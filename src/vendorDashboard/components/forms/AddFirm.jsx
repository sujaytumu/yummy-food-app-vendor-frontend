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

  const handleCategoryChange = (event)=>{
    const value = event.target.value;
    setCategory((prev) =>
      prev.includes(value) ? prev.filter((item)=> item !== value) : [...prev, value]
    );
  }

  const handleBestSeller =(event)=>{
    const value = event.target.value === 'true';
    setBestSeller(value);
  }

  const handleImageUpload =(event)=>{
    setImage(event.target.files[0]);
  }

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "ml_default"); // ⚠️ replace with your preset
    data.append("cloud_name", "dw6srh3vk"); // ⚠️ replace with your cloud name

    const res = await fetch(`https://api.cloudinary.com/v1_1/dw6srh3vk/image/upload`, {
      method: "POST",
      body: data,
    });

    const cloudData = await res.json();
    return cloudData.secure_url;
  };

  const handleAddProduct = async(e)=>{
    e.preventDefault();
    setLoading(true); 

    try {
      const loginToken = localStorage.getItem('loginToken');
      const firmId = localStorage.getItem('firmId');

      if(!loginToken || !firmId){
        console.error("user not authenticated");
        return;
      }

      let imageUrl = "";
      if (image) {
        imageUrl = await uploadToCloudinary(image);
      }

      const body = {
        productName,
        price,
        description,
        bestSeller,
        category,
        image: imageUrl,
      };

      const response = await fetch(`${API_URL}/product/add-product/${firmId}`, {
        method:'POST',
        headers: {
          Authorization: `Bearer ${loginToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if(response.ok){
        alert('Product added succesfully');
      }

      setProductName("");
      setPrice("");
      setCategory([]);
      setBestSeller(false);
      setImage(null);
      setDescription("");

    } catch (error) {
      alert('Failed to add Product');
    }finally {
      setLoading(false); 
    }
  }

  return (
    <div className="firmSection">
      {loading && (
        <div className="loaderSection">
          <ThreeCircles
            visible={loading}
            height={100}
            width={100}
            color="#4fa94d"
          />
          <p>Please wait, your product is being added...</p>
        </div>
      )}
      {!loading && 
        <form className="tableForm" onSubmit={handleAddProduct}>
          <h3>Add Product</h3>
          <label >Product Name</label>
          <input type="text" value={productName} onChange={(e)=>setProductName(e.target.value)} />

          <label >Price</label>
          <input type="text" value={price} onChange={(e)=>setPrice(e.target.value)}/>

          <div className="checkInp">
            <label >Category</label>
            <div className="inputsContainer">
              <div className="checboxContainer">
                <label>Veg</label>
                <input type="checkbox" value="veg" checked ={category.includes('veg')}  onChange={handleCategoryChange}/>
              </div>
              <div className="checboxContainer">
                <label>Non-Veg</label>
                <input type="checkbox" value="non-veg" checked ={category.includes('non-veg')} onChange={handleCategoryChange} />
              </div>
            </div>
          </div>

          <div className="checkInp">
            <label >Best Seller</label>
            <div className="inputsContainer">
              <div className="checboxContainer">
                <label>Yes</label>
                <input type="radio" value="true" checked = {bestSeller=== true} onChange={handleBestSeller}/>
              </div>
              <div className="checboxContainer">
                <label>No</label>
                <input type="radio" value="false" checked = {bestSeller=== false} onChange={handleBestSeller}/>
              </div>
            </div>
          </div>

          <label >Description</label>
          <input type="text" value={description} onChange={(e)=>setDescription(e.target.value)} />

          <label >Product Image</label>
          <input type="file" onChange={handleImageUpload} />

          <div className="btnSubmit">
            <button type='submit'>Submit</button>
          </div>
        </form>
      }
    </div>
  )
}

export default AddProduct;
