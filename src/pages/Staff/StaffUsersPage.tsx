import React from "react";
import StaffLayout from "../../components/Layout/StaffLayout";
import StaffUserManagement from "./StaffUserManagement";

const StaffUsersPage: React.FC = () => {
  return (
    <StaffLayout>
      <StaffUserManagement />
    </StaffLayout>
  );
};

export default StaffUsersPage;
