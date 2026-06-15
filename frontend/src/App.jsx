import React, { useState, useEffect } from 'react';
import BookingWizard from './components/BookingWizard';
import { Sparkles, Star, ShieldCheck, Flame, Rocket, Video } from 'lucide-react';

export default function App() {
  const [mockCheckoutDetails, setMockCheckoutDetails] = useState(null);

  // Check if we are on a mock checkout simulation route
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const isMockCheckout = window.location.pathname === '/mock-checkout';
    const bookingId = query.get('booking_id');
    const sessionId = query.get('session_id');

    if (isMockCheckout && bookingId && sessionId) {
      setMockCheckoutDetails({ bookingId, sessionId });
    }
  }, []);

  const handleConfirmMockCheckout = async () => {
    if (mockCheckoutDetails) {
      // Redirect to the root success page, passing the parameters
      window.location.href = `/?booking_id=${mockCheckoutDetails.bookingId}&session_id=${mockCheckoutDetails.sessionId}`;
    }
  };

  // Render Mock Stripe Checkout Page Simulation
  if (mockCheckoutDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#03001e] relative overflow-hidden">
        {/* Floating background glowing orbits */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10"></div>

        <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-cyan-500/20 text-center shadow-2xl relative">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-6">
            <Rocket className="w-8 h-8 animate-gravity-float" />
          </div>
          
          <h1 className="text-2xl font-black text-white mb-2">🪐 Stripe Simulation Port</h1>
          <p className="text-slate-400 text-sm mb-6">
            You are currently accessing the **Anti-Gravity Photo Booth** sandbox payment gateway. Click below to verify and complete transaction.
          </p>

          <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 text-left text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Booking Reference ID:</span>
              <span className="font-mono text-cyan-400 font-semibold">{mockCheckoutDetails.bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Gateway ID:</span>
              <span className="font-mono text-violet-400 font-semibold">{mockCheckoutDetails.sessionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-400 font-bold uppercase">Ready to Authorized</span>
            </div>
          </div>

          <button
            onClick={handleConfirmMockCheckout}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            Authorize Payment
          </button>
          
          <button
            onClick={() => { window.location.href = '/' }}
            className="w-full py-2.5 mt-3 rounded-xl font-bold text-xs text-slate-400 hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  // Standard Landing Page Layout wrapping the Wizard
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Decorative stars */}
      <div className="absolute top-1/4 left-1/12 w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse-slow"></div>
      <div className="absolute top-1/3 right-1/8 w-2 h-2 bg-violet-400 rounded-full opacity-60 animate-bounce"></div>
      <div className="absolute bottom-1/4 left-1/5 w-1 h-1 bg-cyan-400 rounded-full opacity-35 animate-ping"></div>

      {/* Main Body */}
      <main className="flex-1 pb-16">
        <BookingWizard />
      </main>

      {/* Features Showcase Footer */}
      <div className="glass-panel border-t border-white/5 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-cyan-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Gravity-Defying Rig</h4>
              <p className="text-slate-400 text-xs mt-0.5">3D multi-axis camera mounts that float around your guests.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-violet-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Real-Time Sharing</h4>
              <p className="text-slate-400 text-xs mt-0.5">Instant live uploads to phone via email, SMS, or QR codes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-950/20 border border-pink-500/20 text-pink-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Stripe Secured Payments</h4>
              <p className="text-slate-400 text-xs mt-0.5">Industry-standard secure checkout sessions & refund configs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
