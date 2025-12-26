import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/api';

function Rooms() {
  const { locationId, userId } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    roomType: 'vegetative',
    capacity: '',
    currentOccupancy: 0,
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
      const response = await roomService.getRooms(locationId);
      setRooms(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!locationId) {
      alert('Please select a location in your profile settings.');
      return;
    }
    
    try {
      await roomService.createRoom(locationId, {
        ...newRoom,
        capacity: parseInt(newRoom.capacity),
      });
      setShowCreateForm(false);
      setNewRoom({
        name: '',
        roomType: 'vegetative',
        capacity: '',
        currentOccupancy: 0,
      });
      loadData();
      alert('Room created successfully');
    } catch (error) {
      alert('Error creating room: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    
    try {
      await roomService.updateRoom(locationId, selectedRoom.id, {
        name: selectedRoom.name,
        roomType: selectedRoom.roomType,
        capacity: parseInt(selectedRoom.capacity),
      });
      setShowEditForm(false);
      setSelectedRoom(null);
      loadData();
      alert('Room updated successfully');
    } catch (error) {
      alert('Error updating room: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }
    
    try {
      await roomService.deleteRoom(locationId, roomId);
      loadData();
      alert('Room deleted successfully');
    } catch (error) {
      alert('Error deleting room: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditForm = (room) => {
    setSelectedRoom({ ...room });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setSelectedRoom(null);
  };

  const calculateOccupancyPercentage = (room) => {
    if (!room.capacity) return 0;
    return ((room.currentOccupancy / room.capacity) * 100).toFixed(0);
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return '#e74c3c';
    if (percentage >= 70) return '#f39c12';
    return '#27ae60';
  };

  if (loading) {
    return <div className="loading">Loading rooms...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Room Management</h2>
        <button
          className="button button-success"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Create Room'}
        </button>
      </div>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Room</h3>
          <form onSubmit={handleCreateRoom}>
            <div className="form-group">
              <label>Room Name</label>
              <input
                type="text"
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Room Type</label>
              <select
                value={newRoom.roomType}
                onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                required
              >
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="mother">Mother Room</option>
                <option value="clone">Clone Room</option>
                <option value="drying">Drying Room</option>
                <option value="storage">Storage</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Capacity (number of plants/items)</label>
              <input
                type="number"
                min="1"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="button button-success">
              Create Room
            </button>
          </form>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {rooms.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', padding: '20px' }}>No rooms found</p>
          </div>
        ) : (
          rooms.map((room) => {
            const occupancyPercentage = calculateOccupancyPercentage(room);
            return (
              <div key={room.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{room.name}</h3>
                    <span className="badge" style={{ fontSize: '12px' }}>
                      {room.roomType}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="button"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => openEditForm(room)}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-danger"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '14px' }}>Occupancy</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {room.currentOccupancy || 0} / {room.capacity}
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '20px', 
                    backgroundColor: '#ecf0f1', 
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${occupancyPercentage}%`, 
                      height: '100%', 
                      backgroundColor: getOccupancyColor(occupancyPercentage),
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    {occupancyPercentage}% Full
                  </div>
                </div>

                <div style={{ 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  fontSize: '13px'
                }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Available Space:</strong> {room.capacity - (room.currentOccupancy || 0)}
                  </div>
                  <div style={{ color: '#666' }}>
                    <strong>Created:</strong> {new Date(room.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Room Modal */}
      {showEditForm && selectedRoom && (
        <div className="modal-overlay" onClick={closeEditForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Room</h3>
            
            <form onSubmit={handleUpdateRoom}>
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={selectedRoom.name}
                  onChange={(e) => setSelectedRoom({ ...selectedRoom, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Room Type</label>
                <select
                  value={selectedRoom.roomType}
                  onChange={(e) => setSelectedRoom({ ...selectedRoom, roomType: e.target.value })}
                  required
                >
                  <option value="vegetative">Vegetative</option>
                  <option value="flowering">Flowering</option>
                  <option value="mother">Mother Room</option>
                  <option value="clone">Clone Room</option>
                  <option value="drying">Drying Room</option>
                  <option value="storage">Storage</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={selectedRoom.capacity}
                  onChange={(e) => setSelectedRoom({ ...selectedRoom, capacity: e.target.value })}
                  required
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Current Occupancy: {selectedRoom.currentOccupancy || 0}
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="button button-success">
                  Update Room
                </button>
                <button type="button" className="button" onClick={closeEditForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rooms;
