import React, { useState, useEffect } from 'react';import { API_URL } from '../data/apiPath';

const AllProducts = () => {
  const [products, setProducts] = useState([]);

  const productsHandler = async () => {
    const firmId = localStorage.getItem('firmId');
    try {
      const response = await fetch(`${API_URL}/product/${firmId}/products`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newProductsData = await response.json();
      setProducts(newProductsData.products);
      console.log(newProductsData);
    } catch (error) {
      console.error("failed to fetch products", error);
      alert('failed to fetch products');
    }
  };

  useEffect(() => {
    productsHandler();
    console.log('this is useEffect');
  }, []);

  const deleteProductById = async (productId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/product/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts((prevProducts) => prevProducts.filter(product => product._id !== productId));
        alert("Product deleted successfully");
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error('Failed to delete product', error);
      alert('Failed to delete product');
    }
  };

  return (
    <div className='productSection'>
      {!products || products.length === 0 ? (
        <p>No products added</p>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Image</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => (
              <tr key={item._id}>
                <td>{item.productName}</td>
                <td>₹{item.price}</td>
                <td>
                  {item.image && (
                    <img
                      src={item.image} // ✅ use cloudinary url directly
                      alt={item.productName}
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  )}
                </td>
                <td>
                  <button
                    onClick={() => deleteProductById(item._id)}
                    className='deleteBtn'
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AllProducts;

