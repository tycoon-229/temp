import { create } from 'zustand';

const usePlayer = create((set) => ({
  ids: [],
  activeId: undefined,
  setId: (id, fromHistory = false) => set((state) => {
    const newState = { activeId: id };
    if (!fromHistory && state.activeId && state.activeId !== id) {
      newState.history = [...state.history, state.activeId];
    }
    return newState;
  }),
  setIds: (ids) => set({ ids: ids }),
  reset: () => set({ ids: [], activeId: undefined, history: [] }),

  history: [],
  pushHistory: (id) => set((state) => ({
    history: [...state.history, id]
  })),
  popHistory: () => {
    let previousId;
    set((state) => {
      const newHistory = [...state.history];
      previousId = newHistory.pop();
      return { history: newHistory };
    });
    return previousId;
  },

  seekHistory: {},
  setSeekForId: (id, seek) => set((state) => ({
    seekHistory: { ...state.seekHistory, [id]: seek }
  })),

  isShuffle: false,
  setIsShuffle: (val) => set({ isShuffle: val }),
  repeatMode: 1, // 0 = no repeat, 1 = repeat all, 2 = repeat one
  setRepeatMode: (val) => set({ repeatMode: val }),
}));

export default usePlayer;
