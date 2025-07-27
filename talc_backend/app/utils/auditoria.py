"""
Módulo de Auditoría para TALC
Proporciona funciones para registrar cambios en el sistema de forma segura
"""

import os
import json
from typing import Optional, Any, Dict
from fastapi import Request
from app.database import get_connection

# Configuración de auditoría
AUDITORIA_HABILITADA = os.getenv('AUDITORIA_HABILITADA', 'true').lower() == 'true'

def obtener_usuario_logueado(request: Request) -> Optional[str]:
    """
    Obtiene el username del usuario logueado desde el contexto de la request
    
    Args:
        request: Objeto Request de FastAPI
    
    Returns:
        str: Username del usuario logueado o None si no se puede obtener
    """
    try:
        # Intentar obtener el username desde los headers (si se pasa desde el frontend)
        username = request.headers.get('X-User-Username')
        if username:
            return username
        
        # Si no está en headers, intentar obtenerlo de otra forma
        # Por ahora retornamos None para que se use un valor por defecto
        return None
        
    except Exception as e:
        print(f"⚠️ Error al obtener usuario logueado: {e}")
        return None

def obtener_usuario_por_defecto() -> str:
    """
    Retorna un usuario por defecto para auditoría cuando no se puede obtener el usuario logueado
    
    Returns:
        str: Username por defecto
    """
    return "sistema"  # Usuario genérico para operaciones del sistema

def registrar_auditoria(
    id_usuario: int,
    username: str,
    accion: str,
    tabla: str,
    id_registro: int,
    campo_modificado: Optional[str] = None,
    valor_anterior: Optional[str] = None,
    valor_nuevo: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    comentario: Optional[str] = None
) -> bool:
    """
    Registra una acción de auditoría en la base de datos
    
    Args:
        id_usuario: ID del usuario que realizó la acción
        username: Nombre de usuario
        accion: Tipo de acción (CREATE, UPDATE, DELETE, STATUS_CHANGE)
        tabla: Nombre de la tabla afectada
        id_registro: ID del registro modificado
        campo_modificado: Campo específico modificado (para UPDATE)
        valor_anterior: Valor antes del cambio
        valor_nuevo: Valor después del cambio
        ip_address: Dirección IP del usuario
        user_agent: User agent del navegador
        comentario: Comentario adicional
    
    Returns:
        bool: True si se registró correctamente, False en caso contrario
    """
    
    # Verificar si la auditoría está habilitada
    if not AUDITORIA_HABILITADA:
        return True
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Insertar registro de auditoría
        cursor.execute("""
            INSERT INTO Auditoria (
                ID_Usuario, Username, Accion, Tabla, ID_Registro,
                Campo_Modificado, Valor_Anterior, Valor_Nuevo,
                IP_Address, User_Agent, Comentario
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            id_usuario, username, accion, tabla, id_registro,
            campo_modificado, valor_anterior, valor_nuevo,
            ip_address, user_agent, comentario
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Auditoría registrada: {accion} en {tabla} (ID: {id_registro}) por {username}")
        return True
        
    except Exception as e:
        print(f"⚠️ Error al registrar auditoría: {e}")
        # NO fallar la operación principal
        return False

def obtener_id_usuario_por_username(username: str) -> Optional[int]:
    """
    Obtiene el ID de usuario por username para auditoría
    
    Args:
        username: Nombre de usuario
    
    Returns:
        int: ID del usuario o None si no se encuentra
    """
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return usuario['ID'] if usuario else None
        
    except Exception as e:
        print(f"⚠️ Error al obtener ID de usuario: {e}")
        return None

def auditar_creacion_usuario(
    username_creador: str,
    id_usuario_creado: int,
    datos_usuario: Dict[str, Any],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """
    Registra la auditoría de creación de usuario
    
    Args:
        username_creador: Usuario que creó el registro
        id_usuario_creado: ID del usuario creado
        datos_usuario: Datos del usuario creado
        ip_address: IP del creador
        user_agent: User agent del creador
    
    Returns:
        bool: True si se registró correctamente
    """
    id_creador = obtener_id_usuario_por_username(username_creador)
    if not id_creador:
        return False
    
    return registrar_auditoria(
        id_usuario=id_creador,
        username=username_creador,
        accion="CREATE",
        tabla="Usuario",
        id_registro=id_usuario_creado,
        valor_nuevo=json.dumps(datos_usuario, ensure_ascii=False),
        ip_address=ip_address,
        user_agent=user_agent,
        comentario=f"Usuario creado: {datos_usuario.get('Username', 'N/A')}"
    )

def auditar_modificacion_usuario(
    username_modificador: str,
    id_usuario_modificado: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """
    Registra la auditoría de modificación de usuario
    
    Args:
        username_modificador: Usuario que modificó el registro
        id_usuario_modificado: ID del usuario modificado
        campo_modificado: Campo que se modificó
        valor_anterior: Valor antes del cambio
        valor_nuevo: Valor después del cambio
        ip_address: IP del modificador
        user_agent: User agent del modificador
    
    Returns:
        bool: True si se registró correctamente
    """
    id_modificador = obtener_id_usuario_por_username(username_modificador)
    if not id_modificador:
        return False
    
    return registrar_auditoria(
        id_usuario=id_modificador,
        username=username_modificador,
        accion="UPDATE",
        tabla="Usuario",
        id_registro=id_usuario_modificado,
        campo_modificado=campo_modificado,
        valor_anterior=str(valor_anterior) if valor_anterior is not None else None,
        valor_nuevo=str(valor_nuevo) if valor_nuevo is not None else None,
        ip_address=ip_address,
        user_agent=user_agent,
        comentario=f"Campo '{campo_modificado}' modificado"
    )

def auditar_cambio_estado_usuario(
    username_modificador: str,
    id_usuario_modificado: int,
    estado_anterior: bool,
    estado_nuevo: bool,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> bool:
    """
    Registra la auditoría de cambio de estado de usuario
    
    Args:
        username_modificador: Usuario que cambió el estado
        id_usuario_modificado: ID del usuario modificado
        estado_anterior: Estado anterior (True=Activo, False=Inactivo)
        estado_nuevo: Estado nuevo (True=Activo, False=Inactivo)
        ip_address: IP del modificador
        user_agent: User agent del modificador
    
    Returns:
        bool: True si se registró correctamente
    """
    id_modificador = obtener_id_usuario_por_username(username_modificador)
    if not id_modificador:
        return False
    
    estado_anterior_str = "Activo" if estado_anterior else "Inactivo"
    estado_nuevo_str = "Activo" if estado_nuevo else "Inactivo"
    
    return registrar_auditoria(
        id_usuario=id_modificador,
        username=username_modificador,
        accion="STATUS_CHANGE",
        tabla="Usuario",
        id_registro=id_usuario_modificado,
        campo_modificado="Activo",
        valor_anterior=estado_anterior_str,
        valor_nuevo=estado_nuevo_str,
        ip_address=ip_address,
        user_agent=user_agent,
        comentario=f"Estado cambiado de {estado_anterior_str} a {estado_nuevo_str}"
    ) 

def auditar_creacion_profesional(
    username_creador: str,
    id_profesional_creado: int,
    datos_profesional: Dict[str, Any]
):
    """
    Registra la creación de un profesional en la auditoría
    
    Args:
        username_creador: Username del usuario que creó el profesional
        id_profesional_creado: ID del profesional creado
        datos_profesional: Datos del profesional creado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'CREATE', 'Profesional', %s, NULL, NULL, %s, %s)
        """, (
            username_creador,
            id_profesional_creado,
            json.dumps(datos_profesional, ensure_ascii=False),
            f"Profesional creado: {datos_profesional.get('Nombre', '')} {datos_profesional.get('Apellido', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Profesional creado por {username_creador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de creación de profesional: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_modificacion_profesional(
    username_modificador: str,
    id_profesional_modificado: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any
):
    """
    Registra la modificación de un campo de profesional en la auditoría
    
    Args:
        username_modificador: Username del usuario que modificó el profesional
        id_profesional_modificado: ID del profesional modificado
        campo_modificado: Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Valor nuevo del campo
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'UPDATE', 'Profesional', %s, %s, %s, %s, %s)
        """, (
            username_modificador,
            id_profesional_modificado,
            campo_modificado,
            str(valor_anterior) if valor_anterior is not None else None,
            str(valor_nuevo) if valor_nuevo is not None else None,
            f"Campo '{campo_modificado}' modificado"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Profesional {id_profesional_modificado} modificado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de modificación de profesional: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_cambio_estado_profesional(
    username_modificador: str,
    id_profesional_modificado: int,
    estado_anterior: bool,
    estado_nuevo: bool
):
    """
    Registra el cambio de estado de un profesional en la auditoría
    
    Args:
        username_modificador: Username del usuario que cambió el estado
        id_profesional_modificado: ID del profesional modificado
        estado_anterior: Estado anterior (True=Activo, False=Inactivo)
        estado_nuevo: Estado nuevo (True=Activo, False=Inactivo)
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'STATUS_CHANGE', 'Profesional', %s, 'Activo', %s, %s, %s)
        """, (
            username_modificador,
            id_profesional_modificado,
            'Activo' if estado_anterior else 'Inactivo',
            'Activo' if estado_nuevo else 'Inactivo',
            f"Estado cambiado de {'Activo' if estado_anterior else 'Inactivo'} a {'Activo' if estado_nuevo else 'Inactivo'}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Estado de profesional {id_profesional_modificado} cambiado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de cambio de estado de profesional: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_eliminacion_profesional(
    username_eliminador: str,
    id_profesional_eliminado: int,
    datos_profesional: Dict[str, Any]
):
    """
    Registra la eliminación de un profesional en la auditoría
    
    Args:
        username_eliminador: Username del usuario que eliminó el profesional
        id_profesional_eliminado: ID del profesional eliminado
        datos_profesional: Datos del profesional eliminado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'DELETE', 'Profesional', %s, NULL, %s, NULL, %s)
        """, (
            username_eliminador,
            id_profesional_eliminado,
            json.dumps(datos_profesional, ensure_ascii=False),
            f"Profesional eliminado: {datos_profesional.get('Nombre', '')} {datos_profesional.get('Apellido', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Profesional eliminado por {username_eliminador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de eliminación de profesional: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_creacion_paciente(
    username_creador: str,
    id_paciente_creado: int,
    datos_paciente: Dict[str, Any]
):
    """
    Registra la creación de un paciente en la auditoría
    
    Args:
        username_creador: Username del usuario que creó el paciente
        id_paciente_creado: ID del paciente creado
        datos_paciente: Datos del paciente creado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'CREATE', 'Paciente', %s, NULL, NULL, %s, %s)
        """, (
            username_creador,
            id_paciente_creado,
            json.dumps(datos_paciente, ensure_ascii=False),
            f"Paciente creado: {datos_paciente.get('Nombre', '')} {datos_paciente.get('Apellido', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Paciente creado por {username_creador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de creación de paciente: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_modificacion_paciente(
    username_modificador: str,
    id_paciente_modificado: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any
):
    """
    Registra la modificación de un campo de paciente en la auditoría
    
    Args:
        username_modificador: Username del usuario que modificó el paciente
        id_paciente_modificado: ID del paciente modificado
        campo_modificado: Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Valor nuevo del campo
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'UPDATE', 'Paciente', %s, %s, %s, %s, %s)
        """, (
            username_modificador,
            id_paciente_modificado,
            campo_modificado,
            str(valor_anterior) if valor_anterior is not None else None,
            str(valor_nuevo) if valor_nuevo is not None else None,
            f"Campo '{campo_modificado}' modificado"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Paciente {id_paciente_modificado} modificado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de modificación de paciente: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_cambio_estado_paciente(
    username_modificador: str,
    id_paciente_modificado: int,
    estado_anterior: bool,
    estado_nuevo: bool
):
    """
    Registra el cambio de estado de un paciente en la auditoría
    
    Args:
        username_modificador: Username del usuario que cambió el estado
        id_paciente_modificado: ID del paciente modificado
        estado_anterior: Estado anterior (True=Activo, False=Inactivo)
        estado_nuevo: Estado nuevo (True=Activo, False=Inactivo)
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'STATUS_CHANGE', 'Paciente', %s, 'Activo', %s, %s, %s)
        """, (
            username_modificador,
            id_paciente_modificado,
            'Activo' if estado_anterior else 'Inactivo',
            'Activo' if estado_nuevo else 'Inactivo',
            f"Estado cambiado de {'Activo' if estado_anterior else 'Inactivo'} a {'Activo' if estado_nuevo else 'Inactivo'}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Estado de paciente {id_paciente_modificado} cambiado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de cambio de estado de paciente: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_eliminacion_paciente(
    username_eliminador: str,
    id_paciente_eliminado: int,
    datos_paciente: Dict[str, Any]
):
    """
    Registra la eliminación de un paciente en la auditoría
    
    Args:
        username_eliminador: Username del usuario que eliminó el paciente
        id_paciente_eliminado: ID del paciente eliminado
        datos_paciente: Datos del paciente eliminado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'DELETE', 'Paciente', %s, NULL, %s, NULL, %s)
        """, (
            username_eliminador,
            id_paciente_eliminado,
            json.dumps(datos_paciente, ensure_ascii=False),
            f"Paciente eliminado: {datos_paciente.get('Nombre', '')} {datos_paciente.get('Apellido', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Paciente eliminado por {username_eliminador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de eliminación de paciente: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 

def auditar_creacion_turno(
    username_creador: str,
    id_turno_creado: int,
    datos_turno: Dict[str, Any]
):
    """
    Registra la creación de un turno en la auditoría
    
    Args:
        username_creador: Username del usuario que creó el turno
        id_turno_creado: ID del turno creado
        datos_turno: Datos del turno creado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'CREATE', 'Turno', %s, NULL, NULL, %s, %s)
        """, (
            username_creador,
            id_turno_creado,
            json.dumps(datos_turno, ensure_ascii=False),
            f"Turno creado: {datos_turno.get('Fecha', '')} {datos_turno.get('Hora', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Turno creado por {username_creador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de creación de turno: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_modificacion_turno(
    username_modificador: str,
    id_turno_modificado: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any
):
    """
    Registra la modificación de un campo de turno en la auditoría
    
    Args:
        username_modificador: Username del usuario que modificó el turno
        id_turno_modificado: ID del turno modificado
        campo_modificado: Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Valor nuevo del campo
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'UPDATE', 'Turno', %s, %s, %s, %s, %s)
        """, (
            username_modificador,
            id_turno_modificado,
            campo_modificado,
            str(valor_anterior) if valor_anterior is not None else None,
            str(valor_nuevo) if valor_nuevo is not None else None,
            f"Campo '{campo_modificado}' modificado"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Turno {id_turno_modificado} modificado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de modificación de turno: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_cambio_estado_turno(
    username_modificador: str,
    id_turno_modificado: int,
    estado_anterior: str,
    estado_nuevo: str
):
    """
    Registra el cambio de estado de un turno en la auditoría
    
    Args:
        username_modificador: Username del usuario que cambió el estado
        id_turno_modificado: ID del turno modificado
        estado_anterior: Estado anterior del turno
        estado_nuevo: Estado nuevo del turno
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'STATUS_CHANGE', 'Turno', %s, 'Estado', %s, %s, %s)
        """, (
            username_modificador,
            id_turno_modificado,
            estado_anterior,
            estado_nuevo,
            f"Estado cambiado de '{estado_anterior}' a '{estado_nuevo}'"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Estado de turno {id_turno_modificado} cambiado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de cambio de estado de turno: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_eliminacion_turno(
    username_eliminador: str,
    id_turno_eliminado: int,
    datos_turno: Dict[str, Any]
):
    """
    Registra la eliminación de un turno en la auditoría
    
    Args:
        username_eliminador: Username del usuario que eliminó el turno
        id_turno_eliminado: ID del turno eliminado
        datos_turno: Datos del turno eliminado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'DELETE', 'Turno', %s, NULL, %s, NULL, %s)
        """, (
            username_eliminador,
            id_turno_eliminado,
            json.dumps(datos_turno, ensure_ascii=False),
            f"Turno eliminado: {datos_turno.get('Fecha', '')} {datos_turno.get('Hora', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Turno eliminado por {username_eliminador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de eliminación de turno: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 

def auditar_creacion_adjunto(
    username_creador: str,
    id_adjunto_creado: int,
    datos_adjunto: Dict[str, Any]
):
    """
    Registra la creación de un adjunto en la auditoría
    
    Args:
        username_creador: Username del usuario que creó el adjunto
        id_adjunto_creado: ID del adjunto creado
        datos_adjunto: Datos del adjunto creado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'CREATE', 'Adjunto', %s, NULL, NULL, %s, %s)
        """, (
            username_creador,
            id_adjunto_creado,
            json.dumps(datos_adjunto, ensure_ascii=False),
            f"Adjunto creado: {datos_adjunto.get('NombreArchivo', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Adjunto creado por {username_creador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de creación de adjunto: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_modificacion_adjunto(
    username_modificador: str,
    id_adjunto_modificado: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any
):
    """
    Registra la modificación de un campo de adjunto en la auditoría
    
    Args:
        username_modificador: Username del usuario que modificó el adjunto
        id_adjunto_modificado: ID del adjunto modificado
        campo_modificado: Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Valor nuevo del campo
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'UPDATE', 'Adjunto', %s, %s, %s, %s, %s)
        """, (
            username_modificador,
            id_adjunto_modificado,
            campo_modificado,
            str(valor_anterior) if valor_anterior is not None else None,
            str(valor_nuevo) if valor_nuevo is not None else None,
            f"Campo '{campo_modificado}' modificado"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Adjunto {id_adjunto_modificado} modificado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de modificación de adjunto: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_eliminacion_adjunto(
    username_eliminador: str,
    id_adjunto_eliminado: int,
    datos_adjunto: Dict[str, Any]
):
    """
    Registra la eliminación de un adjunto en la auditoría
    
    Args:
        username_eliminador: Username del usuario que eliminó el adjunto
        id_adjunto_eliminado: ID del adjunto eliminado
        datos_adjunto: Datos del adjunto eliminado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'DELETE', 'Adjunto', %s, NULL, %s, NULL, %s)
        """, (
            username_eliminador,
            id_adjunto_eliminado,
            json.dumps(datos_adjunto, ensure_ascii=False),
            f"Adjunto eliminado: {datos_adjunto.get('NombreArchivo', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Adjunto eliminado por {username_eliminador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de eliminación de adjunto: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 

def auditar_creacion_nota_voz(
    username_creador: str,
    id_nota_voz_creada: int,
    datos_nota_voz: Dict[str, Any]
):
    """
    Registra la creación de una nota de voz en la auditoría
    
    Args:
        username_creador: Username del usuario que creó la nota de voz
        id_nota_voz_creada: ID de la nota de voz creada
        datos_nota_voz: Datos de la nota de voz creada
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'CREATE', 'NotaVoz', %s, NULL, NULL, %s, %s)
        """, (
            username_creador,
            id_nota_voz_creada,
            json.dumps(datos_nota_voz, ensure_ascii=False),
            f"Nota de voz creada: {datos_nota_voz.get('Titulo', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Nota de voz creada por {username_creador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de creación de nota de voz: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_modificacion_nota_voz(
    username_modificador: str,
    id_nota_voz_modificada: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any
):
    """
    Registra la modificación de un campo de nota de voz en la auditoría
    
    Args:
        username_modificador: Username del usuario que modificó la nota de voz
        id_nota_voz_modificada: ID de la nota de voz modificada
        campo_modificado: Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Valor nuevo del campo
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'UPDATE', 'NotaVoz', %s, %s, %s, %s, %s)
        """, (
            username_modificador,
            id_nota_voz_modificada,
            campo_modificado,
            str(valor_anterior) if valor_anterior is not None else None,
            str(valor_nuevo) if valor_nuevo is not None else None,
            f"Campo '{campo_modificado}' modificado"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Nota de voz {id_nota_voz_modificada} modificada por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de modificación de nota de voz: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_eliminacion_nota_voz(
    username_eliminador: str,
    id_nota_voz_eliminada: int,
    datos_nota_voz: Dict[str, Any]
):
    """
    Registra la eliminación de una nota de voz en la auditoría
    
    Args:
        username_eliminador: Username del usuario que eliminó la nota de voz
        id_nota_voz_eliminada: ID de la nota de voz eliminada
        datos_nota_voz: Datos de la nota de voz eliminada
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'DELETE', 'NotaVoz', %s, NULL, %s, NULL, %s)
        """, (
            username_eliminador,
            id_nota_voz_eliminada,
            json.dumps(datos_nota_voz, ensure_ascii=False),
            f"Nota de voz eliminada: {datos_nota_voz.get('Titulo', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Nota de voz eliminada por {username_eliminador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de eliminación de nota de voz: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 

def auditar_creacion_informe_ia(
    username_creador: str,
    id_informe_creado: int,
    datos_informe: Dict[str, Any]
):
    """
    Registra la creación de un informe IA en la auditoría
    
    Args:
        username_creador: Username del usuario que creó el informe
        id_informe_creado: ID del informe creado
        datos_informe: Datos del informe creado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'CREATE', 'InformeIA', %s, NULL, NULL, %s, %s)
        """, (
            username_creador,
            id_informe_creado,
            json.dumps(datos_informe, ensure_ascii=False),
            f"Informe IA creado: {datos_informe.get('TipoInforme', '')} - Paciente {datos_informe.get('ID_Paciente', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Informe IA creado por {username_creador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de creación de informe IA: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_modificacion_informe_ia(
    username_modificador: str,
    id_informe_modificado: int,
    campo_modificado: str,
    valor_anterior: Any,
    valor_nuevo: Any
):
    """
    Registra la modificación de un campo de informe IA en la auditoría
    
    Args:
        username_modificador: Username del usuario que modificó el informe
        id_informe_modificado: ID del informe modificado
        campo_modificado: Nombre del campo modificado
        valor_anterior: Valor anterior del campo
        valor_nuevo: Valor nuevo del campo
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'UPDATE', 'InformeIA', %s, %s, %s, %s, %s)
        """, (
            username_modificador,
            id_informe_modificado,
            campo_modificado,
            str(valor_anterior) if valor_anterior is not None else None,
            str(valor_nuevo) if valor_nuevo is not None else None,
            f"Campo '{campo_modificado}' modificado"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Informe IA {id_informe_modificado} modificado por {username_modificador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de modificación de informe IA: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def auditar_eliminacion_informe_ia(
    username_eliminador: str,
    id_informe_eliminado: int,
    datos_informe: Dict[str, Any]
):
    """
    Registra la eliminación de un informe IA en la auditoría
    
    Args:
        username_eliminador: Username del usuario que eliminó el informe
        id_informe_eliminado: ID del informe eliminado
        datos_informe: Datos del informe eliminado
    """
    if not AUDITORIA_HABILITADA:
        return
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Registrar auditoría
        cursor.execute("""
            INSERT INTO Auditoria (FechaHora, Username, Accion, Tabla, ID_Registro, 
                                 Campo_Modificado, Valor_Anterior, Valor_Nuevo, Comentario)
            VALUES (NOW(), %s, 'DELETE', 'InformeIA', %s, NULL, %s, NULL, %s)
        """, (
            username_eliminador,
            id_informe_eliminado,
            json.dumps(datos_informe, ensure_ascii=False),
            f"Informe IA eliminado: {datos_informe.get('TipoInforme', '')} - Paciente {datos_informe.get('ID_Paciente', '')}"
        ))
        
        conn.commit()
        print(f"✅ Auditoría: Informe IA eliminado por {username_eliminador}")
        
    except Exception as e:
        print(f"❌ Error en auditoría de eliminación de informe IA: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close() 