/*
  # Initial Schema Setup for Smart Transport Botswana

  1. New Tables
    - users
    - bus_companies
    - buses
    - routes
    - trips
    - bookings
    - reviews
    - messages
    - notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('passenger', 'driver', 'manager', 'admin')),
  national_id text UNIQUE NOT NULL,
  nationality text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  profile_image text,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz
);

-- Bus Companies
CREATE TABLE bus_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text,
  description text,
  contact_info jsonb NOT NULL,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Buses
CREATE TABLE buses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES bus_companies(id),
  name text NOT NULL,
  registration_number text UNIQUE NOT NULL,
  capacity integer NOT NULL,
  images jsonb NOT NULL,
  current_location jsonb,
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at timestamptz DEFAULT now()
);

-- Routes
CREATE TABLE routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  stops jsonb NOT NULL,
  distance numeric NOT NULL,
  estimated_duration integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Trips
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id uuid REFERENCES buses(id),
  route_id uuid REFERENCES routes(id),
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  current_stop text,
  price numeric NOT NULL,
  available_seats integer[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  bus_id uuid REFERENCES buses(id),
  trip_id uuid REFERENCES trips(id),
  seat_number integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  bus_id uuid REFERENCES buses(id),
  company_id uuid REFERENCES bus_companies(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  content text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'voice', 'video', 'document')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  type text NOT NULL,
  content jsonb NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can read bus companies"
  ON bus_companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can read buses"
  ON buses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can read routes"
  ON routes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can read trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);