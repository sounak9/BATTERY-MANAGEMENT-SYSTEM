import React, { useEffect, useState } from "react";
import { fetchSensorLogs } from "../api/sensor.js";

export default function DataLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSensorLogs()
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#14234C] rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-white text-lg font-semibold mb-4">Data Logs</h2>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-teal-300 border-white"></div>
          </div>
        ) : (
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-600">
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Voltage</th>
                <th className="px-4 py-2">Temp</th>
                <th className="px-4 py-2">Current</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-700 hover:bg-blue-700 transition-colors"
                >
                  <td className="px-4 py-2 text-gray-300">{log.timestamp}</td>
                  <td className="px-4 py-2 text-gray-300">{log.voltage}</td>
                  <td className="px-4 py-2 text-gray-300">{log.temperature}</td>
                  <td className="px-4 py-2 text-gray-300">{log.current}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
