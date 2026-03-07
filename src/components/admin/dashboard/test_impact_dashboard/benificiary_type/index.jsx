import React from "react";
import BarChart from "../bar_chart";

// update this with vulnerability type

const data = [
  { label: "Internally Displaced People", targeted: "", reached: "", percent: "" },
  { label: "Host Communities", targeted: "", reached: "", percent: "" },
  { label: "Other", targeted: "", reached: "", percent: "" },
  { label: "Returnees", targeted: "", reached: "", percent: "" },
  { label: "Refugees", targeted: "", reached: "", percent: "" },
];

const BeneficiaryTypes = () => (
  <BarChart title="PEOPLE TARGETED AND REACHED BY TYPE" data={data} />
);

export default BeneficiaryTypes;
