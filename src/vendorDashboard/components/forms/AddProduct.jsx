import React, {useState} from 'react'
import { API_URL } from '../../data/apiPath';
import { ThreeCircles } from 'react-loader-spinner';

const AddProduct = () => {
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState([]);
    const [bestSeller, setBestSeller] = useState(false);
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false); 

    const handleCategoryChange = (event) => {
      const value = event.target.value;
      if(category.includes(value)){
        setCategory(category.filter((item)=> item !== value));
      } else {
        setCategory([...category, value]);
      }
    }

    const handleBestSeller =(event) => {
      const value = event.target.value === 'true';
      setBestSeller(value);
    }

    const handleImageUpload =(event) => {
      const selectedImage = event.target.files[0];
      setImage(selectedImage);
    }

    // UPDATED: upload image straight to Cloudinary (same as AddFirm) and store the secure_url
    const uploadToCloudinary = async (file) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "ml_default");
      const res = await fetch("https://api.cloudinary.com/v1_1/dw6srh3vk/image/upload", {
        method: "POST",
        body: data,
      });
      const cloudData = await res.json();
      if (!res.ok || !cloudData.secure_url) {
        throw new Error(cloudData?.error?.message || "Cloudinary upload failed");
      }
      return cloudData.secure_url;
    };

    const handleAddProduct = async(e) => {
      e.preventDefault();
      setLoading(true); 

      try {
        const loginToken = localStorage.getItem('loginToken');
        const firmId = localStorage.getItem('firmId');

        if(!loginToken || !firmId){
          alert("Please login and add a firm first");
          return;
        }

        // UPDATED: image -> Cloudinary URL first; backend just stores this string
        let imageUrl = "";
        if (image) {
          imageUrl = await uploadToCloudinary(image);
        }

        // UPDATED: send JSON instead of multipart FormData (no file goes to backend now)
        const body = { productName, price, description, bestSeller, category, image: imageUrl };

        const response = await fetch(`${API_URL}/product/add-product/${firmId}`, {
          method:'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await response.json();

        if(response.ok){
          alert('Product added succesfully');
          setProductName("");
          setPrice("");
          setCategory([]);
          setBestSeller(false);
          setImage(null);
          setDescription("");
        } else {
          alert(data.error || 'Failed to add Product');
        }

      } catch (error) {
        console.error(error);
        alert('Failed to add Product: ' + error.message);
      } finally {
        setLoading(false); 
      }
    }

    return (
    <div className="firmSection">
      {loading && <div className="loaderSection">
        <ThreeCircles
          visible={loading}
          height={100}
          width={100}
          color="#4fa94d"
          ariaLabel="three-circles-loading"
        />
        <p>Please wait, your product is being added...</p>
      </div>}

      {!loading && 
        <form className="tableForm" onSubmit={handleAddProduct}>
          <h3>Add Product</h3>
          <label>Product Name</label>
          <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} />
          <label>Price</label>
          <input type="text" value={price} onChange={(e)=>setPrice(e.target.value)}/>

          <div className="checkInp">
            <label>Category</label>
            <div className="inputsContainer"> {/* UPDATED: flex container for side-by-side */}
              
              {/* UPDATED: label now wraps input + text together */}
              <div className="checboxContainer">
                <label>
                  <input type="checkbox" value="veg" checked={category.includes('veg')} onChange={handleCategoryChange} />
                  Veg
                </label>
              </div>

              <div className="checboxContainer">
                <label>
                  <input type="checkbox" value="non-veg" checked={category.includes('non-veg')} onChange={handleCategoryChange} />
                  Non-Veg
                </label>
              </div>
            </div>
          </div>

          <div className="checkInp">
            <label>Best Seller</label>
            <div className="inputsContainer"> {/* UPDATED: same flex fix for radios */}
              <div className="checboxContainer">
                <label>
                  <input type="radio" value="true" checked={bestSeller === true} onChange={handleBestSeller} />
                  Yes
                </label>
              </div>
              <div className="checboxContainer">
                <label>
                  <input type="radio" value="false" checked={bestSeller === false} onChange={handleBestSeller} />
                  No
                </label>
              </div>
            </div>
          </div>
       
          <label>Description</label>
          <input type="text" value={description} onChange={(e)=>setDescription(e.target.value)} />
          <label>Firm Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          <br />
          <div className="btnSubmit">
            <button type='submit'>Submit</button>
          </div>
        </form>
      }
    </div>
  )
}

export default AddProduct;
