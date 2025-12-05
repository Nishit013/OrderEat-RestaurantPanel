export interface Variant {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  category: string;
  rating?: number;
  votes?: number;
  variants?: Variant[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  selectedVariant?: Variant;
}

export interface Address {
  id: string;
  type: string;
  houseNo: string;
  area: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
  createdAt?: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  validForFirstOrder?: boolean;
}

export interface AdminSettings {
  taxRate: number;
  deliveryBaseFee: number;
  deliveryPerKm: number;
  platformCommission: number;
}

export interface FilterState {
  sortBy: 'Relevance' | 'Rating' | 'DeliveryTime' | 'CostLow' | 'CostHigh';
  rating: number | null;
  isVeg: boolean;
  hasOffers: boolean;
  costRange: [number, number] | null;
  cuisines: string[];
  deliveryTimeMax?: number;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  imageUrl?: string;
  isApproved: boolean;
  joinedAt: number;
}

export interface InspirationItem {
  id: string;
  name: string;
  image: string;
}

export interface GlobalOffer {
  isActive: boolean;
  text: string;
  subText?: string;
  gradientStart?: string;
  gradientEnd?: string;
  actionText?: string;
  textColor?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  email: string; // Restaurant Login Email
  phone: string;
  cuisine: string[];
  rating: number;
  deliveryTime: string; // Estimated by restaurant
  priceForTwo: number;
  imageUrl: string;
  menu: Record<string, MenuItem>;
  address: string;
  lat?: number;
  lng?: number;
  upiId?: string; // For settlements
  
  // Status Fields
  isOnline: boolean; // Toggled by Restaurant (Open/Close)
  isApproved: boolean; // Toggled by Admin
  promoted?: boolean;
  discount?: string;

  // Financial Overrides
  customTaxRate?: number;
  customDeliveryFee?: number;
  commissionRate?: number;
}

export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP', // Restaurant marks this
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Delivery Partner marks this
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  deliveryAddress: string;
  paymentMethod: 'COD' | 'ONLINE';
  paymentId?: string;
  deliveryPartner?: {
      id: string;
      name: string;
      phone: string;
      vehicleNumber: string;
  };
  ratings?: {
    restaurant: number;
    delivery: number;
  };
}