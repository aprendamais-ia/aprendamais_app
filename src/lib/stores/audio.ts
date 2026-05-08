import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type AudioState = {
  muted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
};

// Persiste em localStorage. Hydra de forma assíncrona — antes de hidratar,
// muted=false (default). Aceitável: usuário pode ouvir 1 som antes do
// localStorage carregar, mas é raro o suficiente pra não justificar gating.
export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      muted: false,
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setMuted: (muted) => set({ muted }),
    }),
    {
      name: "audio-prefs",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
