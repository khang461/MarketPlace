import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ChatBot from "./components/Common/ChatBot";
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
import ContractPage from "./pages/Contract/contract";
import ScrollToTop from "./components/ScrollToTop/scrollToTop";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
    
        <Route path="/chat/:chatId" element={<ChatDetailPage />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
                  <Route path="/post-listing" element={<PostListingPage />} />
                  <Route path="/account" element={<AccountPage />} />
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
