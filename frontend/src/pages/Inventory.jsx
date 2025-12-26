import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { inventoryService, roomService } from '../services/api';

function Inventory() {
  const { locationId, userId } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [operationType, setOperationType] = useState(null);
  const [operationData, setOperationData] = useState({});

  useEffect(() => {
    loadData();
  }, [locationId]);

  const loadData = async () => {
    if (!locationId) {
      setLoading(false);
      return;
    }
    
    try {
      const [inventoryRes, roomsRes] = await Promise.all([
        inventoryService.getInventoryItems(locationId),
        roomService.getRooms(locationId),
      ]);
      
      setInventory(inventoryRes.data);
      setRooms(roomsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setLoading(false);
    }
  };

  const openOperation = (item, type) => {
    setSelectedItem(item);
    setOperationType(type);
    setOperationData({});
    setShowOperationModal(true);
  };

  const closeOperation = () => {
    setShowOperationModal(false);
    setSelectedItem(null);
    setOperationType(null);
    setOperationData({});
  };

  const handleMoveRoom = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.moveItemToRoom(locationId, selectedItem.id, {
        newRoomId: operationData.roomId,
        userId: userId,
      });
      closeOperation();
      loadData();
      alert('Item moved successfully');
    } catch (error) {
      alert('Error moving item: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      const adjustmentAmount = parseFloat(operationData.adjustmentAmount);
      await inventoryService.adjustInventory(locationId, selectedItem.id, {
        adjustmentAmount,
        reason: operationData.reason,
        userId: userId,
      });
      closeOperation();
      loadData();
      alert('Inventory adjusted successfully');
    } catch (error) {
      alert('Error adjusting inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSplit = async (e) => {
    e.preventDefault();
    try {
      const splits = operationData.splits.map(split => ({
        quantity: parseFloat(split.quantity),
        sublotIdentifier: split.sublotIdentifier,
      }));
      
      await inventoryService.splitInventory(locationId, selectedItem.id, {
        splits,
        userId: userId,
      });
      closeOperation();
      loadData();
      alert('Inventory split successfully');
    } catch (error) {
      alert('Error splitting inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDestroy = async (e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to destroy this inventory item?')) {
      return;
    }
    
    try {
      await inventoryService.destroyInventory(locationId, selectedItem.id, {
        reason: operationData.reason,
        userId: userId,
      });
      closeOperation();
      loadData();
      alert('Inventory destroyed successfully');
    } catch (error) {
      alert('Error destroying inventory: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
      </div>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Product Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Room</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  No inventory items found
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id}>
                  <td>{item.barcode}</td>
                  <td>{item.productName || 'N/A'}</td>
                  <td>{item.inventoryType?.name || 'N/A'}</td>
                  <td>
                    {item.quantity} {item.unit}
                  </td>
                  <td>{item.room?.name || 'N/A'}</td>
                  <td>
                    <span className={`badge badge-${item.isDestroyed ? 'danger' : 'success'}`}>
                      {item.isDestroyed ? 'Destroyed' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="button"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => openOperation(item, 'move')}
                        disabled={item.isDestroyed}
                      >
                        Move
                      </button>
                      <button
                        className="button"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => openOperation(item, 'adjust')}
                        disabled={item.isDestroyed}
                      >
                        Adjust
                      </button>
                      <button
                        className="button"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => openOperation(item, 'split')}
                        disabled={item.isDestroyed}
                      >
                        Split
                      </button>
                      <button
                        className="button button-danger"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => openOperation(item, 'destroy')}
                        disabled={item.isDestroyed}
                      >
                        Destroy
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Operation Modal */}
      {showOperationModal && (
        <div className="modal-overlay" onClick={closeOperation}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {operationType === 'move' && 'Move Item to Room'}
              {operationType === 'adjust' && 'Adjust Inventory Quantity'}
              {operationType === 'split' && 'Split Inventory Item'}
              {operationType === 'destroy' && 'Destroy Inventory Item'}
            </h3>

            {operationType === 'move' && (
              <form onSubmit={handleMoveRoom}>
                <div className="form-group">
                  <label>Current Item: {selectedItem?.barcode}</label>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Current Room: {selectedItem?.room?.name || 'N/A'}
                  </p>
                </div>
                <div className="form-group">
                  <label>New Room</label>
                  <select
                    value={operationData.roomId || ''}
                    onChange={(e) => setOperationData({ ...operationData, roomId: e.target.value })}
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="button button-success">
                    Move Item
                  </button>
                  <button type="button" className="button" onClick={closeOperation}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {operationType === 'adjust' && (
              <form onSubmit={handleAdjust}>
                <div className="form-group">
                  <label>Current Item: {selectedItem?.barcode}</label>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Current Quantity: {selectedItem?.quantity} {selectedItem?.unit}
                  </p>
                </div>
                <div className="form-group">
                  <label>Adjustment Amount (use negative for decrease)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={operationData.adjustmentAmount || ''}
                    onChange={(e) => setOperationData({ ...operationData, adjustmentAmount: e.target.value })}
                    required
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    New Quantity: {(parseFloat(selectedItem?.quantity || 0) + parseFloat(operationData.adjustmentAmount || 0)).toFixed(2)} {selectedItem?.unit}
                  </p>
                </div>
                <div className="form-group">
                  <label>Reason for Adjustment</label>
                  <textarea
                    value={operationData.reason || ''}
                    onChange={(e) => setOperationData({ ...operationData, reason: e.target.value })}
                    required
                    rows="3"
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="button button-success">
                    Adjust Inventory
                  </button>
                  <button type="button" className="button" onClick={closeOperation}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {operationType === 'split' && (
              <form onSubmit={handleSplit}>
                <div className="form-group">
                  <label>Current Item: {selectedItem?.barcode}</label>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Available Quantity: {selectedItem?.quantity} {selectedItem?.unit}
                  </p>
                </div>
                <div className="form-group">
                  <label>Number of Splits</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={operationData.splitCount || 2}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 2;
                      const splits = Array(count).fill(null).map((_, i) => ({
                        quantity: '',
                        sublotIdentifier: `${selectedItem?.barcode}-${i + 1}`,
                      }));
                      setOperationData({ ...operationData, splitCount: count, splits });
                    }}
                  />
                </div>
                {operationData.splits && operationData.splits.map((split, index) => (
                  <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Split {index + 1}</h4>
                    <div className="form-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        step="0.01"
                        value={split.quantity}
                        onChange={(e) => {
                          const newSplits = [...operationData.splits];
                          newSplits[index].quantity = e.target.value;
                          setOperationData({ ...operationData, splits: newSplits });
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Sublot Identifier</label>
                      <input
                        type="text"
                        value={split.sublotIdentifier}
                        onChange={(e) => {
                          const newSplits = [...operationData.splits];
                          newSplits[index].sublotIdentifier = e.target.value;
                          setOperationData({ ...operationData, splits: newSplits });
                        }}
                        required
                      />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="button button-success">
                    Split Inventory
                  </button>
                  <button type="button" className="button" onClick={closeOperation}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {operationType === 'destroy' && (
              <form onSubmit={handleDestroy}>
                <div className="form-group">
                  <label>Item to Destroy: {selectedItem?.barcode}</label>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Quantity: {selectedItem?.quantity} {selectedItem?.unit}
                  </p>
                </div>
                <div className="form-group">
                  <label>Reason for Destruction</label>
                  <textarea
                    value={operationData.reason || ''}
                    onChange={(e) => setOperationData({ ...operationData, reason: e.target.value })}
                    required
                    rows="3"
                  />
                </div>
                <div className="error-message" style={{ marginTop: '10px' }}>
                  Warning: This action will permanently destroy this inventory item and cannot be undone.
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" className="button button-danger">
                    Destroy Item
                  </button>
                  <button type="button" className="button" onClick={closeOperation}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
