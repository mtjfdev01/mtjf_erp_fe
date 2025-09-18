import React from 'react';
import './Program.css';
import '../../styles/variables.css';
import '../../styles/components.css';
import Navbar from '../Navbar';
import Welcome from '../common/welcome/Welcome';

const Program = () => {
  return (
    <>
      <Navbar />
        <Welcome 
          title="Welcome to the Program Section"
          message="Here you can manage and view all program-related reports and activities."
        />
    </>
  );
};

export default Program; 