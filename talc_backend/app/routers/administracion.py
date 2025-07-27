"""
Router para el módulo de Administración del sistema TALC

Este módulo maneja todas las operaciones administrativas del sistema:
- Estadísticas del sistema
- Gestión de Profesionales (CRUD)
- Gestión de Usuarios (CRUD)
- Gestión de Obras Sociales (CRUD)
- Gestión de Escuelas (CRUD)

Autor: Sistema TALC
Fecha: 2024
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from app.database import get_connection
import bcrypt
from app.utils.auditoria import (
    auditar_creacion_usuario, auditar_modificacion_usuario, auditar_cambio_estado_usuario,
    auditar_creacion_profesional, auditar_modificacion_profesional, auditar_cambio_estado_profesional, auditar_eliminacion_profesional,
    auditar_creacion_paciente, auditar_modificacion_paciente, auditar_cambio_estado_paciente, auditar_eliminacion_paciente,
    auditar_creacion_turno, auditar_modificacion_turno, auditar_cambio_estado_turno, auditar_eliminacion_turno,
    auditar_creacion_adjunto, auditar_modificacion_adjunto, auditar_eliminacion_adjunto,
    auditar_creacion_nota_voz, auditar_modificacion_nota_voz, auditar_eliminacion_nota_voz,
    auditar_creacion_informe_ia, auditar_modificacion_informe_ia, auditar_eliminacion_informe_ia
)

# Crear router para administración
router = APIRouter(prefix="/administracion", tags=["Administración"])

# =============================================================================
# MODELOS PYDANTIC
# =============================================================================

class EstadisticasSistema(BaseModel):
    """Modelo para las estadísticas del sistema"""
    total_profesionales: int
    total_usuarios: int
    total_obras_sociales: int
    total_escuelas: int
    total_especialidades: int

class ProfesionalBase(BaseModel):
    """Modelo base para profesionales"""
    Nombre: str
    Apellido: str
    Email: str
    Telefono: str
    DNI: str
    Matricula: str
    FechaNacimiento: Optional[str] = None
    Genero: Optional[str] = None
    Domicilio: Optional[str] = None
    ID_Ciudad: Optional[int] = None
    Observaciones: Optional[str] = None
    UsaIntegracionCalendar: Optional[bool] = False
    Especialidad: Optional[str] = None
    NombreGenero: Optional[str] = None
    Especialidades: Optional[List[int]] = None
    NombreCiudad: Optional[str] = None
    ID_Provincia: Optional[int] = None
    NombreProvincia: Optional[str] = None

class ProfesionalCreate(ProfesionalBase):
    """Modelo para crear un profesional"""
    pass

class ProfesionalUpdate(BaseModel):
    """Modelo para actualizar un profesional"""
    Nombre: Optional[str] = None
    Apellido: Optional[str] = None
    Email: Optional[str] = None
    Telefono: Optional[str] = None
    DNI: Optional[str] = None
    Matricula: Optional[str] = None
    FechaNacimiento: Optional[str] = None
    Genero: Optional[str] = None
    Domicilio: Optional[str] = None
    ID_Ciudad: Optional[int] = None
    Observaciones: Optional[str] = None
    UsaIntegracionCalendar: Optional[bool] = None
    Especialidad: Optional[str] = None
    Activo: Optional[bool] = None
    Especialidades: Optional[List[int]] = None

class Profesional(ProfesionalBase):
    """Modelo completo de profesional"""
    ID: int
    Activo: Optional[bool] = None
    
    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    """Modelo base para usuarios"""
    Username: str
    NombreCompleto: str
    Email: str
    Rol: str

class UsuarioCreate(UsuarioBase):
    """Modelo para crear un usuario"""
    Password: str

class UsuarioUpdate(BaseModel):
    """Modelo para actualizar un usuario"""
    Username: Optional[str] = None
    NombreCompleto: Optional[str] = None
    Email: Optional[str] = None
    Password: Optional[str] = None
    Rol: Optional[str] = None
    Activo: Optional[bool] = None

class Usuario(UsuarioBase):
    """Modelo completo de usuario"""
    ID: int
    Activo: bool
    
    class Config:
        from_attributes = True

class ObraSocialBase(BaseModel):
    """Modelo base para obras sociales"""
    Nombre: str

class ObraSocialCreate(ObraSocialBase):
    """Modelo para crear una obra social"""
    pass

class ObraSocialUpdate(BaseModel):
    """Modelo para actualizar una obra social"""
    Nombre: Optional[str] = None

class ObraSocial(ObraSocialBase):
    """Modelo completo de obra social"""
    ID: int
    
    class Config:
        from_attributes = True

class EscuelaBase(BaseModel):
    """Modelo base para escuelas"""
    Nombre: str
    ID_Ciudad: int

class EscuelaCreate(EscuelaBase):
    """Modelo para crear una escuela"""
    pass

class EscuelaUpdate(BaseModel):
    """Modelo para actualizar una escuela"""
    Nombre: Optional[str] = None
    ID_Ciudad: Optional[int] = None

class Escuela(EscuelaBase):
    """Modelo completo de escuela"""
    ID: int
    Ciudad: Optional[str] = None
    Provincia: Optional[str] = None
    
    class Config:
        from_attributes = True

# =============================================================================
# MODELOS DE ESPECIALIDADES
# =============================================================================

class EspecialidadBase(BaseModel):
    """Modelo base para especialidades"""
    Nombre: str
    Descripcion: Optional[str] = None

class EspecialidadCreate(EspecialidadBase):
    """Modelo para crear una especialidad"""
    pass

class EspecialidadUpdate(BaseModel):
    """Modelo para actualizar una especialidad"""
    Nombre: Optional[str] = None
    Descripcion: Optional[str] = None

class Especialidad(EspecialidadBase):
    """Modelo completo de especialidad"""
    ID_Especialidad: int

    class Config:
        from_attributes = True

# =============================================================================
# ENDPOINTS DE ESTADÍSTICAS
# =============================================================================

@router.get("/estadisticas", response_model=EstadisticasSistema)
def obtener_estadisticas():
    """
    Obtiene las estadísticas del sistema para el dashboard de administración
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Contar profesionales
        cursor.execute("SELECT COUNT(*) as total FROM Profesional")
        total_profesionales = cursor.fetchone()['total']

        # Contar usuarios activos
        cursor.execute("SELECT COUNT(*) as total FROM Usuario WHERE Activo = 1")
        total_usuarios = cursor.fetchone()['total']

        # Contar obras sociales
        cursor.execute("SELECT COUNT(*) as total FROM ObraSocial")
        total_obras_sociales = cursor.fetchone()['total']

        # Contar escuelas
        cursor.execute("SELECT COUNT(*) as total FROM Escuela")
        total_escuelas = cursor.fetchone()['total']

        # Contar especialidades
        cursor.execute("SELECT COUNT(*) as total FROM Especialidad")
        total_especialidades = cursor.fetchone()['total']

        return EstadisticasSistema(
            total_profesionales=total_profesionales,
            total_usuarios=total_usuarios,
            total_obras_sociales=total_obras_sociales,
            total_escuelas=total_escuelas,
            total_especialidades=total_especialidades
        )
    except Exception as e:
        print(f"❌ Error al obtener estadísticas: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")
    finally:
        cursor.close()
        conn.close()

# ENDPOINTS DE ESPECIALIDADES
# =============================================================================

@router.get("/especialidades", response_model=List[Especialidad])
def obtener_especialidades():
    """
    Obtiene todas las especialidades disponibles
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT ID_Especialidad, Nombre, Descripcion
            FROM Especialidad
            ORDER BY Nombre
        """)
        especialidades = cursor.fetchall()
        
        return [Especialidad(**esp) for esp in especialidades]
    except Exception as e:
        print(f"❌ Error al obtener especialidades: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener especialidades")
    finally:
        cursor.close()
        conn.close()

@router.post("/especialidades", response_model=Especialidad)
def crear_especialidad(especialidad: EspecialidadCreate):
    """
    Crea una nueva especialidad
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            INSERT INTO Especialidad (Nombre, Descripcion)
            VALUES (%s, %s)
        """, (especialidad.Nombre, especialidad.Descripcion))
        
        conn.commit()
        especialidad_id = cursor.lastrowid
        
        # Obtener la especialidad creada
        cursor.execute("""
            SELECT ID_Especialidad, Nombre, Descripcion
            FROM Especialidad
            WHERE ID_Especialidad = %s
        """, (especialidad_id,))
        
        especialidad_creada = cursor.fetchone()
        return Especialidad(**especialidad_creada)
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear especialidad: {e}")
        
        # Manejar errores específicos de MySQL
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Ya existe una especialidad con ese nombre")
        
        raise HTTPException(status_code=500, detail="Error al crear especialidad")
    finally:
        cursor.close()
        conn.close()

@router.put("/especialidades/{especialidad_id}", response_model=Especialidad)
def actualizar_especialidad(especialidad_id: int, especialidad: EspecialidadUpdate):
    """
    Actualiza una especialidad existente
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que la especialidad existe
        cursor.execute("SELECT ID_Especialidad FROM Especialidad WHERE ID_Especialidad = %s", (especialidad_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Especialidad no encontrada")

        # Construir la consulta de actualización dinámicamente
        campos = []
        valores = []
        
        if especialidad.Nombre is not None:
            campos.append("Nombre = %s")
            valores.append(especialidad.Nombre)
        
        if especialidad.Descripcion is not None:
            campos.append("Descripcion = %s")
            valores.append(especialidad.Descripcion)
        
        if not campos:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        
        valores.append(especialidad_id)
        query = f"UPDATE Especialidad SET {', '.join(campos)} WHERE ID_Especialidad = %s"
        
        cursor.execute(query, valores)
        conn.commit()
        
        # Obtener la especialidad actualizada
        cursor.execute("""
            SELECT ID_Especialidad, Nombre, Descripcion
            FROM Especialidad
            WHERE ID_Especialidad = %s
        """, (especialidad_id,))
        
        especialidad_actualizada = cursor.fetchone()
        return Especialidad(**especialidad_actualizada)
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar especialidad: {e}")
        
        # Manejar errores específicos de MySQL
        if "Duplicate entry" in str(e):
            raise HTTPException(status_code=400, detail="Ya existe una especialidad con ese nombre")
        
        raise HTTPException(status_code=500, detail="Error al actualizar especialidad")
    finally:
        cursor.close()
        conn.close()

@router.delete("/especialidades/{especialidad_id}")
def eliminar_especialidad(especialidad_id: int):
    """
    Elimina una especialidad (solo si no está en uso)
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que la especialidad existe
        cursor.execute("SELECT ID_Especialidad FROM Especialidad WHERE ID_Especialidad = %s", (especialidad_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Especialidad no encontrada")

        # Verificar si la especialidad está en uso por algún profesional
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM Profesional_Especialidad
            WHERE ID_Especialidad = %s
        """, (especialidad_id,))
        
        resultado = cursor.fetchone()
        if resultado['count'] > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No se puede eliminar la especialidad porque está asignada a {resultado['count']} profesional(es)"
            )

        # Eliminar la especialidad
        cursor.execute("DELETE FROM Especialidad WHERE ID_Especialidad = %s", (especialidad_id,))
        conn.commit()
        
        return {"message": "Especialidad eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al eliminar especialidad: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar especialidad")
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# ENDPOINTS DE PROFESIONALES
# =============================================================================

@router.get("/profesionales", response_model=List[Profesional])
def obtener_profesionales():
    """
    Obtiene todos los profesionales del sistema
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                   p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                   p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo,
                   GROUP_CONCAT(e.Nombre SEPARATOR ', ') as Especialidad,
                   GROUP_CONCAT(e.ID_Especialidad SEPARATOR ', ') as Especialidades,
                   g.Genero as NombreGenero,
                   c.Ciudad as NombreCiudad,
                   c.ID_Provincia,
                   pr.Provincia as NombreProvincia
            FROM Profesional p
            LEFT JOIN Profesional_Especialidad pe ON p.ID = pe.ID_Profesional
            LEFT JOIN Especialidad e ON pe.ID_Especialidad = e.ID_Especialidad
            LEFT JOIN Genero g ON p.Genero = g.ID
            LEFT JOIN Ciudad c ON p.ID_Ciudad = c.ID
            LEFT JOIN Provincia pr ON c.ID_Provincia = pr.ID
            GROUP BY p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                     p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                     p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo, 
                     g.Genero, c.Ciudad, c.ID_Provincia, pr.Provincia
            ORDER BY p.Apellido, p.Nombre
        """)
        profesionales = cursor.fetchall()
        
        # Procesar fechas para convertir datetime.date a string
        for prof in profesionales:
            if prof['FechaNacimiento']:
                prof['FechaNacimiento'] = prof['FechaNacimiento'].strftime('%Y-%m-%d')
            
            # Procesar especialidades para convertir string a lista de IDs
            if prof['Especialidades']:
                prof['Especialidades'] = [int(id) for id in prof['Especialidades'].split(', ')]
            else:
                prof['Especialidades'] = []
        
        return [Profesional(**prof) for prof in profesionales]
    except Exception as e:
        print(f"❌ Error al obtener profesionales: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener profesionales")
    finally:
        cursor.close()
        conn.close()

@router.post("/profesionales", response_model=Profesional)
def crear_profesional(profesional: ProfesionalCreate, request: Request):
    """
    Crea un nuevo profesional
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Convertir nombre del género a ID si se proporciona
        genero_id = None
        if profesional.Genero:
            cursor.execute("SELECT ID FROM Genero WHERE Genero = %s", (profesional.Genero,))
            genero_result = cursor.fetchone()
            if genero_result:
                genero_id = genero_result['ID']
            else:
                raise HTTPException(status_code=400, detail=f"Género '{profesional.Genero}' no encontrado")

        # Insertar profesional con todos los campos
        cursor.execute("""
            INSERT INTO Profesional (Nombre, Apellido, Email, Telefono, 
                                    DNI, Matricula, FechaNacimiento, Genero, Domicilio, 
                                    ID_Ciudad, Observaciones, UsaIntegracionCalendar, Activo)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
        """, (profesional.Nombre, profesional.Apellido, 
              profesional.Email, profesional.Telefono, 
              profesional.DNI, profesional.Matricula, 
              profesional.FechaNacimiento, genero_id, profesional.Domicilio,
              profesional.ID_Ciudad, profesional.Observaciones, profesional.UsaIntegracionCalendar))
        
        conn.commit()
        profesional_id = cursor.lastrowid
        
        # Insertar especialidades si se proporcionan
        if profesional.Especialidades:
            for especialidad_id in profesional.Especialidades:
                cursor.execute("""
                    INSERT INTO Profesional_Especialidad (ID_Profesional, ID_Especialidad)
                    VALUES (%s, %s)
                """, (profesional_id, especialidad_id))
            conn.commit()
        
        # Registrar auditoría de creación
        try:
            datos_profesional = {
                "Nombre": profesional.Nombre,
                "Apellido": profesional.Apellido,
                "Email": profesional.Email,
                "Telefono": profesional.Telefono,
                "DNI": profesional.DNI,
                "Matricula": profesional.Matricula,
                "FechaNacimiento": profesional.FechaNacimiento,
                "Genero": profesional.Genero,
                "Domicilio": profesional.Domicilio,
                "ID_Ciudad": profesional.ID_Ciudad,
                "Observaciones": profesional.Observaciones,
                "UsaIntegracionCalendar": profesional.UsaIntegracionCalendar,
                "Especialidades": profesional.Especialidades,
                "Activo": True
            }
            
            # Obtener usuario logueado desde el header o usar valor por defecto
            from app.utils.auditoria import obtener_usuario_logueado, obtener_usuario_por_defecto
            username_creador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            auditar_creacion_profesional(
                username_creador=username_creador,
                id_profesional_creado=profesional_id,
                datos_profesional=datos_profesional
            )
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de creación de profesional: {audit_error}")
            # NO fallar la operación principal
        
        # Obtener el profesional creado con todos sus datos
        cursor.execute("""
            SELECT p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                   p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                   p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo,
                   GROUP_CONCAT(e.Nombre SEPARATOR ', ') as Especialidad,
                   GROUP_CONCAT(e.ID_Especialidad SEPARATOR ', ') as Especialidades,
                   g.Genero as NombreGenero,
                   c.Ciudad as NombreCiudad,
                   c.ID_Provincia,
                   pr.Provincia as NombreProvincia
            FROM Profesional p
            LEFT JOIN Profesional_Especialidad pe ON p.ID = pe.ID_Profesional
            LEFT JOIN Especialidad e ON pe.ID_Especialidad = e.ID_Especialidad
            LEFT JOIN Genero g ON p.Genero = g.ID
            LEFT JOIN Ciudad c ON p.ID_Ciudad = c.ID
            LEFT JOIN Provincia pr ON c.ID_Provincia = pr.ID
            WHERE p.ID = %s
            GROUP BY p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                     p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                     p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo, 
                     g.Genero, c.Ciudad, c.ID_Provincia, pr.Provincia
        """, (profesional_id,))
        
        profesional_creado = cursor.fetchone()
        
        # Procesar fechas para convertir datetime.date a string
        if profesional_creado['FechaNacimiento']:
            profesional_creado['FechaNacimiento'] = profesional_creado['FechaNacimiento'].strftime('%Y-%m-%d')
        
        # Procesar especialidades para convertir string a lista de IDs
        if profesional_creado['Especialidades']:
            profesional_creado['Especialidades'] = [int(id) for id in profesional_creado['Especialidades'].split(', ')]
        else:
            profesional_creado['Especialidades'] = []
        
        return Profesional(**profesional_creado)
        
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear profesional: {e}")
        
        # Manejar errores específicos de MySQL
        if "Duplicate entry" in str(e):
            if "DNI" in str(e):
                raise HTTPException(status_code=400, detail="El DNI ya existe en el sistema")
            elif "Matricula" in str(e):
                raise HTTPException(status_code=400, detail="La matrícula ya existe en el sistema")
            else:
                raise HTTPException(status_code=400, detail="Ya existe un registro con estos datos")
        else:
            raise HTTPException(status_code=500, detail="Error al crear profesional")
    finally:
        cursor.close()
        conn.close()

@router.put("/profesionales/{profesional_id}", response_model=Profesional)
def actualizar_profesional(profesional_id: int, profesional: ProfesionalUpdate, request: Request):
    """
    Actualiza un profesional existente
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener datos actuales del profesional para auditoría
        cursor.execute("""
            SELECT p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                   p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                   p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo,
                   g.Genero as NombreGenero
            FROM Profesional p
            LEFT JOIN Genero g ON p.Genero = g.ID
            WHERE p.ID = %s
        """, (profesional_id,))
        
        profesional_actual = cursor.fetchone()
        if not profesional_actual:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")
        
        # Construir query dinámicamente basado en los campos proporcionados
        campos = []
        valores = []
        
        if profesional.Nombre is not None:
            campos.append("Nombre = %s")
            valores.append(profesional.Nombre)
        if profesional.Apellido is not None:
            campos.append("Apellido = %s")
            valores.append(profesional.Apellido)

        if profesional.Email is not None:
            campos.append("Email = %s")
            valores.append(profesional.Email)
        if profesional.Telefono is not None:
            campos.append("Telefono = %s")
            valores.append(profesional.Telefono)
        if profesional.DNI is not None:
            campos.append("DNI = %s")
            valores.append(profesional.DNI)
        if profesional.Matricula is not None:
            campos.append("Matricula = %s")
            valores.append(profesional.Matricula)
        if profesional.FechaNacimiento is not None:
            campos.append("FechaNacimiento = %s")
            valores.append(profesional.FechaNacimiento)
        if profesional.Genero is not None:
            # Convertir nombre del género a ID
            cursor.execute("SELECT ID FROM Genero WHERE Genero = %s", (profesional.Genero,))
            genero_result = cursor.fetchone()
            if genero_result:
                campos.append("Genero = %s")
                valores.append(genero_result['ID'])
            else:
                raise HTTPException(status_code=400, detail=f"Género '{profesional.Genero}' no encontrado")
        if profesional.Domicilio is not None:
            campos.append("Domicilio = %s")
            valores.append(profesional.Domicilio)
        if profesional.ID_Ciudad is not None:
            campos.append("ID_Ciudad = %s")
            valores.append(profesional.ID_Ciudad)
        if profesional.Observaciones is not None:
            campos.append("Observaciones = %s")
            valores.append(profesional.Observaciones)
        if profesional.UsaIntegracionCalendar is not None:
            campos.append("UsaIntegracionCalendar = %s")
            valores.append(profesional.UsaIntegracionCalendar)
        if profesional.Especialidad is not None:
            campos.append("Especialidad = %s")
            valores.append(profesional.Especialidad)
        if profesional.Activo is not None:
            campos.append("Activo = %s")
            valores.append(profesional.Activo)
        
        if not campos:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        
        valores.append(profesional_id)
        query = f"UPDATE Profesional SET {', '.join(campos)} WHERE ID = %s"
        
        cursor.execute(query, valores)
        conn.commit()
        
        # Registrar auditoría de modificaciones
        try:
            # Obtener usuario logueado desde el header o usar valor por defecto
            from app.utils.auditoria import obtener_usuario_logueado, obtener_usuario_por_defecto
            username_modificador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            # Auditoría de cambios en campos básicos
            if profesional.Nombre is not None and profesional.Nombre != profesional_actual['Nombre']:
                auditar_modificacion_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    campo_modificado="Nombre",
                    valor_anterior=profesional_actual['Nombre'],
                    valor_nuevo=profesional.Nombre
                )
            
            if profesional.Apellido is not None and profesional.Apellido != profesional_actual['Apellido']:
                auditar_modificacion_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    campo_modificado="Apellido",
                    valor_anterior=profesional_actual['Apellido'],
                    valor_nuevo=profesional.Apellido
                )
            
            if profesional.Email is not None and profesional.Email != profesional_actual['Email']:
                auditar_modificacion_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    campo_modificado="Email",
                    valor_anterior=profesional_actual['Email'],
                    valor_nuevo=profesional.Email
                )
            
            if profesional.Telefono is not None and profesional.Telefono != profesional_actual['Telefono']:
                auditar_modificacion_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    campo_modificado="Telefono",
                    valor_anterior=profesional_actual['Telefono'],
                    valor_nuevo=profesional.Telefono
                )
            
            if profesional.DNI is not None and profesional.DNI != profesional_actual['DNI']:
                auditar_modificacion_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    campo_modificado="DNI",
                    valor_anterior=profesional_actual['DNI'],
                    valor_nuevo=profesional.DNI
                )
            
            if profesional.Matricula is not None and profesional.Matricula != profesional_actual['Matricula']:
                auditar_modificacion_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    campo_modificado="Matricula",
                    valor_anterior=profesional_actual['Matricula'],
                    valor_nuevo=profesional.Matricula
                )
            
            # Auditoría de cambio de estado
            if profesional.Activo is not None and profesional.Activo != profesional_actual['Activo']:
                auditar_cambio_estado_profesional(
                    username_modificador=username_modificador,
                    id_profesional_modificado=profesional_id,
                    estado_anterior=profesional_actual['Activo'],
                    estado_nuevo=profesional.Activo
                )
                
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de actualización de profesional: {audit_error}")
            # NO fallar la operación principal
        
        # Obtener el profesional actualizado con información completa
        cursor.execute("""
            SELECT p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                   p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                   p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo,
                   GROUP_CONCAT(e.Nombre SEPARATOR ', ') as Especialidad,
                   g.Genero as NombreGenero
            FROM Profesional p
            LEFT JOIN Profesional_Especialidad pe ON p.ID = pe.ID_Profesional
            LEFT JOIN Especialidad e ON pe.ID_Especialidad = e.ID_Especialidad
            LEFT JOIN Genero g ON p.Genero = g.ID
            WHERE p.ID = %s
            GROUP BY p.ID, p.Nombre, p.Apellido, p.Email, p.Telefono, 
                     p.DNI, p.Matricula, p.FechaNacimiento, p.Genero, p.Domicilio, 
                     p.ID_Ciudad, p.Observaciones, p.UsaIntegracionCalendar, p.Activo, g.Genero
        """, (profesional_id,))
        
        profesional_actualizado = cursor.fetchone()
        if not profesional_actualizado:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")
        
        # Procesar fecha para convertir datetime.date a string
        if profesional_actualizado['FechaNacimiento']:
            profesional_actualizado['FechaNacimiento'] = profesional_actualizado['FechaNacimiento'].strftime('%Y-%m-%d')
        
        return Profesional(**profesional_actualizado)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar profesional: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar profesional")
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# ENDPOINTS DE USUARIOS
# =============================================================================

@router.get("/usuarios", response_model=List[Usuario])
def obtener_usuarios():
    """
    Obtiene todos los usuarios del sistema con sus roles
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT u.ID, u.Username, 
                   CONCAT(u.Nombre, ' ', u.Apellido) as NombreCompleto, 
                   u.Email, u.Activo,
                   GROUP_CONCAT(g.Grupo) as Rol
            FROM Usuario u
            LEFT JOIN Usuario_Grupo ug ON u.ID = ug.ID_Usuario
            LEFT JOIN Grupo g ON ug.ID_Grupo = g.ID
            GROUP BY u.ID
            ORDER BY u.Apellido, u.Nombre
        """)
        usuarios = cursor.fetchall()
        
        # Procesar rol (tomar el primer rol si hay múltiples)
        for usuario in usuarios:
            if usuario['Rol']:
                roles = usuario['Rol'].split(',')
                usuario['Rol'] = roles[0]  # Tomar el primer rol
            else:
                usuario['Rol'] = 'Sin rol'
        
        return [Usuario(**usuario) for usuario in usuarios]
    except Exception as e:
        print(f"❌ Error al obtener usuarios: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener usuarios")
    finally:
        cursor.close()
        conn.close()

@router.post("/usuarios", response_model=Usuario)
def crear_usuario(usuario: UsuarioCreate, request: Request):
    """
    Crea un nuevo usuario con rol
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Separar NombreCompleto en Nombre y Apellido
        nombre_parts = usuario.NombreCompleto.strip().split(' ', 1)
        nombre = nombre_parts[0]
        apellido = nombre_parts[1] if len(nombre_parts) > 1 else ''
        
        # Hash de la contraseña
        hashed_password = bcrypt.hashpw(usuario.Password.encode('utf-8'), bcrypt.gensalt())
        
        # Crear usuario
        cursor.execute("""
            INSERT INTO Usuario (Username, Contraseña, Nombre, Apellido, Email, Activo, DebeCambiarContrasena)
            VALUES (%s, %s, %s, %s, %s, 1, 1)
        """, (usuario.Username, hashed_password, nombre, apellido, usuario.Email))
        
        usuario_id = cursor.lastrowid
        
        # Asignar rol
        cursor.execute("SELECT ID FROM Grupo WHERE Grupo = %s", (usuario.Rol,))
        grupo = cursor.fetchone()
        if grupo:
            cursor.execute("""
                INSERT INTO Usuario_Grupo (ID_Usuario, ID_Grupo)
                VALUES (%s, %s)
            """, (usuario_id, grupo['ID']))
        
        conn.commit()
        
        # Registrar auditoría de creación
        try:
            datos_usuario = {
                "Username": usuario.Username,
                "NombreCompleto": usuario.NombreCompleto,
                "Email": usuario.Email,
                "Rol": usuario.Rol,
                "Activo": True
            }
            
            # Obtener usuario logueado desde el header o usar valor por defecto
            from app.utils.auditoria import obtener_usuario_logueado, obtener_usuario_por_defecto
            username_creador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            auditar_creacion_usuario(
                username_creador=username_creador,
                id_usuario_creado=usuario_id,
                datos_usuario=datos_usuario
            )
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de creación de usuario: {audit_error}")
            # NO fallar la operación principal
        
        return Usuario(
            ID=usuario_id,
            Username=usuario.Username,
            NombreCompleto=usuario.NombreCompleto,
            Email=usuario.Email,
            Rol=usuario.Rol,
            Activo=True
        )
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear usuario: {e}")
        raise HTTPException(status_code=500, detail="Error al crear usuario")
    finally:
        cursor.close()
        conn.close()

@router.put("/usuarios/{usuario_id}", response_model=Usuario)
def actualizar_usuario(usuario_id: int, usuario: UsuarioUpdate, request: Request):
    """
    Actualiza un usuario existente
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Obtener datos actuales del usuario para auditoría
        cursor.execute("""
            SELECT u.ID, u.Username, u.Nombre, u.Apellido, u.Email, u.Activo,
                   GROUP_CONCAT(g.Grupo) as Rol
            FROM Usuario u
            LEFT JOIN Usuario_Grupo ug ON u.ID = ug.ID_Usuario
            LEFT JOIN Grupo g ON ug.ID_Grupo = g.ID
            WHERE u.ID = %s
            GROUP BY u.ID
        """, (usuario_id,))
        
        usuario_actual = cursor.fetchone()
        if not usuario_actual:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Construir query de actualización
        campos = []
        valores = []
        
        if usuario.Username is not None:
            campos.append("Username = %s")
            valores.append(usuario.Username)
        
        if usuario.NombreCompleto is not None:
            # Separar NombreCompleto en Nombre y Apellido
            nombre_parts = usuario.NombreCompleto.strip().split(' ', 1)
            nombre = nombre_parts[0]
            apellido = nombre_parts[1] if len(nombre_parts) > 1 else ''
            
            campos.append("Nombre = %s")
            valores.append(nombre)
            campos.append("Apellido = %s")
            valores.append(apellido)
        
        if usuario.Email is not None:
            campos.append("Email = %s")
            valores.append(usuario.Email)
        
        if usuario.Password is not None:
            hashed_password = bcrypt.hashpw(usuario.Password.encode('utf-8'), bcrypt.gensalt())
            campos.append("Contraseña = %s")
            valores.append(hashed_password)
        
        if usuario.Activo is not None:
            campos.append("Activo = %s")
            valores.append(usuario.Activo)
        
        if campos:
            valores.append(usuario_id)
            query = f"UPDATE Usuario SET {', '.join(campos)} WHERE ID = %s"
            cursor.execute(query, valores)
        
        # Actualizar rol si se proporciona
        if usuario.Rol is not None:
            # Eliminar roles existentes
            cursor.execute("DELETE FROM Usuario_Grupo WHERE ID_Usuario = %s", (usuario_id,))
            
            # Asignar nuevo rol
            cursor.execute("SELECT ID FROM Grupo WHERE Grupo = %s", (usuario.Rol,))
            grupo = cursor.fetchone()
            if grupo:
                cursor.execute("""
                    INSERT INTO Usuario_Grupo (ID_Usuario, ID_Grupo)
                    VALUES (%s, %s)
                """, (usuario_id, grupo['ID']))
        
        conn.commit()
        
        # Registrar auditoría de modificaciones
        try:
            # Obtener usuario logueado desde el header o usar valor por defecto
            from app.utils.auditoria import obtener_usuario_logueado, obtener_usuario_por_defecto
            username_modificador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            # Auditoría de cambios en campos básicos
            if usuario.Username is not None and usuario.Username != usuario_actual['Username']:
                auditar_modificacion_usuario(
                    username_modificador=username_modificador,
                    id_usuario_modificado=usuario_id,
                    campo_modificado="Username",
                    valor_anterior=usuario_actual['Username'],
                    valor_nuevo=usuario.Username
                )
            
            if usuario.Email is not None and usuario.Email != usuario_actual['Email']:
                auditar_modificacion_usuario(
                    username_modificador=username_modificador,
                    id_usuario_modificado=usuario_id,
                    campo_modificado="Email",
                    valor_anterior=usuario_actual['Email'],
                    valor_nuevo=usuario.Email
                )
            
            if usuario.Password is not None:
                auditar_modificacion_usuario(
                    username_modificador=username_modificador,
                    id_usuario_modificado=usuario_id,
                    campo_modificado="Password",
                    valor_anterior="[OCULTO]",
                    valor_nuevo="[OCULTO]"
                )
            
            # Auditoría de cambio de estado
            if usuario.Activo is not None and usuario.Activo != usuario_actual['Activo']:
                auditar_cambio_estado_usuario(
                    username_modificador=username_modificador,
                    id_usuario_modificado=usuario_id,
                    estado_anterior=usuario_actual['Activo'],
                    estado_nuevo=usuario.Activo
                )
            
            # Auditoría de cambio de rol
            if usuario.Rol is not None and usuario.Rol != usuario_actual['Rol']:
                auditar_modificacion_usuario(
                    username_modificador=username_modificador,
                    id_usuario_modificado=usuario_id,
                    campo_modificado="Rol",
                    valor_anterior=usuario_actual['Rol'],
                    valor_nuevo=usuario.Rol
                )
                
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de actualización de usuario: {audit_error}")
            # NO fallar la operación principal
        
        # Obtener usuario actualizado
        cursor.execute("""
            SELECT u.ID, u.Username, 
                   CONCAT(u.Nombre, ' ', u.Apellido) as NombreCompleto, 
                   u.Email, u.Activo,
                   GROUP_CONCAT(g.Grupo) as Rol
            FROM Usuario u
            LEFT JOIN Usuario_Grupo ug ON u.ID = ug.ID_Usuario
            LEFT JOIN Grupo g ON ug.ID_Grupo = g.ID
            WHERE u.ID = %s
            GROUP BY u.ID
        """, (usuario_id,))
        
        usuario_actualizado = cursor.fetchone()
        if usuario_actualizado:
            if usuario_actualizado['Rol']:
                roles = usuario_actualizado['Rol'].split(',')
                usuario_actualizado['Rol'] = roles[0]
            else:
                usuario_actualizado['Rol'] = 'Sin rol'
            
            return Usuario(**usuario_actualizado)
        else:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar usuario: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar usuario")
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# ENDPOINTS DE OBRAS SOCIALES
# =============================================================================

@router.get("/obras-sociales", response_model=List[ObraSocial])
def obtener_obras_sociales():
    """
    Obtiene todas las obras sociales del sistema
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT ID, Nombre
            FROM ObraSocial
            ORDER BY Nombre
        """)
        obras_sociales = cursor.fetchall()
        return [ObraSocial(**obra) for obra in obras_sociales]
    except Exception as e:
        print(f"❌ Error al obtener obras sociales: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener obras sociales")
    finally:
        cursor.close()
        conn.close()

@router.post("/obras-sociales", response_model=ObraSocial)
def crear_obra_social(obra_social: ObraSocialCreate):
    """
    Crea una nueva obra social
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            INSERT INTO ObraSocial (Nombre)
            VALUES (%s)
        """, (obra_social.Nombre,))
        
        conn.commit()
        obra_social_id = cursor.lastrowid
        
        return ObraSocial(ID=obra_social_id, **obra_social.dict())
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear obra social: {e}")
        raise HTTPException(status_code=500, detail="Error al crear obra social")
    finally:
        cursor.close()
        conn.close()

@router.put("/obras-sociales/{obra_social_id}", response_model=ObraSocial)
def actualizar_obra_social(obra_social_id: int, obra_social: ObraSocialUpdate):
    """
    Actualiza una obra social existente
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que la obra social existe
        cursor.execute("SELECT ID FROM ObraSocial WHERE ID = %s", (obra_social_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Obra social no encontrada")

        # Construir query de actualización dinámicamente
        update_fields = []
        values = []
        
        if obra_social.Nombre is not None:
            update_fields.append("Nombre = %s")
            values.append(obra_social.Nombre)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        
        values.append(obra_social_id)
        query = f"UPDATE ObraSocial SET {', '.join(update_fields)} WHERE ID = %s"
        
        cursor.execute(query, values)
        conn.commit()
        
        # Obtener la obra social actualizada
        cursor.execute("SELECT ID, Nombre FROM ObraSocial WHERE ID = %s", (obra_social_id,))
        obra_social_actualizada = cursor.fetchone()
        
        return ObraSocial(**obra_social_actualizada)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar obra social: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar obra social")
    finally:
        cursor.close()
        conn.close()

@router.delete("/obras-sociales/{obra_social_id}")
def eliminar_obra_social(obra_social_id: int):
    """
    Elimina una obra social (marca como inactiva o elimina físicamente)
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que la obra social existe
        cursor.execute("SELECT ID, Nombre FROM ObraSocial WHERE ID = %s", (obra_social_id,))
        obra_social = cursor.fetchone()
        if not obra_social:
            raise HTTPException(status_code=404, detail="Obra social no encontrada")

        # Eliminar físicamente (ya que no hay columna Activo)
        cursor.execute("DELETE FROM ObraSocial WHERE ID = %s", (obra_social_id,))
        conn.commit()
        
        return {"message": f"Obra social '{obra_social['Nombre']}' eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al eliminar obra social: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar obra social")
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# ENDPOINTS DE ESCUELAS
# =============================================================================

@router.get("/escuelas", response_model=List[Escuela])
def obtener_escuelas():
    """
    Obtiene todas las escuelas del sistema con información de ciudad
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT e.ID, e.Nombre, e.ID_Ciudad, c.Ciudad, p.Provincia
            FROM Escuela e
            LEFT JOIN Ciudad c ON e.ID_Ciudad = c.ID
            LEFT JOIN Provincia p ON c.ID_Provincia = p.ID
            ORDER BY e.Nombre
        """)
        escuelas = cursor.fetchall()
        return [Escuela(**escuela) for escuela in escuelas]
    except Exception as e:
        print(f"❌ Error al obtener escuelas: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener escuelas")
    finally:
        cursor.close()
        conn.close()

@router.post("/escuelas", response_model=Escuela)
def crear_escuela(escuela: EscuelaCreate):
    """
    Crea una nueva escuela
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            INSERT INTO Escuela (Nombre, ID_Ciudad)
            VALUES (%s, %s)
        """, (escuela.Nombre, escuela.ID_Ciudad))
        
        conn.commit()
        escuela_id = cursor.lastrowid
        
        # Obtener información de la ciudad y provincia
        cursor.execute("""
            SELECT e.ID, e.Nombre, e.ID_Ciudad, c.Ciudad, p.Provincia
            FROM Escuela e
            LEFT JOIN Ciudad c ON e.ID_Ciudad = c.ID
            LEFT JOIN Provincia p ON c.ID_Provincia = p.ID
            WHERE e.ID = %s
        """, (escuela_id,))
        
        escuela_creada = cursor.fetchone()
        return Escuela(**escuela_creada)
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear escuela: {e}")
        raise HTTPException(status_code=500, detail="Error al crear escuela")
    finally:
        cursor.close()
        conn.close()

@router.put("/escuelas/{escuela_id}", response_model=Escuela)
def actualizar_escuela(escuela_id: int, escuela: EscuelaUpdate):
    """
    Actualiza una escuela existente
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que la escuela existe
        cursor.execute("SELECT ID FROM Escuela WHERE ID = %s", (escuela_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Escuela no encontrada")

        # Construir query de actualización dinámicamente
        update_fields = []
        values = []
        
        if escuela.Nombre is not None:
            update_fields.append("Nombre = %s")
            values.append(escuela.Nombre)
        

        
        if escuela.ID_Ciudad is not None:
            update_fields.append("ID_Ciudad = %s")
            values.append(escuela.ID_Ciudad)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        
        values.append(escuela_id)
        query = f"UPDATE Escuela SET {', '.join(update_fields)} WHERE ID = %s"
        
        cursor.execute(query, values)
        conn.commit()
        
        # Obtener la escuela actualizada con información de ciudad y provincia
        cursor.execute("""
            SELECT e.ID, e.Nombre, e.ID_Ciudad, c.Ciudad, p.Provincia
            FROM Escuela e
            LEFT JOIN Ciudad c ON e.ID_Ciudad = c.ID
            LEFT JOIN Provincia p ON c.ID_Provincia = p.ID
            WHERE e.ID = %s
        """, (escuela_id,))
        
        escuela_actualizada = cursor.fetchone()
        return Escuela(**escuela_actualizada)
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al actualizar escuela: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar escuela")
    finally:
        cursor.close()
        conn.close()

@router.delete("/escuelas/{escuela_id}")
def eliminar_escuela(escuela_id: int):
    """
    Elimina una escuela (marca como inactiva o elimina físicamente)
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que la escuela existe
        cursor.execute("SELECT ID, Nombre FROM Escuela WHERE ID = %s", (escuela_id,))
        escuela = cursor.fetchone()
        if not escuela:
            raise HTTPException(status_code=404, detail="Escuela no encontrada")

        # Eliminar físicamente (ya que no hay columna Activo)
        cursor.execute("DELETE FROM Escuela WHERE ID = %s", (escuela_id,))
        conn.commit()
        
        return {"message": f"Escuela '{escuela['Nombre']}' eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al eliminar escuela: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar escuela")
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# ENDPOINTS DE AUDITORÍA
# =============================================================================

@router.get("/auditoria")
def obtener_auditoria(
    tabla: Optional[str] = None,
    accion: Optional[str] = None,
    usuario: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    limite: int = 100
):
    """
    Obtiene registros de auditoría con filtros opcionales
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Construir query base
        query = """
            SELECT a.ID, a.FechaHora, a.ID_Usuario, a.Username, a.Accion, 
                   a.Tabla, a.ID_Registro, a.Campo_Modificado, a.Valor_Anterior, 
                   a.Valor_Nuevo, a.IP_Address, a.User_Agent, a.Comentario
            FROM Auditoria a
            WHERE 1=1
        """
        valores = []
        
        # Aplicar filtros
        if tabla:
            query += " AND a.Tabla = %s"
            valores.append(tabla)
        
        if accion:
            query += " AND a.Accion = %s"
            valores.append(accion)
        
        if usuario:
            query += " AND a.Username = %s"
            valores.append(usuario)
        
        if fecha_desde:
            query += " AND DATE(a.FechaHora) >= %s"
            valores.append(fecha_desde)
        
        if fecha_hasta:
            query += " AND DATE(a.FechaHora) <= %s"
            valores.append(fecha_hasta)
        
        # Ordenar por fecha más reciente y limitar resultados
        query += " ORDER BY a.FechaHora DESC LIMIT %s"
        valores.append(limite)
        
        cursor.execute(query, valores)
        registros = cursor.fetchall()
        
        return {
            "total": len(registros),
            "registros": registros
        }
        
    except Exception as e:
        print(f"❌ Error al obtener auditoría: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener auditoría")
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# ENDPOINTS DE DEBUG
# =============================================================================

@router.get("/debug-tablas")
def debug_tablas():
    """
    Endpoint de debugging para verificar la estructura de las tablas
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        tablas = ['Profesional', 'Usuario', 'ObraSocial', 'Escuela', 'Ciudad', 'Provincia']
        resultado = {}
        
        for tabla in tablas:
            try:
                cursor.execute(f"DESCRIBE {tabla}")
                columnas = cursor.fetchall()
                resultado[tabla] = [col['Field'] for col in columnas]
            except Exception as e:
                resultado[tabla] = f"Error: {str(e)}"
        
        return resultado
    except Exception as e:
        print(f"❌ Error al debuggear tablas: {e}")
        raise HTTPException(status_code=500, detail="Error al debuggear tablas")
    finally:
        cursor.close()
        conn.close() 