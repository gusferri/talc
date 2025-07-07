from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.database import get_connection
from datetime import date, datetime, timedelta
import locale

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"]
)

@router.post("")
def generar_reporte(filtros: dict):
    tipo = filtros.get("tipo")
    subtipo = filtros.get("subtipo")
    fecha_inicio = filtros.get("fechaInicio")
    fecha_fin = filtros.get("fechaFin")
    paciente_id = filtros.get("pacienteId")
    profesional_id = filtros.get("profesionalId")
    especialidad_id = filtros.get("especialidadId")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            t.Fecha,
            t.Hora,
            CONCAT(p.Nombre, ' ', p.Apellido) AS Paciente,
            CONCAT(pr.Nombre, ' ', pr.Apellido) AS Profesional,
            e.Nombre AS Especialidad,
            es.Descripcion AS Estado,
            (
                SELECT a.FechaHoraLlegada 
                FROM Asistencia a 
                WHERE a.ID_Turno = t.ID 
                LIMIT 1
            ) AS Asistencia
        FROM Turno t
        JOIN Paciente p ON p.ID = t.ID_Paciente
        JOIN Profesional pr ON pr.ID = t.ID_Profesional
        JOIN Especialidad e ON e.ID_Especialidad = t.ID_Especialidad
        JOIN Turno_Estado es ON es.ID = t.ID_EstadoTurno
        WHERE t.Fecha BETWEEN %s AND %s
    """

    valores = [fecha_inicio, fecha_fin]

    if tipo == "paciente" and paciente_id:
        query += " AND t.ID_Paciente = %s"
        valores.append(paciente_id)
    elif tipo == "profesional" and profesional_id:
        query += " AND t.ID_Profesional = %s"
        valores.append(profesional_id)
    elif tipo == "especialidad" and especialidad_id:
        query += " AND t.ID_Especialidad = %s"
        valores.append(especialidad_id)

    if subtipo == "asistencias":
        query += " AND t.ID_EstadoTurno = 5"  # Asistido

    query += " ORDER BY t.Fecha, t.Hora"

    cursor.execute(query, valores)
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()

    locale.setlocale(locale.LC_TIME, 'es_AR.UTF-8')
    for item in resultados:
        for key, value in item.items():
            if key == "Asistencia" and isinstance(value, datetime):
                item[key] = value.strftime("%H:%M")
            elif isinstance(value, (date, datetime)):
                item[key] = value.strftime("%d/%m/%Y")
            elif isinstance(value, timedelta):
                item[key] = str(value)

    if tipo == "paciente":
        for item in resultados:
            item.pop("Paciente", None)
    elif tipo == "profesional":
        for item in resultados:
            item.pop("Profesional", None)

    return JSONResponse(content=resultados)
