import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './ParkingLotStats.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const ParkingLotStats = () => {
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await parkingLotService.getParkingLotStatistics();
        setStats(statsData);
        console.log('Fetched stats:', statsData); // Debug log
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch parking lot data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  const createChartData = (breakdown) => {
    // Only create chart data if there are subscriptions
    if (breakdown.some(item => item.count > 0)) {
      return {
        labels: breakdown.map(item => item.name),
        datasets: [{
          data: breakdown.map(item => item.percentage),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#BCDEFA'
          ],
        }]
      };
    }
    return null;
  };

  const renderPieChart = (breakdown) => {
    const chartData = createChartData(breakdown);
    if (!chartData) {
      return <div className="no-data">No active subscriptions</div>;
    }
    return (
      <div className="chart-container">
        <Pie
          data={chartData}
          options={{
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  padding: 15
                }
              }
            }
          }}
        />
      </div>
    );
  };

  if (error) return <div className="error">{error}</div>;
  if (Object.keys(stats).length === 0) return <div className="loading">Loading...</div>;

  return (
    <div className="parking-lot-stats">
      <h2 className="title">Subscription Statistics</h2>
      <div className="stats-grid">
        {Object.entries(stats).map(([parkingLotName, data]) => (
          <div key={parkingLotName} className="stats-card">
            <h3>{parkingLotName}</h3>
            <p className="total">Total: {data.total_subscriptions}</p>
            {renderPieChart(data.subscription_breakdown)}
            <div className="breakdown">
              {data.subscription_breakdown.map(item => (
                <div key={item.name} className="breakdown-row">
                  <span className="name">{item.name}</span>
                  <span className="stats">
                    {item.percentage}% ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParkingLotStats;