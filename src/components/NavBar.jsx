// src/components/NavBar.js
import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const NavBar = () => (
  <AppBar position="static" color="primary">
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        College Course Review
      </Typography>
      <Box>
        <Button color="inherit" component={Link} to="/profile">Profile</Button>
        <Button color="inherit" component={Link} to="/classes">All Classes</Button>
        <Button color="inherit" component={Link} to="/easy-classes">Easy Classes</Button>
      </Box>
    </Toolbar>
  </AppBar>
);

export default NavBar;
