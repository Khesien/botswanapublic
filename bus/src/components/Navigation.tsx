import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import {
  Home,
  Bus,
  MessageSquare,
  User,
  Settings,
  LogOut,
  BarChart,
  Map,
  HelpCircle
} from 'lucide-react';

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/buses', icon: Bus, label: 'Buses' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/map', icon: Map, label: 'Live Map' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // Additional items for drivers and managers
  const roleSpecificItems = user?.role === 'driver' ? [
    { path: '/driver/dashboard', icon: BarChart, label: 'Driver Dashboard' }
  ] : user?.role === 'manager' ? [
    { path: '/manager/dashboard', icon: BarChart, label: 'Company Dashboard' }
  ] : [];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Bus className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Smart Transport
              </span>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {[...navigationItems, ...roleSpecificItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    isActive(item.path)
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <item.icon className="w-5 h-5 mr-1" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter />
            
            <Link
              to="/settings"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <Settings className="w-6 h-6" />
            </Link>

            <Link
              to="/help"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <HelpCircle className="w-6 h-6" />
            </Link>

            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}