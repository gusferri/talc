# voz.py
from fastapi import APIRouter, File, UploadFile, Form
import openai
import os
from dotenv import load_dotenv
import requests
import time
from app.database import get_connection

load_dotenv()
from datetime import datetime

router = APIRouter()
openai.api_key = os.getenv("OPENAI_API_KEY")

@router.post("/api/notas-voz")
async def transcribir_nota_voz(audio: UploadFile = File(...), turno_id: int = Form(...)):
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

@router.post("/api/actualizar-notas-voz/{turno_id}")
async def update_nota_voz(turno_id: int, data: dict = Body(...)):
    texto = data.get("texto", "")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE NotaVoz SET TextoTranscripto = %s WHERE ID = %s", (texto, turno_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensaje": "Nota de voz actualizada con éxito"}