import React, { useState, useEffect } from 'react';
import { API_URL } from '../data/apiPath';

// NEW: delivery status steps (must match backend utils/orderStatus.js)
const STEPS = [
  { status: 'placed', label: 'Order placed' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'out_for_delivery', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
];
const nextStatus = (current) => {
  const i = STEPS.findIndex((s) => s.status === current);
  return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
};
const labelOf = (status) => STEPS.find((s) => s.status === status)?.label || status;

// NEW: paid customer orders for this vendor's restaurants (newest first)
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null); // NEW: disables the button while a status PATCH is in flight

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

  // NEW: move one order to the next delivery status
  const advanceStatus = async (order) => {
    const next = nextStatus(order.deliveryStatus || 'placed');
    if (!next) return;
    setUpdatingId(order._id);
    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${API_URL}/payment/order-status/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ status: next.status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update status');
      setOrders((cur) => cur.map((o) => (o._id === order._id ? { ...o, deliveryStatus: data.deliveryStatus } : o)));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const current = o.deliveryStatus || 'placed';
                const next = nextStatus(current);
                return (
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
                    <td>
                      <div className={`statusPill status-${current}`}>{labelOf(current)}</div>
                      {next && (
                        <button
                          type="button"
                          className="statusAdvanceBtn"
                          disabled={updatingId === o._id}
                          onClick={() => advanceStatus(o)}
                        >
                          {updatingId === o._id ? 'Updating...' : `Mark "${next.label}"`}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
