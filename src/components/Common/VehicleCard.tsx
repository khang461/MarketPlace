import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, Gauge, Battery } from 'lucide-react';
import { Vehicle } from '../../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  showFavorite?: boolean;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, showFavorite = true }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('vi-VN').format(mileage);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative">
        <img
          src={vehicle.images[0]}
          alt={vehicle.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {vehicle.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
            Nổi bật
          </div>
        )}
        {showFavorite && (
          <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>
        )}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {vehicle.images.length} ảnh
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/vehicle/${vehicle.id}`}>
          <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {vehicle.title}
          </h3>
        </Link>

        <p className="text-2xl font-bold text-blue-600 mb-3">
          {formatPrice(vehicle.price)}
        </p>

        {/* Vehicle Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Năm {vehicle.year}</span>
            </div>
            {vehicle.category === 'car' && (
              <div className="flex items-center space-x-1">
                <Gauge className="w-4 h-4" />
                <span>{formatMileage(vehicle.mileage)} km</span>
              </div>
            )}
          </div>

          {vehicle.batteryCapacity && (
            <div className="flex items-center space-x-1">
              <Battery className="w-4 h-4" />
              <span>Pin {vehicle.batteryCapacity}kWh - {vehicle.batteryCondition}</span>
            </div>
          )}

          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{vehicle.location}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">{vehicle.sellerName}</span>
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium">{vehicle.sellerRating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;