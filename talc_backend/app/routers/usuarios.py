from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
import bcrypt
from app.database import get_connection
from app.routers.ai import tarea_generar_resumen

router = APIRouter()

# Modelo de datos que va a recibir el login
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(datos: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT ID, Username, Contraseña, Nombre, Apellido, Email, DebeCambiarContrasena
        FROM Usuario
        WHERE Username = %s AND Activo = 1
    """, (datos.username,))
    usuario = cursor.fetchone()

    if not usuario or not usuario['Contraseña']:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if not bcrypt.checkpw(datos.password.encode('utf-8'), usuario['Contraseña'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    cursor.execute("""
        SELECT g.Grupo
        FROM Usuario_Grupo ug
        INNER JOIN Grupo g ON ug.ID_Grupo = g.ID
        WHERE ug.ID_Usuario = %s
    """, (usuario['ID'],))
    grupos = cursor.fetchall()
    grupos_list = [g['Grupo'] for g in grupos]

    cursor.close()
    conn.close()

    return {
        "ID": usuario["ID"],
        "Username": usuario["Username"],
        "Nombre": usuario["Nombre"],
        "Apellido": usuario["Apellido"],
        "Email": usuario["Email"],
        "Grupos": grupos_list,
        "DebeCambiarContrasena": usuario["DebeCambiarContrasena"]
    }


@router.get("/verificar-grupos/{username}")
def verificar_grupos_usuario(username: str):
    """
    Endpoint para verificar qué grupos tiene asignado un usuario específico
    Útil para debugging de permisos y roles
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener el usuario por username
        cursor.execute("""
            SELECT ID, Username, Nombre, Apellido
            FROM Usuario
            WHERE Username = %s AND Activo = 1
        """, (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener los grupos del usuario
        cursor.execute("""
            SELECT g.ID, g.Grupo
            FROM Usuario_Grupo ug
            INNER JOIN Grupo g ON ug.ID_Grupo = g.ID
            WHERE ug.ID_Usuario = %s
        """, (usuario['ID'],))
        grupos = cursor.fetchall()

        return {
            "usuario": {
                "ID": usuario["ID"],
                "Username": usuario["Username"],
                "Nombre": usuario["Nombre"],
                "Apellido": usuario["Apellido"]
            },
            "grupos": grupos,
            "grupos_nombres": [g['Grupo'] for g in grupos]
        }
    except Exception as e:
        print(f"❌ Error al verificar grupos del usuario {username}: {e}")
        raise HTTPException(status_code=500, detail="Error al verificar grupos")
    finally:
        cursor.close()
        conn.close()


# Modelo de datos que va a recibir el cambio de contraseña
class CambiarContrasenaRequest(BaseModel):
    username: str
    contrasena_actual: str
    nueva_contrasena: str


@router.post("/cambiar-contrasena")
def cambiar_contrasena(datos: CambiarContrasenaRequest):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscar el usuario actual por Username
    cursor.execute("""
        SELECT ID, Contraseña FROM Usuario WHERE Username = %s AND Activo = 1
    """, (datos.username,))
    usuario = cursor.fetchone()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    import bcrypt

    # Verificar la contraseña actual
    if not bcrypt.checkpw(datos.contrasena_actual.encode('utf-8'), usuario['Contraseña'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

    # Hashear la nueva contraseña
    from app.utils.seguridad import hashear_contrasena
    nueva_contraseña_hasheada = hashear_contrasena(datos.nueva_contrasena)

    # Actualizar la contraseña y resetear la bandera
    cursor.execute("""
        UPDATE Usuario
        SET Contraseña = %s, DebeCambiarContrasena = 0
        WHERE ID = %s
    """, (nueva_contraseña_hasheada, usuario['ID']))

    if cursor.rowcount == 0:
        raise HTTPException(status_code=400, detail="No se pudo actualizar la contraseña, verifique el usuario")
    conn.commit()
    cursor.close()
    conn.close()

    return {"mensaje": "Contraseña actualizada exitosamente"}


# Endpoint para actualizar la contraseña de cualquier usuario (por admin, etc)
from fastapi import Depends
from app.utils.seguridad import hashear_contrasena

class ActualizarContrasenaRequest(BaseModel):
    id_usuario: int
    nueva_contrasena: str

@router.post("/actualizar-contrasena")
def actualizar_contrasena(datos: ActualizarContrasenaRequest):
    conn = get_connection()
    cursor = conn.cursor()

    # Hashear la nueva contraseña
    nueva_contrasena_hasheada = hashear_contrasena(datos.nueva_contrasena)

    # Actualizar la contraseña en la base de datos
    cursor.execute("""
        UPDATE Usuario
        SET Contraseña = %s, DebeCambiarContrasena = 0
        WHERE ID = %s
    """, (nueva_contrasena_hasheada, datos.id_usuario))

    conn.commit()
    cursor.close()
    conn.close()

    return {"mensaje": "Contraseña actualizada exitosamente"}

def generar_notificaciones_notavoz():
    print("Ejecutando generador de notificaciones...")  # Debug
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT t.ID, pu.ID_Usuario, p.Nombre AS NombrePaciente, p.Apellido AS ApellidoPaciente, t.Fecha
        FROM Turno t
        JOIN ProfesionalUsuario pu ON pu.ID_Profesional = t.ID_Profesional
        JOIN Paciente p ON p.ID = t.ID_Paciente
        LEFT JOIN NotaVoz nv ON nv.ID_Turno = t.ID
        LEFT JOIN Notificacion n ON n.ID_Usuario = pu.ID_Usuario AND n.ID_Turno = t.ID AND n.Titulo = 'Recordatorio Nota de Voz' AND n.Leido = 0
        WHERE CONCAT(t.Fecha, ' ', t.Hora) < NOW()
          AND nv.ID IS NULL
          AND n.ID IS NULL
          AND t.ID_EstadoTurno = 5
    """

    cursor.execute(sql)
    turnos = cursor.fetchall()
    print(f"Turnos sin nota de voz encontrados: {len(turnos)}")  # Debug

    notificaciones_creadas = 0

    for turno in turnos:
        print(f"Insertando notificación para turno ID {turno['ID']} y usuario ID {turno['ID_Usuario']}")  # Debug
        mensaje = f"Recordá grabar la nota de voz de la sesión de {turno['NombrePaciente']} {turno['ApellidoPaciente']} con fecha {turno['Fecha'].strftime('%d/%m/%Y')}"
        cursor.execute("""
            INSERT INTO Notificacion (ID_Usuario, ID_Turno, Titulo, Mensaje)
            VALUES (%s, %s, %s, %s)
        """, (
            turno['ID_Usuario'],
            turno['ID'],
            'Recordatorio Nota de Voz',
            mensaje
        ))
        notificaciones_creadas += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Total notificaciones creadas: {notificaciones_creadas}")  # Debug
    return notificaciones_creadas


# --- APScheduler para programar la función cada 30 minutos ---
from apscheduler.schedulers.background import BackgroundScheduler

import logging
logging.basicConfig(level=logging.DEBUG)
logging.getLogger('apscheduler').setLevel(logging.DEBUG)

def start_scheduler():
    print("Iniciando scheduler...")  # Debug
    scheduler = BackgroundScheduler()
    scheduler.add_job(generar_notificaciones_notavoz, 'interval', minutes=30)
    scheduler.add_job(tarea_generar_resumen, 'interval', minutes=5, id='resumen_sesion')
    scheduler.start()
    print("Scheduler iniciado")  # Debug


# --- Endpoint para obtener notificaciones de usuario ---
from fastapi import Query

@router.get("/notificaciones")
def get_notificaciones(username: str = Query(...)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscamos el ID del usuario
    cursor.execute("SELECT ID FROM Usuario WHERE Username = %s AND Activo = 1", (username,))
    usuario = cursor.fetchone()
    if not usuario:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    id_usuario = usuario['ID']
    # Traemos las notificaciones de ese usuario
    cursor.execute("""
        SELECT ID, ID_Usuario, Titulo, Mensaje, FechaEnvio, Leido
        FROM Notificacion
        WHERE ID_Usuario = %s AND Leido = 0
        ORDER BY FechaEnvio DESC
    """, (id_usuario,))
    notificaciones = cursor.fetchall()

    cursor.close()
    conn.close()
    return notificaciones

@router.post("/test-generar-notificaciones")
def test_generar_notificaciones():
    cantidad = generar_notificaciones_notavoz()
    return {"notificaciones_creadas": cantidad}

from fastapi import Body

@router.post("/notificaciones/marcarLeido")
def marcar_notificacion_leida(id_notificacion: int = Body(..., embed=True)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE Notificacion
        SET Leido = 1
        WHERE ID = %s
    """, (id_notificacion,))

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    conn.commit()
    cursor.close()
    conn.close()

    return {"mensaje": "Notificación marcada como leída"}

@router.get("/notificaciones/{id_notificacion}/paciente")
def obtener_paciente_por_notificacion(id_notificacion: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT p.ID, p.Nombre, p.Apellido
            FROM Notificacion n
            JOIN Turno t ON t.ID = n.ID_Turno
            JOIN Paciente p ON p.ID = t.ID_Paciente
            WHERE n.ID = %s
        """, (id_notificacion,))
        
        paciente = cursor.fetchone()
        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        return paciente

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cursor.close()
        conn.close()