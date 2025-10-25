import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid, List, SlidersHorizontal } from "lucide-react";
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
  tradeMethod?: string;
  status: string;
  createdAt: string;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12,
  });

  const [filters, setFilters] = useState({
    make: searchParams.get("make") || "",
    model: searchParams.get("model") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    year: searchParams.get("year") || "",
    mileageKm: searchParams.get("mileageKm") || "",
    batteryCapacityKWh: searchParams.get("batteryCapacityKWh") || "",
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
    condition: searchParams.get("condition") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const makes = ["Tesla", "VinFast", "Honda", "Toyota", "Hyundai", "BYD"];
  const years = [2024, 2023, 2022, 2021, 2020];
  const cities = ["Hà Nội", "HCM", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];
  const conditions = [
    { value: "", label: "Tất cả" },
    { value: "New", label: "Mới" },
    { value: "LikeNew", label: "Như mới" },
    { value: "Used", label: "Đã qua sử dụng" },
  ];
  const sortOptions = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "priceAsc", label: "Giá thấp đến cao" },
    { value: "priceDesc", label: "Giá cao đến thấp" },
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);

        const params: Record<string, string> = {
          page: searchParams.get("page") || "1",
          limit: "12",
          sortBy: filters.sortBy,
        };

        if (filters.make) params.make = filters.make;
        if (filters.model) params.model = filters.model;
        if (filters.year) params.year = filters.year;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.mileageKm) params.mileageKm = filters.mileageKm;
        if (filters.batteryCapacityKWh)
          params.batteryCapacityKWh = filters.batteryCapacityKWh;
        if (filters.city) params.city = filters.city;
        if (filters.district) params.district = filters.district;
        if (filters.condition) params.condition = filters.condition;

        const searchQuery = searchParams.get("q");
        if (searchQuery) params.keyword = searchQuery;

        const response = await api.get("/listings", { params });

        console.log("Listings response:", response.data);

        setListings(response.data.listings || []);
        setPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 12,
          }
        );

        const convertedVehicles: Vehicle[] = response.data.listings.map(
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
            images: listing.photos.map((p) => `http://localhost:8081${p.url}`),
            postedDate: listing.createdAt,
            status:
              listing.condition === "LikeNew"
                ? "available"
                : listing.status.toLowerCase(),
            sellerId: listing.sellerId._id,
            isFeatured: false,
          })
        );

        setFilteredVehicles(convertedVehicles);
      } catch (error) {
        console.error("Error fetching listings:", error);
        setFilteredVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [filters, searchParams]);

  useEffect(() => {
    // This useEffect is now handled by the API fetch above
    // Keeping it empty to avoid breaking the component structure
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters({
      make: "",
      model: "",
      minPrice: "",
      maxPrice: "",
      year: "",
      mileageKm: "",
      batteryCapacityKWh: "",
      city: "",
      district: "",
      condition: "",
      sortBy: "newest",
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tìm kiếm sản phẩm
            </h1>
            <p className="text-gray-600 mt-1">
              Tìm thấy {filteredVehicles.length} kết quả
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-blue-600"
                } rounded-l-lg transition-colors`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-blue-600"
                } rounded-r-lg transition-colors`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div
            className={`lg:w-80 ${showFilters ? "block" : "hidden lg:block"}`}
          >
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Bộ lọc tìm kiếm</h2>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Xóa bộ lọc
                </button>
              </div>

              <div className="space-y-4">
                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model xe
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập model"
                    value={filters.model}
                    onChange={(e) =>
                      handleFilterChange("model", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Make (Hãng xe) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hãng xe
                  </label>
                  <select
                    value={filters.make}
                    onChange={(e) => handleFilterChange("make", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả hãng</option>
                    {makes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Khoảng giá (VNĐ)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Từ"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Đến"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Năm sản xuất
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả</option>
                    {years.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mileage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số km đã chạy (tối đa)
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 50000"
                    value={filters.mileageKm}
                    onChange={(e) =>
                      handleFilterChange("mileageKm", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Battery Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dung lượng pin (kWh)
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 75"
                    value={filters.batteryCapacityKWh}
                    onChange={(e) =>
                      handleFilterChange("batteryCapacityKWh", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thành phố
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tất cả thành phố</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quận/Huyện
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập quận/huyện"
                    value={filters.district}
                    onChange={(e) =>
                      handleFilterChange("district", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tình trạng xe
                  </label>
                  <select
                    value={filters.condition}
                    onChange={(e) =>
                      handleFilterChange("condition", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {conditions.map((cond) => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sắp xếp theo
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy kết quả
                </h3>
                <p className="text-gray-600">
                  Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Tìm thấy <strong>{pagination.totalCount}</strong> kết quả
                </div>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
