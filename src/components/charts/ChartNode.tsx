"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsIcon, XIcon } from "lucide-react";
import type { VisualizationConfig } from "@/types/visualization";
import {
  InteractiveBarChart,
  InteractiveLineChart,
  InteractivePieChart,
  InteractiveScatterChart,
  InteractiveAreaChart,
} from "./InteractiveCharts";

interface ChartNodeProps {
  data: {
    visualization: VisualizationConfig;
    onDelete?: (id: string) => void;
    onConfigure?: (id: string) => void;
  };
}

const renderChart = (visualization: VisualizationConfig) => {
  const { type, data, config } = visualization;

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  switch (type) {
    case "bar":
      return <InteractiveBarChart data={data} config={config} />;
    case "line":
      return <InteractiveLineChart data={data} config={config} />;
    case "pie":
      return <InteractivePieChart data={data} config={config} />;
    case "scatter":
      return <InteractiveScatterChart data={data} config={config} />;
    case "area":
      return <InteractiveAreaChart data={data} config={config} />;
    case "composed":
      // For composed charts, default to bar chart
      return <InteractiveBarChart data={data} config={config} />;
    default:
      return (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Unsupported chart type: {type}
        </div>
      );
  }
};

export const ChartNode = memo(({ data }: ChartNodeProps) => {
  const { visualization, onDelete, onConfigure } = data;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Card className="min-w-[360px] max-w-[560px]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg">
                {visualization.title}
              </CardTitle>
              {visualization.description ? (
                <CardDescription className="mt-1 text-xs">
                  {visualization.description}
                </CardDescription>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {onConfigure ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onConfigure(visualization.id)}
                >
                  <SettingsIcon className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onDelete(visualization.id)}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full rounded bg-background">
            {renderChart(visualization)}
          </div>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Right} />
    </>
  );
});

ChartNode.displayName = "ChartNode";
