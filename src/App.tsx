import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ChatBot from "./components/Common/ChatBot";
import ChatNotificationListener from "./components/Common/ChatNotificationListener";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import PostListingPage from "./pages/PostListingPage";
import AccountPage from "./pages/AccountPage";
import ChatDetailPage from "./pages/ChatDetailPage";
import SupportPage from "./pages/SupportPage";
import NotificationsPage from "./pages/NotificationsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import ContractPage from "./pages/Contract/contract";
import WalletPage from "./pages/WalletPage";
import NotificationDepositPage from "./pages/NotificationDepositPage";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import StaffAppointmentPage from "./pages/Staff/StaffAppointmentPage";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import StaffRedirect from "./components/Common/StaffRedirect";
import ScrollToTop from "./components/ScrollToTop/scrollToTop";
import "./utils/websocketDebug"; // Load debug tools

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ChatNotificationListener />
      <Routes>
        <Route path="/chat/:chatId" element={<ChatDetailPage />} />
        
        {/* Staff Routes - Protected */}
        <Route path="/staff" element={
          <ProtectedRoute requiredRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        } />
        <Route path="/staff/appointments" element={
          <ProtectedRoute requiredRole="staff">
            <StaffAppointmentPage />
          </ProtectedRoute>
        } />
        
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <StaffRedirect />
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
                  <Route path="/post-listing" element={<PostListingPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/notifications-deposit" element={<NotificationDepositPage />} />
                  <Route
                    path="/notifications"
                    element={<NotificationsPage />}
                  />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/contract" element={<ContractPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
