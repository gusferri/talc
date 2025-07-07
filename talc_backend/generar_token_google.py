from google_auth_oauthlib.flow import InstalledAppFlow
from app.database import get_connection
import mysql.connector
from datetime import datetime

# Configuración
SCOPES = ['https://www.googleapis.com/auth/calendar']
PROFESIONAL_ID = 1  # Cambiar por el ID del profesional que se está autenticando

# Paso 1: Autenticación con Google
flow = InstalledAppFlow.from_client_secrets_file(
    'credentials.json', SCOPES
)
creds = flow.run_local_server(port=8080)  # Esto abre el navegador

# Paso 2: Obtener el refresh token
refresh_token = creds.refresh_token
if not refresh_token:
    print("⚠️ No se recibió refresh_token. Probá agregando prompt='consent' y access_type='offline'")
    exit()

# Paso 3: Guardar en la base de datos
conn = get_connection()
cursor = conn.cursor()


cursor.execute("""
    INSERT INTO Profesional_IntegracionGoogle (ID_Profesional, RefreshToken, TokenCreado)
    VALUES (%s, %s, %s)
    ON DUPLICATE KEY UPDATE
        RefreshToken = VALUES(RefreshToken),
        TokenCreado = VALUES(TokenCreado)
""", (PROFESIONAL_ID, refresh_token, datetime.now()))

conn.commit()
cursor.close()
conn.close()

print("✅ Token generado y guardado correctamente.")