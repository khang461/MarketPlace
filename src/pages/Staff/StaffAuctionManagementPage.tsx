import React from "react";
import StaffLayout from "../../components/Layout/StaffLayout";
import AuctionManagementPage from "./AuctionManagementPage";

const StaffAuctionManagementPage: React.FC = () => {
  return (
    <StaffLayout>
      <AuctionManagementPage />
    </StaffLayout>
  );
};

export default StaffAuctionManagementPage;
