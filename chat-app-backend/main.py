from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
import uuid
import shutil

app = FastAPI()

# CORS agar bisa diakses dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ganti dengan domain frontend jika perlu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direktori penyimpanan file
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Simpan semua pesan di memori (untuk versi sederhana)
messages = []

@app.get("/messages")
def get_messages():
    return messages

@app.post("/messages/text")
def send_text(sender: str = Form(...), content: str = Form(...)):
    msg = {"type": "text", "sender": sender, "content": content}
    messages.append(msg)
    return {"status": "ok", "message": msg}

@app.post("/messages/file")
def upload_file(sender: str = Form(...), file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/download/{unique_name}"
    file_type = file.content_type.split("/")[0]

    msg = {
        "type": file_type if file_type in ["image", "video", "audio"] else "file",
        "sender": sender,
        "content": file_url,
        "name": file.filename
    }
    messages.append(msg)
    return {"status": "ok", "message": msg}

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"detail": "File not found"})
