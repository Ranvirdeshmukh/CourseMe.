// src/components/Footer.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { styled } from '@mui/system';

const FooterContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: '10px 20px',
  backgroundColor: '#571CE0',
  color: '#fff',
  textAlign: 'center',
  position: 'fixed',
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'row',
  boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.3)',
}));

const Footer = () => {
  return (
    <FooterContainer>
      <SecurityIcon sx={{ fontSize: 30, marginRight: '10px' }} />
      <Typography variant="body2">
        <strong>Your Data Security is Our Priority.</strong> We take your privacy seriously. All your data is securely stored and handled with the utmost care. Rest assured, we never access or misuse your personal information.
      </Typography>
    </FooterContainer>
  );
};

export default Footer;
