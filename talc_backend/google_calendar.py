from fastapi import APIRouter, Body
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from fastapi import Request
from fastapi.responses import RedirectResponse
import json
from google_auth_oauthlib.flow import Flow

with open("credentials.json") as f:
    creds = json.load(f)

CLIENT_ID = creds["web"]["client_id"]
CLIENT_SECRET = creds["web"]["client_secret"]
REDIRECT_URI = creds["web"]["redirect_uris"][0]
SCOPES = ['https://www.googleapis.com/auth/calendar.events']

router = APIRouter()

@router.get("/google/login")
def login():
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI

    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    return RedirectResponse(auth_url)

@router.get("/oauth2callback")
def oauth2callback(request: Request):
    code = request.query_params.get("code")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(code=code)

    credentials = flow.credentials

    return {
        "access_token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_expiry": str(credentials.expiry)
    }
def crear_evento_google_calendar(
    access_token: str = Body(...),
    resumen: str = Body(...),
    descripcion: str = Body(...),
    inicio: str = Body(...),  # ISO: "2025-05-01T10:00:00-03:00"
    fin: str = Body(...),
):
    creds = Credentials(token=access_token)
    service = build("calendar", "v3", credentials=creds)

    evento = {
        "summary": resumen,
        "description": descripcion,
        "start": {
            "dateTime": inicio,
            "timeZone": "America/Argentina/Cordoba"
        },
        "end": {
            "dateTime": fin,
            "timeZone": "America/Argentina/Cordoba"
        },
        "reminders": {
            "useDefault": True
        }
    }

    evento_creado = service.events().insert(calendarId="primary", body=evento).execute()

    return {
        "id": evento_creado.get("id"),
        "htmlLink": evento_creado.get("htmlLink"),
        "status": evento_creado.get("status")
    }