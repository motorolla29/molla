import { create } from 'zustand';

interface ViewedAdsState {
  viewedIds: Set<string>;
  markViewed: (id: string) => void;
}

export const useViewedAdsStore = create<ViewedAdsState>((set) => ({
  viewedIds: new Set(),
  markViewed: (id: string) =>
    set((state) => {
      if (state.viewedIds.has(id)) {
        return state;
      }
      const next = new Set(state.viewedIds);
      next.add(id);
      return { viewedIds: next };
    }),
}));

