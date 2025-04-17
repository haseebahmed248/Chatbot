import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define theme mode constants
export enum THEME_MODE {
    LIGHT = "light",
    DARK = "dark"
};

export enum THEME_SIDEBAR_TOGGLE {
    TRUE = 1,
    FALSE = 0
};

// Define state interface
export interface ThemeState {
    themeType: THEME_MODE;
    themeSidebarToggle: THEME_SIDEBAR_TOGGLE
}

// Get saved theme from localStorage if available
const getSavedTheme = (): THEME_MODE => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === THEME_MODE.LIGHT || savedTheme === THEME_MODE.DARK) {
            return savedTheme as THEME_MODE;
        }
    }
    return THEME_MODE.DARK; // Default to dark theme
};

// Initial state with saved or default theme
const initialState: ThemeState = {
    themeType: getSavedTheme(),
    themeSidebarToggle: THEME_SIDEBAR_TOGGLE.FALSE
};

// Create slice using createSlice from Redux Toolkit
const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        // Change theme action
        changeTheme(state: ThemeState, action: PayloadAction<THEME_MODE>) {
            state.themeType = action.payload;
            
            // Save to localStorage whenever theme changes
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('theme', action.payload);
            }
        },
        changeSidebarThemeToggle(state: ThemeState, action: PayloadAction<THEME_SIDEBAR_TOGGLE>) {
            state.themeSidebarToggle = action.payload;
        },
    }
});

// Export actions and reducer
export const { changeTheme, changeSidebarThemeToggle } = themeSlice.actions;
export default themeSlice.reducer;