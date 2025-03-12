import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  Users,
  Bus,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeTrips: 0,
    averageRating: 0,
    busUtilization: 0,
    onTimePerformance: 0,
    customerSatisfaction: 0,
    emergencyIncidents: 0
  });

  const [charts, setCharts] = useState({
    revenue: {
      labels: [],
      datasets: []
    },
    bookings: {
      labels: [],
      datasets: []
    },
    utilization: {
      labels: [],
      datasets: []
    },
    satisfaction: {
      labels: [],
      datasets: []
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    try {
      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('bookings')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('payment_status', 'paid');

      // Fetch bookings data
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch active trips
      const { data: activeTrips } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'in_progress');

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('reviews')
        .select('rating, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculate metrics
      const totalRevenue = revenueData?.reduce((sum, booking) => sum + booking.amount, 0) || 0;
      const totalBookings = bookingsData?.length || 0;
      const averageRating = ratingsData?.reduce((sum, review) => sum + review.rating, 0) / (ratingsData?.length || 1);

      setMetrics({
        totalRevenue,
        totalBookings,
        activeTrips: activeTrips?.length || 0,
        averageRating,
        busUtilization: calculateBusUtilization(activeTrips),
        onTimePerformance: calculateOnTimePerformance(activeTrips),
        customerSatisfaction: (averageRating / 5) * 100,
        emergencyIncidents: 0 // This would come from incidents table
      });

      // Update charts
      updateCharts(revenueData, bookingsData, ratingsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const calculateBusUtilization = (trips: any[]) => {
    if (!trips?.length) return 0;
    const totalSeats = trips.reduce((sum, trip) => sum + trip.available_seats.length, 0);
    const occupiedSeats = trips.reduce((sum, trip) => sum + (trip.capacity - trip.available_seats.length), 0);
    return (occupiedSeats / totalSeats) * 100;
  };

  const calculateOnTimePerformance = (trips: any[]) => {
    if (!trips?.length) return 0;
    const onTimeTrips = trips.filter(trip => {
      const scheduledArrival = new Date(trip.arrival_time);
      const actualArrival = new Date(trip.actual_arrival_time || trip.arrival_time);
      const diffInMinutes = (actualArrival.getTime() - scheduledArrival.getTime()) / (1000 * 60);
      return diffInMinutes <= 10; // Consider 10 minutes delay as on-time
    });
    return (onTimeTrips.length / trips.length) * 100;
  };

  const updateCharts = (revenueData: any[], bookingsData: any[], ratingsData: any[]) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const labels = Array.from({ length: days }, (_, i) => {
      return format(subDays(new Date(), days - 1 - i), 'MMM dd');
    });

    const revenueByDay = labels.map(label => {
      const dayData = revenueData?.filter(booking => 
        format(new Date(booking.created_at), 'MMM dd') === label
      );
      return dayData?.reduce((sum, booking) => sum + booking.amount, 0) || 0;
    });

    const bookingsByDay = labels.map(label => {
      return bookingsData?.filter(booking => 
        format(new Date(booking.created_at), 'MMM dd') === label
      ).length || 0;
    });

    const satisfactionByDay = labels.map(label => {
      const dayRatings = ratingsData?.filter(review =>
        format(new Date(review.created_at), 'MMM dd') === label
      );
      const average = dayRatings?.reduce((sum, review) => sum + review.rating, 0) / (dayRatings?.length || 1);
      return (average / 5) * 100;
    });

    setCharts({
      revenue: {
        labels,
        datasets: [{
          label: 'Revenue (BWP)',
          data: revenueByDay,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        }]
      },
      bookings: {
        labels,
        datasets: [{
          label: 'Bookings',
          data: bookingsByDay,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      utilization: {
        labels,
        datasets: [{
          label: 'Bus Utilization (%)',
          data: Array(days).fill(metrics.busUtilization),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      satisfaction: {
        labels,
        datasets: [{
          label: 'Customer Satisfaction (%)',
          data: satisfactionByDay,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={() => fetchAnalytics()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-xl font-semibold text-gray-900">
                  P{metrics.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bus Utilization</p>
                <p className="text-xl font-semibold text-gray-900">
                  {metrics.busUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">On-Time Performance</p>
                <p className="text-xl font-semibold text-gray-900">
                  {metrics.onTimePerformance.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Customer Satisfaction</p>
                <p className="text-xl font-semibold text-gray-900">
                  {metrics.customerSatisfaction.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-80">
              <Bar
                data={charts.revenue}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => `P${value}`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Trend</h3>
            <div className="h-80">
              <Line
                data={charts.bookings}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bus Utilization</h3>
            <div className="h-80">
              <Line
                data={charts.utilization}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (value) => `${value}%`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Satisfaction</h3>
            <div className="h-80">
              <Line
                data={charts.satisfaction}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        callback: (value) => `${value}%`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}