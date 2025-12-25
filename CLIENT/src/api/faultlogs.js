import axios from "axios";
import { getApiUrl } from "../lib/backend";

const API_BASE = getApiUrl();

// ---------------- GET ALL FAULT LOGS ----------------
export const getFaultLogs = async (params) => {
  try {
    const res = await axios.get(`${API_BASE}/fault-logs`, { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching fault logs:", err);
    throw err;
  }
};

// ---------------- DOWNLOAD CSV ----------------
export const getFaultLogsCSV = () => {
  return `${API_BASE}/fault-logs/csv`;
};
