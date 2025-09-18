import React, { useRef } from "react";
import "./index.css";
import { RiDownload2Fill } from "react-icons/ri";
import { toPng } from "html-to-image";

const data = [
  {
    label: "International NGO",
    targeted: "23.4M",
    reached: "22.1M",
    percent: "94%",
  },
  {
    label: "National NGO",
    targeted: "15.6M",
    reached: "15.4M",
    percent: "98%",
  },
  {
    label: "UN Agency",
    targeted: "5.71M",
    reached: "7.76M",
    percent: "135%",
  },
  {
    label: "Others",
    targeted: "33.5k",
    reached: "56k",
    percent: "167%",
  },
];

const OrganizationChart = () => {
  const chartRef = useRef(null);

  const handleDownload = async () => {
    if (chartRef.current === null) return;

    try {
      const dataUrl = await toPng(chartRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff' // Add white background
      });
      const link = document.createElement("a");
      link.download = "people-targeted-and-reached-by-organization.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    }
  };

  return (
    <div className="org-chart" ref={chartRef}>
      <div style={{ position: "relative" }}>
        <h2 className="org-title">PEOPLE TARGETED AND REACHED BY ORGANIZATION</h2>
        <button
          onClick={handleDownload}
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "4px",
            color: "#666",
            fontSize: "20px",
            transition: "color 0.2s ease"
          }}
          onMouseEnter={(e) => e.target.style.color = "#333"}
          onMouseLeave={(e) => e.target.style.color = "#666"}
          title="Download as PNG"
        >
          <RiDownload2Fill />
        </button>
      </div>
      <div className="legend">
        (<span className="targeted">targeted</span>,{" "}
        <span className="reached">reached</span>)
      </div>

      <div className="chart-container">
        {data.map((item, idx) => (
          <div key={idx} className="chart-row">
            <div className="label">{item.label}</div>
            <div className="bars">
              <div className="bar targeted-bar">
                {item.targeted}
              </div>
              <div className="bar reached-bar">
                {item.reached}
              </div>
            </div>
            <div className="percent">{item.percent}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrganizationChart;
