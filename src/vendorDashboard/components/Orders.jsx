import React, { useState, useEffect } from 'react';
import { API_URL } from '../data/apiPath';

// Delivery lifecycle (must match backend utils/orderStatus.js)
const STATUS_ORDER = ['placed', 'preparing', 'out_for_delivery', 'delivered'];
const STATUS_LABEL = {
  placed: 'Order placed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};
const NEXT_ACTION = {
  placed: 'Start preparing',
  preparing: 'Out for delivery',
  out_for_delivery: 'Mark delivered',
};

// NEW: paid customer orders for this vendor's restaurants (newest first)
const Orders = () => {
  const [updatingId, setUpdatingId] = useState('');
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

  // Vendor moves an order forward: placed -> preparing -> out_for_delivery -> delivered
  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    setError('');
    try {
      const loginToken = localStorage.getItem('loginToken');
      const response = await fetch(`${API_URL}/payment/order-status/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginToken}` },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(response.status === 403 ? 'Session expired, please logout and login again' : data.error || 'Failed to update status');
      }
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, deliveryStatus: data.deliveryStatus } : o)));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUpdatingId('');
    }
  };

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
                <th>Status</th>
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
                  <td>
                    {(() => {
                      const current = o.deliveryStatus || 'placed';
                      const next = STATUS_ORDER[STATUS_ORDER.indexOf(current) + 1];
                      return (
                        <>
                          <strong>{STATUS_LABEL[current]}</strong>
                          {next ? (
                            <>
                              <br />
                              <button
                                disabled={updatingId === o._id}
                                onClick={() => updateStatus(o._id, next)}
                                style={{ marginTop: '6px' }}
                              >
                                {updatingId === o._id ? 'Updating...' : NEXT_ACTION[current]}
                              </button>
                            </>
                          ) : null}
                        </>
                      );
                    })()}
                  </td>
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
