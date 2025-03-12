import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Navigation
} from 'lucide-react';
import type { Trip, User } from '../types';

export function DriverDashboard() {
  const { user } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<User[]>([]);
  const [nextStop, setNextStop] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');

  useEffect(() => {
    if (!user) return;
    fetchCurrentTrip();
    const tripSubscription = supabase
      .channel('trip_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `bus_id=eq.${user.bus_id}`,
      }, fetchCurrentTrip)
      .subscribe();

    return () => {
      tripSubscription.unsubscribe();
    };
  }, [user]);

  const fetchCurrentTrip = async () => {
    if (!user) return;

    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        bus:buses(*),
        route:routes(*),
        bookings:bookings(
          user:users(*)
        )
      `)
      .eq('bus_id', user.bus_id)
      .in('status', ['scheduled', 'in_progress'])
      .order('departure_time', { ascending: true })
      .limit(1)
      .single();

    if (tripError) {
      console.error('Error fetching trip:', tripError);
      return;
    }

    if (tripData) {
      setCurrentTrip(tripData);
      setPassengers(tripData.bookings.map(booking => booking.user));
      updateTripStatus(tripData);
    }
  };

  const updateTripStatus = (trip: Trip) => {
    const now = new Date();
    const departureTime = new Date(trip.departure_time);
    const arrivalTime = new Date(trip.arrival_time);

    if (now < departureTime) {
      setTripStatus('not_started');
    } else if (now >= departureTime && now <= arrivalTime) {
      setTripStatus('in_progress');
    } else {
      setTripStatus('completed');
    }
  };

  const updateCurrentStop = async (stopName: string) => {
    if (!currentTrip) return;

    try {
      const { error } = await supabase
        .from('trips')
        .update({ current_stop: stopName })
        .eq('id', currentTrip.id);

      if (error) throw error;

      setNextStop(stopName);

      // Notify passengers
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(
          passengers.map(passenger => ({
            user_id: passenger.id,
            type: 'stop_update',
            content: {
              message: `Bus has arrived at ${stopName}`,
              trip_id: currentTrip.id
            }
          }))
        );

      if (notificationError) throw notificationError;
    } catch (error) {
      console.error('Error updating stop:', error);
    }
  };

  const reportEmergency = async (type: string, description: string) => {
    if (!currentTrip) return;

    try {
      // Create emergency report
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: 'emergency',
          content: {
            type,
            description,
            trip_id: currentTrip.id,
            location: currentTrip.current_location
          }
        });

      if (error) throw error;

      // Notify passengers
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(
          passengers.map(passenger => ({
            user_id: passenger.id,
            type: 'emergency_alert',
            content: {
              message: `Emergency reported: ${type}. Please stay calm and follow crew instructions.`,
              trip_id: currentTrip.id
            }
          }))
        );

      if (notificationError) throw notificationError;
    } catch (error) {
      console.error('Error reporting emergency:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Driver Dashboard
              </h2>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            {currentTrip ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="font-medium">Current Location</span>
                      </div>
                      <span className="text-sm text-blue-600">
                        {currentTrip.current_stop || 'Not started'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-green-500 mr-2" />
                        <span className="font-medium">Passengers</span>
                      </div>
                      <span className="text-sm text-green-600">
                        {passengers.length} on board
                      </span>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-purple-500 mr-2" />
                        <span className="font-medium">Trip Status</span>
                      </div>
                      <span className="text-sm text-purple-600">
                        {tripStatus === 'not_started' ? 'Not Started' :
                         tripStatus === 'in_progress' ? 'In Progress' :
                         'Completed'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Passenger List</h3>
                    <div className="space-y-3">
                      {passengers.map((passenger) => (
                        <div
                          key={passenger.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center">
                            {passenger.profile_image ? (
                              <img
                                src={passenger.profile_image}
                                alt={passenger.full_name}
                                className="w-8 h-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{passenger.full_name}</p>
                              <p className="text-sm text-gray-500">
                                {passenger.nationality}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {/* Handle passenger check-in */}}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {/* Handle passenger removal */}}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Trip Controls</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Current Stop
                        </label>
                        <select
                          className="w-full border-gray-300 rounded-md shadow-sm"
                          onChange={(e) => updateCurrentStop(e.target.value)}
                          value={currentTrip.current_stop || ''}
                        >
                          <option value="">Select stop</option>
                          {currentTrip.route.stops.map((stop, index) => (
                            <option key={index} value={stop.name}>
                              {stop.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <button
                          onClick={() => reportEmergency('mechanical', 'Bus mechanical issue')}
                          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
                        >
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Report Emergency
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => {/* Handle navigation */}}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Navigation className="w-5 h-5 mr-2" />
                          Open Navigation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Trips
                </h3>
                <p className="text-gray-500">
                  You don't have any scheduled or ongoing trips at the moment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}