import React, { useEffect } from "react";
import BarChart from "../bar_chart";
import { IoIosMan } from "react-icons/io";
import { programs_list } from "../../../../../utils/program/index";
import axiosInstance from "../../../../../utils/axios";
console.log(programs_list);
const data = [
  { label: "Food Security", targeted: 11700000, reached: 12700000, percent: "108%", icon: <IoIosMan size={20}/> },
  { label: "Community Services", targeted: 9770000, reached: 8390000, percent: "85%", icon: <IoIosMan size={20} /> },
  { label: "Food Security", targeted: 3140000, reached: 4280000, percent: "136%", icon: <IoIosMan size={20} /> },
  { label: "Nutrition", targeted: 3600000, reached: 4150000, percent: "115%", icon: <IoIosMan size={20} /> },
  { label: "Common and Support Services", targeted: 2280000, reached: 2340000, percent: "102%", icon: <IoIosMan size={20} /> },
  { label: "Emergency Shelter and NFI", targeted: 1010000, reached: 1270000, percent: "125%", icon: <IoIosMan size={20} /> },
  { label: "Early Recovery", targeted: 1010000, reached: 1010000, percent: "99%", icon: <IoIosMan size={20} /> },
  { label: "Education", targeted: 688000, reached: 833000, percent: "120%", icon: <IoIosMan size={20} /> },
  { label: "Logistics", targeted: 673000, reached: 673000, percent: "100%", icon: <IoIosMan size={20} /> },
  { label: "Multi-Purpose cash", targeted: 341000, reached: 407000, percent: "119%", icon: <IoIosMan size={20} /> },
  { label: "Camp Coordination / Management", targeted: 257000, reached: 319000, percent: "124%", icon: <IoIosMan size={20} /> },
  { label: "Multi-Sector", targeted: 20700, reached: 26200, percent: "126%", icon: <IoIosMan size={20} /> },
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
