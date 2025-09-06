import React from "react";
import { FaUserCircle } from "react-icons/fa";

const Header = () => (
  <div className="bg-[#14234C] h-16 flex items-center justify-between px-6 shadow-xl rounded-b-xl">
    <div>
      <h1 className="text-white text-xl md:text-2xl font-bold tracking-wide">
        Battery Monitoring Dashboard
      </h1>
    </div>
    <div className="flex items-center gap-4">
      <FaUserCircle
        className="text-gray-300 hover:text-white transition-all duration-300 transform hover:scale-110 cursor-pointer"
        size={40}
      />
    </div>
  </div>
);

export default Header;
