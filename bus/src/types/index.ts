export type UserRole = 'passenger' | 'driver' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  national_id: string;
  nationality: string;
  profile_image?: string;
  gender: 'male' | 'female' | 'other';
  created_at: string;
}

export interface Bus {
  id: string;
  company_id: string;
  name: string;
  registration_number: string;
  capacity: number;
  images: {
    exterior: string[];
    interior: string[];
  };
  current_location?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'maintenance' | 'inactive';
}

export interface BusCompany {
  id: string;
  name: string;
  logo: string;
  description: string;
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
  rating: number;
  total_reviews: number;
}

export interface Booking {
  id: string;
  user_id: string;
  bus_id: string;
  trip_id: string;
  seat_number: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  amount: number;
  created_at: string;
}

export interface Trip {
  id: string;
  bus_id: string;
  route_id: string;
  departure_time: string;
  arrival_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  current_stop?: string;
  price: number;
  available_seats: number[];
}

export interface Route {
  id: string;
  origin: string;
  destination: string;
  stops: {
    name: string;
    lat: number;
    lng: number;
  }[];
  distance: number;
  estimated_duration: number;
}