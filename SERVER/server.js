const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client

require("dotenv").config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Setup Express
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestSensorData = null;

// Generate random sensor data
function generateSensorData() {
  const voltage = parseFloat((Math.random() * (14 - 10) + 10).toFixed(2));
  const current = parseFloat((Math.random() * (20 - 0) + 0).toFixed(2));
  const temperature = parseFloat((Math.random() * (50 - 26) + 26).toFixed(1));
  return {
    voltage,
    current,
    temperature,
    timestamp: new Date().toISOString(),
  };
}

// Send and store data every 1 minute
setInterval(async () => {
  const data = generateSensorData();
  latestSensorData = data; // Save latest data
  const message = JSON.stringify(data);

  // Send to WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  // Store in Supabase
  const { error } = await supabase.from("system_data").insert([data]);

  if (error) {
    console.error("❌ Error inserting into Supabase:", error);
  } else {
    console.log("✅ Data inserted into Supabase:", data);
  }
}, 15000); // every 1 minute

wss.on("connection", (ws) => {
  console.log("🟢 WebSocket client connected");
  ws.send(JSON.stringify({ message: "Connected to WebSocket Server" }));
});

app.get("/", (req, res) => {
  res.send("WebSocket Sensor Server with Supabase Storage is running.");
});

// Add this endpoint
app.get("/api/sensor", (req, res) => {
  if (latestSensorData) {
    res.json(latestSensorData);
  } else {
    res.status(404).json({ error: "No sensor data available" });
  }
});

app.get("/api/sensor/logs", async (req, res) => {
  const { data, error } = await supabase
    .from("system_data")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100); // latest 100 logs

  if (error) {
    return res.status(500).json({ error: "Supabase error" });
  }
  res.json(data);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
