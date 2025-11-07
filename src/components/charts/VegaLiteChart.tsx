"use client";

import { useEffect, useRef } from "react";
import embed from "vega-embed";

interface VegaLiteChartProps {
  spec: Record<string, unknown>;
  className?: string;
}

export function VegaLiteChart({ spec, className }: VegaLiteChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !spec) {
      return;
    }

    let chartView: any = null;

    // Clear previous chart
    chartRef.current.innerHTML = "";

    // Ensure spec is a plain object (sanitize if needed)
    const sanitizedSpec = JSON.parse(JSON.stringify(spec));

    // Render the chart
    embed(chartRef.current, sanitizedSpec, {
      actions: false,
      renderer: "svg",
    })
      .then((result) => {
        chartView = result.view;
      })
      .catch((error) => {
        console.error("Error rendering Vega-Lite chart:", error);
      });

    // Cleanup function
    return () => {
      if (chartView) {
        chartView.finalize();
      }
    };
  }, [spec]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: "100%", minHeight: "300px" }}
    />
  );
}

