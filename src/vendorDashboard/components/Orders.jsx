import React, { useState, useEffect } from 'react';
import { API_URL } from '../data/apiPath';

// NEW: paid customer orders for this vendor's restaurants (newest first)
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${API_URL}/payment/vendor-orders`, {
        headers: { Authorization: `Bearer ${loginToken}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(response.status === 403 ? 'Session expired, please logout and login again' : data.error || 'Failed to load orders');
      }
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const when = (o) =>
    new Date(o.paidAt || o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="productSection">
      <button onClick={loadOrders} disabled={loading} style={{ marginBottom: '12px' }}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      {error && <p>{error}</p>}
      {!loading && !error && orders.length === 0 && <p>No paid orders yet</p>}
      {orders.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="product-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Paid via</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{when(o)}</td>
                  <td>#{String(o._id).slice(-8).toUpperCase()}</td>
                  <td>
                    {o.customer?.name}
                    <br />
                    {o.customer?.phone}
                    <br />
                    {o.customer?.address}
                  </td>
                  <td>
                    {o.items.map((it, i) => (
                      <div key={i}>
                        {it.productName} × {it.qty}
                      </div>
                    ))}
                  </td>
                  <td>₹{(o.amount / 100).toFixed(2)}</td>
                  <td>{o.paymentDetail || o.paymentMethod || 'Online'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
