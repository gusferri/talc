FROM python:3.11-slim

WORKDIR /app

COPY . /app
COPY requirements.txt /app

RUN apt update && \
    apt install -y ffmpeg && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
