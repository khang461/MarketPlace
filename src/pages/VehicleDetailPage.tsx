import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, Share2, MapPin, Calendar, Gauge, Battery, 
  Phone, MessageCircle, Star, ChevronLeft, ChevronRight,
  Shield, Award, CheckCircle
} from 'lucide-react';
import { mockVehicles } from '../data/mockData';

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const vehicle = mockVehicles.find(v => v.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không tìm thấy sản phẩm
          </h1>
          <Link to="/search" className="text-blue-600 hover:underline">
            Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === vehicle.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? vehicle.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link></li>
            <li className="text-gray-500">/</li>
            <li><Link to="/search" className="text-blue-600 hover:underline">Tìm kiếm</Link></li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900">{vehicle.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <img
                  src={vehicle.images[currentImageIndex]}
                  alt={vehicle.title}
                  className="w-full h-96 object-cover"
                />
                {vehicle.images.length > 1 && (
                  <>
                    <button
                      onClick={previousImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {currentImageIndex + 1} / {vehicle.images.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnail Navigation */}
              {vehicle.images.length > 1 && (
                <div className="p-4 flex space-x-2 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${vehicle.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông số kỹ thuật</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hãng xe:</span>
                    <span className="font-semibold">{vehicle.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mẫu xe:</span>
                    <span className="font-semibold">{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Năm sản xuất:</span>
                    <span className="font-semibold">{vehicle.year}</span>
                  </div>
                  {vehicle.category === 'car' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số km đã chạy:</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('vi-VN').format(vehicle.mileage)} km
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {vehicle.batteryCapacity && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dung lượng pin:</span>
                        <span className="font-semibold">{vehicle.batteryCapacity} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tình trạng pin:</span>
                        <span className="font-semibold">{vehicle.batteryCondition}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Địa điểm:</span>
                    <span className="font-semibold">{vehicle.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`font-semibold ${
                      vehicle.status === 'available' ? 'text-green-600' : 
                      vehicle.status === 'sold' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {vehicle.status === 'available' ? 'Có sẵn' : 
                       vehicle.status === 'sold' ? 'Đã bán' : 'Đang xử lý'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả</h2>
              <div className="text-gray-700 leading-relaxed">
                {showFullDescription ? (
                  <p>{vehicle.description}</p>
                ) : (
                  <p>{vehicle.description.substring(0, 200)}...</p>
                )}
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:underline mt-2"
                >
                  {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Price and Contact */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(vehicle.price)}
                </p>
                {vehicle.isFeatured && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Tin nổi bật
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Mua ngay
                </button>
                <button className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Thêm vào yêu thích
                </button>
                <div className="flex space-x-2">
                  <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Lưu</span>
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <Share2 className="w-4 h-4" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin người bán</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {vehicle.sellerName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold">{vehicle.sellerName}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{vehicle.sellerRating}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Gọi điện</span>
                </button>
                <button className="w-full border border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Nhắn tin</span>
                </button>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Lưu ý an toàn</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Kiểm tra kỹ xe trước khi mua</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Giao dịch tại nơi công cộng</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Không chuyển tiền trước</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Yêu cầu giấy tờ đầy đủ</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailPage;