import socketio
from fastapi import FastAPI
import uvicorn

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Simpan pesan ke dalam memori
chat_history = []

@sio.event
async def connect(sid, environ):
    print(f"User connected: {sid}")
    # Kirim riwayat chat ke pengguna yang baru masuk
    for msg in chat_history:
        await sio.emit('chat_message', msg, room=sid)

@sio.event
async def chat_message(sid, message):
    print(f"Received from {sid}: {message}")
    chat_history.append(message)  # Simpan pesan
    await sio.emit('chat_message', message, skip_sid=sid)

@sio.event
async def disconnect(sid):
    print(f"User disconnected: {sid}")

if __name__ == "__main__":
    uvicorn.run("app:socket_app", host="0.0.0.0", port=5000, reload=True)
