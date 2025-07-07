import bcrypt
import mysql.connector
from app.database import get_connection

def resetear_contrasena(username: str, nueva_contrasena: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Hashear la nueva contraseña
        hashed = bcrypt.hashpw(nueva_contrasena.encode('utf-8'), bcrypt.gensalt()).decode()

        # Actualizar la contraseña y forzar cambio en próximo login
        cursor.execute("""
            UPDATE Usuario
            SET Contraseña = %s, DebeCambiarContrasena = 1
            WHERE Username = %s AND Activo = 1
        """, (hashed, username))

        if cursor.rowcount == 0:
            print(f"❌ Usuario '{username}' no encontrado o inactivo.")
        else:
            conn.commit()
            print(f"✅ Contraseña de '{username}' reseteada exitosamente.")

    except mysql.connector.Error as e:
        print(f"❌ Error en la base de datos: {e}")

    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🔐 Reseteo de Contraseñas")
    username = input("Ingrese el nombre de usuario a resetear: ")
    nueva_contrasena = input("Ingrese la nueva contraseña: ")
    resetear_contrasena(username, nueva_contrasena)