import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isManager } from '../utils/auth';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Destination redirect based on user role
  const navigateByRole = useCallback(
    (user: any) => {
      if (isManager(user)) {
        navigate(redirectParam || '/admin', { replace: true });
      } else {
        // Cashier role can only go to /cashier (or allowed non-admin redirect)
        const target = redirectParam && !redirectParam.startsWith('/admin') ? redirectParam : '/cashier';
        navigate(target, { replace: true });
      }
    },
    [navigate, redirectParam]
  );

  // If already logged in, redirect based on role
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigateByRole(user);
      }
    });
    return () => unsubscribe();
  }, [navigateByRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setErrorMessage('يرجى إدخال اسم المستخدم');
      return;
    }
    if (!password) {
      setErrorMessage('يرجى إدخال كلمة المرور');
      return;
    }

    if (!auth) {
      setErrorMessage('خدمة المصادقة غير مفعلة، تحقق من إعدادات فايربيس.');
      return;
    }

    // Normalize username: if no @, append @fireandash.local (e.g. manager -> manager@fireandash.local, cashier -> cashier@fireandash.local)
    const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@fireandash.local`;

    try {
      setLoading(true);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      navigateByRole(userCred.user);
    } catch (err: any) {
      console.error('[AdminLogin] Auth error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email'
      ) {
        setErrorMessage('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('محاولات دخول كثيرة، يرجى الانتظار قليلاً والمحاولة مجدداً');
      } else {
        setErrorMessage('تعذر تسجيل الدخول، يرجى التحقق من الاتصال والمحاولة ثانية');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col items-center justify-center p-4 font-['Cairo',sans-serif] selection:bg-[#D92D16] selection:text-white"
      dir="rtl"
    >
      {/* Background Ember Glow */}
      <div className="absolute top-1/4 -translate-y-1/2 w-96 h-96 bg-[#D92D16]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#141417] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#09090B] border border-[#27272A] p-1.5 mb-3 flex items-center justify-center shadow-inner">
            <img
              src="/images/logo/fire-ash-logo.webp"
              alt="FIRE & ASH"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            تسجيل دخول النظام
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            لوحة الإدارة ونقطة بيع الكاشير — مشويات FIRE &amp; ASH
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-[#D92D16]/15 border border-[#D92D16]/40 text-[#FAFAFA] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D92D16] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager أو cashier"
                disabled={loading}
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder-[#52525B] outline-none transition-colors disabled:opacity-50"
                dir="ltr"
              />
              <User className="w-4 h-4 text-[#71717A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[10px] text-[#52525B] mt-1 pr-1">
              أدخل <span className="text-[#FF5A1F]">manager</span> للوحة الإدارة، أو <span className="text-[#FF5A1F]">cashier</span> لنقطة البيع
            </p>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] rounded-xl py-2.5 pr-10 pl-10 text-sm text-white placeholder-[#52525B] outline-none transition-colors disabled:opacity-50"
                dir="ltr"
              />
              <Lock className="w-4 h-4 text-[#71717A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] active:bg-[#B91C1C] disabled:opacity-50 text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#D92D16]/20 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>دخول النظام</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link back to menu */}
        <div className="mt-6 pt-5 border-t border-[#27272A] flex items-center justify-between text-xs text-[#71717A]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة إلى المنيو الإلكتروني</span>
          </Link>
          <span className="text-[10px] text-[#52525B]">FIRE &amp; ASH v3.0</span>
        </div>
      </div>
    </div>
  );
};
