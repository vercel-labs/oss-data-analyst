"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { DownloadIcon, TrashIcon } from "lucide-react";
import { ChartNode } from "@/components/charts/ChartNode";
import { useCanvasStore } from "@/hooks/useCanvasStore";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

const nodeTypes = {
  chart: ChartNode,
};

export function VisualizationCanvas() {
  const visualizations = useCanvasStore((state) =>
    Array.from(state.visualizations.values())
  );
  const removeVisualization = useCanvasStore(
    (state) => state.removeVisualization
  );
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const updateVisualization = useCanvasStore(
    (state) => state.updateVisualization
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>([]);

  // Use a ref to track the previous serialized key to prevent infinite loops
  const prevKeyRef = useRef<string>("");

  useEffect(() => {
    // Create a stable key from visualization IDs and positions
    const currentKey = JSON.stringify(
      visualizations.map((viz) => ({
        id: viz.id,
        position: viz.position,
      }))
    );

    // Only update nodes if the visualization data actually changed
    if (prevKeyRef.current === currentKey) {
      return;
    }

    prevKeyRef.current = currentKey;

    const mappedNodes: CanvasNode[] = visualizations.map((viz, index) => ({
      id: viz.id,
      type: "chart",
      position:
        viz.position ?? {
          x: 80 + index * 40,
          y: 80 + index * 40,
        },
      data: {
        visualization: viz,
        onDelete: removeVisualization,
        onConfigure: (id: string) => {
          console.log("Configure visualization", id);
        },
      },
    }));

    setNodes(mappedNodes);
  }, [visualizations, setNodes, removeVisualization]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      onNodesChange(changes);

      changes.forEach((change) => {
        if (
          change.type === "position" &&
          change.position &&
          !change.dragging
        ) {
          updateVisualization(change.id, {
            position: change.position,
          });
        }
      });
    },
    [onNodesChange, updateVisualization]
  );

  const handleConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleExport = async () => {
    console.log("Export canvas not yet implemented");
  };

  if (visualizations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        <div className="space-y-2">
          <p>No visualizations yet</p>
          <p className="text-xs">
            Ask the AI to generate a chart and it will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm" variant="destructive" onClick={clearCanvas}>
          <TrashIcon className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
