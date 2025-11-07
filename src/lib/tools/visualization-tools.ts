import { tool } from "ai";
import { z } from "zod";
import type { ChartType, VisualizationConfig } from "@/types/visualization";

const chartDataPointSchema = z
  .object({})
  .catchall(z.union([z.string(), z.number(), z.null()]));

const chartDataSchema = z.array(chartDataPointSchema);

const chartConfigSchema = z.object({
  xAxis: z.string().optional(),
  yAxis: z.union([z.string(), z.array(z.string())]).optional(),
  colors: z.array(z.string()).optional(),
  legend: z.boolean().optional(),
  grid: z.boolean().optional(),
  tooltip: z.boolean().optional(),
});

const baseVisualizationSchema = z.object({
  type: z.enum(["bar", "line", "pie", "scatter", "area", "composed"]),
  title: z.string().min(1),
  description: z.string().optional(),
  data: chartDataSchema,
  config: chartConfigSchema.optional(),
});

const createVisualizationResult = (
  type: ChartType,
  input: z.infer<typeof baseVisualizationSchema>
) => ({
  visualization: {
    id: "",
    type,
    title: input.title,
    description: input.description,
    data: input.data,
    config: input.config ?? {},
  } satisfies VisualizationConfig,
});

export const generateBarChartTool = tool({
  description:
    "Generate a bar chart to compare values across discrete categories. Use this tool when the user explicitly requests a bar chart, barchart, or wants to compare categories. Pass the data array from FormatResults preview. The chart will be automatically displayed in the canvas.",
  inputSchema: baseVisualizationSchema.extend({
    type: z.literal("bar"),
  }),
  execute: async (input) => ({
    ...createVisualizationResult("bar", input),
    message: `Created bar chart: ${input.title}`,
  }),
});

export const generateLineChartTool = tool({
  description:
    "Generate a line chart to highlight trends over continuous dimensions such as time.",
  inputSchema: baseVisualizationSchema.extend({
    type: z.literal("line"),
  }),
  execute: async (input) => ({
    ...createVisualizationResult("line", input),
    message: `Created line chart: ${input.title}`,
  }),
});

export const generatePieChartTool = tool({
  description:
    "Generate a pie chart to show the proportional contribution of categories to a whole. Use this tool when the user explicitly requests a pie chart, pie, or wants to show proportions/percentages. Pass the data array from FormatResults preview. The chart will be automatically displayed in the canvas.",
  inputSchema: baseVisualizationSchema.extend({
    type: z.literal("pie"),
  }),
  execute: async (input) => ({
    ...createVisualizationResult("pie", input),
    message: `Created pie chart: ${input.title}`,
  }),
});

export const generateScatterPlotTool = tool({
  description:
    "Generate a scatter plot to inspect correlation or distribution across two variables.",
  inputSchema: baseVisualizationSchema.extend({
    type: z.literal("scatter"),
  }),
  execute: async (input) => ({
    ...createVisualizationResult("scatter", input),
    message: `Created scatter plot: ${input.title}`,
  }),
});

export const autoSelectVisualizationTool = tool({
  description:
    "Automatically select and configure a chart based on the provided data and analysis goal.",
  inputSchema: z.object({
    data: chartDataSchema,
    goal: z
      .string()
      .describe("Explain the insight or question this visualization must show."),
    title: z.string().min(1),
    description: z.string().optional(),
    config: chartConfigSchema.optional(),
  }),
  execute: async (input) => {
    const { data, goal } = input;
    let selectedType: ChartType = "bar";

    const hasTimeLikeField = data.some((row) =>
      Object.keys(row).some((key) => /date|time|month|year|day/i.test(key))
    );
    const columnCount = Object.keys(data[0] ?? {}).length;
    const goalLower = goal.toLowerCase();

    if (goalLower.includes("trend") || hasTimeLikeField) {
      selectedType = "line";
    } else if (
      goalLower.includes("proportion") ||
      goalLower.includes("percentage") ||
      goalLower.includes("share")
    ) {
      selectedType = "pie";
    } else if (
      goalLower.includes("relationship") ||
      goalLower.includes("correlation") ||
      goalLower.includes("distribution") ||
      columnCount === 2
    ) {
      selectedType = "scatter";
    }

    return {
      ...createVisualizationResult(selectedType, {
        type: selectedType,
        title: input.title,
        description: input.description,
        data: input.data,
        config: input.config ?? {},
      }),
      message: `Auto-selected ${selectedType} chart: ${input.title}`,
      reasoning:
        selectedType === "line"
          ? "Detected time-like data or trend-focused goal."
          : selectedType === "pie"
            ? "Goal highlights proportions or percentage breakdowns."
            : selectedType === "scatter"
              ? "Goal or structure indicates analysing relationships between variables."
              : "Defaulted to bar chart for categorical comparison.",
    };
  },
});

export const visualizationTools = {
  generateBarChart: generateBarChartTool,
  generateLineChart: generateLineChartTool,
  generatePieChart: generatePieChartTool,
  generateScatterPlot: generateScatterPlotTool,
  autoSelectVisualization: autoSelectVisualizationTool,
};
