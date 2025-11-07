"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { ChartDataPoint, ChartConfig } from "@/types/visualization";

// Default color palette
const DEFAULT_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

interface ChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
}

// Helper to get colors
const getColors = (config: ChartConfig) =>
  config.colors && config.colors.length > 0 ? config.colors : DEFAULT_COLORS;

// Helper to auto-detect axes if not provided
const detectAxes = (data: ChartDataPoint[], config: ChartConfig) => {
  if (data.length === 0) return { xAxis: "", yAxis: [] as string[] };

  const keys = Object.keys(data[0]);
  const xAxis =
    config.xAxis || keys.find((k) => typeof data[0][k] === "string") || keys[0];

  let yAxis: string[];
  if (config.yAxis) {
    yAxis = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis];
  } else {
    const defaultY = keys.find((k) => typeof data[0][k] === "number") || keys[1] || keys[0];
    yAxis = [defaultY];
  }

  return { xAxis, yAxis };
};

export function InteractiveBarChart({ data, config }: ChartProps) {
  const { xAxis, yAxis } = detectAxes(data, config);
  const colors = getColors(config);
  const showLegend = config.legend !== false;
  const showGrid = config.grid !== false;
  const showTooltip = config.tooltip !== false;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey={xAxis}
          tick={{ fontSize: 12 }}
          tickLine={{ strokeOpacity: 0.3 }}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={{ strokeOpacity: 0.3 }} />
        {showTooltip && <Tooltip />}
        {showLegend && yAxis.length > 1 && <Legend />}
        {yAxis.map((key: string, index: number) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InteractiveLineChart({ data, config }: ChartProps) {
  const { xAxis, yAxis } = detectAxes(data, config);
  const colors = getColors(config);
  const showLegend = config.legend !== false;
  const showGrid = config.grid !== false;
  const showTooltip = config.tooltip !== false;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey={xAxis}
          tick={{ fontSize: 12 }}
          tickLine={{ strokeOpacity: 0.3 }}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={{ strokeOpacity: 0.3 }} />
        {showTooltip && <Tooltip />}
        {showLegend && yAxis.length > 1 && <Legend />}
        {yAxis.map((key: string, index: number) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function InteractivePieChart({ data, config }: ChartProps) {
  const colors = getColors(config);
  const showLegend = config.legend !== false;
  const showTooltip = config.tooltip !== false;

  // For pie charts, we need name and value
  const { xAxis, yAxis } = detectAxes(data, config);
  const nameKey = xAxis;
  const valueKey = Array.isArray(yAxis) ? yAxis[0] : yAxis;

  const pieData = data.map((item) => ({
    name: item[nameKey],
    value: item[valueKey],
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {pieData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InteractiveScatterChart({ data, config }: ChartProps) {
  const { xAxis, yAxis } = detectAxes(data, config);
  const colors = getColors(config);
  const showGrid = config.grid !== false;
  const showTooltip = config.tooltip !== false;

  const xKey = xAxis;
  const yKey = Array.isArray(yAxis) ? yAxis[0] : yAxis;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          type="number"
          dataKey={xKey}
          name={xKey}
          tick={{ fontSize: 12 }}
          tickLine={{ strokeOpacity: 0.3 }}
        />
        <YAxis
          type="number"
          dataKey={yKey}
          name={yKey}
          tick={{ fontSize: 12 }}
          tickLine={{ strokeOpacity: 0.3 }}
        />
        {showTooltip && <Tooltip cursor={{ strokeDasharray: "3 3" }} />}
        <Scatter data={data} fill={colors[0]} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function InteractiveAreaChart({ data, config }: ChartProps) {
  const { xAxis, yAxis } = detectAxes(data, config);
  const colors = getColors(config);
  const showLegend = config.legend !== false;
  const showGrid = config.grid !== false;
  const showTooltip = config.tooltip !== false;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey={xAxis}
          tick={{ fontSize: 12 }}
          tickLine={{ strokeOpacity: 0.3 }}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={{ strokeOpacity: 0.3 }} />
        {showTooltip && <Tooltip />}
        {showLegend && yAxis.length > 1 && <Legend />}
        {yAxis.map((key: string, index: number) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
