import { User, Vehicle, Review, Transaction } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Nguyễn Văn Minh',
  email: 'minh.nguyen@email.com',
  phone: '0901234567',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  joinDate: '2023-01-15',
  rating: 4.8,
  totalTransactions: 25
};

export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    title: 'VinFast VF8 Plus - Xe điện cao cấp',
    brand: 'VinFast',
    model: 'VF8 Plus',
    year: 2023,
    mileage: 15000,
    price: 1200000000,
    images: [
      'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=500',
    ],
    description: 'Xe điện VinFast VF8 Plus trong tình trạng rất tốt, bảo hành chính hãng còn 2 năm.',
    sellerId: '2',
    sellerName: 'Trần Thị Lan',
    sellerPhone: '0987654321',
    sellerRating: 4.9,
    location: 'Hà Nội',
    postedDate: '2024-01-10',
    category: 'car',
    batteryCapacity: 87.7,
    batteryCondition: 'Tốt (95%)',
    isFeatured: true,
    status: 'available'
  },
  {
    id: '2',
    title: 'Honda City 2022 - Sedan tiết kiệm',
    brand: 'Honda',
    model: 'City',
    year: 2022,
    mileage: 25000,
    price: 580000000,
    images: [
      'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=500',
    ],
    description: 'Honda City 2022 màu trắng, nội thất đen, máy 1.5L tiết kiệm nhiên liệu.',
    sellerId: '3',
    sellerName: 'Lê Văn Hùng',
    sellerPhone: '0912345678',
    sellerRating: 4.7,
    location: 'TP.HCM',
    postedDate: '2024-01-08',
    category: 'car',
    isFeatured: false,
    status: 'available'
  },
  {
    id: '3',
    title: 'Pin Lithium 60V-20Ah cho xe điện',
    brand: 'Panasonic',
    model: 'NCR18650B',
    year: 2023,
    mileage: 0,
    price: 8500000,
    images: [
      'https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=500',
    ],
    description: 'Pin Lithium chất lượng cao cho xe máy điện, còn bảo hành 18 tháng.',
    sellerId: '4',
    sellerName: 'Phạm Minh Đức',
    sellerPhone: '0934567890',
    sellerRating: 4.6,
    location: 'Đà Nẵng',
    postedDate: '2024-01-05',
    category: 'battery',
    batteryCapacity: 20,
    batteryCondition: 'Mới 100%',
    isFeatured: true,
    status: 'available'
  }
];

export const mockReviews: Review[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Nguyễn Văn Minh',
    userAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    rating: 5,
    comment: 'Xe rất đẹp, người bán nhiệt tình. Giao dịch suôn sẻ!',
    date: '2024-01-12',
    transactionId: 'tx1'
  },
  {
    id: '2',
    userId: '2',
    userName: 'Trần Thị Lan',
    userAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    rating: 4,
    comment: 'Pin chất lượng tốt, giao hàng nhanh chóng.',
    date: '2024-01-08',
    transactionId: 'tx2'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    vehicleId: '1',
    vehicleTitle: 'VinFast VF8 Plus - Xe điện cao cấp',
    buyerId: '1',
    sellerId: '2',
    amount: 1200000000,
    status: 'completed',
    date: '2024-01-12',
    paymentMethod: 'Chuyển khoản ngân hàng'
  },
  {
    id: 'tx2',
    vehicleId: '3',
    vehicleTitle: 'Pin Lithium 60V-20Ah cho xe điện',
    buyerId: '1',
    sellerId: '4',
    amount: 8500000,
    status: 'pending',
    date: '2024-01-08',
    paymentMethod: 'Ví điện tử'
  }
];

export const mockCategories = [
  { id: 'car', name: 'Ô tô điện', icon: 'Car', count: 156 },
  { id: 'battery', name: 'Pin xe điện', icon: 'Battery', count: 89 },
  { id: 'latest', name: 'Tin mới nhất', icon: 'Clock', count: 245 },
  { id: 'featured', name: 'Tin nổi bật', icon: 'Star', count: 34 }
];

export const mockFAQ = [
  {
    question: 'Làm thế nào để đăng tin bán xe?',
    answer: 'Bạn cần đăng ký tài khoản, sau đó vào mục "Đăng tin" và điền đầy đủ thông tin về xe cần bán.'
  },
  {
    question: 'Phí dịch vụ là bao nhiêu?',
    answer: 'Đăng tin miễn phí trong 30 ngày đầu. Các dịch vụ khác như tin VIP có phí riêng.'
  },
  {
    question: 'Làm sao để liên hệ với người bán?',
    answer: 'Bạn có thể gọi điện hoặc nhắn tin trực tiếp thông qua thông tin liên hệ trên tin đăng.'
  }
];