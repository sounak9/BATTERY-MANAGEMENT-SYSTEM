import React, { useEffect, useState, useCallback, useMemo } from "react";
import Card from "../components/Card";
import Graph from "../components/Graph";
import { fetchDatalogs } from "../api/datalogs.js";

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [batteryId, setBatteryId] = useState("All");
  const [batteryIds, setBatteryIds] = useState([]);
  const [timeRange, setTimeRange] = useState("1hr");
  const [sensor, setSensor] = useState({
    voltage: 0,
    current: 0,
    temperature: 0,
    timestamp: "",
  });

  /** 🔹 Normalize and sort datalogs */
  const normalizeLogs = useCallback((data) => {
    return (data || [])
      .map((l) => {
        const isoTs = l.timestamp?.includes(" ")
          ? l.timestamp.replace(" ", "T")
          : l.timestamp;
        const tsMs = Date.parse(isoTs);
        return {
          ...l,
          voltage: Number(l.voltage || 0),
          current: Number(l.current || 0),
          temperature: Number(l.temperature || 0),
          timestamp: isoTs,
          timestampMs: isNaN(tsMs) ? null : tsMs,
        };
      })
      .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0));
  }, []);

  /** 🔹 Compute cutoff time based on selected range */
  const getCutoff = useCallback(() => {
    const now = new Date();
    const ranges = {
      "1min": 1 * 60 * 1000,
      "30min": 30 * 60 * 1000,
      "1hr": 60 * 60 * 1000,
      "1day": 24 * 60 * 60 * 1000,
    };

    if (ranges[timeRange]) return new Date(Date.now() - ranges[timeRange]);

    const date = new Date();
    if (timeRange === "1month") date.setMonth(date.getMonth() - 1);
    if (timeRange === "6months") date.setMonth(date.getMonth() - 6);
    if (timeRange === "1year") date.setFullYear(date.getFullYear() - 1);
    return date;
  }, [timeRange]);

  /** 🔹 Fetch and process data */
  const loadLogs = useCallback(async () => {
    try {
      const rawData = await fetchDatalogs({ batteryId });
      const normalized = normalizeLogs(rawData);
      const cutoff = getCutoff();
      const cutoffMs = cutoff?.getTime();

      const filtered =
        cutoffMs && normalized.length
          ? normalized.filter((log) => log.timestampMs >= cutoffMs)
          : normalized;

      const usableLogs = filtered.length ? filtered : normalized;
      setLogs(usableLogs);
      setBatteryIds([
        ...new Set(normalized.map((l) => l.batteryId).filter(Boolean)),
      ]);

      if (usableLogs.length) {
        const last = usableLogs[usableLogs.length - 1];
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
  }, [batteryId, normalizeLogs, getCutoff]);

  /** 🔹 Auto-load on dependency change */
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /** 🔹 Memoized chart labels */
  const labels = useMemo(
    () =>
      logs.map((log) =>
        new Date(
          log.timestampMs || Date.parse(log.timestamp)
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      ),
    [logs]
  );

  /** 🔹 Chart datasets */
  const makeChartData = useCallback(
    (label, color, key) => ({
      labels,
      datasets: [
        {
          label,
          data: logs.map((log) => log[key]),
          borderColor: color,
          backgroundColor: `${color}33`, // translucent fill
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [logs, labels]
  );

  const charts = useMemo(
    () => ({
      current: makeChartData("Current (A)", "#3b82f6", "current"),
      temperature: makeChartData("Temperature (°C)", "#ef4444", "temperature"),
      voltage: makeChartData("Voltage (V)", "#10b981", "voltage"),
    }),
    [makeChartData]
  );

  return (
    <div className="p-6 bg-[#1A2B5B] rounded-xl shadow-lg">
      {/* 🔹 Stats */}
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

      {/* 🔹 Filters */}
      <div className="bg-[#1A2B5B] p-4 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row justify-between gap-4">
        <select
          value={batteryId}
          onChange={(e) => setBatteryId(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 text-gray-100"
        >
          <option value="All">All Batteries</option>
          {batteryIds.map((id) => (
            <option key={id} value={id}>
              Battery {id}
            </option>
          ))}
        </select>

        <ul className="flex flex-wrap gap-2">
          {["1min", "30min", "1hr", "1day", "1month", "6months", "1year"].map(
            (range) => (
              <li
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
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

      {/* 🔹 Graphs */}
      <div className="space-y-6">
        <Graph
          id="currentGraph"
          type="line"
          data={charts.current}
          title="Current (Amps)"
        />
        <Graph
          id="temperatureGraph"
          type="line"
          data={charts.temperature}
          title="Temperature (°C)"
        />
        <Graph
          id="voltageGraph"
          type="line"
          data={charts.voltage}
          title="Voltage (Volts)"
        />
      </div>
    </div>
  );
};

export default Dashboard;
