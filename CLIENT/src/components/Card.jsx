import React from "react";

const Card = ({ title, value, unit, description }) => (
  <div className="bg-[#14234C] p-6 rounded-xl shadow-lg text-center text-white transform transition-transform duration-300 hover:scale-105">
    <p className="text-gray-400 text-sm mb-2">{title}</p>
    <p className="text-5xl font-bold">
      {value}
      {unit}
    </p>
    <p className="text-gray-400 text-sm mt-2">{description}</p>
  </div>
);

export default Card;
