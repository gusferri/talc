from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
import mysql.connector
from app.database import get_connection
from app.utils.auditoria import (
    auditar_creacion_adjunto, auditar_modificacion_adjunto, auditar_eliminacion_adjunto,
    obtener_usuario_logueado, obtener_usuario_por_defecto
)
import shutil
import os
from datetime import datetime
import mimetypes

router = APIRouter()

# ✅ Define una ruta relativa para funcionar fuera de Docker
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/adjuntos")
async def subir_archivo(
    archivo: UploadFile = File(...),
    titulo: str = Form(...),
    id_paciente: int = Form(...),
    username: str = Form(...),
    id_especialidad: int = Form(None),
    request: Request = None,
):
    extension = archivo.filename.split(".")[-1]
    nombre_archivo = f"{int(datetime.utcnow().timestamp())}.{extension}"
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)

    try:
        with open(ruta_archivo, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="Error al guardar el archivo")

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT ID FROM Usuario WHERE Username = %s", (username,))
        usuario = cursor.fetchone()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        id_usuario = usuario[0]

        print(f"📝 Insertando documento -> PacienteID: {id_paciente}, Titulo: {titulo}, NombreArchivo: {nombre_archivo}, Ruta: {ruta_archivo}, UsuarioID: {id_usuario}, EspecialidadID: {id_especialidad}")

        cursor.execute("""
            INSERT INTO Paciente_Documentos 
                (ID_Paciente, Titulo, FechaSubida, NombreArchivo, RutaArchivo, ID_Usuario, ID_Especialidad)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            id_paciente,
            titulo,
            datetime.utcnow(),
            nombre_archivo,
            ruta_archivo,
            id_usuario,
            id_especialidad
        ))
        conn.commit()
        documento_id = cursor.lastrowid
        
        # Registrar auditoría de creación
        try:
            datos_adjunto = {
                "ID_Paciente": id_paciente,
                "Titulo": titulo,
                "NombreArchivo": nombre_archivo,
                "RutaArchivo": ruta_archivo,
                "ID_Usuario": id_usuario,
                "ID_Especialidad": id_especialidad,
                "FechaSubida": datetime.utcnow().isoformat()
            }
            
            username_creador = obtener_usuario_logueado(request) or username or obtener_usuario_por_defecto()
            
            auditar_creacion_adjunto(
                username_creador=username_creador,
                id_adjunto_creado=documento_id,
                datos_adjunto=datos_adjunto
            )
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de creación de adjunto: {audit_error}")
            # NO fallar la operación principal
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(db_err)}")

    return {"mensaje": "Archivo subido correctamente", "documento_id": documento_id}

@router.get("/adjuntos/{id_paciente}")
async def obtener_adjuntos_paciente(id_paciente: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                pd.ID,
                pd.Titulo,
                pd.FechaSubida,
                pd.NombreArchivo,
                pd.RutaArchivo,
                u.Username as UsuarioSubio,
                e.Nombre as Especialidad
            FROM Paciente_Documentos pd
            LEFT JOIN Usuario u ON u.ID = pd.ID_Usuario
            LEFT JOIN Especialidad e ON e.ID_Especialidad = pd.ID_Especialidad
            WHERE pd.ID_Paciente = %s
            ORDER BY pd.FechaSubida DESC
        """, (id_paciente,))
        
        adjuntos = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return adjuntos
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(db_err)}")

@router.get("/adjuntos/descargar/{documento_id}")
async def descargar_adjunto(documento_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT Titulo, NombreArchivo, RutaArchivo
            FROM Paciente_Documentos
            WHERE ID = %s
        """, (documento_id,))
        
        documento = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not documento:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        ruta_archivo = documento['RutaArchivo']
        if not os.path.exists(ruta_archivo):
            raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")
        
        mime_type, _ = mimetypes.guess_type(ruta_archivo)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        return FileResponse(
            path=ruta_archivo,
            filename=documento['Titulo'],
            media_type=mime_type
        )
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(db_err)}")

@router.get("/adjuntos/visualizar/{documento_id}")
async def visualizar_adjunto(documento_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT Titulo, NombreArchivo, RutaArchivo
            FROM Paciente_Documentos
            WHERE ID = %s
        """, (documento_id,))
        
        documento = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not documento:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        ruta_archivo = documento['RutaArchivo']
        if not os.path.exists(ruta_archivo):
            raise HTTPException(status_code=404, detail="Archivo no encontrado en el servidor")
        
        mime_type, _ = mimetypes.guess_type(ruta_archivo)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        tipos_visualizables = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
        
        if mime_type in tipos_visualizables:
            return FileResponse(
                path=ruta_archivo,
                media_type=mime_type
            )
        else:
            raise HTTPException(status_code=400, detail="Tipo de archivo no visualizable")
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(db_err)}")

@router.delete("/adjuntos/{documento_id}")
async def eliminar_adjunto(documento_id: int, request: Request):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Obtener datos del documento antes de eliminarlo para auditoría
        cursor.execute("""
            SELECT ID, ID_Paciente, Titulo, FechaSubida, NombreArchivo, RutaArchivo, ID_Usuario, ID_Especialidad
            FROM Paciente_Documentos
            WHERE ID = %s
        """, (documento_id,))
        
        documento = cursor.fetchone()
        if not documento:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        ruta_archivo = documento['RutaArchivo']
        
        cursor.execute("DELETE FROM Paciente_Documentos WHERE ID = %s", (documento_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        conn.commit()
        
        # Registrar auditoría de eliminación
        try:
            datos_adjunto = {
                "ID": documento['ID'],
                "ID_Paciente": documento['ID_Paciente'],
                "Titulo": documento['Titulo'],
                "NombreArchivo": documento['NombreArchivo'],
                "RutaArchivo": documento['RutaArchivo'],
                "ID_Usuario": documento['ID_Usuario'],
                "ID_Especialidad": documento['ID_Especialidad'],
                "FechaSubida": documento['FechaSubida'].isoformat() if documento['FechaSubida'] else None
            }
            
            username_eliminador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
            
            auditar_eliminacion_adjunto(
                username_eliminador=username_eliminador,
                id_adjunto_eliminado=documento_id,
                datos_adjunto=datos_adjunto
            )
        except Exception as audit_error:
            print(f"⚠️ Error en auditoría de eliminación de adjunto: {audit_error}")
            # NO fallar la operación principal
        
        cursor.close()
        conn.close()
        
        try:
            if os.path.exists(ruta_archivo):
                os.remove(ruta_archivo)
        except Exception as e:
            print(f"⚠️ Error al eliminar archivo físico: {e}")
        
        return {"mensaje": "Documento eliminado correctamente"}
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(db_err)}")