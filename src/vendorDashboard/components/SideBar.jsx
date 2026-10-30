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
        {showFirmTitle && <li className={cls("firm")} onClick={showFirmHandler}>Add firm</li>}
        <li className={cls("product")} onClick={showProductHandler}>Add product</li>
        <li className={cls("all")} onClick={showAllProductsHandler}>All products</li>
        <li className={cls("orders")} onClick={showOrdersHandler}>Orders</li> {/* NEW */}
        <li className={cls("analytics")} onClick={showAnalyticsHandler}>Analytics</li> {/* NEW */}
        <li className={cls("user")} onClick={showUserDetailsHandler}>User details</li> {/* ✅ added click */}
      </ul>
    </div>
  );
};

export default SideBar;
