from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from app.database import get_connection
from app.schemas.turno import TurnoOut, TurnoDetalleOut
from typing import List, Optional
from datetime import datetime, date, time, timedelta
from pydantic import BaseModel
from calendar_sync import sincronizar_turno_en_google_calendar
from calendar_sync import eliminar_evento_google_calendar
from calendar_sync import actualizar_evento_google_calendar
from twilio.rest import Client

import os

router = APIRouter(
    prefix="/turnos",
    tags=["Turnos"]
)

class TurnoIn(BaseModel):
    ID_Paciente: int
    ID_Profesional: int
    Fecha: date
    Hora: time
    ID_Especialidad: int
    ID_EstadoTurno: int

# Listar turnos detallados para cargar en el calendario
# Se usa para mostrar los turnos en la vista de calendario
@router.get("/detalle", response_model=List[TurnoDetalleOut])
def listar_turnos_detallados():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            t.ID,
            CONCAT(p.Nombre, ' ', p.Apellido) AS Paciente,
            CONCAT(pr.Nombre, ' ', pr.Apellido) AS Profesional,
            e.Nombre AS Especialidad,
            t.Fecha,
            t.Hora,
            te.Descripcion AS Estado
        FROM Turno t
        JOIN Paciente p ON t.ID_Paciente = p.ID
        JOIN Profesional pr ON t.ID_Profesional = pr.ID
        JOIN Especialidad e ON t.ID_Especialidad = e.ID_Especialidad
        JOIN Turno_Estado te ON t.ID_EstadoTurno = te.ID
        ORDER BY t.Fecha DESC, t.Hora DESC
    """)
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for turno in resultados:
        if isinstance(turno["Hora"], timedelta):
            td = turno["Hora"]
            turno["Hora"] = (datetime.min + td).time()
    
    return resultados

# Función para obtener el cliente de Twilio
def obtener_cliente_twilio():
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        print("⚠️ Advertencia: Credenciales de Twilio no configuradas")
        return None
    
    return Client(account_sid, auth_token)

# Crea un nuevo turno
@router.post("/")
async def crear_turno(data: TurnoIn):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO Turno (ID_Paciente, ID_Profesional, ID_Especialidad, Fecha, Hora, ID_EstadoTurno)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data.ID_Paciente,
            data.ID_Profesional,
            int(data.ID_Especialidad),
            data.Fecha,
            data.Hora,
            data.ID_EstadoTurno
        ))
        conn.commit()
        id_turno = cursor.lastrowid
        
        # Obtener el teléfono del paciente
        cursor.execute("SELECT Telefono FROM Paciente WHERE ID = %s", (data.ID_Paciente,))
        telefono_resultado = cursor.fetchone()
        telefono_paciente = telefono_resultado[0] if telefono_resultado and telefono_resultado[0] else None
        
        turno_data = {
            "id_profesional": data.ID_Profesional,
            "estado": data.ID_EstadoTurno,
            "id_turno": id_turno,
            "paciente": "",  # Se reemplaza con el nombre real del paciente
            "descripcion": "Turno creado desde TALC",
            "inicio": datetime.combine(data.Fecha, data.Hora).isoformat(),
            "fin": (datetime.combine(data.Fecha, data.Hora) + timedelta(hours=1)).isoformat()
        }
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT CONCAT(Nombre, ' ', Apellido) AS nombre FROM Paciente WHERE ID = %s", (data.ID_Paciente,))
        paciente_resultado = cursor.fetchone()
        paciente_nombre = paciente_resultado["nombre"] if paciente_resultado else "Paciente"
        turno_data["paciente"] = paciente_nombre

        cursor.execute("SELECT CONCAT(Nombre, ' ', Apellido) AS nombre FROM Profesional WHERE ID = %s", (data.ID_Profesional,))
        profesional_resultado = cursor.fetchone()
        profesional_nombre = profesional_resultado["nombre"] if profesional_resultado else "la profesional"
        
        # Llamar a la función de sincronización solo si aplica
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT UsaIntegracionCalendar FROM Profesional WHERE ID = %s", (data.ID_Profesional,))
        profesional_info = cursor.fetchone()
        usa_calendar = profesional_info["UsaIntegracionCalendar"] if profesional_info else 0

        if usa_calendar == 1 and data.ID_EstadoTurno in [1, 2]:
            google_event_id = sincronizar_turno_en_google_calendar(turno_data)
            if google_event_id:
                cursor.execute("""
                    INSERT INTO GoogleCalendarEvento (ID_Turno, GoogleEventID)
                    VALUES (%s, %s)
                """, (id_turno, google_event_id))
                
        if telefono_paciente:
            client = obtener_cliente_twilio()
            if client:
                # Enviar mensaje de WhatsApp
                mensaje = f"Hola {paciente_nombre}, se ha generado un turno con {profesional_nombre} para el día {data.Fecha.strftime('%d/%m/%Y')} a las {data.Hora.strftime('%H:%M')}."
                try:
                    message = client.messages.create(
                        body=mensaje,
                        from_='whatsapp:+14155238886',
                        to=f'whatsapp:{telefono_paciente}'
                    )
                    print(f"[WHATSAPP] Mensaje enviado: SID {message.sid}")
                except Exception as e:
                    print(f"[WHATSAPP ERROR] No se pudo enviar el mensaje: {e}")
        
        return JSONResponse(content={"message": "Turno creado correctamente"}, status_code=201)
    except Exception as e:
        import traceback
        print("Error al crear turno:", traceback.format_exc())
        conn.rollback()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()

#Obtiene listado de pacientes
@router.get("/pacientes")
def listar_pacientes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT ID, CONCAT(Nombre, ' ', Apellido) AS nombre FROM Paciente")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

#Obtiene listado de profesionales
@router.get("/profesionales")
def listar_profesionales():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT ID, CONCAT(Nombre, ' ', Apellido) AS nombre FROM Profesional")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

#Obtiene listado de especialidades por profesional
@router.get("/especialidades-por-profesional/{id_profesional}")
def listar_especialidades_por_profesional(id_profesional: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT 
            e.ID_Especialidad AS ID,
            e.Nombre
        FROM Profesional_Especialidad pe
        JOIN Especialidad e ON pe.ID_Especialidad = e.ID_Especialidad
        WHERE pe.ID_Profesional = %s
    """, (id_profesional,))
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

#Obtiene listado de turnos
#Se usa para validar los horarios ocupados de pacientes y profesionales y no permitir solapamientos al generar nuevos turnos
@router.get("/todos", response_model=List[TurnoOut])
def obtener_todos_los_turnos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT ID, ID_Paciente, ID_Profesional, ID_Especialidad, Fecha, Hora, ID_EstadoTurno
        FROM Turno
    """)
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    
    for turno in resultados:
        if isinstance(turno["Hora"], timedelta):
            turno["Hora"] = (datetime.min + turno["Hora"]).time()
    
    return resultados


@router.get("/{turno_id}", response_model=TurnoOut)
def obtener_turno_por_id(turno_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT ID, ID_Paciente, ID_Profesional, ID_Especialidad, Fecha, Hora, ID_EstadoTurno
        FROM Turno
        WHERE ID = %s
    """, (turno_id,))
    resultado = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not resultado:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    if isinstance(resultado["Hora"], timedelta):
        resultado["Hora"] = (datetime.min + resultado["Hora"]).time()

    return resultado

#Actualiza un turno existente
@router.put("/{turno_id}")
def actualizar_turno(turno_id: int, data: TurnoIn):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)  # Usamos un solo cursor con dictionary=True
    try:
        cursor.execute("""
            UPDATE Turno
            SET ID_Paciente = %s,
                ID_Profesional = %s,
                ID_Especialidad = %s,
                Fecha = %s,
                Hora = %s,
                ID_EstadoTurno = %s
            WHERE ID = %s
        """, (
            data.ID_Paciente,
            data.ID_Profesional,
            int(data.ID_Especialidad),
            data.Fecha,
            data.Hora,
            data.ID_EstadoTurno,
            turno_id
        ))
        conn.commit()

        cursor.execute("SELECT UsaIntegracionCalendar FROM Profesional WHERE ID = %s", (data.ID_Profesional,))
        profesional_info = cursor.fetchone()
        usa_calendar = profesional_info["UsaIntegracionCalendar"] if profesional_info else 0

        print(f"[DEBUG] usa_calendar: {usa_calendar}")
        print(f"[DEBUG] ID_EstadoTurno: {data.ID_EstadoTurno}")
        # Solo lógica de sincronización con Google Calendar
        if usa_calendar == 1 and data.ID_EstadoTurno in [1, 2]:
            cursor.execute("SELECT CONCAT(Nombre, ' ', Apellido) AS nombre FROM Paciente WHERE ID = %s", (data.ID_Paciente,))
            paciente_resultado = cursor.fetchone()
            paciente_nombre = paciente_resultado["nombre"] if paciente_resultado else "Paciente"

            turno_data = {
                "id_turno": turno_id,
                "id_profesional": data.ID_Profesional,
                "estado": data.ID_EstadoTurno,
                "paciente": paciente_nombre,
                "descripcion": "Turno reprogramado desde TALC",
                "inicio": datetime.combine(data.Fecha, data.Hora).isoformat(),
                "fin": (datetime.combine(data.Fecha, data.Hora) + timedelta(hours=1)).isoformat()
            }

            google_event_id = actualizar_evento_google_calendar(turno_id, turno_data)
            if google_event_id:
                cursor.execute("""
                    SELECT COUNT(*) as count FROM GoogleCalendarEvento WHERE ID_Turno = %s
                """, (turno_id,))
                result = cursor.fetchone()
                if result["count"] == 0:
                    cursor.execute("""
                        INSERT INTO GoogleCalendarEvento (ID_Turno, GoogleEventID)
                        VALUES (%s, %s)
                    """, (turno_id, google_event_id))
                else:
                    cursor.execute("""
                        UPDATE GoogleCalendarEvento
                        SET GoogleEventID = %s, UltimaActualizacion = NOW()
                        WHERE ID_Turno = %s
                    """, (google_event_id, turno_id))

        # Envío de WhatsApp (fuera del if de Google Calendar)
        cursor.execute("SELECT CONCAT(Nombre, ' ', Apellido) AS nombre FROM Paciente WHERE ID = %s", (data.ID_Paciente,))
        paciente_resultado = cursor.fetchone()
        paciente_nombre = paciente_resultado["nombre"] if paciente_resultado else "Paciente"

        cursor.execute("SELECT CONCAT(Nombre, ' ', Apellido) AS nombre FROM Profesional WHERE ID = %s", (data.ID_Profesional,))
        profesional_resultado = cursor.fetchone()
        profesional_nombre = profesional_resultado["nombre"] if profesional_resultado else "Profesional"

        cursor.execute("SELECT Telefono FROM Paciente WHERE ID = %s", (data.ID_Paciente,))
        telefono_resultado = cursor.fetchone()
        telefono_paciente = telefono_resultado["Telefono"] if telefono_resultado and telefono_resultado.get("Telefono") else None

        if telefono_paciente:
            print(f"[DEBUG] Enviando mensaje a: {telefono_paciente}")
            client = obtener_cliente_twilio()
            if client:
                mensaje = f"Hola {paciente_nombre}, su turno con {profesional_nombre} fue reprogramado para el día {data.Fecha.strftime('%d/%m/%Y')} a las {data.Hora.strftime('%H:%M')}."
                try:
                    message = client.messages.create(
                        body=mensaje,
                        from_='whatsapp:+14155238886',
                        to=f'whatsapp:{telefono_paciente}'
                    )
                    print(f"[WHATSAPP] Mensaje de reprogramación enviado: SID {message.sid}")
                except Exception as e:
                    print(f"[WHATSAPP ERROR] No se pudo enviar el mensaje: {e}")

        return {"mensaje": "Turno actualizado correctamente"}
    except Exception as e:
        import traceback
        print("Error al actualizar turno:", traceback.format_exc())
        conn.rollback()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()

# Cambia el estado de un turno a "Cancelado"
# y elimina el evento correspondiente de Google Calendar
@router.put("/{turno_id}/estado")
def eliminar_turno(turno_id: int, estado: dict, request: Request):
    print(f"[DEBUG] Cambio de estado solicitado para turno {turno_id} desde: {request.client.host}")
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE Turno
            SET ID_EstadoTurno = %s
            WHERE ID = %s
        """, (estado["ID_EstadoTurno"], turno_id))
        conn.commit()

        # Obtener los datos del turno
        cursor.execute("""
            SELECT ID_Paciente, ID_Profesional, Fecha, Hora
            FROM Turno
            WHERE ID = %s
        """, (turno_id,))
        turno = cursor.fetchone()
        turno = dict(zip([column[0] for column in cursor.description], turno))
        
        # Enviar mensaje de WhatsApp al paciente informando la cancelación
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT Telefono, CONCAT(Nombre, ' ', Apellido) AS nombre FROM Paciente WHERE ID = %s", (turno["ID_Paciente"],))
        paciente_info = cursor.fetchone()
        telefono_paciente = paciente_info["Telefono"] if paciente_info else None
        paciente_nombre = paciente_info["nombre"] if paciente_info else "el paciente"
        cursor.execute("SELECT CONCAT(Nombre, ' ', Apellido) AS nombre FROM Profesional WHERE ID = %s", (turno["ID_Profesional"],))
        profesional_resultado = cursor.fetchone()
        profesional_nombre = profesional_resultado["nombre"] if profesional_resultado else "la profesional"
        if telefono_paciente:
            client = obtener_cliente_twilio()
            if client:
                if isinstance(turno["Hora"], timedelta):
                    turno["Hora"] = (datetime.min + turno["Hora"]).time()
                mensaje = f"Hola {paciente_nombre}, su turno con {profesional_nombre} para el día {turno['Fecha'].strftime('%d/%m/%Y')} a las {turno['Hora'].strftime('%H:%M')} ha sido cancelado."
                try:
                    message = client.messages.create(
                        body=mensaje,
                        from_='whatsapp:+14155238886',
                        to=f'whatsapp:{telefono_paciente}'
                    )
                    print(f"[WHATSAPP] Mensaje enviado: SID {message.sid}")
                except Exception as e:
                    print(f"[WHATSAPP ERROR] No se pudo enviar el mensaje: {e}")

        if estado["ID_EstadoTurno"] == 3:
            try:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("""
                    SELECT t.ID_Profesional, gce.GoogleEventID
                    FROM Turno t
                    JOIN GoogleCalendarEvento gce ON t.ID = gce.ID_Turno
                    WHERE t.ID = %s
                """, (turno_id,))
                turno = cursor.fetchone()
                print(f"[DEBUG] Resultado GoogleCalendarEvento para turno {turno_id}: {turno}")
                if turno:
                    event_id = turno["GoogleEventID"]
                    eliminar_evento_google_calendar(event_id, turno["ID_Profesional"])
                    cursor.execute("DELETE FROM GoogleCalendarEvento WHERE ID_Turno = %s", (turno_id,))
                    conn.commit()
                    print(f"[DEBUG] Evento con ID {event_id} eliminado correctamente de Google Calendar.")
                else:
                    print(f"[DEBUG] No se encontró evento en GoogleCalendarEvento para el turno {turno_id}.")
            except Exception as e:
                import traceback
                print(f"[ERROR] Falló eliminación de evento en Google Calendar: {traceback.format_exc()}")
        return {"mensaje": "Estado actualizado correctamente"}
    except Exception as e:
        import traceback
        print("[ERROR] Falló al actualizar estado del turno:", traceback.format_exc())
        conn.rollback()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()

# Registra la asistencia de un paciente a un turno
# Cambia el estado del turno a "Asistió" y registra la fecha y hora de llegada
@router.post("/{turno_id}/asistencia")
def registrar_asistencia(turno_id: int, request: Request):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Cambiar estado del turno a 5 (Asistió)
        cursor.execute("""
            UPDATE Turno
            SET ID_EstadoTurno = 5
            WHERE ID = %s
        """, (turno_id,))
        
        # Insertar en tabla Asistencia
        usuario_id = 1  # TODO: Reemplazar por el ID del usuario autenticado cuando esté implementado
        now = datetime.now()

        cursor.execute("""
            INSERT INTO Asistencia (ID_Turno, Asistio, FechaHoraLlegada, RegistradoPor)
            VALUES (%s, %s, %s, %s)
        """, (
            turno_id,
            1,  # Asistió
            now,
            1
        ))
        
        conn.commit()
        return {"mensaje": "Asistencia registrada correctamente"}
    except Exception as e:
        conn.rollback()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()