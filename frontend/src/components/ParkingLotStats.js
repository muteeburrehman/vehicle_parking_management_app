import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './ParkingLotStats.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const ParkingLotStats = () => {
  const [stats, setStats] = useState({});
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await parkingLotService.getParkingLotStats();
        setStats(statsData);

        const typesData = await parkingLotService.getSubscriptionTypes();
        setSubscriptionTypes(typesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch parking lot data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (Object.keys(stats).length === 0 || !subscriptionTypes.length) return <div className="loading">Loading...</div>;

  const createChartData = (parkingLotName, vehicleType) => {
    const parkingLotStats = stats[parkingLotName];
    if (!parkingLotStats) return null;

    const relevantSubscriptions = subscriptionTypes.filter(type =>
      type.name.includes(parkingLotName) && type.name.includes(vehicleType)
    );

    const labels = [];
    const data = [];

    relevantSubscriptions.forEach(sub => {
      const count = parkingLotStats.subscription_counts?.[sub.name] || 0;
      if (count > 0) {
        labels.push(sub.name);
        data.push(count);
      }
    });

    const freeSpaces = vehicleType === 'CAR' ?
      parkingLotStats.free_car_spaces :
      parkingLotStats.free_motorcycle_spaces;

    labels.push('Free Spaces');
    data.push(freeSpaces);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#BCDEFA'
        ],
      }]
    };
  };

  const calculateTotalBilling = (parkingLotName, vehicleType) => {
    const parkingLotStats = stats[parkingLotName];
    if (!parkingLotStats) return 0;

    return subscriptionTypes
      .filter(type => type.name.includes(parkingLotName) && type.name.includes(vehicleType))
      .reduce((total, sub) => {
        const count = parkingLotStats.subscription_counts?.[sub.name] || 0;
        return total + (count * sub.price);
      }, 0);
  };

  return (
    <div className="parking-lot-stats">
      <h2 className="title">Parking Lot Statistics</h2>
      {Object.entries(stats).map(([parkingLotName, parkingLotStats]) => (
        <div key={parkingLotName} className="stats-container">
          <h3>{parkingLotName}</h3>
          <div className="stats-section">
            <h4>Space Utilization</h4>
            <p>Total Car Spaces: {parkingLotStats.total_car_spaces}</p>
            <p>Total Motorcycle Spaces: {parkingLotStats.total_motorcycle_spaces}</p>
            <p>Free Car Spaces: {parkingLotStats.free_car_spaces}</p>
            <p>Free Motorcycle Spaces: {parkingLotStats.free_motorcycle_spaces}</p>
            <p>Occupied Car Spaces: {parkingLotStats.total_car_spaces - parkingLotStats.free_car_spaces}</p>
            <p>Occupied Motorcycle Spaces: {parkingLotStats.total_motorcycle_spaces - parkingLotStats.free_motorcycle_spaces}</p>
          </div>

          <div className="chart-section">
            <h4>Car Subscriptions</h4>
            <div className="chart-wrapper">
              <Pie data={createChartData(parkingLotName, 'CAR')} />
            </div>
            <p>Total Expected Billing: ${calculateTotalBilling(parkingLotName, 'CAR').toFixed(2)}</p>
          </div>

          <div className="chart-section">
            <h4>Motorcycle Subscriptions</h4>
            <div className="chart-wrapper">
              <Pie data={createChartData(parkingLotName, 'Motorcycle')} />
            </div>
            <p>Total Expected Billing: ${calculateTotalBilling(parkingLotName, 'Motorcycle').toFixed(2)}</p>
          </div>

          <div className="stats-section">
            <h4>Subscription Counts</h4>
            {Object.entries(parkingLotStats.subscription_counts || {}).map(([type, count]) => (
              <p key={type}>
                {type}: {count} ({(parkingLotStats.percentages?.[type] || 0).toFixed(2)}%)
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParkingLotStats;