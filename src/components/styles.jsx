import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

// Define a custom styled button that accepts a `darkMode` prop.
const CustomButton = styled(ButtonBase)(({ darkMode }) => ({
  width: '200px',
  height: '180px',
  margin: '18px 0',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '12px',
  padding: '10px',
  transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
  backgroundColor: darkMode ? 'transparent' : '#f9f9f9',
  backgroundImage: darkMode
    ? 'linear-gradient(135deg, #1C093F 10%, #571CE0 50%, #0C0F33 100%)'
    : 'none',
  boxShadow: darkMode
    ? '0 8px 16px rgba(87, 28, 224, 0.2)'
    : '0 8px 16px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-5px)',
    backgroundColor: darkMode ? 'transparent' : '#ececec',
    backgroundImage: darkMode
      ? 'linear-gradient(135deg, #2C194F 0%, #571CE0 50%, #1C1F43 100%)'
      : 'none',
    boxShadow: darkMode
      ? '0 12px 24px rgba(87, 28, 224, 0.3)'
      : '0 12px 24px rgba(0, 0, 0, 0.2)',
  },
}));
