import React, { useState, useEffect } from 'react';
import { cultivationService } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPlants: 0,
    activeRooms: 0,
    totalSales: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const locationId = 'demo-location-id'; // In production, get from context/user

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Mock data for demonstration
      setStats({
        totalPlants: 150,
        activeRooms: 8,
        totalSales: 245,
        revenue: 45230.50,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      
      <div className="grid">
        <div className="stat-card">
          <h3>Total Plants</h3>
          <div className="stat-value">{stats.totalPlants}</div>
        </div>
        
        <div className="stat-card">
          <h3>Active Rooms</h3>
          <div className="stat-value">{stats.activeRooms}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Sales</h3>
          <div className="stat-value">{stats.totalSales}</div>
        </div>
        
        <div className="stat-card">
          <h3>Revenue</h3>
          <div className="stat-value">${stats.revenue.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <h3>Recent Activity</h3>
        <p>No recent activity to display.</p>
      </div>
    </div>
  );
}

export default Dashboard;
