import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transferService, inventoryService } from '../services/api';

function Transfers() {
  const { locationId, userId } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [view, setView] = useState('all'); // 'all', 'pending'
  const [newTransfer, setNewTransfer] = useState({
    destinationLocationId: '',
    transferType: 'sale',
    notes: '',
    items: [],
  });
  const [receiveData, setReceiveData] = useState({
    acceptanceOption: 'acceptAll',
    itemsReceived: [],
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
      const [transfersRes, pendingRes] = await Promise.all([
        transferService.getTransfers(locationId, {}),
        transferService.getPendingTransfers(locationId),
      ]);
      
      setTransfers(transfersRes.data);
      setPendingTransfers(pendingRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transfers:', error);
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!locationId) {
      alert('Please select a location in your profile settings.');
      return;
    }
    
    try {
      await transferService.createTransfer(locationId, {
        ...newTransfer,
        userId: userId,
      });
      setShowCreateForm(false);
      setNewTransfer({
        destinationLocationId: '',
        transferType: 'sale',
        notes: '',
        items: [],
      });
      loadData();
      alert('Transfer created successfully');
    } catch (error) {
      alert('Error creating transfer: ' + (error.response?.data?.message || error.message));
    }
  };

  const openReceiveModal = (transfer) => {
    setSelectedTransfer(transfer);
    setReceiveData({
      acceptanceOption: 'acceptAll',
      itemsReceived: transfer.items.map(item => ({
        transferItemId: item.id,
        quantityReceived: item.quantity,
        accepted: true,
      })),
    });
    setShowReceiveModal(true);
  };

  const handleReceiveTransfer = async (e) => {
    e.preventDefault();
    
    try {
      await transferService.receiveTransfer(locationId, selectedTransfer.id, {
        ...receiveData,
        userId: userId,
      });
      setShowReceiveModal(false);
      setSelectedTransfer(null);
      loadData();
      alert('Transfer received successfully');
    } catch (error) {
      alert('Error receiving transfer: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleVoidTransfer = async (transferId) => {
    if (!confirm('Are you sure you want to void this transfer?')) {
      return;
    }
    
    try {
      await transferService.voidTransfer(locationId, transferId, 'User requested void');
      loadData();
      alert('Transfer voided successfully');
    } catch (error) {
      alert('Error voiding transfer: ' + (error.response?.data?.message || error.message));
    }
  };

  const addItemToTransfer = () => {
    setNewTransfer({
      ...newTransfer,
      items: [
        ...newTransfer.items,
        {
          inventoryItemId: '',
          quantity: '',
        },
      ],
    });
  };

  const removeItemFromTransfer = (index) => {
    const items = [...newTransfer.items];
    items.splice(index, 1);
    setNewTransfer({ ...newTransfer, items });
  };

  const updateTransferItem = (index, field, value) => {
    const items = [...newTransfer.items];
    items[index][field] = value;
    setNewTransfer({ ...newTransfer, items });
  };

  if (loading) {
    return <div className="loading">Loading transfers...</div>;
  }

  const displayTransfers = view === 'pending' ? pendingTransfers : transfers;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Transfer Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`button ${view === 'all' ? 'button-success' : ''}`}
            onClick={() => setView('all')}
          >
            All Transfers
          </button>
          <button
            className={`button ${view === 'pending' ? 'button-success' : ''}`}
            onClick={() => setView('pending')}
          >
            Pending ({pendingTransfers.length})
          </button>
          <button
            className="button button-success"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Transfer'}
          </button>
        </div>
      </div>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3>Create New Transfer</h3>
          <form onSubmit={handleCreateTransfer}>
            <div className="form-group">
              <label>Destination Location ID</label>
              <input
                type="text"
                value={newTransfer.destinationLocationId}
                onChange={(e) => setNewTransfer({ ...newTransfer, destinationLocationId: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Transfer Type</label>
              <select
                value={newTransfer.transferType}
                onChange={(e) => setNewTransfer({ ...newTransfer, transferType: e.target.value })}
                required
              >
                <option value="sale">Sales Transfer</option>
                <option value="sameUBI">Same UBI Transfer</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={newTransfer.notes}
                onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Transfer Items</label>
              {newTransfer.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <input
                    type="text"
                    placeholder="Inventory Item ID"
                    value={item.inventoryItemId}
                    onChange={(e) => updateTransferItem(index, 'inventoryItemId', e.target.value)}
                    style={{ flex: 1 }}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateTransferItem(index, 'quantity', e.target.value)}
                    style={{ width: '120px' }}
                    required
                  />
                  <button
                    type="button"
                    className="button button-danger"
                    onClick={() => removeItemFromTransfer(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button"
                onClick={addItemToTransfer}
              >
                Add Item
              </button>
            </div>
            
            <button type="submit" className="button button-success">
              Create Transfer
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Transfer ID</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Items</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayTransfers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  No transfers found
                </td>
              </tr>
            ) : (
              displayTransfers.map((transfer) => (
                <tr key={transfer.id}>
                  <td>{transfer.transferNumber || transfer.id.substring(0, 8)}</td>
                  <td>{transfer.transferType}</td>
                  <td>{transfer.sourceLocation?.name || transfer.sourceLocationId}</td>
                  <td>{transfer.destinationLocation?.name || transfer.destinationLocationId}</td>
                  <td>{transfer.items?.length || 0} items</td>
                  <td>
                    <span className={`badge badge-${
                      transfer.status === 'completed' ? 'success' : 
                      transfer.status === 'voided' ? 'danger' :
                      'warning'
                    }`}>
                      {transfer.status}
                    </span>
                  </td>
                  <td>{new Date(transfer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {transfer.status === 'pending' && (
                        <>
                          <button
                            className="button button-success"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => openReceiveModal(transfer)}
                          >
                            Receive
                          </button>
                          <button
                            className="button button-danger"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => handleVoidTransfer(transfer.id)}
                          >
                            Void
                          </button>
                        </>
                      )}
                      <button
                        className="button"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receive Transfer Modal */}
      {showReceiveModal && selectedTransfer && (
        <div className="modal-overlay" onClick={() => setShowReceiveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Receive Transfer</h3>
            
            <form onSubmit={handleReceiveTransfer}>
              <div className="form-group">
                <label>Transfer: {selectedTransfer.transferNumber || selectedTransfer.id.substring(0, 8)}</label>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  From: {selectedTransfer.sourceLocation?.name || selectedTransfer.sourceLocationId}
                </p>
              </div>

              <div className="form-group">
                <label>Acceptance Option</label>
                <select
                  value={receiveData.acceptanceOption}
                  onChange={(e) => setReceiveData({ ...receiveData, acceptanceOption: e.target.value })}
                  required
                >
                  <option value="acceptAll">Accept All</option>
                  <option value="acceptPartial">Accept Partial</option>
                  <option value="rejectAll">Reject All</option>
                </select>
              </div>

              {receiveData.acceptanceOption === 'acceptPartial' && (
                <div>
                  <h4>Items</h4>
                  {selectedTransfer.items.map((item, index) => (
                    <div key={item.id} style={{ 
                      marginBottom: '15px', 
                      padding: '10px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px' 
                    }}>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Item {index + 1}</strong>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        Expected: {item.quantity} {item.unit}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label style={{ marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={receiveData.itemsReceived[index]?.accepted}
                            onChange={(e) => {
                              const items = [...receiveData.itemsReceived];
                              items[index].accepted = e.target.checked;
                              setReceiveData({ ...receiveData, itemsReceived: items });
                            }}
                          />
                          Accept
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Quantity Received"
                          value={receiveData.itemsReceived[index]?.quantityReceived || ''}
                          onChange={(e) => {
                            const items = [...receiveData.itemsReceived];
                            items[index].quantityReceived = e.target.value;
                            setReceiveData({ ...receiveData, itemsReceived: items });
                          }}
                          disabled={!receiveData.itemsReceived[index]?.accepted}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="button button-success">
                  Confirm Receipt
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowReceiveModal(false)}
                >
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

export default Transfers;
