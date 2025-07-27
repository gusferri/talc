from fastapi import APIRouter, Query, HTTPException, Form, Request
from app.database import get_connection
from pydantic import BaseModel
from typing import List
from datetime import date, time, datetime, timedelta
from app.utils.auditoria import (
    auditar_creacion_paciente, auditar_modificacion_paciente, 
    auditar_cambio_estado_paciente, auditar_eliminacion_paciente,
    obtener_usuario_logueado, obtener_usuario_por_defecto
)

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
        WHERE (DNI LIKE %s OR Apellido LIKE %s OR Nombre LIKE %s) AND Activo = 1
        LIMIT 10
    """
    like_query = f"%{query}%"
    cursor.execute(sql, (like_query, like_query, like_query))
    resultados = cursor.fetchall()

    cursor.close()
    conn.close()
    return resultados

@router.get("/paciente/{dni}")
def obtener_paciente_por_dni(dni: str):
    """
    Obtiene un paciente específico por DNI sin filtrar por estado activo
    Utilizado para edición de pacientes (activos e inactivos)
    """
    print(f"🔍 Obteniendo paciente por DNI: {dni}")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        sql = """
            SELECT * FROM Paciente
            WHERE DNI = %s
        """
        cursor.execute(sql, (dni,))
        paciente = cursor.fetchone()

        if not paciente:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        print(f"✅ Paciente encontrado: {paciente['Nombre']} {paciente['Apellido']} (Activo: {paciente['Activo']})")
        return paciente
    except Exception as e:
        print(f"❌ Error al obtener paciente por DNI: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener paciente")
    finally:
        cursor.close()
        conn.close()

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

@router.get("/completo")
def obtener_todos_los_pacientes():
    """
    Obtiene todos los pacientes del sistema con todos sus campos
    Utilizado principalmente por secretarias para ver todos los pacientes
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT 
                ID, DNI, Nombre, Apellido, FechaNacimiento, 
                ID_Genero, ID_Ciudad, Telefono, Email, 
                ID_ObraSocial, ID_Escuela, Observaciones, Activo
            FROM Paciente
            ORDER BY Apellido, Nombre
        """)
        resultados = cursor.fetchall()
        return resultados
    except Exception as e:
        print(f"❌ Error al obtener todos los pacientes: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener pacientes")
    finally:
        cursor.close()

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
def grabar_paciente(paciente: dict, request: Request):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Debug: Imprimir los datos recibidos
        print("Datos recibidos para insertar:", paciente)

        sql = """
            INSERT INTO Paciente (
                DNI, Apellido, Nombre, FechaNacimiento, ID_Genero, ID_Ciudad, Telefono, Email,
                ID_ObraSocial, ID_Escuela, Observaciones, Activo
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
            paciente.get("activo", 1)  # Activo por defecto (1 = activo, 0 = inactivo)
        ))
        conn.commit()
        
        paciente_id = cursor.lastrowid
        
        # Registrar auditoría de creación
        try:
            datos_paciente = {
                "DNI": paciente["dni"],
                "Apellido": paciente["apellido"],
                "Nombre": paciente["nombre"],
                "FechaNacimiento": paciente["fechaNacimiento"],
                "ID_Genero": paciente.get("idGenero"),
                "ID_Ciudad": paciente.get("idCiudad"),
                "Telefono": paciente.get("telefono"),
                "Email": paciente.get("email"),
                "ID_ObraSocial": paciente.get("idObraSocial"),
                "ID_Escuela": paciente.get("idEscuela"),
                "Observaciones": paciente.get("observaciones"),
                "Activo": paciente.get("activo", 1)
            }
            
            # Obtener usuario logueado desde el header o usar valor por defecto
            username_creador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            auditar_creacion_paciente(
                username_creador=username_creador,
                id_paciente_creado=paciente_id,
                datos_paciente=datos_paciente
            )
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de creación de paciente: {audit_error}")
            # NO fallar la operación principal
        
        return {"message": "Paciente grabado con éxito", "id": paciente_id}
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
def actualizar_paciente(dni: str, paciente: dict, request: Request):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Obtener datos actuales del paciente para auditoría
        cursor.execute("""
            SELECT DNI, Apellido, Nombre, FechaNacimiento, ID_Genero, ID_Ciudad, 
                   Telefono, Email, ID_ObraSocial, ID_Escuela, Observaciones, Activo
            FROM Paciente
            WHERE DNI = %s
        """, (dni,))
        
        paciente_actual = cursor.fetchone()
        if not paciente_actual:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        # Debug: Imprimir los datos recibidos
        print(f"🔄 Actualizando paciente con DNI: {dni}")
        print("📦 Datos completos recibidos para actualizar:", paciente)
        print(f"🔍 Campo 'activo' recibido: {paciente.get('activo')}")
        print(f"🔍 Tipo de dato del campo 'activo': {type(paciente.get('activo'))}")

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
                Observaciones = %s,
                Activo = %s
            WHERE DNI = %s
        """
        
        # Preparar valores para la consulta SQL
        valores = (
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
            paciente.get("activo", 1),  # Activo por defecto (1 = activo, 0 = inactivo)
            dni  # El DNI del paciente que se va a actualizar
        )
        
        print(f"🔍 Valores que se van a ejecutar en SQL: {valores}")
        
        cursor.execute(sql, valores)
        conn.commit()

        # Verificar si se actualizó algún registro
        if cursor.rowcount == 0:
            print(f"❌ No se encontró paciente con DNI: {dni}")
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        # Registrar auditoría de modificaciones
        try:
            # Obtener usuario logueado desde el header o usar valor por defecto
            username_modificador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            # Auditoría de cambios en campos básicos
            if paciente["apellido"] != paciente_actual[1]:  # Apellido
                auditar_modificacion_paciente(
                    username_modificador=username_modificador,
                    id_paciente_modificado=paciente_actual[0],  # DNI como ID
                    campo_modificado="Apellido",
                    valor_anterior=paciente_actual[1],
                    valor_nuevo=paciente["apellido"]
                )
            
            if paciente["nombre"] != paciente_actual[2]:  # Nombre
                auditar_modificacion_paciente(
                    username_modificador=username_modificador,
                    id_paciente_modificado=paciente_actual[0],
                    campo_modificado="Nombre",
                    valor_anterior=paciente_actual[2],
                    valor_nuevo=paciente["nombre"]
                )
            
            if paciente.get("email") != paciente_actual[7]:  # Email
                auditar_modificacion_paciente(
                    username_modificador=username_modificador,
                    id_paciente_modificado=paciente_actual[0],
                    campo_modificado="Email",
                    valor_anterior=paciente_actual[7],
                    valor_nuevo=paciente.get("email")
                )
            
            if paciente.get("telefono") != paciente_actual[6]:  # Telefono
                auditar_modificacion_paciente(
                    username_modificador=username_modificador,
                    id_paciente_modificado=paciente_actual[0],
                    campo_modificado="Telefono",
                    valor_anterior=paciente_actual[6],
                    valor_nuevo=paciente.get("telefono")
                )
            
            # Auditoría de cambio de estado
            nuevo_activo = paciente.get("activo", 1)
            if nuevo_activo != paciente_actual[11]:  # Activo
                auditar_cambio_estado_paciente(
                    username_modificador=username_modificador,
                    id_paciente_modificado=paciente_actual[0],
                    estado_anterior=bool(paciente_actual[11]),
                    estado_nuevo=bool(nuevo_activo)
                )
                
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de actualización de paciente: {audit_error}")
            # NO fallar la operación principal

        print(f"✅ Paciente actualizado exitosamente. Filas afectadas: {cursor.rowcount}")
        return {"message": "Paciente actualizado con éxito"}
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar el paciente: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar el paciente")
    finally:
        cursor.close()
        conn.close()

@router.put("/pacientes/{dni}/estado")
def actualizar_estado_paciente(dni: str, estado: dict, request: Request):
    """
    Actualiza el estado activo/inactivo de un paciente específico
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        # Obtener estado actual del paciente para auditoría
        cursor.execute("SELECT Activo FROM Paciente WHERE DNI = %s", (dni,))
        paciente_actual = cursor.fetchone()
        if not paciente_actual:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        # Validar que el estado sea válido (0 o 1)
        activo = estado.get("activo")
        if activo not in [0, 1]:
            raise HTTPException(status_code=400, detail="El valor de activo debe ser 0 o 1")
        
        cursor.execute("""
            UPDATE Paciente
            SET Activo = %s
            WHERE DNI = %s
        """, (activo, dni))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")
        
        conn.commit()
        
        # Registrar auditoría de cambio de estado
        try:
            # Obtener usuario logueado desde el header o usar valor por defecto
            username_modificador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            # Solo auditar si el estado realmente cambió
            if activo != paciente_actual[0]:
                auditar_cambio_estado_paciente(
                    username_modificador=username_modificador,
                    id_paciente_modificado=dni,  # Usar DNI como ID
                    estado_anterior=bool(paciente_actual[0]),
                    estado_nuevo=bool(activo)
                )
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de cambio de estado de paciente: {audit_error}")
            # NO fallar la operación principal
        
        return {"mensaje": "Estado de paciente actualizado exitosamente"}
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar estado: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar estado")
    finally:
        cursor.close()
        conn.close()
        
@router.get("/esProfesionalPorShortname")
async def es_profesional_por_shortname(shortname: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener ID del usuario desde Username
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (shortname,))
        usuario = cursor.fetchone()

        if not usuario:
            cursor.close()
            conn.close()
            return {"esProfesional": False}

        # Buscar en la tabla de mapeo ProfesionalUsuario
        cursor.execute("""
            SELECT ID FROM ProfesionalUsuario
            WHERE ID_Usuario = %s
        """, (usuario["ID"],))
        resultado = cursor.fetchone()
        
        print(f"Resultado de búsqueda en ProfesionalUsuario: {resultado}")
        cursor.close()
        conn.close()
        return {"esProfesional": resultado is not None}
    except Exception as e:
        print(f"❌ Error al verificar profesional: {e}")
        cursor.close()
        conn.close()
        return {"esProfesional": False}

@router.get("/profesional")
def obtener_pacientes_por_profesional(shortname: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener ID del usuario desde Username
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (shortname,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener ID del profesional usando la tabla de mapeo
        cursor.execute("""
            SELECT ID_Profesional FROM ProfesionalUsuario
            WHERE ID_Usuario = %s
        """, (usuario["ID"],))
        profesional = cursor.fetchone()

        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

        # Obtener pacientes con al menos un turno con ese profesional
        cursor.execute("""
            SELECT DISTINCT p.*
            FROM Paciente p
            JOIN Turno t ON p.ID = t.ID_Paciente
            WHERE t.ID_Profesional = %s AND p.Activo = 1
        """, (profesional["ID_Profesional"],))
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
        # Obtener ID del usuario desde Username
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener ID del profesional usando la tabla de mapeo
        cursor.execute("""
            SELECT ID_Profesional FROM ProfesionalUsuario
            WHERE ID_Usuario = %s
        """, (usuario["ID"],))
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
            t.ID_EstadoTurno,
            est.Descripcion AS EstadoTurno,
            nv.ID AS ID_NotaVoz
        FROM Turno t
        JOIN Especialidad e ON t.ID_Especialidad = e.ID_Especialidad
        JOIN Turno_Estado est ON t.ID_EstadoTurno = est.ID
        LEFT JOIN NotaVoz nv ON t.ID = nv.ID_Turno
        WHERE t.ID_Paciente = %s AND t.ID_Profesional = %s
        ORDER BY t.Fecha DESC, t.Hora DESC
        """
        cursor.execute(sql, (id_paciente, profesional["ID_Profesional"]))
        turnos = cursor.fetchall()

        # Convertir timedelta a time para el campo Hora
        for turno in turnos:
            if isinstance(turno["Hora"], timedelta):
                td = turno["Hora"]
                turno["Hora"] = (datetime.min + td).time()

        return turnos
    except Exception as e:
        print(f"❌ Error al obtener turnos del paciente: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener turnos")
    finally:
        cursor.close()
        conn.close()


# Endpoint para obtener profesional por username
from fastapi import HTTPException

@router.get("/obtenerIdProfesionalPorUsername")
def obtener_id_profesional_por_username(username: str):
    """
    Obtiene el ID del profesional directamente por username
    Utilizado para optimizar consultas en el frontend
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener ID del usuario desde Username
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Buscar el ID del profesional usando la tabla de mapeo
        cursor.execute("""
            SELECT ID_Profesional FROM ProfesionalUsuario
            WHERE ID_Usuario = %s
        """, (usuario["ID"],))
        profesional = cursor.fetchone()

        if not profesional:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")

        return {"idProfesional": profesional["ID_Profesional"]}
    except Exception as e:
        print(f"❌ Error al obtener ID del profesional: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener ID del profesional")
    finally:
        cursor.close()
        conn.close()

@router.get("/obtenerProfesionalPorUsername")
def obtener_profesional_por_username(username: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener ID del usuario desde Username
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Buscar el ID del profesional usando la tabla de mapeo
        cursor.execute("""
            SELECT pu.ID_Profesional, p.Nombre, p.Apellido
            FROM ProfesionalUsuario pu
            JOIN Profesional p ON pu.ID_Profesional = p.ID
            WHERE pu.ID_Usuario = %s
        """, (usuario["ID"],))
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
        # Obtener ID del usuario desde Username
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Obtener ID del profesional usando la tabla de mapeo
        cursor.execute("""
            SELECT ID_Profesional FROM ProfesionalUsuario
            WHERE ID_Usuario = %s
        """, (usuario["ID"],))
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
            t.ID_EstadoTurno,
            est.Descripcion AS EstadoTurno,
            p.Nombre AS NombrePaciente,
            p.Apellido AS ApellidoPaciente,
            nv.ID AS ID_NotaVoz
        FROM Turno t
        JOIN Especialidad e ON t.ID_Especialidad = e.ID_Especialidad
        JOIN Turno_Estado est ON t.ID_EstadoTurno = est.ID
        JOIN Paciente p ON t.ID_Paciente = p.ID
        LEFT JOIN NotaVoz nv ON t.ID = nv.ID_Turno
        WHERE t.ID_Profesional = %s
        ORDER BY t.Fecha DESC, t.Hora DESC
        """
        cursor.execute(sql, (profesional["ID_Profesional"],))
        turnos = cursor.fetchall()

        # Convertir timedelta a time para el campo Hora
        for turno in turnos:
            if isinstance(turno["Hora"], timedelta):
                td = turno["Hora"]
                turno["Hora"] = (datetime.min + td).time()

        return turnos
    except Exception as e:
        print(f"❌ Error al obtener turnos: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener turnos")
    finally:
        cursor.close()
        conn.close()