import React, { useState, useEffect } from 'react';
import { API_URL } from '../data/apiPath';
import { authFetch } from '../data/authFetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'ml_default');
  const res = await fetch('https://api.cloudinary.com/v1_1/dw6srh3vk/image/upload', {
    method: 'POST',
    body: data,
  });
  const cloudData = await res.json();
  if (!res.ok || !cloudData.secure_url) {
    throw new Error(cloudData?.error?.message || 'Cloudinary upload failed');
  }
  return cloudData.secure_url;
};

const errorFrom = async (response, fallback) => {
  if (response.status === 401 || response.status === 403) {
    return 'Session expired or not allowed, please logout and login again';
  }
  const data = await response.json().catch(() => ({}));
  return data.error || fallback;
};

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [busyId, setBusyId] = useState('');
  const [editing, setEditing] = useState(null); // product being edited
  const [form, setForm] = useState({ productName: '', price: '', description: '', category: [], bestSeller: false });
  const [newImage, setNewImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const productsHandler = async () => {
    const firmId = localStorage.getItem('firmId');
    try {
      const response = await fetch(`${API_URL}/product/${firmId}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newProductsData = await response.json();
      setProducts(newProductsData.products);
    } catch (error) {
      console.error('failed to fetch products', error);
      alert('failed to fetch products');
    }
  };

  useEffect(() => {
    productsHandler();
  }, []);

  const deleteProductById = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (!confirmDelete) return;

    setBusyId(productId);
    try {
      const response = await authFetch(`${API_URL}/product/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId));
      } else {
        alert(await errorFrom(response, 'Failed to delete product'));
      }
    } catch (error) {
      console.error('Failed to delete product', error);
      alert('Failed to delete product');
    } finally {
      setBusyId('');
    }
  };

  // Out-of-stock toggle: hides the dish from ordering without deleting it
  const toggleStock = async (item) => {
    const next = item.inStock === false; // currently out -> bring back in stock
    setBusyId(item._id);
    try {
      const response = await authFetch(`${API_URL}/product/${item._id}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify({ inStock: next }),
      });
      if (!response.ok) throw new Error(await errorFrom(response, 'Failed to update stock'));
      setProducts((prev) => prev.map((p) => (p._id === item._id ? { ...p, inStock: next } : p)));
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setBusyId('');
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setNewImage(null);
    setForm({
      productName: item.productName || '',
      price: String(item.price ?? ''),
      description: item.description || '',
      category: Array.isArray(item.category) ? item.category : [],
      bestSeller: !!item.bestSeller,
    });
  };

  const toggleCategory = (value) =>
    setForm((f) => ({
      ...f,
      category: f.category.includes(value) ? f.category.filter((c) => c !== value) : [...f.category, value],
    }));

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim() || !form.price.trim()) {
      alert('Product name and price are required');
      return;
    }
    setSaving(true);
    try {
      const body = { ...form };
      if (newImage) body.image = await uploadToCloudinary(newImage);
      const response = await authFetch(`${API_URL}/product/${editing._id}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(await errorFrom(response, 'Failed to save product'));
      const updated = await response.json();
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setEditing(null);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="productSection">
      {!products || products.length === 0 ? (
        <p>No products added</p>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%', maxWidth: '1100px' }}>
        <table className="product-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Image</th>
              <th>Stock</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const out = item.inStock === false;
              return (
                <tr key={item._id} style={out ? { opacity: 0.6 } : undefined}>
                  <td>{item.productName}</td>
                  <td>₹{item.price}</td>
                  <td>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    )}
                  </td>
                  <td>
                    <div className={`statusPill ${out ? 'status-placed' : 'status-delivered'}`}>
                      {out ? 'Out of stock' : 'In stock'}
                    </div>
                    <button
                      type="button"
                      className="statusAdvanceBtn"
                      disabled={busyId === item._id}
                      onClick={() => toggleStock(item)}
                    >
                      {out ? 'Mark available' : 'Mark out of stock'}
                    </button>
                  </td>
                  <td>
                    <button type="button" className="statusAdvanceBtn" onClick={() => startEdit(item)}>Edit</button>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteProductById(item._id)}
                      className="deleteBtn"
                      disabled={busyId === item._id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}

      {editing && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px',
          }}
        >
          <form
            onSubmit={saveEdit}
            style={{
              background: '#fff', borderRadius: '10px', padding: '20px', width: '100%',
              maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '10px',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: 0 }}>Edit product</h3>
            <label>Product name
              <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
            </label>
            <label>Price
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </label>
            <div>
              Category:{' '}
              {['veg', 'non-veg'].map((c) => (
                <label key={c} style={{ marginRight: '12px' }}>
                  <input type="checkbox" checked={form.category.includes(c)} onChange={() => toggleCategory(c)} /> {c}
                </label>
              ))}
            </div>
            <label>
              <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} /> Best seller
            </label>
            <label>Description
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>Replace image (optional)
              <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files[0] || null)} />
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AllProducts;
