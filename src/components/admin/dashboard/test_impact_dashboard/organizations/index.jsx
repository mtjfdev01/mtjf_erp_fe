import React from "react";
import BarChart from "../bar_chart";

const data = [
  { label: "International NGO", targeted: 23400000, reached: 22100000, percent: "94%" },
  { label: "National NGO", targeted: 15600000, reached: 15400000, percent: "98%" },
  { label: "UN Agency", targeted: 5710000, reached: 7760000, percent: "135%" },
  { label: "Others", targeted: 33500, reached: 56000, percent: "167%" },
];

const Organizations = () => (
  <BarChart title="PEOPLE TARGETED AND REACHED BY ORGANIZATION" data={data} />
);

export default Organizations;
