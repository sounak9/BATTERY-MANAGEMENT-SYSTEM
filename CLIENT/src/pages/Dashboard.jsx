import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Graph from "../components/Graph";
import { fetchDatalogs } from "../api/datalogs.js";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [batteryId, setBatteryId] = useState("All");
  const [batteryIds, setBatteryIds] = useState([]);
  const [timeRange, setTimeRange] = useState("1hr"); // default filter

  // Current snapshot values
  const [sensor, setSensor] = useState({
    voltage: 0,
    current: 0,
    temperature: 0,
    timestamp: "",
  });

  useEffect(() => {
    loadLogs();
  }, [batteryId, timeRange]);

  const loadLogs = async () => {
    try {
      const data = await fetchDatalogs({ batteryId });
      let filtered = data;

      // Apply time filtering
      const now = new Date();
      let cutoff = null;
      switch (timeRange) {
        case "1min":
          cutoff = new Date(now.getTime() - 60 * 1000);
          break;
        case "30min":
          cutoff = new Date(now.getTime() - 30 * 60 * 1000);
          break;
        case "1hr":
          cutoff = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case "1day":
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "1month":
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "6months":
          cutoff = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case "1year":
          cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoff = null;
      }

      if (cutoff) {
        filtered = data.filter((log) => new Date(log.timestamp) >= cutoff);
      }

      setLogs(filtered);

      // Collect unique battery IDs
      const ids = [...new Set(data.map((l) => l.batteryId).filter(Boolean))];
      setBatteryIds(ids);

      // Update current snapshot
      if (filtered.length > 0) {
        const last = filtered[filtered.length - 1];
        setSensor({
          voltage: last.voltage,
          current: last.current,
          temperature: last.temperature,
          timestamp: last.timestamp,
        });
      }
    } catch (err) {
      console.error("Error loading logs:", err);
      setLogs([]);
    }
  };

  const labels = logs.map((log) =>
    new Date(log.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const currentData = {
    labels,
    datasets: [
      {
        label: "Current (A)",
        data: logs.map((log) => log.current),
        borderColor: "#3b82f6", // blue
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const temperatureData = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: logs.map((log) => log.temperature),
        borderColor: "#ef4444", // red
        backgroundColor: "rgba(239,68,68,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const voltageData = {
    labels,
    datasets: [
      {
        label: "Voltage (V)",
        data: logs.map((log) => log.voltage),
        borderColor: "#10b981", // green
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="p-6 bg-[#1A2B5B] rounded-xl shadow-lg">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Current"
          value={sensor.current}
          unit="A"
          description="Real-time Current"
        />
        <Card
          title="Temperature"
          value={sensor.temperature}
          unit="°C"
          description="Real-time Temperature"
        />
        <Card
          title="Voltage"
          value={sensor.voltage}
          unit="V"
          description="Real-time Voltage"
        />
        <Card title="SOC" value="90" unit="%" description="State of Charge" />
      </div>

      {/* Filters */}
      <div className="bg-[#1A2B5B] p-4 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
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

          {/* Time Filters */}
          <ul className="flex flex-wrap gap-2">
            {["1min", "30min", "1hr", "1day", "1month", "6months", "1year"].map(
              (range) => (
                <li
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors duration-200 ease-in-out ${
                    timeRange === range
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  {range}
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      {/* Graphs */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Current (Amps)</h3>
          <Graph id="currentGraph" type="line" data={currentData} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Temperature (°C)</h3>
          <Graph id="temperatureGraph" type="line" data={temperatureData} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Voltage (Volts)</h3>
          <Graph id="voltageGraph" type="line" data={voltageData} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
