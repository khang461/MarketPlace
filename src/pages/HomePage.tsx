import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Battery,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Users,
} from "lucide-react";
import VehicleCard from "../components/Common/VehicleCard";
import { Vehicle } from "../types";
import api from "../config/api";

interface Listing {
  _id: string;
  sellerId: {
    _id: string;
    fullName: string;
    phone: string;
  };
  type: string;
  make: string;
  model: string;
  year: number;
  batteryCapacityKWh: number;
  mileageKm: number;
  chargeCycles: number;
  condition: string;
  photos: Array<{ url: string; kind: string }>;
  location: {
    city: string;
    district: string;
    address: string;
  };
  priceListed: number;
  status: string;
  createdAt: string;
}

const HomePage: React.FC = () => {
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [latestVehicles, setLatestVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<
    { type: string; count: number }[]
  >([]);
  const [conditionCategories, setConditionCategories] = useState<
    { condition: string; count: number }[]
  >([]);

  useEffect(() => {
    const fetchFeaturedVehicles = async () => {
      try {
        const response = await api.get("/listings", {
          params: {
            page: "1",
            limit: "3",
            sortBy: "newest",
            status: "Published", // Chỉ lấy sản phẩm còn hàng
          },
        });

        const converted: Vehicle[] = response.data.listings.map(
          (listing: Listing) => ({
            id: listing._id,
            title: `${listing.make} ${listing.model} ${listing.year}`,
            brand: listing.make,
            model: listing.model,
            year: listing.year,
            price: listing.priceListed,
            category: listing.type === "Car" ? "xe-dien" : "pin",
            mileage: listing.mileageKm,
            batteryHealth: Math.max(80, 100 - listing.chargeCycles / 20),
            location: `${listing.location.district}, ${listing.location.city}`,
            images: listing.photos,
            postedDate: listing.createdAt,
            status: listing.status,
            sellerId: listing.sellerId._id,
            isFeatured: true,
          })
        );

        setFeaturedVehicles(converted);
      } catch (error) {
        console.error("Error fetching featured vehicles:", error);
      }
    };

    fetchFeaturedVehicles();
  }, []);

  useEffect(() => {
    const fetchLatestVehicles = async () => {
      try {
        const response = await api.get("/listings", {
          params: {
            page: "1",
            limit: "3",
            sortBy: "newest",
          },
        });

        const converted: Vehicle[] = response.data.listings.map(
          (listing: Listing) => ({
            id: listing._id,
            title: `${listing.make} ${listing.model} ${listing.year}`,
            brand: listing.make,
            model: listing.model,
            year: listing.year,
            price: listing.priceListed,
            category: listing.type === "Car" ? "xe-dien" : "pin",
            mileage: listing.mileageKm,
            batteryHealth: Math.max(80, 100 - listing.chargeCycles / 20),
            location: `${listing.location.district}, ${listing.location.city}`,
            images: listing.photos,
            postedDate: listing.createdAt,
            status: listing.status,
            sellerId: listing.sellerId._id,
            isFeatured: false,
          })
        );

        setLatestVehicles(converted);
      } catch (error) {
        console.error("Error fetching latest vehicles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestVehicles();
  }, []);

  // Fetch categories từ listings
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/listings", {
          params: {
            page: "1",
            limit: "100", // Lấy nhiều để đếm
          },
        });

        // Đếm số lượng theo type
        const typeCounts: Record<string, number> = {};
        response.data.listings.forEach((listing: Listing) => {
          typeCounts[listing.type] = (typeCounts[listing.type] || 0) + 1;
        });

        // Convert thành array
        const categoryArray = Object.entries(typeCounts).map(
          ([type, count]) => ({
            type,
            count,
          })
        );

        setCategories(categoryArray);

        // Đếm số lượng theo condition
        const conditionCounts: Record<string, number> = {};
        response.data.listings.forEach((listing: Listing) => {
          conditionCounts[listing.condition] =
            (conditionCounts[listing.condition] || 0) + 1;
        });

        // Convert thành array (chỉ lấy New và LikeNew)
        const conditionArray = Object.entries(conditionCounts)
          .filter(
            ([condition]) => condition === "New" || condition === "LikeNew"
          )
          .map(([condition, count]) => ({
            condition,
            count,
          }));

        setConditionCategories(conditionArray);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Car: Car,
      Battery: Battery,
      Motor: Zap,
      Accessory: Star,
    };
    const IconComponent = icons[type] || Car;
    return <IconComponent className="w-8 h-8" />;
  };

  const getCategoryName = (type: string) => {
    const names: Record<string, string> = {
      Car: "Ô tô điện",
      Battery: "Pin xe điện",
      Motor: "Động cơ",
      Accessory: "Phụ kiện",
    };
    return names[type] || type;
  };

  const getConditionIcon = (condition: string) => {
    if (condition === "New") {
      return <Star className="w-8 h-8" />;
    }
    return <Shield className="w-8 h-8" />;
  };

  const getConditionName = (condition: string) => {
    const names: Record<string, string> = {
      New: "Xe mới",
      LikeNew: "Như mới",
    };
    return names[condition] || condition;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nền tảng mua bán xe điện
              <span className="block text-yellow-400">hàng đầu Việt Nam</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Kết nối người mua và người bán xe điện, pin và phụ kiện một cách
              an toàn, tiện lợi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/search"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center space-x-2"
              >
                <span>Tìm xe ngay</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/post-listing"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
              >
                Đăng tin bán xe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn MarketPlace?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cam kết mang đến trải nghiệm mua bán tốt nhất cho cộng
              đồng xe điện Việt Nam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">An toàn & Tin cậy</h3>
              <p className="text-gray-600">
                Hệ thống xác minh nghiêm ngặt đảm bảo mọi giao dịch đều an toàn
                và minh bạch
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Nhanh chóng & Tiện lợi
              </h3>
              <p className="text-gray-600">
                Đăng tin dễ dàng, tìm kiếm thông minh và giao dịch nhanh chóng
                chỉ trong vài bước
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cộng đồng lớn</h3>
              <p className="text-gray-600">
                Kết nối với hàng nghìn người dùng xe điện trên toàn quốc
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Danh mục sản phẩm
            </h2>
            <p className="text-lg text-gray-600">
              Khám phá các loại sản phẩm phong phú
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 center">
            {categories.map((category) => (
              <Link
                key={category.type}
                to={`/search?type=${category.type}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    {getCategoryIcon(category.type)}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {getCategoryName(category.type)}
                  </h3>
                  <p className="text-gray-600">{category.count} sản phẩm</p>
                </div>
              </Link>
            ))}
            {conditionCategories.map((category) => (
              <Link
                key={category.condition}
                to={`/search?condition=${category.condition}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow group"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    {getConditionIcon(category.condition)}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {getConditionName(category.condition)}
                  </h3>
                  <p className="text-gray-600">{category.count} sản phẩm</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Sản phẩm nổi bật
              </h2>
              <p className="text-gray-600">
                Những chiếc xe được quan tâm nhiều nhất
              </p>
            </div>
            <Link
              to="/search?featured=true"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Tin đăng mới nhất
              </h2>
              <p className="text-gray-600">
                Cập nhật liên tục những chiếc xe mới nhất
              </p>
            </div>
            <Link
              to="/search?sort=latest"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng bán xe của bạn?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Đăng tin miễn phí và tiếp cận hàng nghìn khách hàng tiềm năng
          </p>
          <Link
            to="/post-listing"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center space-x-2"
          >
            <span>Đăng tin ngay</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
