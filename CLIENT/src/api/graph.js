// src/api/graph.js
import { getApiUrl } from "../lib/backend";

export const fetchGraphData = async ({ batteryId = "All", start, end }) => {
  const url = new URL(`${getApiUrl()}/graph`);

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
