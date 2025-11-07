"use client";

import { create } from "zustand";

interface CanvasVisibilityStore {
  isOpen: boolean;
  openCanvas: () => void;
  closeCanvas: () => void;
  toggleCanvas: () => void;
}

export const useCanvasVisibility = create<CanvasVisibilityStore>((set) => ({
  isOpen: false,
  openCanvas: () => set({ isOpen: true }),
  closeCanvas: () => set({ isOpen: false }),
  toggleCanvas: () => set((state) => ({ isOpen: !state.isOpen })),
}));
