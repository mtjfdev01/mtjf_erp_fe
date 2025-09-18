import React from "react";
import BarChart from "../bar_chart";

// update this with vulnerability type

const data = [
  { label: "Internally Displaced People", targeted: 19500000, reached: 20900000, percent: "106%" },
  { label: "Host Communities", targeted: 18600000, reached: 17500000, percent: "94%" },
  { label: "Other", targeted: 3840000, reached: 4010000, percent: "104%" },
  { label: "Returnees", targeted: 2250000, reached: 2330000, percent: "103%" },
  { label: "Refugees", targeted: 426000, reached: 543000, percent: "127%" },
];

const BeneficiaryTypes = () => (
  <BarChart title="PEOPLE TARGETED AND REACHED BY TYPE" data={data} />
);

export default BeneficiaryTypes;
