import { getApiUrl } from "../lib/backend";

export async function fetchSensorData() {
  const res = await fetch(`${getApiUrl()}/sensor`);
  if (!res.ok) throw new Error("Failed to fetch sensor data");
  return await res.json();
}
export async function fetchSensorLogs() {
  const res = await fetch(`${getApiUrl()}/sensor/logs`);
  if (!res.ok) throw new Error("Failed to fetch sensor logs");
  return await res.json();
}
