import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "./ProgressTracker.css";

const ContributionChart = ({ aiContribution }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartData, setChartData] = useState({
    humanPercentage: 0,
    aiPercentage: 0,
  });

  // Update chart data when props change
  useEffect(() => {
    setChartData({
      humanPercentage: aiContribution.human || 0,
      aiPercentage: aiContribution.ai || 0,
    });
  }, [aiContribution]);

  // Initialize and update chart
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Human", "AI"],
        datasets: [
          {
            data: [chartData.humanPercentage, chartData.aiPercentage],
            backgroundColor: [
              "#51c5b0", // Human - teal
              "#5762db", // AI - purple
            ],
            borderColor: ["#51c5b0", "#5762db"],
            borderWidth: 1,
            cutout: "75%",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.raw}%`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <div className="contribution-chart">
      <h4>Contribution Balance</h4>
      <div className="chart-container">
        <canvas ref={chartRef}></canvas>
        <div className="chart-center-text">
          <div className="center-percentage">{chartData.humanPercentage}%</div>
          <div className="center-label">Human</div>
        </div>
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color human-color"></div>
          <div className="legend-label">Human</div>
          <div className="legend-value">{chartData.humanPercentage}%</div>
        </div>
        <div className="legend-item">
          <div className="legend-color ai-color"></div>
          <div className="legend-label">AI</div>
          <div className="legend-value">{chartData.aiPercentage}%</div>
        </div>
      </div>
    </div>
  );
};

export default ContributionChart;
