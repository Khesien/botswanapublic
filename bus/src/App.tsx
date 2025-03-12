import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { UserProfile } from './pages/UserProfile';
import { BusSearch } from './components/BusSearch';
import { BusBooking } from './pages/BusBooking';
import { PaymentProcessor } from './components/PaymentProcessor';
import { Messaging } from './components/Messaging';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { CompanyProfile } from './pages/CompanyProfile';
import { AIWelcome } from './components/AIWelcome';
import { AIChat } from './components/AIChat';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={
                  <>
                    <AIWelcome isRegistered={false} />
                    <BusSearch />
                  </>
                } />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/bus-booking" element={<BusBooking />} />
                <Route path="/messages" element={<Messaging />} />
                <Route path="/payment" element={<PaymentProcessor />} />
                <Route path="/driver/dashboard" element={<DriverDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/company/:id" element={<CompanyProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <AIChat />
            <Toaster position="top-right" />
          </div>
        </Router>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;