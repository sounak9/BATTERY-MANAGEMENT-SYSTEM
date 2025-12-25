import { getApiUrl } from "../lib/backend";

export async function fetchDatalogs({ start, end, batteryId } = {}) {
  const params = new URLSearchParams();

  if (start) params.append("start", start); // expects YYYY-MM-DD
  if (end) params.append("end", end); // expects YYYY-MM-DD
  if (batteryId && batteryId !== "All") params.append("battery_id", batteryId);

  const url = `${getApiUrl()}/datalogs?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch datalogs: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching datalogs:", err);
    throw err;
  }
}
