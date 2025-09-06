import React from "react";
import { MdBolt, MdThermostat, MdBatteryChargingFull } from "react-icons/md";

const sensorList = [
  {
    name: "Voltage Sensor",
    status: "Active",
    icon: <MdBolt className="text-3xl text-teal-300" />,
    value: "12.4V",
  },
  {
    name: "Temperature Sensor",
    status: "Active",
    icon: <MdThermostat className="text-3xl text-teal-300" />,
    value: "36.2°C",
  },
  {
    name: "Current Sensor",
    status: "Active",
    icon: <MdBatteryChargingFull className="text-3xl text-teal-300" />,
    value: "1.1A",
  },
];

const Sensors = () => {
  return (
    <div className="bg-[#14234C] rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-white text-lg font-semibold mb-4">Sensors</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sensorList.map((sensor, idx) => (
          <div
            key={idx}
            className="flex items-center bg-blue-900 rounded-lg p-4 shadow-md"
          >
            <div className="mr-4">{sensor.icon}</div>
            <div>
              <p className="text-white font-medium">{sensor.name}</p>
              <p className="text-gray-400 text-sm">{sensor.status}</p>
              <p className="text-teal-300 text-lg font-bold">{sensor.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sensors;
