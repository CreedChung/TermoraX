import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeId } from "../../../entities/domain";

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

/**
 * Theme store with localStorage persistence.
 * This ensures theme preference survives page reloads and is immediately available
 * before backend settings are loaded.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "midnight",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "termorax-theme",
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
