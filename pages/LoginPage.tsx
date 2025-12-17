import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-green-400">Christmas</span> Tree Shop
            </h1>
          </Link>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
              <button
                type="button"
                onClick={clearError}
                className="float-right text-red-400/70 hover:text-red-400"
              >
                &times;
              </button>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
                transition-all duration-200
              "
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
                transition-all duration-200
              "
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-3 px-4 rounded-xl
              bg-green-600 hover:bg-green-500
              disabled:bg-green-600/50 disabled:cursor-not-allowed
              text-white font-semibold
              shadow-lg shadow-green-500/25
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
            "
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </form>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            &larr; Back to Tree Decorator
          </Link>
        </p>
      </div>
    </div>
  );
}
