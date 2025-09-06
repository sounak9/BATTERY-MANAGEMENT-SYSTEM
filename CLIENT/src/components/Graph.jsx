import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";

export default function Graph({ id, type, data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    chartRef.current = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          y: {
            ticks: { color: "#ffffff" },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
        ...options,
      },
    });

    return () => chartRef.current.destroy();
  }, [type, options]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = data;
      chartRef.current.update();
    }
  }, [data]);

  return (
    <div className="bg-[#14234C] p-4 rounded-xl shadow-lg h-[400px] overflow-hidden">
      <canvas
        ref={canvasRef}
        id={id}
        width={600}
        height={320}
        className="w-full h-full block"
      />
    </div>
  );
}
