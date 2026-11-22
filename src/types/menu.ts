export const MENU_VERSION = '1.0.0';

export interface WeightOption {
  id: string;
  label: string;
  price: number;
}

export type CategoryId = 'sandwiches' | 'weights' | 'meals' | 'sides';

export type CravingType = 'all' | 'quick-sandwich' | 'filling-meal' | 'weight-grills' | 'sides';

export interface MenuItem {
  id: string;
  name: string;
  categoryId: CategoryId;
  categoryName: string;
  price: number;
  description: string;
  image: string;
  imageUrl?: string;
  weights?: WeightOption[];
  ingredients?: string[];
  badge?: string;
  cravings: CravingType[];
  isPopular?: boolean;
  isSignature?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface AddOnOption {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  selectedWeight?: WeightOption;
  selectedAddOns: AddOnOption[];
  notes: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = 'delivery' | 'pickup';

export interface OrderFormState {
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
}

export interface RestaurantInfo {
  name: string;
  slogan: string;
  subSlogans: string[];
  phone: string;
  phoneDisplay: string;
  whatsappLink: string;
  address: string;
  facebookUrl: string;
  hours: string;
}
