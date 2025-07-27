# voz.py
from fastapi import APIRouter, File, UploadFile, Form, Request
import openai
import os
from dotenv import load_dotenv
import requests
import time
from app.database import get_connection
from app.utils.auditoria import (
    auditar_creacion_nota_voz, auditar_modificacion_nota_voz, auditar_eliminacion_nota_voz,
    obtener_usuario_logueado, obtener_usuario_por_defecto
)

load_dotenv()
from datetime import datetime

router = APIRouter()
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/api/notas-voz")
async def transcribir_nota_voz(audio: UploadFile = File(...), turno_id: int = Form(...), request: Request = None):
    import tempfile

    # Paso 1: guardar el audio temporalmente
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        temp_audio.write(await audio.read())
        temp_audio_path = temp_audio.name
        
    print(f"Tamaño del archivo guardado: {os.path.getsize(temp_audio_path)} bytes")

    print("✅ Audio guardado:", temp_audio_path)

    # Paso 2: transcribir con Whisper API local
    print("🎤 Enviando a Whisper local para transcripción...")

    with open(temp_audio_path, "rb") as f:
        files = {"audio_file": (audio.filename, f, audio.content_type)}
        response = requests.post("http://192.168.2.39:9000/transcribe", files=files)

    if response.status_code == 200:
        texto_transcripto = response.json().get("text", "")
    else:
        print("❌ Error en transcripción Whisper local:", response.text)
        return {"error": "Error en transcripción Whisper local"}
    print("🧠 Transcripción recibida:", texto_transcripto)

    # Paso 3: obtener datos del turno
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT ID_Paciente, ID_Profesional FROM Turno WHERE ID = %s", (turno_id,))
    turno = cursor.fetchone()
    if not turno:
        cursor.close()
        conn.close()
        return {"error": "Turno no encontrado."}

    id_paciente, id_profesional = turno

    # Paso 4: insertar en NotaVoz
    cursor.execute("""
        INSERT INTO NotaVoz (ID_Turno, ID_Paciente, ID_Profesional, Fecha, TextoTranscripto)
        VALUES (%s, %s, %s, NOW(), %s)
    """, (turno_id, id_paciente, id_profesional, texto_transcripto))

    conn.commit()
    nota_voz_id = cursor.lastrowid
    
    # Registrar auditoría de creación
    try:
        datos_nota_voz = {
            "ID_Turno": turno_id,
            "ID_Paciente": id_paciente,
            "ID_Profesional": id_profesional,
            "Fecha": datetime.now().isoformat(),
            "TextoTranscripto": texto_transcripto,
            "NombreArchivo": audio.filename
        }
        
        username_creador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
        
        auditar_creacion_nota_voz(
            username_creador=username_creador,
            id_nota_voz_creada=nota_voz_id,
            datos_nota_voz=datos_nota_voz
        )
    except Exception as audit_error:
        print(f"⚠️ Error en auditoría de creación de nota de voz: {audit_error}")
        # NO fallar la operación principal
    
    print("💾 Transcripción guardada en BD con éxito.")
    cursor.close()
    conn.close()

    return {
        "mensaje": "Transcripción guardada con éxito",
        "texto": texto_transcripto
    }
    
@router.get("/api/obtener-notas-voz/{turno_id}")
async def get_nota_voz(turno_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    print(f"Buscando nota de voz para el turno ID: {turno_id}")
    cursor.execute("SELECT ID, TextoTranscripto FROM NotaVoz WHERE ID = %s ORDER BY Fecha DESC LIMIT 1", (turno_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        return {"error": "Nota de voz no encontrada"}
    id_nota, texto = row
    return {"id": id_nota, "texto": texto}

from fastapi import Body

@router.post("/api/actualizar-notas-voz/{nota_voz_id}")
async def update_nota_voz(nota_voz_id: int, data: dict = Body(...), request: Request = None):
    texto = data.get("texto", "")

    conn = get_connection()
    cursor = conn.cursor()
    
    # Obtener datos actuales de la nota de voz para auditoría
    cursor.execute("SELECT ID, TextoTranscripto FROM NotaVoz WHERE ID = %s", (nota_voz_id,))
    nota_actual = cursor.fetchone()
    if not nota_actual:
        cursor.close()
        conn.close()
        return {"error": "Nota de voz no encontrada"}
    
    nota_id, texto_anterior = nota_actual
    
    cursor.execute("UPDATE NotaVoz SET TextoTranscripto = %s WHERE ID = %s", (texto, nota_id))
    conn.commit()
    
    # Registrar auditoría de modificación
    try:
        username_modificador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
        
        auditar_modificacion_nota_voz(
            username_modificador=username_modificador,
            id_nota_voz_modificada=nota_id,
            campo_modificado="TextoTranscripto",
            valor_anterior=texto_anterior,
            valor_nuevo=texto
        )
    except Exception as audit_error:
        print(f"⚠️ Error en auditoría de modificación de nota de voz: {audit_error}")
        # NO fallar la operación principal
    
    cursor.close()
    conn.close()
    return {"mensaje": "Nota de voz actualizada con éxito"}

@router.delete("/api/eliminar-notas-voz/{turno_id}")
async def delete_nota_voz(turno_id: int, request: Request = None):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Obtener datos de la nota de voz antes de eliminarla para auditoría
    cursor.execute("""
        SELECT ID, ID_Paciente, ID_Profesional, Fecha, TextoTranscripto 
        FROM NotaVoz 
        WHERE ID_Turno = %s 
        ORDER BY Fecha DESC LIMIT 1
    """, (turno_id,))
    
    nota = cursor.fetchone()
    if not nota:
        cursor.close()
        conn.close()
        return {"error": "Nota de voz no encontrada"}
    
    nota_id, id_paciente, id_profesional, fecha, texto = nota
    
    # Eliminar la nota de voz
    cursor.execute("DELETE FROM NotaVoz WHERE ID = %s", (nota_id,))
    
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return {"error": "No se pudo eliminar la nota de voz"}
    
    conn.commit()
    
    # Registrar auditoría de eliminación
    try:
        datos_nota_voz = {
            "ID": nota_id,
            "ID_Turno": turno_id,
            "ID_Paciente": id_paciente,
            "ID_Profesional": id_profesional,
            "Fecha": fecha.isoformat() if fecha else None,
            "TextoTranscripto": texto
        }
        
        username_eliminador = obtener_usuario_logueado(request) or obtener_usuario_por_defecto()
        
        auditar_eliminacion_nota_voz(
            username_eliminador=username_eliminador,
            id_nota_voz_eliminada=nota_id,
            datos_nota_voz=datos_nota_voz
        )
    except Exception as audit_error:
        print(f"⚠️ Error en auditoría de eliminación de nota de voz: {audit_error}")
        # NO fallar la operación principal
    
    cursor.close()
    conn.close()
    return {"mensaje": "Nota de voz eliminada con éxito"}