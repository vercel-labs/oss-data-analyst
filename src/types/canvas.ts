import type { Edge, Node } from "@xyflow/react";
import type { VisualizationConfig } from "./visualization";

export interface CanvasNode extends Node {
  data: {
    visualization: VisualizationConfig;
    onUpdate?: (config: VisualizationConfig) => void;
    onDelete?: (id: string) => void;
    onConfigure?: (id: string) => void;
  };
}

export interface CanvasEdge extends Edge {
  data?: {
    relationship?: "datasource" | "filter" | "calculation";
  };
}

export interface CanvasExportOptions {
  format: "png" | "svg" | "pdf";
  quality?: number;
  backgroundColor?: string;
}
