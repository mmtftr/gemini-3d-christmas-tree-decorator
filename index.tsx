import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConvexClientProvider } from './lib/convex';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import { LoginPage, SignupPage } from './pages';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConvexClientProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </AuthProvider>
      </ConvexClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);