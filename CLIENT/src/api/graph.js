// src/api/graph.js
export const fetchGraphData = async ({ batteryId = "All", start, end }) => {
  const url = new URL("http://localhost:8000/api/graph");

  if (batteryId && batteryId !== "All") {
    url.searchParams.append("battery_id", batteryId);
  }
  if (start) url.searchParams.append("start", start);
  if (end) url.searchParams.append("end", end);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch graph data: ${res.statusText}`);
  }
  return await res.json();
};
