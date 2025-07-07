from app.utils.seguridad import hashear_contrasena
from app.database import get_connection 
import mysql.connector

def actualizar_contrasenas():
    # Conectamos a la base
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscar usuarios actuales
    cursor.execute("SELECT ID, Contraseña FROM Usuario")
    usuarios = cursor.fetchall()

    for usuario in usuarios:
        id_usuario = usuario['ID']
        contrasena_actual = usuario['Contraseña']

        # Hashear la contraseña actual
        hashed_password = hashear_contrasena(contrasena_actual)

        # Actualizar en la base
        cursor.execute(
            "UPDATE Usuario SET Contraseña = %s WHERE ID = %s",
            (hashed_password, id_usuario)
        )

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Contraseñas actualizadas correctamente.")

if __name__ == "__main__":
    actualizar_contrasenas()