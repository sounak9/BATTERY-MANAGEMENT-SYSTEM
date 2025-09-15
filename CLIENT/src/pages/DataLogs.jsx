import React, { useEffect, useState } from "react";
import { fetchDatalogs } from "../api/datalogs.js";

export default function DataLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [batteryId, setBatteryId] = useState("All");
  const [batteryIds, setBatteryIds] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await fetchDatalogs(filters);
      setLogs(data);

      // collect unique battery IDs
      const uniqueIds = [
        ...new Set(data.map((log) => log.batteryId).filter(Boolean)),
      ];
      setBatteryIds(uniqueIds);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadLogs({ start: startDate, end: endDate, batteryId });
  };

  const handleDownloadCSV = () => {
    const csvData = [
      [
        "Timestamp",
        "Current (A)",
        "Temperature (°C)",
        "Voltage (V)",
        "Battery ID",
      ],
      ...logs.map((log) => [
        log.timestamp,
        log.current,
        log.temperature,
        log.voltage,
        log.batteryId,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "datalogs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#1A2B5B] p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Datalogs</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="flex-1 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <label className="text-gray-400 text-sm flex items-center">
            Start Date:
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-700 text-gray-100 p-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <label className="text-gray-400 text-sm flex items-center">
            End Date:
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-700 text-gray-100 p-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
        </div>

        {/* Battery Filter */}
        <select
          value={batteryId}
          onChange={(e) => setBatteryId(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 text-gray-100"
        >
          <option value="All">All Batteries</option>
          {batteryIds.map((id) => (
            <option key={id} value={id}>{`Battery ${id}`}</option>
          ))}
        </select>

        {/* Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleFilter}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            Filter
          </button>
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-white"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-600 rounded-xl overflow-hidden">
            <thead className="bg-slate-700 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Current (A)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Temperature (°C)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Voltage (V)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Battery ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {log.current}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {log.temperature}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {log.voltage}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {log.batteryId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
