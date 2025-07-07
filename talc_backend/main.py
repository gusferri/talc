from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import turnos
from app.routers import usuarios
from app.routers.usuarios import start_scheduler
from app.routers import exportar_turnos
from app.routers import voz
from google_calendar import router as google_calendar_router
from app.routers import reportes
from app.routers import pacientes
from app.routers.voz import router as voz_router
from app.routers import ai
from app.routers import adjuntos


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Reemplazar "*" por ["http://localhost:8080"] para mayor seguridad
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(turnos.router)
app.include_router(google_calendar_router)
app.include_router(reportes.router)
app.include_router(usuarios.router)
app.include_router(exportar_turnos.router)
app.include_router(pacientes.router)
app.include_router(voz_router)
app.include_router(ai.router)
app.include_router(adjuntos.router, prefix="/pacientes")

@app.on_event("startup")
async def startup_event():
    start_scheduler()