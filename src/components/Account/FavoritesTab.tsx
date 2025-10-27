import React from "react";
import { Heart } from "lucide-react";

const FavoritesTab: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Sản phẩm yêu thích</h2>
      </div>

      <div className="text-center py-8">
        <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Chưa có sản phẩm yêu thích</p>
      </div>
    </div>
  );
};

export default FavoritesTab;
