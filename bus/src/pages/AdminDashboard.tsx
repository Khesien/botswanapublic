import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart as BarChartIcon,
  Users,
  Bus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Map,
  Settings
} from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTrips: 0,
    totalRevenue: 0,
    busUtilization: 0,
    alerts: [],
    recentBookings: []
  });

  const [chartData, setChartData] = useState({
    revenue: {
      labels: [],
      datasets: []
    },
    bookings: {
      labels: [],
      datasets: []
    }
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Fetch active trips
      const { data: activeTrips } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'in_progress');

      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('bookings')
        .select('amount, created_at')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      // Fetch alerts
      const { data: alerts } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'alert')
        .order('created_at', { ascending: false })
        .limit(5);

      // Update stats
      setStats({
        totalUsers: userCount || 0,
        activeTrips: activeTrips?.length || 0,
        totalRevenue: revenueData?.reduce((sum, booking) => sum + booking.amount, 0) || 0,
        busUtilization: calculateBusUtilization(activeTrips),
        alerts: alerts || [],
        recentBookings: revenueData?.slice(0, 5) || []
      });

      // Update chart data
      updateChartData(revenueData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const calculateBusUtilization = (trips) => {
    if (!trips?.length) return 0;
    const totalSeats = trips.reduce((sum, trip) => sum + trip.available_seats.length, 0);
    const occupiedSeats = trips.reduce((sum, trip) => sum + (trip.capacity - trip.available_seats.length), 0);
    return (occupiedSeats / totalSeats) * 100;
  };

  const updateChartData = (revenueData) => {
    // Process data for charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const revenueByDay = last7Days.map(date => ({
      date,
      revenue: revenueData?.filter(booking => 
        booking.created_at.startsWith(date)
      ).reduce((sum, booking) => sum + booking.amount, 0) || 0
    }));

    setChartData({
      revenue: {
        labels: revenueByDay.map(d => d.date),
        datasets: [{
          label: 'Daily Revenue (BWP)',
          data: revenueByDay.map(d => d.revenue),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      },
      bookings: {
        labels: last7Days,
        datasets: [{
          label: 'Daily Bookings',
          data: last7Days.map(date => 
            revenueData?.filter(booking => 
              booking.created_at.startsWith(date)
            ).length || 0
          ),
          borderColor: 'rgb(34, 197, 94)',
          tension: 0.1,
          fill: false
        }]
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bus className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Trips
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.activeTrips}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      P{stats.totalRevenue.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChartIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bus Utilization
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.busUtilization.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64">
              <Bar data={chartData.revenue} options={{
                responsive: true,
                maintainAspectRatio: false
              }} />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Trend</h3>
            <div className="h-64">
              <Line data={chartData.bookings} options={{
                responsive: true,
                maintainAspectRatio: false
              }} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h3>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats.alerts.map((alert, index) => (
                    <li key={index} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {alert.content.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {alert.content.message}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {stats.recentBookings.map((booking, index) => (
                    <li key={index} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Booking #{booking.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Amount: P{booking.amount}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          {new Date(booking.created_at).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}