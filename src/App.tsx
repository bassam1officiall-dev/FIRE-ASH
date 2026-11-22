import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { PublicMenu } from './pages/PublicMenu';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MenuProvider>
        <CartProvider>
          <Routes>
            {/* Route 1: Public Digital Menu */}
            <Route path="/" element={<PublicMenu />} />

            {/* Route 2: Admin Login */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Route 3: Protected Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </MenuProvider>
    </BrowserRouter>
  );
};

export default App;
