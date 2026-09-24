import React from "react";

const SideBar = ({
  showFirmHandler,
  showProductHandler,
  showAllProductsHandler,
  showUserDetailsHandler, // ✅ added
  showOrdersHandler, // NEW
  showFirmTitle
}) => {
  return (
    <div className="sideBarSection">
      <ul>
        {showFirmTitle && <li onClick={showFirmHandler}>Add Firm</li>}
        <li onClick={showProductHandler}>Add Product</li>
        <li onClick={showAllProductsHandler}>All Products</li>
        <li onClick={showOrdersHandler}>Orders</li> {/* NEW */}
        <li onClick={showUserDetailsHandler}>User Details</li> {/* ✅ added click */}
      </ul>
    </div>
  );
};

export default SideBar;
