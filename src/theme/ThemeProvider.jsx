// src/theme/ThemeProvider.jsx
import React, { createContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { lightTheme, darkTheme } from './constants';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('courseme-theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [mode, setMode] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem('courseme-theme', mode);
    document.body.classList.toggle('dark-mode', mode === 'dark');
  }, [mode]);

  const colorTheme = mode === 'dark' ? darkTheme : lightTheme;

  const theme = createTheme({
    palette: {
      mode,
      primary: colorTheme.primary,
      background: colorTheme.background,
      text: colorTheme.text,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: colorTheme.background.paper,
            color: colorTheme.text.primary,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: colorTheme.border.light,
            color: colorTheme.text.secondary,
          },
          head: {
            backgroundColor: colorTheme.background.secondary,
            color: colorTheme.text.primary,
            fontWeight: 700,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(even)': {
              backgroundColor: colorTheme.background.secondary,
            },
            '&:hover': {
              backgroundColor: colorTheme.action.hover,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? colorTheme.text.primary : 'inherit',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: colorTheme.background.paper,
              '& fieldset': {
                borderColor: colorTheme.border.main,
              },
            },
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};