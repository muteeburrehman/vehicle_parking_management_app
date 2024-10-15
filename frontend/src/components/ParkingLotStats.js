import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './ParkingLotStats.css'; // Import custom CSS

ChartJS.register(ArcElement, Tooltip, Legend);

const ParkingLotStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await parkingLotService.getParkingLotStats();
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching parking lot stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) return <div className="loading">Loading...</div>;

  const pieChartData = {
    labels: Object.keys(stats.subscription_counts),
    datasets: [
      {
        data: Object.values(stats.subscription_counts),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  return (
    <div className="parking-lot-stats">
      <h2 className="title">Parking Lot Statistics</h2>
      <div className="stats-container">
        <div className="stats-section">
          <h3>Space Utilization</h3>
          <p>Total Spaces: {stats.total_spaces}</p>
          <p>Occupied Car Spaces: {stats.occupied_car_spaces}</p>
          <p>Occupied Motorcycle Spaces: {stats.occupied_motorcycle_spaces}</p>
          <p>Free Car Spaces: {stats.free_car_spaces}</p>
          <p>Free Motorcycle Spaces: {stats.free_motorcycle_spaces}</p>
        </div>

        <div className="chart-section">
          <h3>Subscription Distribution</h3>
          <div className="chart-wrapper">
            <Pie data={pieChartData} />
          </div>
        </div>

        <div className="stats-section">
          <h3>Subscription Counts</h3>
          {Object.entries(stats.subscription_counts).map(([type, count]) => (
            <p key={type}>
              {type}: {count} ({stats.percentages[type].toFixed(2)}%)
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParkingLotStats;
