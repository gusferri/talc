import os
import mysql.connector
from app.database import get_connection
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
TOKEN_URI = "https://oauth2.googleapis.com/token"

def obtener_refresh_token(id_profesional: int) -> str | None:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT RefreshToken FROM Profesional_IntegracionGoogle WHERE ID_Profesional = %s", (id_profesional,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result["RefreshToken"] if result else None

def sincronizar_turno_en_google_calendar(turno):
    id_profesional = turno.get("id_profesional")
    estado = turno.get("estado")

    # Solo sincroniza si es Marina Bernardi y el estado es 1 o 2
    if id_profesional != 1 or estado not in [1, 2]:
        return

    refresh_token = obtener_refresh_token(id_profesional)
    if not refresh_token:
        print("No hay refresh token disponible para el profesional.")
        return

    # Obtener credenciales actualizadas
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=TOKEN_URI,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )
    creds.refresh(Request())

    service = build("calendar", "v3", credentials=creds)

    evento = {
        "summary": f"Turno con {turno.get('paciente')}",
        "description": (
            f"Turno creado desde TALC Gestión\n"
            f"Paciente: {turno.get('paciente')}"
        ),
        "start": {"dateTime": turno["inicio"], "timeZone": "America/Argentina/Cordoba"},
        "end": {"dateTime": turno["fin"], "timeZone": "America/Argentina/Cordoba"},
    }

    # Verificar si ya existe un evento para ese turno
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT ID FROM GoogleCalendarEvento WHERE ID_Turno = %s", (turno.get("id_turno"),))
    existente = cursor.fetchone()

    if existente:
        cursor.close()
        conn.close()
        print("El evento ya estaba sincronizado. No se insertó nuevamente.")
        return

    # Crear evento en Google Calendar
    nuevo_evento = service.events().insert(calendarId="primary", body=evento).execute()
    nuevo_event_id = nuevo_evento.get("id")

    # Insertar en GoogleCalendarEvento
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO GoogleCalendarEvento (ID_Turno, GoogleEventID) VALUES (%s, %s)",
        (turno.get("id_turno"), nuevo_event_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
    print("Evento creado exitosamente.")

def eliminar_evento_google_calendar(event_id: str, id_profesional: int):
    print(f"[DEBUG] Solicitando eliminación de evento ID {event_id} para profesional {id_profesional}")

    if id_profesional != 1:
        print(f"[DEBUG] Profesional {id_profesional} no autorizado para sincronización.")
        return

    refresh_token = obtener_refresh_token(id_profesional)
    if not refresh_token:
        print("[DEBUG] No hay refresh token disponible para el profesional.")
        return

    print("[DEBUG] Obteniendo credenciales...")
    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=TOKEN_URI,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )
    creds.refresh(Request())
    print("[DEBUG] Credenciales actualizadas correctamente.")

    service = build("calendar", "v3", credentials=creds)

    try:
        print(f"[DEBUG] Ejecutando delete del evento {event_id}...")
        service.events().delete(calendarId="primary", eventId=event_id).execute()
        print(f"[DEBUG] Evento {event_id} eliminado correctamente de Google Calendar.")
    except Exception as e:
        print(f"[ERROR] Falló eliminación de evento en Google Calendar: {e}")

def actualizar_evento_google_calendar(id_turno: int, nuevo_turno: dict):
    id_profesional = nuevo_turno.get("id_profesional")

    if id_profesional != 1:
        return

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT GoogleEventID FROM GoogleCalendarEvento WHERE ID_Turno = %s",
        (id_turno,)
    )
    result = cursor.fetchone()
    
    if result:
        print(f"Evento existente encontrado en DB con ID: {result['GoogleEventID']}")
    else:
        print(f"No se encontró evento existente en DB para ID_Turno = {id_turno}")

    if result:
        event_id = result["GoogleEventID"]
        print("Intentando actualizar evento en Google Calendar...")
        try:
            refresh_token = obtener_refresh_token(id_profesional)
            if not refresh_token:
                print("No hay refresh token disponible para el profesional.")
                return

            creds = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri=TOKEN_URI,
                client_id=CLIENT_ID,
                client_secret=CLIENT_SECRET
            )
            creds.refresh(Request())
            service = build("calendar", "v3", credentials=creds)

            service.events().patch(
                calendarId="primary",
                eventId=event_id,
                body={
                    "summary": f"Turno con {nuevo_turno.get('paciente')}",
                    "description": (
                        f"Turno actualizado desde TALC Gestión\n"
                        f"Paciente: {nuevo_turno.get('paciente')}"
                    ),
                    "start": {"dateTime": nuevo_turno["inicio"], "timeZone": "America/Argentina/Cordoba"},
                    "end": {"dateTime": nuevo_turno["fin"], "timeZone": "America/Argentina/Cordoba"},
                }
            ).execute()

            cursor.execute(
                "UPDATE GoogleCalendarEvento SET UltimaActualizacion = NOW() WHERE ID_Turno = %s",
                (id_turno,)
            )
            conn.commit()
            cursor.close()
            conn.close()
            print("Evento actualizado exitosamente.")
            return

        except Exception as e:
            print(f"Error al actualizar evento existente: {e}")
            raise e
            # En caso de error, seguir y crear uno nuevo

    # Si no existe, crear uno nuevo
    refresh_token = obtener_refresh_token(id_profesional)
    if not refresh_token:
        print("No hay refresh token disponible para el profesional.")
        return

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=TOKEN_URI,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )
    creds.refresh(Request())
    service = build("calendar", "v3", credentials=creds)

    print("No se encontró evento anterior, creando uno nuevo...")
    evento = {
        "summary": f"Turno con {nuevo_turno.get('paciente')}",
        "description": (
            f"Turno creado desde TALC Gestión\n"
            f"Paciente: {nuevo_turno.get('paciente')}"
        ),
        "start": {"dateTime": nuevo_turno["inicio"], "timeZone": "America/Argentina/Cordoba"},
        "end": {"dateTime": nuevo_turno["fin"], "timeZone": "America/Argentina/Cordoba"},
    }

    nuevo_evento = service.events().insert(calendarId="primary", body=evento).execute()
    nuevo_event_id = nuevo_evento.get("id")

    cursor.execute(
        "INSERT INTO GoogleCalendarEvento (ID_Turno, GoogleEventID) VALUES (%s, %s)",
        (id_turno, nuevo_event_id)
    )

    conn.commit()
    cursor.close()
    conn.close()
    print("Evento creado exitosamente.")