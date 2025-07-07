from app.database import get_connection
import mysql.connector

conn = get_connection()
cursor = conn.cursor()

try:
    # Obtener todos los turnos en el rango de fechas
    cursor.execute("""
        SELECT ID, Fecha, Hora FROM Turno
        WHERE Fecha > "2025-06-01" AND Fecha < "2025-07-31"
    """)
    turnos = cursor.fetchall()

    for turno in turnos:
        id_turno, fecha, hora = turno
        fecha_hora_llegada = f"{fecha} {hora}"

        # Verificar si ya existe una entrada en Asistencia para este turno
        cursor.execute("SELECT COUNT(*) FROM Asistencia WHERE ID_Turno = %s", (id_turno,))
        (existe,) = cursor.fetchone()

        if existe == 0:
            cursor.execute("""
                INSERT INTO Asistencia (ID_Turno, Asistio, FechaHoraLLegada, RegistradoPor)
                VALUES (%s, %s, %s, %s)
            """, (id_turno, "1", fecha_hora_llegada, "3"))
            print(f"Insertada asistencia para turno ID {id_turno}")
        else:
            print(f"Asistencia ya existe para turno ID {id_turno}")

    conn.commit()

finally:
    cursor.close()
    conn.close()
