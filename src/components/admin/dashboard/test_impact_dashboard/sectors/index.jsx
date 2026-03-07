import React, { useEffect } from "react";
import BarChart from "../bar_chart";
import { IoIosMan } from "react-icons/io";
import { programs_list } from "../../../../../utils/program/index";
import axiosInstance from "../../../../../utils/axios";
const data = [
  { label: "Food Security", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20}/> },
  { label: "Community Services", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Food Security", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Nutrition", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Common and Support Services", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Emergency Shelter and NFI", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Early Recovery", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Education", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Logistics", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Multi-Purpose cash", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Camp Coordination / Management", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
  { label: "Multi-Sector", targeted: "", reached: "", percent: "", icon: <IoIosMan size={20} /> },
]; 

// Fontend will only have label and logo and key 
// Data will be formatted from backend mostly and pass the same format to BarChart component below is the format 
// [  { label: "Food Security", targeted: 11700000, reached: 12700000, percent: "108%", icon: <IoIosMan size={20}/> }]
const Sectors = () => {

  const getResult = async () => {
    const year = new Date().getFullYear();
    const result = await axiosInstance.get('/summary', {params: {year: year}});
    return result;
  };

  useEffect(() => {
    getResult();
  }, []);

  return (
    <BarChart title="PEOPLE TARGETED AND REACHED BY PROGRAM" data={data} />
  );
};

export default Sectors;
