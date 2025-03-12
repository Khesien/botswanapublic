import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const stripePromise = loadStripe('your_publishable_key');

export function PaymentProcessor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tripId, seats, amount } = location.state || {};

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');

      // Create payment intent on your server
      const { data: session, error: sessionError } = await supabase
        .functions.invoke('create-payment-intent', {
          body: { amount, currency: 'BWP', tripId, seats }
        });

      if (sessionError) throw sessionError;

      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) throw result.error;

      // Payment successful
      toast.success('Payment successful!');
      navigate('/bookings');
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center mb-8">
            <CreditCard className="w-12 h-12 text-indigo-600" />
          </div>

          <h2 className="text-2xl font-bold text-center mb-8">
            Complete Your Payment
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Trip ID</span>
                  <span className="font-medium">{tripId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Seats</span>
                  <span className="font-medium">{seats?.join(', ')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-4">
                  <span>Total Amount</span>
                  <span>P{amount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <Lock className="w-4 h-4 mr-2" />
              Secured by Stripe Payment Gateway
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}