import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Calendar, Users, MapPin } from 'lucide-react';
import type { Route } from '../types';

export function BusSearch() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    passengers: 1
  });
  const [suggestions, setSuggestions] = useState<{
    from: string[];
    to: string[];
  }>({
    from: [],
    to: []
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data: routes } = await supabase
      .from('routes')
      .select('origin, destination');

    if (routes) {
      const locations = Array.from(new Set([
        ...routes.map(route => route.origin),
        ...routes.map(route => route.destination)
      ])).sort();
      setLocations(locations);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));

    if (field === 'from' || field === 'to') {
      const filtered = locations.filter(location =>
        location.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ ...prev, [field]: filtered }));
    }
  };

  const handleSuggestionClick = (field: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
  };

  const handleSearch = () => {
    navigate('/bus-booking', { state: searchParams });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchParams.from}
              onChange={(e) => handleInputChange('from', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pl-10"
              placeholder="Departure City"
            />
            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {suggestions.from.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
              {suggestions.from.map((location) => (
                <button
                  key={location}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => handleSuggestionClick('from', location)}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchParams.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pl-10"
              placeholder="Destination City"
            />
            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {suggestions.to.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
              {suggestions.to.map((location) => (
                <button
                  key={location}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  onClick={() => handleSuggestionClick('to', location)}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={searchParams.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pl-10"
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passengers
          </label>
          <div className="relative">
            <input
              type="number"
              value={searchParams.passengers}
              min="1"
              max="10"
              onChange={(e) => handleInputChange('passengers', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg pl-10"
            />
            <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSearch}
          disabled={!searchParams.from || !searchParams.to || !searchParams.date}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Search className="w-5 h-5 mr-2" />
          Search Buses
        </button>
      </div>
    </div>
  );
}