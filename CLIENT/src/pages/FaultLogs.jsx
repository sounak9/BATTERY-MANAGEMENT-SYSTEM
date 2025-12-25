import React, { useEffect, useState } from "react";
import { getFaultLogs, getFaultLogsCSV } from "../api/faultlogs";

export default function FaultLogs() {
  const [logs, setLogs] = useState([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [batteryId, setBatteryId] = useState("all");
  const [faultType, setFaultType] = useState("all");

  // Fetch Logs
  const fetchLogs = async () => {
    try {
      const data = await getFaultLogs({
        start,
        end,
        battery_id: batteryId,
        fault_type: faultType,
      });
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Fault Logs</h1>

      {/* Filter Inputs */}
      <div className="flex gap-4 mb-6 items-center">
        <input
          type="date"
          className="p-2 rounded bg-slate-800 border border-slate-600"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        <input
          type="date"
          className="p-2 rounded bg-slate-800 border border-slate-600"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />

        <select
          className="p-2 rounded bg-slate-800 border border-slate-600"
          value={batteryId}
          onChange={(e) => setBatteryId(e.target.value)}
        >
          <option value="all">All Batteries</option>
          <option value="1">Battery 1</option>
          <option value="2">Battery 2</option>
        </select>

        <select
          className="p-2 rounded bg-slate-800 border border-slate-600"
          value={faultType}
          onChange={(e) => setFaultType(e.target.value)}
        >
          <option value="all">All Fault Types</option>
          <option value="Overheating">Overheating</option>
          <option value="Low Voltage">Low Voltage</option>
          <option value="High Current">High Current</option>
        </select>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 rounded shadow"
        >
          Filter
        </button>

        <a
          href={getFaultLogsCSV()}
          className="px-4 py-2 bg-green-600 rounded shadow"
        >
          Download CSV
        </a>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded p-4 overflow-auto">
        <table className="w-full text-left">
          <thead className="text-blue-300 border-b border-slate-600">
            <tr>
              <th className="py-3 px-2">Detected At</th>
              <th className="py-3 px-2">Battery ID</th>
              <th className="py-3 px-2">Fault Type</th>
              <th className="py-3 px-2">Severity</th>
              <th className="py-3 px-2">Predicted By</th>
              <th className="py-3 px-2">Note</th>
              <th className="py-3 px-2">Resolve Text</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.fault_id} className="border-b border-slate-700">
                <td className="py-3 px-2">{log.detected_at}</td>
                <td className="py-3 px-2">{log.battery_id}</td>
                <td className="py-3 px-2">{log.fault_type}</td>
                <td className="py-3 px-2">{log.severity}</td>
                <td className="py-3 px-2">{log.predicted_by}</td>
                <td className="py-3 px-2">{log.note}</td>
                <td className="py-3 px-2">{log.resolve_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
