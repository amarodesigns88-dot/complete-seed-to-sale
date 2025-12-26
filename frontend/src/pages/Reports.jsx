import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  cultivationService, 
  inventoryService, 
  salesService, 
  transferService 
} from '../services/api';

function Reports() {
  const { locationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('inventory');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    if (!locationId) {
      alert('Please select a location in your profile settings.');
      return;
    }

    setLoading(true);
    try {
      let data = null;

      if (reportType === 'inventory') {
        const response = await inventoryService.getInventoryItems(locationId);
        const items = response.data;
        
        data = {
          title: 'Inventory Report',
          summary: [
            { label: 'Total Items', value: items.length },
            { label: 'Active Items', value: items.filter(i => !i.isDestroyed).length },
            { label: 'Destroyed Items', value: items.filter(i => i.isDestroyed).length },
            { 
              label: 'Total Quantity', 
              value: items.reduce((sum, i) => sum + (i.isDestroyed ? 0 : parseFloat(i.quantity || 0)), 0).toFixed(2) 
            },
          ],
          details: items.map(item => ({
            barcode: item.barcode,
            productName: item.productName || 'N/A',
            type: item.inventoryType?.name || 'N/A',
            quantity: `${item.quantity} ${item.unit}`,
            room: item.room?.name || 'N/A',
            status: item.isDestroyed ? 'Destroyed' : 'Active',
          })),
          columns: ['Barcode', 'Product Name', 'Type', 'Quantity', 'Room', 'Status'],
        };
      } else if (reportType === 'plants') {
        const response = await cultivationService.getPlants(locationId);
        const plants = response.data;
        
        data = {
          title: 'Plants Report',
          summary: [
            { label: 'Total Plants', value: plants.length },
            { label: 'Vegetative', value: plants.filter(p => p.phase === 'vegetative').length },
            { label: 'Flowering', value: plants.filter(p => p.phase === 'flowering').length },
            { label: 'Harvested', value: plants.filter(p => p.phase === 'harvested').length },
          ],
          details: plants.map(plant => ({
            barcode: plant.barcode,
            strain: plant.strain,
            phase: plant.phase,
            room: plant.room?.name || 'N/A',
            status: plant.status,
            created: new Date(plant.createdAt).toLocaleDateString(),
          })),
          columns: ['Barcode', 'Strain', 'Phase', 'Room', 'Status', 'Created'],
        };
      } else if (reportType === 'sales') {
        const response = await salesService.getSales(locationId);
        const sales = response.data;
        
        const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;
        
        data = {
          title: 'Sales Report',
          summary: [
            { label: 'Total Sales', value: sales.length },
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
            { label: 'Average Sale', value: `$${avgSale.toFixed(2)}` },
            { label: 'Completed', value: sales.filter(s => s.status === 'completed').length },
          ],
          details: sales.map(sale => ({
            date: new Date(sale.createdAt).toLocaleString(),
            customer: sale.customer?.name || 'Walk-in',
            items: sale.saleItems?.length || 0,
            total: `$${(sale.totalAmount || 0).toFixed(2)}`,
            status: sale.status,
          })),
          columns: ['Date', 'Customer', 'Items', 'Total', 'Status'],
        };
      } else if (reportType === 'transfers') {
        const response = await transferService.getTransfers(locationId, {});
        const transfers = response.data;
        
        data = {
          title: 'Transfers Report',
          summary: [
            { label: 'Total Transfers', value: transfers.length },
            { label: 'Pending', value: transfers.filter(t => t.status === 'pending').length },
            { label: 'Completed', value: transfers.filter(t => t.status === 'completed').length },
            { label: 'Voided', value: transfers.filter(t => t.status === 'voided').length },
          ],
          details: transfers.map(transfer => ({
            id: transfer.transferNumber || transfer.id.substring(0, 8),
            type: transfer.transferType,
            from: transfer.sourceLocation?.name || transfer.sourceLocationId,
            to: transfer.destinationLocation?.name || transfer.destinationLocationId,
            items: transfer.items?.length || 0,
            status: transfer.status,
            date: new Date(transfer.createdAt).toLocaleDateString(),
          })),
          columns: ['Transfer ID', 'Type', 'From', 'To', 'Items', 'Status', 'Date'],
        };
      }

      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.details) return;

    const headers = reportData.columns;
    const rows = reportData.details.map(item => 
      Object.values(item).map(val => `"${val}"`).join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>Reports & Analytics</h2>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Generate Report</h3>
        
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="inventory">Inventory Report</option>
              <option value="plants">Plants Report</option>
              <option value="sales">Sales Report</option>
              <option value="transfers">Transfers Report</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>

          <button
            className="button button-success"
            onClick={generateReport}
            disabled={loading || !locationId}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{reportData.title}</h3>
            <button
              className="button"
              onClick={exportToCSV}
            >
              📥 Export to CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid" style={{ marginBottom: '30px' }}>
            {reportData.summary.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  {reportData.columns.map((col, index) => (
                    <th key={index}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.details.length === 0 ? (
                  <tr>
                    <td colSpan={reportData.columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                      No data available for this report
                    </td>
                  </tr>
                ) : (
                  reportData.details.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex}>{value}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            backgroundColor: '#e8f4f8', 
            borderRadius: '4px',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>Report generated:</strong> {new Date().toLocaleString()} • 
            <strong> Total records:</strong> {reportData.details.length}
          </div>
        </div>
      )}

      {!reportData && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Select a report type and click "Generate Report" to view data.</p>
        </div>
      )}
    </div>
  );
}

export default Reports;
