import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
});

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'vendor' | 'outlet_staff' | 'admin';
  user_type: string;
  campus_id?: string;
};

export type Outlet = {
  id: number;
  name: string;
  slug: string;
  description: string;
  location: string;
  status: string;
  crowd_level: 'LOW' | 'MODERATE' | 'HIGH';
  avg_wait_min: number;
  available_tables: number;
};

export type Food = {
  id: number;
  outlet_id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  prep_minutes: number;
  dietary_type: 'veg' | 'non_veg';
  is_jain: boolean;
  is_available: boolean;
  available_quantity: number | null;
  rating?: number;
  is_popular?: boolean;
  outlet_name?: string;
};

export type Order = {
  id: number;
  order_number: string;
  outlet_id: number;
  outlet_name: string;
  pickup_counter: string;
  status: 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  total: number;
  created_at: string;
  pickup_type?: 'immediate' | 'scheduled';
  scheduled_time?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price?: number;
    line_total?: number;
  }>;
};

export type Table = {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  location: string;
  reserved_by?: string;
  expires_at?: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  timestamp: string;
  type: 'order' | 'pickup' | 'rush' | 'announcement';
  read: boolean;
};

export type HardwareStatus = {
  device_id: string;
  device_model: string;
  ip_address: string;
  status: 'online' | 'offline' | 'syncing';
  last_sync: string;
  canteen_terminal: string;
  active_printer: boolean;
  queued_tickets: number;
  uptime_hours: number;
};

export type CanteenStatus = {
  campus: string;
  crowd_level: 'LOW' | 'MODERATE' | 'HIGH';
  average_wait_minutes: number;
  available_tables: number;
  total_tables: number;
  active_outlets_count: number;
  rush_period: string;
  outlets: Array<{
    id: number;
    name: string;
    location: string;
    crowd_level: 'LOW' | 'MODERATE' | 'HIGH';
    avg_wait_min: number;
    status: string;
  }>;
};
