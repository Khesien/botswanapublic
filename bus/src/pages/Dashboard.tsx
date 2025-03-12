import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  Star,
  AlertTriangle,
  Bus,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import type { Booking, Trip } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch upcoming trips
      const { data: trips } = await supabase
        .from('trips')
        .select(`
          *,
          bus:buses(*),
          route:routes(*)
        `)
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true })
        .limit(5);

      setUpcomingTrips(trips || []);

      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(*),
          bus:buses(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentBookings(bookings || []);

      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setNotifications(notifs || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with your travel plans
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Upcoming Trips */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Upcoming Trips
              </h2>
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <Bus className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {trip.route.origin} → {trip.route.destination}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {format(new Date(trip.departure_time), 'PPP')}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {format(new Date(trip.departure_time), 'p')}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {trip.status}
                      </span>
                    </div>
                  </div>
                ))}
                {upcomingTrips.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No upcoming trips
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Recent Bookings
              </h2>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <CreditCard className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Booking #{booking.id.slice(0, 8)}
                      </p>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        Seat {booking.seat_number}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Star className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        P{booking.amount}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No recent bookings
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Notifications
              </h2>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.content.title || 'Notification'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {notification.content.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {format(
                          new Date(notification.created_at),
                          'MMM d, yyyy HH:mm'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No new notifications
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}