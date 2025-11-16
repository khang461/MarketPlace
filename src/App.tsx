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
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import NotFoundPage from "./pages/NotFoundPage";
import ScrollToTop from "./components/ScrollToTop/scrollToTop";
import "./utils/websocketDebug"; // Load debug tools

// 🔽 thêm 3 import cho phần đấu giá
import AuctionListPage from "./pages/Auction/AuctionListPage";
import AuctionDetailPage from "./pages/Auction/AuctionDetailPage";
import StaffAuctionManagementPage from "./pages/Staff/StaffAuctionManagementPage";
import AuctionCreatePage from "./pages/Auction/AuctionCreatePage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import TransactionDetailPage from "./pages/TransactionDetailPage";

// 🔽 bọc App bằng SocketProvider để bật realtime
import { SocketProvider } from "./contexts/SocketContext";
import MyMembershipPage from "./pages/MyMembershipPage";
import UpgradeMembershipPage from "./pages/UpgradeMembershipPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import DepositPaymentResultPage from "./pages/DepositPaymentResultPage";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import StaffRedirect from "./components/Common/StaffRedirect";
import EkycPage from "./pages/EkycPage";
import WalletPage from "./pages/WalletPage";
import NotificationDepositPage from "./pages/NotificationDepositPage";
import NotificationsPage from "./pages/NotificationsPage";
import ContractPage from "./pages/Contract/contract";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import StaffAppointmentPage from "./pages/Staff/StaffAppointmentPage";

function App() {
  return (
    <SocketProvider>
      <Router>
        <ScrollToTop />
        <ChatNotificationListener />
        <Routes>
          <Route path="/chat/:chatId" element={<ChatDetailPage />} />

          {/* Staff Routes - Protected */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/appointments"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffAppointmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/auction-management"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffAuctionManagementPage />
              </ProtectedRoute>
            }
          />

          {/* ---- App Shell có Header/Footer ---- */}
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
                    <Route
                      path="/vehicle/:id"
                      element={<VehicleDetailPage />}
                    />
                    <Route path="/post-listing" element={<PostListingPage />} />
                    <Route path="/ekyc" element={<EkycPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/membership" element={<MyMembershipPage />} />
                    <Route
                      path="/membership/upgrade"
                      element={<UpgradeMembershipPage />}
                    />
                    <Route
                      path="/membership/payment-result"
                      element={<PaymentResultPage />}
                    />
                    <Route
                      path="/payments"
                      element={<PaymentResultPage />}
                    />
                    <Route
                      path="/deposits"
                      element={<DepositPaymentResultPage />}
                    />
                    <Route
                      path="/notifications-deposit"
                      element={<NotificationDepositPage />}
                    />
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

                    {/* 🔥 ROUTES ĐẤU GIÁ */}
                    <Route path="/auctions" element={<AuctionListPage />} />
                    <Route
                      path="/auctions/:auctionId"
                      element={<AuctionDetailPage />}
                    />
                    <Route
                      path="/auctions/create"
                      element={
                        <ProtectedRoute>
                          <AuctionCreatePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 🔥 ROUTES LỊCH HẸN */}
                    <Route
                      path="/appointments/:appointmentId"
                      element={
                        <ProtectedRoute>
                          <AppointmentDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* 🔥 ROUTES GIAO DỊCH */}
                    <Route
                      path="/transactions/:transactionId"
                      element={
                        <ProtectedRoute>
                          <TransactionDetailPage />
                        </ProtectedRoute>
                      }
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
    </SocketProvider>
  );
}

export default App;
