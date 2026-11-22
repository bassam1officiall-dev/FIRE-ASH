import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { PublicMenu } from './pages/PublicMenu';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { CashierPOS } from './pages/CashierPOS';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <MenuProvider>
        <CartProvider>
          <Routes>
            {/* Route 1: Public Digital Menu (Phase 1) */}
            <Route path="/" element={<PublicMenu />} />

            {/* Route 2: Unified Login (Manager / Cashier) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Route 3: Protected Admin Dashboard (Manager ONLY) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="manager">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Route 4: Protected Cashier POS Workspace (Manager & Cashier) */}
            <Route
              path="/cashier"
              element={
                <ProtectedRoute allowedRole="any">
                  <CashierPOS />
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
