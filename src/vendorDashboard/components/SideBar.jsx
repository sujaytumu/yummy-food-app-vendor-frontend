import React from "react";

const SideBar = ({
  showFirmHandler,
  showProductHandler,
  showAllProductsHandler,
  showUserDetailsHandler, // ✅ added
  showOrdersHandler, // NEW
  showAnalyticsHandler, // NEW
  showFirmTitle,
  activeTab // NEW: highlights the current tab
}) => {
  const cls = (name) => (activeTab === name ? "active" : undefined);
  return (
    <div className="sideBarSection">
      <ul>
        {showFirmTitle && <li className={cls("firm")} onClick={showFirmHandler}>Add Firm</li>}
        <li className={cls("product")} onClick={showProductHandler}>Add Product</li>
        <li className={cls("all")} onClick={showAllProductsHandler}>All Products</li>
        <li className={cls("orders")} onClick={showOrdersHandler}>Orders</li> {/* NEW */}
        <li className={cls("analytics")} onClick={showAnalyticsHandler}>Analytics</li> {/* NEW */}
        <li className={cls("user")} onClick={showUserDetailsHandler}>User Details</li> {/* ✅ added click */}
      </ul>
    </div>
  );
};

export default SideBar;
