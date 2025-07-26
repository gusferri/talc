from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional

class TurnoOut(BaseModel):
    ID: int
    ID_Paciente: int
    NombrePaciente: str
    ApellidoPaciente: str
    ID_Profesional: int
    NombreProfesional: str
    ApellidoProfesional: str
    ID_Especialidad: int
    Especialidad: str
    Fecha: date
    Hora: time
    ID_EstadoTurno: int

class TurnoDetalleOut(BaseModel):
    ID: int
    Paciente: str
    Profesional: str
    Especialidad: str
    Fecha: date
    Hora: time
    Estado: str