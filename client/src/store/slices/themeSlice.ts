import { THEME } from '@/constants/constants';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: localStorage.getItem(THEME.STORAGE_KEY) || THEME.DARK,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
        const newTheme = state.mode === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
        state.mode = newTheme;
      localStorage.setItem(THEME.STORAGE_KEY, newTheme);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem(THEME.STORAGE_KEY, action.payload);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;