import os
import json
import time
from threading import Thread
from flask import Flask, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS  
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

# ✅ Enable CORS for all domains or restrict as needed
CORS(app, origins=["http://localhost:5173"])  # You can change this to your frontend's URL

# ✅ Initialize SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173"])  # Same origin as above

# Background task to emit latest sensor data every 5 seconds
def sensor_background_task():
    while True:
        response = supabase.table("system_data").select("*").order("timestamp", desc=True).limit(1).execute()
        if response.data:
            socketio.emit('sensor_data', response.data[0])
        time.sleep(5)

@app.route("/")
def home():
    return jsonify({"message": "Flask WebSocket Sensor Server is running."})

@app.route("/api/sensor")
def get_latest_sensor():
    response = supabase.table("system_data").select("*").order("timestamp", desc=True).limit(1).execute()
    if response.data:
        return jsonify(response.data[0])
    return jsonify({"error": "No sensor data available"})

@app.route("/api/sensor/logs")
def get_sensor_logs():
    response = supabase.table("system_data").select("*").order("timestamp", desc=True).limit(100).execute()
    return jsonify(response.data)

@socketio.on('connect')
def on_connect():
    print("✅ Client connected")

@socketio.on('disconnect')
def on_disconnect():
    print("🔴 Client disconnected")

if __name__ == '__main__':
    # Start background task
    thread = Thread(target=sensor_background_task)
    thread.daemon = True
    thread.start()

    # Run the app
    socketio.run(app, host='0.0.0.0', port=8000)
