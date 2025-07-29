import React, { useRef, useEffect } from "react";
import { Box } from "@chakra-ui/react";
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
        ...options,
        animation: false,
        animations: false,
        maintainAspectRatio: false,
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
    <Box
      bg="blue.800"
      p={4}
      borderRadius="xl"
      boxShadow="lg"
      height="400px"
      overflow="hidden"
    >
      <canvas
        ref={canvasRef}
        id={id}
        width={600}
        height={320}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </Box>
  );
}

Graph.defaultProps = {
  options: { responsive: true, animation: false, animations: false },
};
