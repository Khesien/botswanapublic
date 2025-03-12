import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Clock, MapPin, Users, CreditCard } from 'lucide-react';
import type { Trip, Bus, Route } from '../types';

export function BusBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const searchParams = location.state as { from: string; to: string; date: string; passengers: number };

  useEffect(() => {
    if (!searchParams) return;
    
    const fetchTrips = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          bus:buses(*),
          route:routes(*)
        `)
        .eq('route.origin', searchParams.from)
        .eq('route.destination', searchParams.to)
        .gte('departure_time', searchParams.date)
        .lt('departure_time', new Date(new Date(searchParams.date).getTime() + 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching trips:', error);
        return;
      }

      setTrips(data);
    };

    fetchTrips();
  }, [searchParams]);

  const handleSeatSelection = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else if (selectedSeats.length < searchParams.passengers) {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleBooking = async () => {
    if (!user || !selectedTrip || selectedSeats.length === 0) return;

    try {
      const bookings = selectedSeats.map(seat => ({
        user_id: user.id,
        trip_id: selectedTrip.id,
        bus_id: selectedTrip.bus_id,
        seat_number: seat,
        amount: selectedTrip.price,
        status: 'pending',
        payment_status: 'pending'
      }));

      const { error } = await supabase
        .from('bookings')
        .insert(bookings);

      if (error) throw error;

      navigate('/payment', { 
        state: { 
          tripId: selectedTrip.id,
          seats: selectedSeats,
          amount: selectedTrip.price * selectedSeats.length
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Available Buses</h2>
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-colors ${
                  selectedTrip?.id === trip.id ? 'ring-2 ring-indigo-600' : ''
                }`}
                onClick={() => setSelectedTrip(trip)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{(trip.bus as Bus).name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(trip.departure_time).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {(trip.route as Route).distance} km
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {trip.available_seats.length} seats available
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">
                      P{trip.price}
                    </p>
                    <p className="text-sm text-gray-500">per person</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTrip && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Select Seats</h3>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {Array.from({ length: (selectedTrip.bus as Bus).capacity }, (_, i) => i + 1).map((seat) => (
                <button
                  key={seat}
                  className={`p-2 rounded ${
                    selectedTrip.available_seats.includes(seat)
                      ? selectedSeats.includes(seat)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  onClick={() => handleSeatSelection(seat)}
                  disabled={!selectedTrip.available_seats.includes(seat)}
                >
                  {seat}
                </button>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Selected Seats</span>
                <span>{selectedSeats.join(', ') || 'None'}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span>Total Amount</span>
                <span className="font-bold">
                  P{selectedTrip.price * selectedSeats.length}
                </span>
              </div>
              <button
                onClick={handleBooking}
                disabled={selectedSeats.length === 0}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Proceed to Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}