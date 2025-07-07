from fastapi import APIRouter, Query, HTTPException, Form
from app.database import get_connection
from pydantic import BaseModel
from typing import List
from datetime import date, time, datetime, timedelta

router = APIRouter(
    prefix="/pacientes",
    tags=["pacientes"]
)

class TurnoPorPacienteOut(BaseModel):
    ID: int
    Fecha: date
    Hora: time
    ID_Especialidad: int
    Especialidad: str
    ID_NotaVoz: int | None = None
    ID_EstadoTurno: int
    EstadoTurno: str
    
class Turnos(BaseModel):
    ID: int
    Fecha: date
    Hora: time
    ID_Especialidad: int
    Especialidad: str
    ID_NotaVoz: int | None = None
    ID_EstadoTurno: int
    EstadoTurno: str
    NombrePaciente: str
    ApellidoPaciente: str

@router.get("/buscarPacientes")
def buscar_pacientes(query: str = Query(..., min_length=1)):
    print(f"🔍 Buscando pacientes con query: {query}")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT * FROM Paciente
        WHERE DNI LIKE %s OR Apellido LIKE %s OR Nombre LIKE %s
        LIMIT 10
    """
    like_query = f"%{query}%"
    cursor.execute(sql, (like_query, like_query, like_query))
    resultados = cursor.fetchall()

    cursor.close()
    conn.close()
    return resultados

@router.get("/buscarProvincias")
def buscar_provincias(query: str = Query(..., min_length=1)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT * FROM Provincia
        WHERE Provincia LIKE %s
        LIMIT 10
    """
    like_query = f"%{query}%"
    cursor.execute(sql, (like_query,))
    resultados = cursor.fetchall()

    cursor.close()
    conn.close()
    return resultados

@router.get("/buscarCiudadesPorProvincia")
def buscar_ciudades_por_provincia(query: str = Query(..., min_length=1), id: int = Query(...)):
    print(f"📍 Buscando ciudades con query: '{query}' en provincia ID {id}")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT * FROM Ciudad
        WHERE Ciudad LIKE %s AND ID_Provincia = %s
        LIMIT 10
    """
    like_query = f"%{query}%"
    cursor.execute(sql, (like_query, id))
    resultados = cursor.fetchall()

    cursor.close()
    conn.close()
    return resultados

@router.get("/buscarObrasSociales")
def buscar_obrassociales(query: str = Query(..., min_length=1)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT * FROM ObraSocial
        WHERE Nombre LIKE %s
        LIMIT 10
    """
    like_query = f"%{query}%"
    cursor.execute(sql, (like_query,))
    resultados = cursor.fetchall()

    cursor.close()
    conn.close()
    return resultados

@router.get("/buscarGeneros")
def buscar_generos():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Genero")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

@router.get("/buscarEscuelasPorCiudad")
def buscar_escuelas_por_ciudad(query: str = Query(..., min_length=1), id: int = Query(...)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT * FROM Escuela
        WHERE Nombre LIKE %s AND ID_Ciudad = %s
        LIMIT 10
    """
    like_query = f"%{query}%"
    cursor.execute(sql, (like_query, id))
    resultados = cursor.fetchall()

    cursor.close()
    conn.close()
    return resultados

@router.post("/grabarPaciente")
def grabar_paciente(paciente: dict):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Debug: Imprimir los datos recibidos
        print("Datos recibidos para insertar:", paciente)

        sql = """
            INSERT INTO Paciente (
                DNI, Apellido, Nombre, FechaNacimiento, ID_Genero, ID_Ciudad, Telefono, Email,
                ID_ObraSocial, ID_Escuela, Observaciones, ID_Estado
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            paciente["dni"],
            paciente["apellido"],
            paciente["nombre"],
            paciente["fechaNacimiento"],
            paciente.get("idGenero"),  # Puede ser NULL
            paciente.get("idCiudad"),  # Puede ser NULL
            paciente.get("telefono"),  # Puede ser NULL
            paciente.get("email"),  # Puede ser NULL
            paciente.get("idObraSocial"),  # Puede ser NULL
            paciente.get("idEscuela"),  # Puede ser NULL
            paciente.get("observaciones"),  # Puede ser NULL
            paciente["idEstado"]  # Obligatorio, por defecto 1
        ))
        conn.commit()
        return {"message": "Paciente grabado con éxito", "id": cursor.lastrowid}
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al grabar el paciente: {e}")
        raise HTTPException(status_code=500, detail="Error al grabar el paciente")
    finally:
        cursor.close()
        conn.close()
        
@router.get("/obtenerProvincias")
def obtener_provincias():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Provincia")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

@router.get("/obtenerCiudades")
def obtener_ciudades():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Ciudad")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

@router.get("/obtenerObrasSociales")
def obtenerObrasSociales():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM ObraSocial")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

@router.get("/obtenerEscuelas")
def obtenerEscuelas():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Escuela")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

@router.put("/actualizarPaciente/{dni}")
def actualizar_paciente(dni: str, paciente: dict):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Debug: Imprimir los datos recibidos
        print(f"Actualizando paciente con DNI: {dni}")
        print("Datos recibidos para actualizar:", paciente)

        sql = """
            UPDATE Paciente
            SET Apellido = %s,
                Nombre = %s,
                FechaNacimiento = %s,
                ID_Genero = %s,
                ID_Ciudad = %s,
                Telefono = %s,
                Email = %s,
                ID_ObraSocial = %s,
                ID_Escuela = %s,
                Observaciones = %s
            WHERE DNI = %s
        """
        cursor.execute(sql, (
            paciente["apellido"],
            paciente["nombre"],
            paciente["fechaNacimiento"],
            paciente.get("idGenero"),  # Puede ser NULL
            paciente.get("idCiudad"),  # Puede ser NULL
            paciente.get("telefono"),  # Puede ser NULL
            paciente.get("email"),  # Puede ser NULL
            paciente.get("idObraSocial"),  # Puede ser NULL
            paciente.get("idEscuela"),  # Puede ser NULL
            paciente.get("observaciones"),  # Puede ser NULL
            dni  # El DNI del paciente que se va a actualizar
        ))
        conn.commit()

        # Verificar si se actualizó algún registro
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        return {"message": "Paciente actualizado con éxito"}
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar el paciente: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar el paciente")
    finally:
        cursor.close()
        conn.close()
        
@router.get("/esProfesionalPorShortname")
async def es_profesional_por_shortname(shortname: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Obtener Nombre y Apellido desde Usuario
    cursor.execute("SELECT Nombre, Apellido FROM Usuario WHERE Username = %s", (shortname,))
    usuario = cursor.fetchone()

    if not usuario:
        cursor.close()
        conn.close()
        return {"esProfesional": False}

    # Buscar coincidencia con Profesional
    cursor.execute("""
        SELECT ID FROM Profesional
        WHERE Nombre = %s AND Apellido = %s
    """, (usuario["Nombre"], usuario["Apellido"]))
    resultado = cursor.fetchone()
    print(f"Resultado de búsqueda en Profesional: {resultado}")
    cursor.close()
    conn.close()
    return {"esProfesional": resultado is not None}

@router.get("/profesional")
def obtener_pacientes_por_profesional(shortname: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener Nombre y Apellido del usuario desde Username
        cursor.execute("SELECT Nombre, Apellido FROM Usuario WHERE Username = %s", (shortname,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener ID del profesional
        cursor.execute("""
            SELECT ID FROM Profesional
            WHERE Nombre = %s AND Apellido = %s
        """, (usuario["Nombre"], usuario["Apellido"]))
        profesional = cursor.fetchone()

        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

        # Obtener pacientes con al menos un turno con ese profesional
        cursor.execute("""
            SELECT DISTINCT p.*
            FROM Paciente p
            JOIN Turno t ON p.ID = t.ID_Paciente
            WHERE t.ID_Profesional = %s
        """, (profesional["ID"],))
        pacientes = cursor.fetchall()

        return pacientes
    except Exception as e:
        print(f"❌ Error al obtener pacientes del profesional: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener pacientes")
    finally:
        cursor.close()
        conn.close()
        
@router.get("/turnosPorPaciente", response_model=List[TurnoPorPacienteOut])
def obtener_turnos_por_paciente(
    id_paciente: int = Query(...),
    username: str = Query(...)
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener Nombre y Apellido del usuario desde Username
        cursor.execute("SELECT Nombre, Apellido FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener ID del profesional
        cursor.execute("""
            SELECT ID FROM Profesional
            WHERE Nombre = %s AND Apellido = %s
        """, (usuario["Nombre"], usuario["Apellido"]))
        profesional = cursor.fetchone()

        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

        # Obtener turnos del paciente con ese profesional incluyendo si tiene nota de voz (ID de nota o null)
        sql = """
        SELECT 
            t.ID, 
            t.Fecha, 
            t.Hora, 
            t.ID_Especialidad, 
            e.Nombre AS Especialidad,
            nv.ID AS ID_NotaVoz,
            t.ID_EstadoTurno,
            te.Descripcion AS EstadoTurno
        FROM Turno t
        JOIN Especialidad e ON t.ID_Especialidad = e.ID_Especialidad
        JOIN Turno_Estado te ON t.ID_EstadoTurno = te.ID
        LEFT JOIN NotaVoz nv ON t.ID = nv.ID_Turno
        WHERE t.ID_Paciente = %s 
          AND t.ID_Profesional = %s 
          AND t.ID_EstadoTurno = 5
        ORDER BY t.Fecha, t.Hora
        """
        cursor.execute(sql, (id_paciente, profesional["ID"]))
        turnos = cursor.fetchall()
        for turno in turnos:
            hora_valor = turno["Hora"]
            if isinstance(hora_valor, timedelta):
                turno["Hora"] = (datetime.min + hora_valor).time()
        return turnos
    except Exception as e:
        print(f"❌ Error al obtener turnos por paciente: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener turnos del paciente")
    finally:
        cursor.close()
        conn.close()


# Endpoint para obtener profesional por username
from fastapi import HTTPException

@router.get("/obtenerProfesionalPorUsername")
def obtener_profesional_por_username(username: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Buscar el nombre y apellido del usuario por su username
        cursor.execute("SELECT Nombre, Apellido FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Buscar el ID del profesional que coincida con el nombre y apellido
        cursor.execute("""
            SELECT ID, Nombre, Apellido
            FROM Profesional
            WHERE Nombre = %s AND Apellido = %s
        """, (usuario["Nombre"], usuario["Apellido"]))
        profesional = cursor.fetchone()

        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

        return profesional
    except Exception as e:
        print(f"❌ Error al obtener profesional por username: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener profesional")
    finally:
        cursor.close()
        conn.close()
        
@router.get("/turnos", response_model=List[Turnos])
def obtener_turnos(
    username: str = Query(...)
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener Nombre y Apellido del usuario desde Username
        cursor.execute("SELECT Nombre, Apellido FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener ID del profesional
        cursor.execute("""
            SELECT ID FROM Profesional
            WHERE Nombre = %s AND Apellido = %s
        """, (usuario["Nombre"], usuario["Apellido"]))
        profesional = cursor.fetchone()

        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

        # Obtener turnos del paciente con ese profesional incluyendo nombre y apellido del paciente
        sql = """
        SELECT 
            t.ID, 
            t.Fecha, 
            t.Hora, 
            t.ID_Especialidad, 
            e.Nombre AS Especialidad,
            nv.ID AS ID_NotaVoz,
            t.ID_EstadoTurno,
            te.Descripcion AS EstadoTurno,
            p.Nombre AS NombrePaciente,
            p.Apellido AS ApellidoPaciente
        FROM Turno t
        JOIN Especialidad e ON t.ID_Especialidad = e.ID_Especialidad
        JOIN Turno_Estado te ON t.ID_EstadoTurno = te.ID
        JOIN Paciente p ON t.ID_Paciente = p.ID
        LEFT JOIN NotaVoz nv ON t.ID = nv.ID_Turno
        WHERE t.ID_Profesional = %s 
          AND t.ID_EstadoTurno != 3
        ORDER BY t.Fecha, t.Hora
        """
        cursor.execute(sql, (profesional["ID"],))
        turnos = cursor.fetchall()
        for turno in turnos:
            hora_valor = turno["Hora"]
            if isinstance(hora_valor, timedelta):
                turno["Hora"] = (datetime.min + hora_valor).time()
        return turnos
    except Exception as e:
        print(f"❌ Error al obtener turnos por paciente: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener turnos del paciente")
    finally:
        cursor.close()
        conn.close()