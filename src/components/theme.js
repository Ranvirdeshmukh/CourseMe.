// theme.js

import { createTheme } from '@mui/material/styles';

// A single dark theme, which you can toggle on/off in your application.
const darkTheme = createTheme({
  palette: {
    // Enabling "dark" mode for built-in MUI theming behavior
    mode: 'dark',
    background: {
      default: 'transparent', // So our CSSBaseline override takes effect
      paper: '#222',          // Cards, Paper, etc. get a dark background
    },
    text: {
      primary: '#FFFFFF',     // Set primary text to white
      secondary: '#CCCCCC',   // Secondary text remains light gray
    },
    primary: {
      main: '#571CE0',        // Purple
    },
    secondary: {
      main: '#F26655',        // Orange
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // The gradient you requested for dark mode:
          background: `
            linear-gradient(
              90deg,
              #1C093F 0%,
              #0C0F33 100%
            )
          `,
          color: '#FFFFFF', // Correct text color for dark mode
          margin: 0,
          padding: 0,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // Override the AppBar background with a dark gradient
          background: `
            linear-gradient(
              90deg,
              #1C093F 0%,
              #0C0F33 100%
            )
          `,
          boxShadow: 'none',
        },
      },
    },
    // Optionally override other components if you wish (e.g. MuiCard, MuiButton, etc.)
  },
});

export default darkTheme;
