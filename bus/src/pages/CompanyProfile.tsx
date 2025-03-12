import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Bus,
  Users,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import type { BusCompany, Bus, Review } from '../types';

export function CompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<BusCompany | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'buses' | 'reviews'>('buses');

  useEffect(() => {
    if (!id) return;
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('bus_companies')
        .select('*')
        .eq('id', id)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData);

      // Fetch company buses
      const { data: busesData, error: busesError } = await supabase
        .from('buses')
        .select('*')
        .eq('company_id', id);

      if (busesError) throw busesError;
      setBuses(busesData);

      // Fetch company reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:users(full_name, profile_image)
        `)
        .eq('company_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-48 bg-indigo-600">
            {company.logo && (
              <img
                src={company.logo}
                alt={company.name}
                className="absolute bottom-0 left-8 transform translate-y-1/2 w-32 h-32 rounded-lg border-4 border-white bg-white object-cover"
              />
            )}
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {company.name}
                </h1>
                <div className="mt-2 flex items-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="ml-1 text-gray-600">
                    {company.rating.toFixed(1)} ({company.total_reviews} reviews)
                  </span>
                </div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Follow Company
              </button>
            </div>

            <p className="mt-4 text-gray-600">{company.description}</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {company.contact_info.address}
                </span>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {company.contact_info.phone}
                </span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-gray-600">
                  {company.contact_info.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'buses'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('buses')}
              >
                <Bus className="w-5 h-5 inline mr-2" />
                Buses
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('reviews')}
              >
                <MessageSquare className="w-5 h-5 inline mr-2" />
                Reviews
              </button>
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'buses' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buses.map((bus) => (
                  <div
                    key={bus.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    {bus.images.exterior[0] && (
                      <img
                        src={bus.images.exterior[0]}
                        alt={bus.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{bus.name}</h3>
                      <p className="text-gray-500">
                        Reg: {bus.registration_number}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-1" />
                          <span className="text-gray-600">
                            {bus.capacity} seats
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            bus.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : bus.status === 'maintenance'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {bus.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-start">
                      <img
                        src={review.user.profile_image || 'https://via.placeholder.com/40'}
                        alt={review.user.full_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{review.user.full_name}</h4>
                          <div className="flex items-center">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 text-yellow-400"
                                fill="currentColor"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-gray-600">{review.comment}</p>
                        <div className="mt-4 flex items-center space-x-4">
                          <button className="flex items-center text-gray-500 hover:text-gray-700">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Helpful
                          </button>
                          <button className="flex items-center text-gray-500 hover:text-gray-700">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}