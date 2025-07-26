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

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import mysql.connector
from app.database import get_connection
import bcrypt

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

class ProfesionalBase(BaseModel):
    """Modelo base para profesionales"""
    Nombre: str
    Apellido: str
    Especialidad: str
    Email: str
    Telefono: str

class ProfesionalCreate(ProfesionalBase):
    """Modelo para crear un profesional"""
    pass

class ProfesionalUpdate(BaseModel):
    """Modelo para actualizar un profesional"""
    Nombre: Optional[str] = None
    Apellido: Optional[str] = None
    Especialidad: Optional[str] = None
    Email: Optional[str] = None
    Telefono: Optional[str] = None

class Profesional(ProfesionalBase):
    """Modelo completo de profesional"""
    ID: int
    
    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    """Modelo base para usuarios"""
    Username: str
    Nombre: str
    Apellido: str
    Email: str
    roles: List[str]

class UsuarioCreate(UsuarioBase):
    """Modelo para crear un usuario"""
    password: str

class UsuarioUpdate(BaseModel):
    """Modelo para actualizar un usuario"""
    Nombre: Optional[str] = None
    Apellido: Optional[str] = None
    Email: Optional[str] = None
    roles: Optional[List[str]] = None

class Usuario(UsuarioBase):
    """Modelo completo de usuario"""
    ID: int
    Activo: bool
    
    class Config:
        from_attributes = True

class ObraSocialBase(BaseModel):
    """Modelo base para obras sociales"""
    Nombre: str
    Descripcion: Optional[str] = None

class ObraSocialCreate(ObraSocialBase):
    """Modelo para crear una obra social"""
    pass

class ObraSocialUpdate(BaseModel):
    """Modelo para actualizar una obra social"""
    Nombre: Optional[str] = None
    Descripcion: Optional[str] = None

class ObraSocial(ObraSocialBase):
    """Modelo completo de obra social"""
    ID: int
    
    class Config:
        from_attributes = True

class EscuelaBase(BaseModel):
    """Modelo base para escuelas"""
    Nombre: str
    Direccion: Optional[str] = None
    ID_Ciudad: int

class EscuelaCreate(EscuelaBase):
    """Modelo para crear una escuela"""
    pass

class EscuelaUpdate(BaseModel):
    """Modelo para actualizar una escuela"""
    Nombre: Optional[str] = None
    Direccion: Optional[str] = None
    ID_Ciudad: Optional[int] = None

class Escuela(EscuelaBase):
    """Modelo completo de escuela"""
    ID: int
    Ciudad: Optional[str] = None
    
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

        return EstadisticasSistema(
            total_profesionales=total_profesionales,
            total_usuarios=total_usuarios,
            total_obras_sociales=total_obras_sociales,
            total_escuelas=total_escuelas
        )
    except Exception as e:
        print(f"❌ Error al obtener estadísticas: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")
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
            SELECT ID, Nombre, Apellido, Especialidad, Email, Telefono
            FROM Profesional
            ORDER BY Apellido, Nombre
        """)
        profesionales = cursor.fetchall()
        return [Profesional(**prof) for prof in profesionales]
    except Exception as e:
        print(f"❌ Error al obtener profesionales: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener profesionales")
    finally:
        cursor.close()
        conn.close()

@router.post("/profesionales", response_model=Profesional)
def crear_profesional(profesional: ProfesionalCreate):
    """
    Crea un nuevo profesional
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            INSERT INTO Profesional (Nombre, Apellido, Especialidad, Email, Telefono)
            VALUES (%s, %s, %s, %s, %s)
        """, (profesional.Nombre, profesional.Apellido, profesional.Especialidad, 
              profesional.Email, profesional.Telefono))
        
        conn.commit()
        profesional_id = cursor.lastrowid
        
        return Profesional(ID=profesional_id, **profesional.dict())
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear profesional: {e}")
        raise HTTPException(status_code=500, detail="Error al crear profesional")
    finally:
        cursor.close()
        conn.close()

@router.put("/profesionales/{profesional_id}", response_model=Profesional)
def actualizar_profesional(profesional_id: int, profesional: ProfesionalUpdate):
    """
    Actualiza un profesional existente
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Construir query dinámicamente basado en los campos proporcionados
        campos = []
        valores = []
        
        if profesional.Nombre is not None:
            campos.append("Nombre = %s")
            valores.append(profesional.Nombre)
        if profesional.Apellido is not None:
            campos.append("Apellido = %s")
            valores.append(profesional.Apellido)
        if profesional.Especialidad is not None:
            campos.append("Especialidad = %s")
            valores.append(profesional.Especialidad)
        if profesional.Email is not None:
            campos.append("Email = %s")
            valores.append(profesional.Email)
        if profesional.Telefono is not None:
            campos.append("Telefono = %s")
            valores.append(profesional.Telefono)
        
        if not campos:
            raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")
        
        valores.append(profesional_id)
        query = f"UPDATE Profesional SET {', '.join(campos)} WHERE ID = %s"
        
        cursor.execute(query, valores)
        conn.commit()
        
        # Obtener el profesional actualizado
        cursor.execute("""
            SELECT ID, Nombre, Apellido, Especialidad, Email, Telefono
            FROM Profesional WHERE ID = %s
        """, (profesional_id,))
        
        profesional_actualizado = cursor.fetchone()
        if not profesional_actualizado:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")
        
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

@router.delete("/profesionales/{profesional_id}")
def eliminar_profesional(profesional_id: int):
    """
    Elimina un profesional (marca como inactivo si tiene columna Activo, sino elimina físicamente)
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar si existe la columna Activo
        cursor.execute("DESCRIBE Profesional")
        columnas = [col['Field'] for col in cursor.fetchall()]
        
        if 'Activo' in columnas:
            # Marcar como inactivo
            cursor.execute("UPDATE Profesional SET Activo = 0 WHERE ID = %s", (profesional_id,))
        else:
            # Eliminar físicamente
            cursor.execute("DELETE FROM Profesional WHERE ID = %s", (profesional_id,))
        
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Profesional no encontrado")
        
        return {"message": "Profesional eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al eliminar profesional: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar profesional")
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
            SELECT u.ID, u.Username, u.Nombre, u.Apellido, u.Email, u.Activo,
                   GROUP_CONCAT(g.Grupo) as roles
            FROM Usuario u
            LEFT JOIN Usuario_Grupo ug ON u.ID = ug.ID_Usuario
            LEFT JOIN Grupo g ON ug.ID_Grupo = g.ID
            GROUP BY u.ID
            ORDER BY u.Apellido, u.Nombre
        """)
        usuarios = cursor.fetchall()
        
        # Procesar roles
        for usuario in usuarios:
            if usuario['roles']:
                usuario['roles'] = usuario['roles'].split(',')
            else:
                usuario['roles'] = []
        
        return [Usuario(**usuario) for usuario in usuarios]
    except Exception as e:
        print(f"❌ Error al obtener usuarios: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener usuarios")
    finally:
        cursor.close()
        conn.close()

@router.post("/usuarios", response_model=Usuario)
def crear_usuario(usuario: UsuarioCreate):
    """
    Crea un nuevo usuario con roles
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Hash de la contraseña
        hashed_password = bcrypt.hashpw(usuario.password.encode('utf-8'), bcrypt.gensalt())
        
        # Crear usuario
        cursor.execute("""
            INSERT INTO Usuario (Username, Contraseña, Nombre, Apellido, Email, Activo)
            VALUES (%s, %s, %s, %s, %s, 1)
        """, (usuario.Username, hashed_password, usuario.Nombre, usuario.Apellido, usuario.Email))
        
        usuario_id = cursor.lastrowid
        
        # Asignar roles
        for rol in usuario.roles:
            cursor.execute("SELECT ID FROM Grupo WHERE Grupo = %s", (rol,))
            grupo = cursor.fetchone()
            if grupo:
                cursor.execute("""
                    INSERT INTO Usuario_Grupo (ID_Usuario, ID_Grupo)
                    VALUES (%s, %s)
                """, (usuario_id, grupo['ID']))
        
        conn.commit()
        
        return Usuario(
            ID=usuario_id,
            Username=usuario.Username,
            Nombre=usuario.Nombre,
            Apellido=usuario.Apellido,
            Email=usuario.Email,
            Activo=True,
            roles=usuario.roles
        )
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear usuario: {e}")
        raise HTTPException(status_code=500, detail="Error al crear usuario")
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
            SELECT ID, Nombre, Descripcion
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
            INSERT INTO ObraSocial (Nombre, Descripcion)
            VALUES (%s, %s)
        """, (obra_social.Nombre, obra_social.Descripcion))
        
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
            SELECT e.ID, e.Nombre, e.Direccion, e.ID_Ciudad, c.Ciudad
            FROM Escuela e
            LEFT JOIN Ciudad c ON e.ID_Ciudad = c.ID
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
            INSERT INTO Escuela (Nombre, Direccion, ID_Ciudad)
            VALUES (%s, %s, %s)
        """, (escuela.Nombre, escuela.Direccion, escuela.ID_Ciudad))
        
        conn.commit()
        escuela_id = cursor.lastrowid
        
        # Obtener información de la ciudad
        cursor.execute("""
            SELECT e.ID, e.Nombre, e.Direccion, e.ID_Ciudad, c.Ciudad
            FROM Escuela e
            LEFT JOIN Ciudad c ON e.ID_Ciudad = c.ID
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

# =============================================================================
# ENDPOINTS DE DEBUGGING
# =============================================================================

@router.get("/debug-tablas")
def debug_tablas():
    """
    Endpoint de debugging para verificar la estructura de las tablas
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        tablas = ['Profesional', 'Usuario', 'ObraSocial', 'Escuela']
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