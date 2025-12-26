import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cultivationService, inventoryService, transferService, salesService, roomService } from '../services/api';

function Dashboard() {
  const { locationId } = useAuth();
  const [stats, setStats] = useState({
    totalPlants: 0,
    activeRooms: 0,
    totalInventoryItems: 0,
    pendingTransfers: 0,
    totalSales: 0,
    revenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (locationId) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [locationId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [plantsRes, roomsRes, inventoryRes, transfersRes, salesRes] = await Promise.all([
        cultivationService.getPlants(locationId).catch(() => ({ data: [] })),
        roomService.getRooms(locationId).catch(() => ({ data: [] })),
        inventoryService.getInventoryItems(locationId).catch(() => ({ data: [] })),
        transferService.getPendingTransfers(locationId).catch(() => ({ data: [] })),
        salesService.getSales(locationId).catch(() => ({ data: [] })),
      ]);
      
      // Calculate stats
      const plants = plantsRes.data || [];
      const rooms = roomsRes.data || [];
      const inventory = inventoryRes.data || [];
      const transfers = transfersRes.data || [];
      const sales = salesRes.data || [];
      
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      
      setStats({
        totalPlants: plants.length,
        activeRooms: rooms.filter(r => !r.isDeleted).length,
        totalInventoryItems: inventory.filter(i => !i.isDestroyed).length,
        pendingTransfers: transfers.length,
        totalSales: sales.length,
        revenue: totalRevenue,
      });
      
      // Build recent activity (last 10 items)
      const activity = [];
      
      // Add recent plants
      plants.slice(0, 3).forEach(plant => {
        activity.push({
          type: 'plant',
          message: `Plant ${plant.barcode} created`,
          timestamp: plant.createdAt,
        });
      });
      
      // Add recent sales
      sales.slice(0, 3).forEach(sale => {
        activity.push({
          type: 'sale',
          message: `Sale completed for $${sale.totalAmount?.toFixed(2) || '0.00'}`,
          timestamp: sale.createdAt,
        });
      });
      
      // Add pending transfers
      transfers.slice(0, 3).forEach(transfer => {
        activity.push({
          type: 'transfer',
          message: `Transfer ${transfer.transferNumber || transfer.id.substring(0, 8)} pending`,
          timestamp: transfer.createdAt,
        });
      });
      
      // Sort by timestamp and take top 10
      activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentActivity(activity.slice(0, 10));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}
      
      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
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
          <h3>Inventory Items</h3>
          <div className="stat-value">{stats.totalInventoryItems}</div>
        </div>
        
        <div className="stat-card" style={{ background: stats.pendingTransfers > 0 ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' : undefined }}>
          <h3>Pending Transfers</h3>
          <div className="stat-value">{stats.pendingTransfers}</div>
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
        {recentActivity.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No recent activity to display.
          </p>
        ) : (
          <div>
            {recentActivity.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  borderBottom: index < recentActivity.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className={`badge ${
                      item.type === 'sale' ? 'badge-success' :
                      item.type === 'transfer' ? 'badge-warning' :
                      'badge-success'
                    }`}
                  >
                    {item.type}
                  </span>
                  <span>{item.message}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
