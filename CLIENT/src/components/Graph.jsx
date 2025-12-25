import React, { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(zoomPlugin);

export default function Graph({ id, type, data, options }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(ctx, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,

        animation: {
          duration: 600,
          easing: "easeOutQuart",
        },

        interaction: {
          mode: "index",
          intersect: false,
        },

        plugins: {
          legend: {
            labels: { color: "#ffffff" },
            onClick: (e, item, legend) => {
              const index = item.datasetIndex;
              legend.chart.toggleDataVisibility(index);
              legend.chart.update();
            },
          },

          tooltip: {
            backgroundColor: "#1E293B",
            titleColor: "#fff",
            bodyColor: "#e2e8f0",
            borderColor: "#64748b",
            borderWidth: 1,
          },

          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
            },
            pan: {
              enabled: true,
              mode: "x",
            },
          },
        },

        onClick: (evt, active) => {
          if (active.length > 0) {
            const index = active[0].index;
            console.log("Clicked point:", data.datasets[0].data[index]);
          }
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
  }, [type, data, options]);

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
