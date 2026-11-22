import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { isManager } from '../../utils/auth';
import { Flame, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRole?: 'manager' | 'any';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole = 'any',
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4 font-['Cairo',sans-serif]"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#141417] border border-[#27272A] flex items-center justify-center text-[#FF5A1F] shadow-lg shadow-black/40">
            <Flame className="w-7 h-7 animate-pulse text-[#FF5A1F]" />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#A1A1AA] font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#D92D16]" />
            <span>جاري التحقق من الصلاحيات والاتصال...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: redirect to login with return path
  if (!user) {
    const redirectQuery = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?redirect=${redirectQuery}`} replace />;
  }

  // Role separation: If manager role is strictly required, non-managers redirect to /cashier
  if (allowedRole === 'manager' && !isManager(user)) {
    return <Navigate to="/cashier" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
