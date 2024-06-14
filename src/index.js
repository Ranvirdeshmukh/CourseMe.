// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';
import './styles/global.css'; // Import the global CSS

const theme = createTheme({
  palette: {
    primary: {
      main: '#571CE0',
    },
    secondary: {
      main: '#000000',
    },
  },
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>,
  document.getElementById('root')
);
