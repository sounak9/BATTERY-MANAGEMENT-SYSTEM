import React from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdSettings,
  MdList,
  MdSensors,
  MdLogout,
} from "react-icons/md";

const sidebarItems = [
  { to: "/", icon: <MdDashboard size={28} />, label: "Dashboard" },
  { to: "/settings", icon: <MdSettings size={28} />, label: "Settings" },
  { to: "/data-logs", icon: <MdList size={28} />, label: "Data Logs" },
  { to: "/sensors", icon: <MdSensors size={28} />, label: "Sensors" },
];

const Sidebar = () => (
  <div className="bg-[#14234C] w-20 py-8 px-2 min-h-[calc(100vh-64px)] shadow-xl rounded-r-xl flex flex-col items-center">
    <div className="flex flex-col items-center space-y-8 w-full">
      {sidebarItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `w-full flex flex-col items-center text-gray-400 transition-transform duration-200 hover:text-white hover:scale-105 ${
              isActive ? "text-white font-semibold" : ""
            }`
          }
        >
          {item.icon}
          <span className="text-xs font-medium mt-1">{item.label}</span>
        </NavLink>
      ))}
    </div>
    <div className="flex-grow" /> {/* Spacer */}
    <div
      className="flex flex-col items-center text-gray-400 hover:text-white cursor-pointer mt-8"
      onClick={() => {
        localStorage.removeItem("isAuthenticated");
        window.location.href = "/login";
      }}
    >
      <MdLogout size={28} className="mb-2" />
      <span className="text-xs font-medium">Logout</span>
    </div>
  </div>
);

export default Sidebar;
