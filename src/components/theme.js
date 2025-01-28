// theme.js

import { createTheme } from '@mui/material/styles';

// A single dark theme, which you can toggle on/off in your application.
const darkTheme = createTheme({
  palette: {
    // Enabling "dark" mode for built-in MUI theming behavior
    mode: 'dark',
    background: {
      default: 'transparent', // So our CSSBaseline override takes effect
      paper: '#222',        // Changed from '#222' to navy royal blue
    },
    text: {
      primary: '#FFFFFF',     // Set primary text to white
      secondary: '#CCCCCC',   // Changed from '#CCCCCC' (grey) to navy royal blue
    },
    primary: {
      main: '#571ce0',        // Navy Royal Blue instead of Purple
    },
    secondary: {
      main: '#F26655',        // Orange remains the same
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
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#000080', // Navy Royal Blue
          color: '#FFFFFF',            // White text
          '&:hover': {
            backgroundColor: '#0000CD', // Medium Blue on hover
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#000080', // Navy Royal Blue
          '&:hover': {
            color: '#0000CD', // Medium Blue on hover
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': {
            borderColor: '#000080', // Navy Royal Blue border
          },
          '&:hover fieldset': {
            borderColor: '#0000CD', // Medium Blue border on hover
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0000CD', // Medium Blue border on focus
          },
        },
      },
    },
  },
});

export default darkTheme;
