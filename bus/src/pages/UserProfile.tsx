import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Flag,
  CreditCard,
  Camera,
  Edit2,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export function UserProfile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    nationality: '',
    national_id: '',
    profile_image: ''
  });
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalSpent: 0,
    averageRating: 0,
    memberSince: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        nationality: user.nationality,
        national_id: user.national_id,
        profile_image: user.profile_image || ''
      });
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      // Fetch total trips
      const { count: tripsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('user_id', user!.id);

      // Fetch total spent
      const { data: bookings } = await supabase
        .from('bookings')
        .select('amount')
        .eq('user_id', user!.id);

      const totalSpent = bookings?.reduce((sum, booking) => sum + booking.amount, 0) || 0;

      // Fetch average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('user_id', user!.id);

      const averageRating = reviews?.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      setStats({
        totalTrips: tripsCount || 0,
        totalSpent,
        averageRating,
        memberSince: new Date(user!.created_at).toLocaleDateString()
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        address: profileData.address
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      await updateProfile({ profile_image: publicUrl });
      setProfileData(prev => ({ ...prev, profile_image: publicUrl }));
      toast.success('Profile image updated');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-indigo-600">
            <div className="absolute -bottom-12 left-8">
              <div className="relative">
                {profileData.profile_image ? (
                  <img
                    src={profileData.profile_image}
                    alt={profileData.full_name}
                    className="w-24 h-24 rounded-full border-4 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <Camera className="w-4 h-4 text-gray-500" />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            {/* Profile Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.totalTrips}
                </p>
                <p className="text-sm text-gray-500">Total Trips</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  P{stats.totalSpent.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.averageRating.toFixed(1)}★
                </p>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.memberSince}
                </p>
                <p className="text-sm text-gray-500">Member Since</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  Personal Information
                </h2>
                <button
                  onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                  className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="bg-gray-50 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nationality
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Flag className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nationality"
                      value={profileData.nationality}
                      disabled
                      className="bg-gray-50 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    National ID
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="national_id"
                      value={profileData.national_id}
                      disabled
                      className="bg-gray-50 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}