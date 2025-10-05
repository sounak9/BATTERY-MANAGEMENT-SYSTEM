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

      // Normalize incoming data: convert numeric fields (which may be strings)
      // into Numbers so charts and cards can use them directly.
      const normalized = (data || [])
        .map((l) => {
          // Ensure timestamp is an ISO-parseable string. Some backends send
          // "YYYY-MM-DD HH:MM:SS" (space) which Date(...) can't reliably parse
          // across browsers — replace the space with 'T' to make it ISO8601.
          const rawTs = l.timestamp || "";
          const isoTs =
            rawTs.includes(" ") && !rawTs.includes("T")
              ? rawTs.replace(" ", "T")
              : rawTs;

          const tsMs = Date.parse(isoTs);
          return {
            ...l,
            voltage: l.voltage == null ? 0 : Number(l.voltage),
            current: l.current == null ? 0 : Number(l.current),
            temperature: l.temperature == null ? 0 : Number(l.temperature),
            timestamp: isoTs,
            timestampMs: isNaN(tsMs) ? null : tsMs,
          };
        })
        // sort ascending by timestampMs (oldest -> newest). Invalid timestamps go last.
        .sort((a, b) => {
          if (a.timestampMs == null && b.timestampMs == null) return 0;
          if (a.timestampMs == null) return 1;
          if (b.timestampMs == null) return -1;
          return a.timestampMs - b.timestampMs;
        });

      let filtered = normalized;

      // Apply time filtering
      const now = new Date();
      let cutoff = null;
      switch (timeRange) {
        case "1min":
          cutoff = new Date(Date.now() - 60 * 1000);
          break;
        case "30min":
          cutoff = new Date(Date.now() - 30 * 60 * 1000);
          break;
        case "1hr":
          cutoff = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case "1day":
          cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case "1month": {
          const d = new Date();
          d.setMonth(d.getMonth() - 1);
          cutoff = d;
          break;
        }
        case "6months": {
          const d = new Date();
          d.setMonth(d.getMonth() - 6);
          cutoff = d;
          break;
        }
        case "1year": {
          const d = new Date();
          d.setFullYear(d.getFullYear() - 1);
          cutoff = d;
          break;
        }
        default:
          cutoff = null;
      }

      if (cutoff) {
        const cutoffMs = cutoff.getTime();
        filtered = normalized.filter((log) => {
          return log.timestampMs != null && log.timestampMs >= cutoffMs;
        });
      }

      // If filtering removed all entries but there is data, fall back to showing
      // the full dataset so the cards/graphs don't appear empty.
      const logsToUse = filtered.length > 0 ? filtered : normalized;
      // Debug info for developer — remove or guard in production
      console.debug(
        "datalogs: total=",
        normalized.length,
        "filtered=",
        filtered.length,
        "using=",
        logsToUse.length
      );
      if (cutoff) console.debug("cutoffMs=", cutoff.getTime());
      // ensure logs stored in state are sorted ascending by time
      setLogs(
        logsToUse.slice().sort((a, b) => {
          if (a.timestampMs == null && b.timestampMs == null) return 0;
          if (a.timestampMs == null) return 1;
          if (b.timestampMs == null) return -1;
          return a.timestampMs - b.timestampMs;
        })
      );

      // Collect unique battery IDs from the raw/normalized data
      const ids = [
        ...new Set(normalized.map((l) => l.batteryId).filter(Boolean)),
      ];
      setBatteryIds(ids);

      // Update current snapshot (use last available entry from logsToUse)
      if (logsToUse.length > 0) {
        const last = logsToUse[logsToUse.length - 1];
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

  // Use numeric timestampMs (if available) to generate labels — this keeps
  // labels consistent with the filtering which uses timestampMs
  const labels = logs.map((log) =>
    new Date(log.timestampMs || Date.parse(log.timestamp)).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )
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
          <h3 className="text-lg font-semibold mb-2">Temperature (Â°C)</h3>
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
