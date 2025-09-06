import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Graph from "../components/Graph";
import { fetchSensorLogs } from "../api/sensor";
import io from "socket.io-client";

const socket = io("http://127.0.0.1:8000");

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [sensor, setSensor] = useState({
    voltage: 0,
    current: 0,
    temperature: 0,
    timestamp: "",
  });

  useEffect(() => {
    fetchSensorLogs()
      .then((data) => {
        const ordered = data.reverse();
        setLogs(ordered);
        if (ordered.length > 0) setSensor(ordered[ordered.length - 1]);
      })
      .catch(() => setLogs([]));

    socket.on("sensor_data", (newData) => {
      console.log("📡 Received real-time update:", newData);
      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs, newData];
        return updatedLogs.slice(-20);
      });
      setSensor(newData);
    });

    return () => {
      socket.off("sensor_data");
    };
  }, []);

  const labels = logs.map((log) =>
    new Date(log.timestamp).toLocaleTimeString()
  );

  const voltageData = {
    labels,
    datasets: [
      {
        label: "Voltage (V)",
        data: logs.map((log) => log.voltage),
        borderColor: "#38B2AC",
        backgroundColor: "rgba(56,178,172,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const currentData = {
    labels,
    datasets: [
      {
        label: "Current (A)",
        data: logs.map((log) => log.current),
        borderColor: "#F6E05E",
        backgroundColor: "rgba(246,224,94,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const isHighTemperature = logs.some((log) => log.temperature > 43);
  const temperatureData = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: logs.map((log) => log.temperature),
        borderColor: isHighTemperature ? "#FF0000" : "#54d21b",
        backgroundColor: isHighTemperature
          ? "rgba(255,0,0,0.2)"
          : "rgba(84,210,27,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="p-4">
      {/* Cards */}
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

      {/* Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Graph id="currentGraph" type="line" data={currentData} />
        <Graph id="voltageGraph" type="line" data={voltageData} />
        <Graph id="temperatureGraph" type="line" data={temperatureData} />
      </div>
    </div>
  );
};

export default Dashboard;
