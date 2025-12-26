import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { conversionService, inventoryService, roomService } from '../services/api';

function Conversions() {
  const { locationId, userId } = useAuth();
  const [conversions, setConversions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [conversionType, setConversionType] = useState('wetToDry');
  const [formData, setFormData] = useState({
    sourceInventoryIds: [''],
    destinationRoomId: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [locationId]);

  const loadData = async () => {
    if (!locationId) {
      setLoading(false);
      return;
    }
    
    try {
      const [conversionsRes, inventoryRes, roomsRes] = await Promise.all([
        conversionService.getConversions(locationId, {}).catch(() => ({ data: [] })),
        inventoryService.getInventoryItems(locationId).catch(() => ({ data: [] })),
        roomService.getRooms(locationId).catch(() => ({ data: [] })),
      ]);
      
      setConversions(conversionsRes.data);
      setInventory(inventoryRes.data.filter(item => !item.isDestroyed));
      setRooms(roomsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversions:', error);
      setLoading(false);
    }
  };

  const handleCreateConversion = async (e) => {
    e.preventDefault();
    if (!locationId) {
      alert('Please select a location in your profile settings.');
      return;
    }
    
    try {
      const data = {
        sourceInventoryIds: formData.sourceInventoryIds.filter(id => id),
        destinationRoomId: formData.destinationRoomId,
        notes: formData.notes,
        userId: userId,
      };

      if (conversionType === 'wetToDry') {
        await conversionService.convertWetToDry(locationId, data);
      } else if (conversionType === 'dryToExtraction') {
        await conversionService.convertDryToExtraction(locationId, data);
      } else if (conversionType === 'extractionToFinished') {
        await conversionService.convertExtractionToFinished(locationId, data);
      }
      
      setShowCreateForm(false);
      setFormData({
        sourceInventoryIds: [''],
        destinationRoomId: '',
        notes: '',
      });
      loadData();
      alert('Conversion completed successfully');
    } catch (error) {
      alert('Error creating conversion: ' + (error.response?.data?.message || error.message));
    }
  };

  const addSourceInventory = () => {
    setFormData({
      ...formData,
      sourceInventoryIds: [...formData.sourceInventoryIds, ''],
    });
  };

  const removeSourceInventory = (index) => {
    const ids = [...formData.sourceInventoryIds];
    ids.splice(index, 1);
    setFormData({ ...formData, sourceInventoryIds: ids });
  };

  const updateSourceInventory = (index, value) => {
    const ids = [...formData.sourceInventoryIds];
    ids[index] = value;
    setFormData({ ...formData, sourceInventoryIds: ids });
  };

  const getConversionTypeLabel = (type) => {
    const labels = {
      wetToDry: 'Wet to Dry',
      dryToExtraction: 'Dry to Extraction',
      extractionToFinished: 'Extraction to Finished Goods',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="loading">Loading conversions...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Inventory Conversions</h2>
        <button
          className="button button-success"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'New Conversion'}
        </button>
      </div>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Conversion</h3>
          
          <div className="form-group">
            <label>Conversion Type</label>
            <select
              value={conversionType}
              onChange={(e) => setConversionType(e.target.value)}
            >
              <option value="wetToDry">Wet to Dry</option>
              <option value="dryToExtraction">Dry to Extraction</option>
              <option value="extractionToFinished">Extraction to Finished Goods</option>
            </select>
          </div>

          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e8f4f8', 
            borderRadius: '4px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Info:</strong> {getConversionTypeLabel(conversionType)} conversion will create new inventory items from the source materials.
          </div>

          <form onSubmit={handleCreateConversion}>
            <div className="form-group">
              <label>Source Inventory Items</label>
              {formData.sourceInventoryIds.map((id, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '10px' 
                }}>
                  <select
                    value={id}
                    onChange={(e) => updateSourceInventory(index, e.target.value)}
                    style={{ flex: 1 }}
                    required
                  >
                    <option value="">Select Inventory Item</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.barcode} - {item.productName || 'N/A'} ({item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                  {formData.sourceInventoryIds.length > 1 && (
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => removeSourceInventory(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="button"
                onClick={addSourceInventory}
              >
                Add Another Source
              </button>
            </div>
            
            <div className="form-group">
              <label>Destination Room</label>
              <select
                value={formData.destinationRoomId}
                onChange={(e) => setFormData({ ...formData, destinationRoomId: e.target.value })}
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.roomType})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder="Add any notes about this conversion..."
              />
            </div>
            
            <button type="submit" className="button button-success">
              Create Conversion
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Conversion History</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Source Items</th>
              <th>Output Items</th>
              <th>Room</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {conversions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No conversions found
                </td>
              </tr>
            ) : (
              conversions.map((conversion) => (
                <tr key={conversion.id}>
                  <td>{new Date(conversion.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className="badge">
                      {conversion.conversionType || 'N/A'}
                    </span>
                  </td>
                  <td>{conversion.inputs?.length || 0} items</td>
                  <td>{conversion.outputs?.length || 0} items</td>
                  <td>{conversion.room?.name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${
                      conversion.status === 'completed' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {conversion.status || 'completed'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Conversions;
