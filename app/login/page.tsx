"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLinkedIn = async () => {
    setLoading(true);
    window.location.href = "/api/auth/signin/linkedin";
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-4">
            <MapPin size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Social Mapper</h1>
          <p className="text-gray-400 text-sm mt-1">See where your network lives</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
          <p className="text-xs text-gray-500 text-center uppercase tracking-widest mb-4">
            Sign in to continue
          </p>

          <button
            onClick={handleLinkedIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#0A66C2" }}
          >
            <span className="font-bold text-base leading-none">in</span>
            Continue with LinkedIn
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-900 px-3 text-xs text-gray-600">or</span>
            </div>
          </div>

          <button
            onClick={() => { window.location.href = "/?demo=1"; }}
            className="w-full py-3 px-4 rounded-xl text-sm font-medium text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300 transition-colors"
          >
            Continue with demo account
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Your social graph is private — only you can see your connections.
        </p>
      </div>
    </div>
  );
}
