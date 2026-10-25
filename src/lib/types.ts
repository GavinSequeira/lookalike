export type Category = 'shoes' | 'perfumes';

export interface Alternative {
  slug?: string;
  name?: string;
  brand?: string;
  price?: number | null;
  currentPriceINR?: number | null;
  currency?: string;
  imageUrl?: string;
  buyUrl?: string;
  productUrl?: string;
  retailerUrl?: string;
}

export interface Product {
  slug: string;
  name: string;
  brand: string;
  category: Category;
  style?: string;
  price: number | null;
  currentPriceINR?: number | null;
  currency?: string;
  imageUrl?: string;
  buyUrl?: string;
  productUrl?: string;
  lastChecked?: string | null;
  verificationStatus?: string;
  priceVerificationStatus?: string;
  alternatives?: Alternative[];
}

export interface ProductDetail {
  alternatives: Alternative[];
  evidence: unknown[];
}

export interface AdminProduct {
  _id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number | null;
  currency: string;
  imageUrl: string;
  productUrl: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AdminProductInput = Omit<AdminProduct, '_id' | 'createdAt' | 'updatedAt' | 'price'> & {
  price: number | null;
};

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export type FeedbackTopic = 'general' | 'catalogue' | 'design' | 'prices' | 'account';

export interface FeedbackInput {
  name: string;
  email: string;
  rating: number;
  topic: FeedbackTopic;
  comments: string;
}

export interface FeedbackEntry {
  name: string;
  rating: number;
  comments: string;
  topic: string;
  submitted_at?: string;
}

export interface FeedbackStats {
  count: number;
  average: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface FileInfo {
  name: string;
  size: number;
  modified: string;
}
