import React from 'react';
import StaffLayout from '../../components/Layout/StaffLayout';
import AppointmentManagement from './AppointmentManagement';

const StaffAppointmentPage: React.FC = () => {
  return (
    <StaffLayout>
      <AppointmentManagement />
    </StaffLayout>
  );
};

export default StaffAppointmentPage;
