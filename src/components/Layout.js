// src/components/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="layout">
      {/* The Navbar and Footer are now handled in individual components */}
      <Outlet /> {/* This renders the nested routes */}
    </div>
  );
};

export default Layout;