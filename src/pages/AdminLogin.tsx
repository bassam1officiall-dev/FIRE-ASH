import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in, redirect directly to /admin
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/admin', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

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

    // Normalize username: if no @, append @fireandash.local
    const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@fireandash.local`;

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('[AdminLogin] Auth error:', err);
      // Clean Arabic error messages
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
            تسجيل دخول الإدارة
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            لوحة تحكم مشويات FIRE &amp; ASH — البدرشين
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-[#D92D16]/15 border border-[#D92D16]/40 text-[#FAFAFA] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FF5A1F] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager"
                autoComplete="username"
                dir="ltr"
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl py-2.5 ps-10 pe-4 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors text-left font-mono"
              />
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[#71717A]">
                <User className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[11px] text-[#71717A] mt-1 block">
              أدخل اسم المستخدم فقط (مثال: manager) دون الحاجة لكتابة بريد إلكتروني
            </span>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-[#A1A1AA] mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                dir="ltr"
                className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl py-2.5 ps-10 pe-11 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors text-left font-mono"
              />
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[#71717A]">
                <Lock className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-[#71717A] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-white font-bold text-sm shadow-lg shadow-[#D92D16]/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>تسجيل الدخول إلى الإدارة</span>
              </>
            )}
          </button>
        </form>

        {/* Return to menu */}
        <div className="mt-6 pt-5 border-t border-[#27272A] text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-white transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة إلى المنيو العام</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
