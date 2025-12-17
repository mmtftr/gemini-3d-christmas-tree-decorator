import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    const result = await signup({ email, password, name: name || undefined });
    if (result.success) {
      navigate('/');
    }
  };

  const displayError = localError || error;

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
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {displayError}
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearError();
                }}
                className="float-right text-red-400/70 hover:text-red-400"
              >
                &times;
              </button>
            </div>
          )}

          {/* Name Field */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-gray-500">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
                transition-all duration-200
              "
            />
          </div>

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
          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/5 border border-white/10
                text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
                transition-all duration-200
              "
            />
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Terms */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            By signing up, you agree to our{' '}
            <a href="#" className="text-green-400 hover:text-green-300">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-green-400 hover:text-green-300">Privacy Policy</a>
          </p>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-green-400 hover:text-green-300 font-medium transition-colors"
            >
              Sign in
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
