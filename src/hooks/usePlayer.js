import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const usePlayer = create(
  persist(
    (set, get) => ({
      ids: [],
      activeId: undefined,
      
      // --- VOLUME STATE (Thêm vào đây) ---
      volume: 1, // Mặc định 100%
      setVolume: (val) => set({ volume: val }),
      
      // 1. Set ID & History Logic
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
      pushHistory: (id) => set((state) => ({ history: [...state.history, id] })),

      popHistory: () => {
        const history = get().history;
        if (history.length === 0) return undefined;
        const newHistory = [...history];
        const previousId = newHistory.pop();
        set({ history: newHistory });
        return previousId;
      },

      seekHistory: {},
      setSeekForId: (id, seek) => set((state) => ({
        seekHistory: { ...state.seekHistory, [id]: seek }
      })),

      isShuffle: false,
      setIsShuffle: (val) => set({ isShuffle: val }),
      
      repeatMode: 1, 
      setRepeatMode: (val) => set({ repeatMode: val }),
    }),
    {
      name: 'player-storage', 
      storage: createJSONStorage(() => localStorage), 
    }
  )
);

export default usePlayer;