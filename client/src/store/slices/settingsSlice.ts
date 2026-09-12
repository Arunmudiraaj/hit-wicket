import { THEME } from '@/constants/constants';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: string;
  soundEnabled: boolean;
}

const getInitialSoundEnabled = () => {
  const saved = localStorage.getItem('soundEnabled');
  if (saved !== null) {
    return saved === 'true';
  }
  return true; // Default to true
};

const initialState: SettingsState = {
  theme: localStorage.getItem(THEME.STORAGE_KEY) || THEME.DARK,
  soundEnabled: getInitialSoundEnabled(),
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      const newTheme = state.theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
      state.theme = newTheme;
      localStorage.setItem(THEME.STORAGE_KEY, newTheme);
    },
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
      localStorage.setItem(THEME.STORAGE_KEY, action.payload);
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem('soundEnabled', state.soundEnabled.toString());
    },
    setSettings: (state, action: PayloadAction<SettingsState>) => {
      state.theme = action.payload.theme;
      state.soundEnabled = action.payload.soundEnabled;
      localStorage.setItem(THEME.STORAGE_KEY, action.payload.theme);
      localStorage.setItem('soundEnabled', action.payload.soundEnabled.toString());
    },
  },
});

export const { toggleTheme, setTheme, toggleSound, setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
