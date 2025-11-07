export type ChartType =
  | "bar"
  | "line"
  | "pie"
  | "scatter"
  | "area"
  | "composed";

export interface ChartDataPoint {
  [key: string]: string | number | null;
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string | string[];
  colors?: string[];
  legend?: boolean;
  grid?: boolean;
  tooltip?: boolean;
  // Extend with additional chart-level configuration as needed
}

export interface VisualizationConfig {
  id: string;
  type: ChartType;
  title: string;
  description?: string;
  data: ChartDataPoint[];
  config: ChartConfig;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface VisualizationToolInput {
  type: ChartType;
  data: ChartDataPoint[];
  title: string;
  description?: string;
  config?: Partial<ChartConfig>;
}

export interface CanvasState {
  visualizations: Map<string, VisualizationConfig>;
  selectedId: string | null;
  zoom: number;
}
