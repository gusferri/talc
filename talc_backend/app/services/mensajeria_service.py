# app/services/mensajeria_service.py
from twilio.rest import Client
import os

def enviar_mensaje_whatsapp(nombre_paciente, nombre_profesional, telefono_paciente, fecha, hora):
    # Obtener credenciales desde variables de entorno
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        print("⚠️ Advertencia: Credenciales de Twilio no configuradas")
        return False
    
    client = Client(account_sid, auth_token)
    mensaje = (
        f"Hola {nombre_paciente}, se ha generado un turno con {nombre_profesional} "
        f"para el día {fecha.strftime('%d/%m/%Y')} a las {hora.strftime('%H:%M')}."
    )
    try:
        message = client.messages.create(
            body=mensaje,
            from_='whatsapp:+14155238886',
            to=f'whatsapp:{telefono_paciente}'
        )
        print(f"✅ Mensaje enviado a {telefono_paciente}")
        return True
    except Exception as e:
        print("❌ Error al enviar mensaje:", str(e))
        return False