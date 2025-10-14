import React from 'react';
import Sidebar from '../common/Sidebar/Sidebar';
import Welcome from '../common/welcome/Welcome';
import '../store/Store.css';
import Navbar from '../Navbar';

const FundRaising = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <Welcome 
        title="Fund Raising Management" 
        message="Welcome to the Fund Raising Management module. Use the sidebar to access Fund Raising reports and manage daily activities."
      />
    </>
  );
};

export default FundRaising; 