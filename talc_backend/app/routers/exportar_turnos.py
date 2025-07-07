from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from app.database import get_connection  # 👈 importa tu método de conexión ya existente

router = APIRouter()

@router.get("/api/exportarTurnos")
def exportar_turnos(
    paciente: str = Query(default="Todos"),
    profesional: str = Query(default="Todos"),
    estado: str = Query(default="Todos"),
    fecha_inicio: str = Query(default=None),
    fecha_fin: str = Query(default=None)
):
    connection = get_connection()

    query = """
    SELECT 
        Fecha,
        Hora,
        Paciente,
        Profesional,
        Especialidad,
        Estado,
        Asistencia
    FROM Vista_TurnosConAsistencia
    WHERE 1=1
    """
    params = []

    if paciente != "Todos":
        query += " AND Paciente = %s"
        params.append(paciente)
    
    if profesional != "Todos":
        query += " AND Profesional = %s"
        params.append(profesional)
    
    if estado != "Todos":
        query += " AND Estado = %s"
        params.append(estado)

    if fecha_inicio and fecha_fin:
        query += " AND Fecha BETWEEN %s AND %s"
        params.append(fecha_inicio)
        params.append(fecha_fin)

    df = pd.read_sql(query, connection, params=params)
    connection.close()

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Turnos')

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=turnos.xlsx"}
    )