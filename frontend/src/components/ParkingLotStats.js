import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import './ParkingLotStats.css';
import CustomLegend from './CustomLegend';

ChartJS.register(ArcElement, Tooltip);

const ParkingLotStats = () => {
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);
  const [visibleIndexes, setVisibleIndexes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await parkingLotService.getParkingLotStatistics();
        setStats(statsData);

        // Initialize visibility state for each parking lot
        const initialVisibility = {};
        Object.keys(statsData).forEach(parkingLotName => {
          initialVisibility[parkingLotName] = statsData[parkingLotName].subscription_breakdown.map((_, index) => index);
        });
        setVisibleIndexes(initialVisibility);
      } catch (error) {
        console.error('Error buscando los datos:', error);
        setError('Fallo al recopilar datos de los aparcamientos. Por favor intentelo mas  tarde.');
      }
    };

    fetchData();
  }, []);

  const generateColor = (index) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#BCDEFA', '#FFA07A',
      '#20B2AA', '#9370DB', '#FF4500', '#FFD700',
      '#ADFF2F', '#00FA9A', '#8A2BE2', '#FF1493',
      '#7FFF00',
    ];
    return colors[index % colors.length];
  };

  const createChartData = (breakdown, parkingLotName) => {
    const data = breakdown.map((item, index) =>
      (visibleIndexes[parkingLotName] && visibleIndexes[parkingLotName].includes(index)) ? item.count : 0
    );
    return {
      labels: breakdown.map(item => item.name),
      datasets: [{
        data: data,
        backgroundColor: breakdown.map((_, index) => generateColor(index)),
      }]
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleToggleVisibility = (index, parkingLotName) => {
    setVisibleIndexes((prev) => {
      const currentLotIndexes = prev[parkingLotName] || [];
      return {
        ...prev,
        [parkingLotName]: currentLotIndexes.includes(index)
          ? currentLotIndexes.filter(i => i !== index)
          : [...currentLotIndexes, index]
      };
    });
  };

  const renderPieChart = (breakdown, parkingLotName) => {
    const chartData = createChartData(breakdown, parkingLotName);
    if (breakdown.every(item => item.count === 0)) {
      return <div className="no-data">No Hay Abonos Activos</div>;
    }

    return (
      <div className="chart-container">
        <Pie
          data={chartData}
          options={{
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (tooltipItem) => {
                    const label = tooltipItem.label || '';
                    const count = breakdown[tooltipItem.dataIndex].count;
                    const percentage = breakdown[tooltipItem.dataIndex].percentage;
                    return `${label}: ${percentage}% (${count})`;
                  },
                },
              },
            },
            layout: {
              padding: {
                bottom: 40,
              },
            },
          }}
        />
      </div>
    );
  };

  if (error) return <div className="error">{error}</div>;
  if (Object.keys(stats).length === 0) return <div className="loading">Loading...</div>;

  return (
    <div className="parking-lot-stats">
      <h2 className="title">Estadísticas</h2>
      <div className="stats-grid">
        {Object.entries(stats).map(([parkingLotName, data]) => (
          <div key={parkingLotName} className="stats-card">
            <h3>{parkingLotName}</h3>
            <div className="summary">
              <p className="total">Abonos totales: {data.total_subscriptions}</p>
              <p className="total-billing">
                Facturación Mensual Esperada: {formatCurrency(data.total_expected_billing)}
              </p>
            </div>
            {renderPieChart(data.subscription_breakdown, parkingLotName)}
            <CustomLegend
              parkingLotName={parkingLotName}
              labels={data.subscription_breakdown.map((item, index) => ({
                text: item.name,
                color: generateColor(index),
              }))}
              onToggleVisibility={handleToggleVisibility}
              visibleIndexes={visibleIndexes[parkingLotName] || []}
            />
            <div className="breakdown">
              {data.subscription_breakdown.map((item, index) => (
                <div key={item.name} className="breakdown-row">
                  <div className="breakdown-info">
                    <span className="name">{item.name}</span>
                    <span className="stats">
                      {item.percentage}% ({item.count})
                    </span>
                  </div>
                  <div className="billing">
                    {formatCurrency(item.total_billing)}
                  </div>
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