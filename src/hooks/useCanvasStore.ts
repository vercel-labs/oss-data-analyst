"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  CanvasState,
  VisualizationConfig,
} from "@/types/visualization";

interface CanvasStore extends CanvasState {
  addVisualization: (viz: Omit<VisualizationConfig, "id">) => string;
  updateVisualization: (
    id: string,
    updates: Partial<VisualizationConfig>
  ) => void;
  removeVisualization: (id: string) => void;
  selectVisualization: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  clearCanvas: () => void;
  exportCanvas: () => VisualizationConfig[];
  importCanvas: (visualizations: VisualizationConfig[]) => void;
}

export const useCanvasStore = create<CanvasStore>()((set, get) => ({
      visualizations: new Map(),
      selectedId: null,
      zoom: 1,

      addVisualization: (viz) => {
        const id = nanoid();
        const visualization: VisualizationConfig = {
          ...viz,
          id,
        };

        set((state) => ({
          visualizations: new Map(state.visualizations).set(id, visualization),
          selectedId: id,
        }));

        return id;
      },

      updateVisualization: (id, updates) => {
        set((state) => {
          const current = state.visualizations.get(id);
          if (!current) {
            return state;
          }

          const updated: VisualizationConfig = {
            ...current,
            ...updates,
          };

          return {
            visualizations: new Map(state.visualizations).set(id, updated),
          };
        });
      },

      removeVisualization: (id) => {
        set((state) => {
          const next = new Map(state.visualizations);
          next.delete(id);

          return {
            visualizations: next,
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
        });
      },

      selectVisualization: (id) => set({ selectedId: id }),
      setZoom: (zoom) => set({ zoom }),

      clearCanvas: () =>
        set({
          visualizations: new Map(),
          selectedId: null,
        }),

      exportCanvas: () => Array.from(get().visualizations.values()),

      importCanvas: (visualizations) => {
        const map = new Map(
          visualizations.map((visualization) => [visualization.id, visualization])
        );

        set({
          visualizations: map,
          selectedId: null,
        });
      },
    })
);
