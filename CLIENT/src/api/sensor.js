export async function fetchSensorData() {
  const res = await fetch("http://127.0.0.1:8000/api/sensor");
  if (!res.ok) throw new Error("Failed to fetch sensor data");
  return await res.json();
}
export async function fetchSensorLogs() {
  const res = await fetch("http://127.0.0.1:8000/api/sensor/logs");
  if (!res.ok) throw new Error("Failed to fetch sensor logs");
  return await res.json();
}
