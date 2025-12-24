import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { salesService } from '../services/api';

function Sales() {
  const { locationId } = useAuth();
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPOS, setShowPOS] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock data for demonstration
      // In production, use locationId from context: salesService.getSales(locationId)
      setSales([
        {
          id: '1',
          totalAmount: 150.00,
          status: 'completed',
          customer: { name: 'John Doe' },
          createdAt: new Date().toISOString(),
          saleItems: [
            { inventoryItem: { productName: 'Blue Dream - 3.5g' }, quantity: 2, price: 75 }
          ],
        },
      ]);
      setInventory([
        { id: '1', productName: 'Blue Dream - 3.5g', quantity: 50, unit: 'units' },
        { id: '2', productName: 'OG Kush - 3.5g', quantity: 30, unit: 'units' },
      ]);
      setCustomers([
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sales:', error);
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.inventoryItemId === item.id);
    if (existing) {
      setCart(cart.map(c => 
        c.inventoryItemId === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        inventoryItemId: item.id,
        productName: item.productName,
        quantity: 1,
        price: 50, // Mock price
        discountAmount: 0,
      }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.inventoryItemId !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity - item.discountAmount), 0);
  };

  const handleCheckout = async () => {
    if (!locationId) {
      alert('Please select a location in your profile settings.');
      return;
    }
    try {
      await salesService.createSale(locationId, {
        customerId: selectedCustomer || undefined,
        items: cart,
      });
      setCart([]);
      setSelectedCustomer('');
      setShowPOS(false);
      loadData();
      alert('Sale completed successfully!');
    } catch (error) {
      alert('Error completing sale: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading sales...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Sales & POS</h2>
        <button className="button button-success" onClick={() => setShowPOS(!showPOS)}>
          {showPOS ? 'View Sales History' : 'Open POS'}
        </button>
      </div>

      {!locationId && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          No location selected. Please select a location in your profile settings.
        </div>
      )}

      {showPOS ? (
        <div>
          <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div className="card">
              <h3>Available Products</h3>
              {inventory.map((item) => (
                <div key={item.id} style={{ 
                  padding: '10px', 
                  marginBottom: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{item.productName}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Available: {item.quantity} {item.unit}
                    </div>
                  </div>
                  <button className="button" onClick={() => addToCart(item)}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>

            <div className="card">
              <h3>Shopping Cart</h3>
              
              <div className="form-group">
                <label>Customer (Optional)</label>
                <select 
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {cart.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>Cart is empty</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.inventoryItemId} style={{ 
                      padding: '10px', 
                      marginBottom: '10px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <strong>{item.productName}</strong>
                        <button 
                          onClick={() => removeFromCart(item.inventoryItemId)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#e74c3c', 
                            cursor: 'pointer' 
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        Qty: {item.quantity} × ${item.price} = ${item.price * item.quantity}
                      </div>
                    </div>
                  ))}

                  <div style={{ 
                    marginTop: '20px', 
                    paddingTop: '10px', 
                    borderTop: '2px solid #ddd',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    Total: ${calculateTotal().toFixed(2)}
                  </div>

                  <button 
                    className="button button-success" 
                    style={{ width: '100%', marginTop: '15px' }}
                    onClick={handleCheckout}
                  >
                    Complete Sale
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3>Sales History</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.createdAt).toLocaleString()}</td>
                  <td>{sale.customer?.name || 'Walk-in'}</td>
                  <td>{sale.saleItems.length} items</td>
                  <td>${sale.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${sale.status === 'completed' ? 'success' : 'warning'}`}>
                      {sale.status}
                    </span>
                  </td>
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
      )}
    </div>
  );
}

export default Sales;
