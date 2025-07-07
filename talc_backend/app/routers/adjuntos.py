from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import mysql.connector
from app.database import get_connection
import shutil
import os
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/adjuntos")
async def subir_archivo(
    archivo: UploadFile = File(...),
    titulo: str = Form(...),
    id_paciente: int = Form(...),
    username: str = Form(...),
    id_especialidad: int = Form(None),
):
    extension = archivo.filename.split(".")[-1]
    nombre_archivo = f"{int(datetime.utcnow().timestamp())}.{extension}"
    ruta_archivo = os.path.join(UPLOAD_DIR, nombre_archivo)

    try:
        with open(ruta_archivo, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
    except Exception as e:
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
        cursor.close()
        conn.close()
    except mysql.connector.Error as db_err:
        raise HTTPException(status_code=500, detail=f"Error de base de datos: {str(db_err)}")

    return {"mensaje": "Archivo subido correctamente", "documento_id": documento_id}