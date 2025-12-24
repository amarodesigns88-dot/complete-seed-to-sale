import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { cultivationService } from '../services/api';

function Plants() {
  const { locationId } = useAuth();
  const [plants, setPlants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlant, setNewPlant] = useState({
    strain: '',
    roomId: '',
    phase: 'vegetative',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock data for demonstration
      // In production, use locationId from context: cultivationService.getPlants(locationId)
      setPlants([
        {
          id: '1',
          barcode: 'PLT-001',
          strain: 'Blue Dream',
          phase: 'vegetative',
          status: 'active',
          room: { name: 'Room A' },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          barcode: 'PLT-002',
          strain: 'OG Kush',
          phase: 'flowering',
          status: 'active',
          room: { name: 'Room B' },
          createdAt: new Date().toISOString(),
        },
      ]);
      setRooms([
        { id: '1', name: 'Room A' },
        { id: '2', name: 'Room B' },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading plants:', error);
      setLoading(false);
    }
  };

  const handleCreatePlant = async (e) => {
    e.preventDefault();
    if (!locationId) {
      alert('Please select a location in your profile settings.');
      return;
    }
    try {
      await cultivationService.createPlant(locationId, newPlant);
      setShowCreateForm(false);
      setNewPlant({ strain: '', roomId: '', phase: 'vegetative' });
      loadData();
    } catch (error) {
      alert('Error creating plant: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading plants...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Plants Management</h2>
        <button className="button button-success" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Plant'}
        </button>
      </div>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      {showCreateForm && (
        <div className="card">
          <h3>Create New Plant</h3>
          <form onSubmit={handleCreatePlant}>
            <div className="form-group">
              <label>Strain</label>
              <input
                type="text"
                value={newPlant.strain}
                onChange={(e) => setNewPlant({ ...newPlant, strain: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Room</label>
              <select
                value={newPlant.roomId}
                onChange={(e) => setNewPlant({ ...newPlant, roomId: e.target.value })}
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Phase</label>
              <select
                value={newPlant.phase}
                onChange={(e) => setNewPlant({ ...newPlant, phase: e.target.value })}
                required
              >
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="harvested">Harvested</option>
              </select>
            </div>
            
            <button type="submit" className="button button-success">
              Create Plant
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Strain</th>
              <th>Phase</th>
              <th>Room</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.id}>
                <td>{plant.barcode}</td>
                <td>{plant.strain}</td>
                <td>{plant.phase}</td>
                <td>{plant.room?.name || 'N/A'}</td>
                <td>
                  <span className={`badge badge-${plant.status === 'active' ? 'success' : 'warning'}`}>
                    {plant.status}
                  </span>
                </td>
                <td>{new Date(plant.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="button" style={{ fontSize: '12px', padding: '5px 10px' }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Plants;
