import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useMenu } from '../context/MenuContext';
import type { MenuItem, CategoryId, WeightOption } from '../types/menu';
import { compressImage } from '../utils/imageCompression';
import {
  ExternalLink,
  LogOut,
  Plus,
  Search,
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  CheckSquare,
  XSquare,
  Loader2,
  Scale,
  Sandwich,
  UtensilsCrossed,
  Salad,
  Flame,
  Receipt,
} from 'lucide-react';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

const CATEGORY_OPTIONS: { id: CategoryId; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'sandwiches', name: 'ساندوتشات', icon: Sandwich },
  { id: 'weights', name: 'الوزنات', icon: Scale },
  { id: 'meals', name: 'الوجبات', icon: UtensilsCrossed },
  { id: 'sides', name: 'الإضافات والسلطات', icon: Salad },
];

export const AdminDashboard: React.FC = () => {
  const {
    items,
    loading,
    isLive,
    firestoreItemCount,
    seedMenuItems,
    toggleAvailability,
    saveMenuItem,
    deleteMenuItem,
  } = useMenu();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast State
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Seed State
  const [seeding, setSeeding] = useState(false);

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields State
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    categoryId: CategoryId;
    price: number;
    description: string;
    image: string;
    imageUrl?: string;
    ingredientsText: string;
    badge: string;
    isAvailable: boolean;
    weights: WeightOption[];
  }>({
    name: '',
    categoryId: 'sandwiches',
    price: 0,
    description: '',
    image: '/images/dishes/sandwich-kofta.webp',
    imageUrl: '',
    ingredientsText: '',
    badge: '',
    isAvailable: true,
    weights: [],
  });

  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (selectedCategory !== 'all') {
      result = result.filter((i) => i.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.categoryName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, selectedCategory, searchQuery]);

  // Statistics
  const totalCount = items.length;
  const availableCount = items.filter((i) => i.isAvailable !== false).length;
  const unavailableCount = totalCount - availableCount;

  // Sign out handler
  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  // Handle Initial 1-Click Seed
  const handleSeed = async () => {
    if (seeding) return;
    try {
      setSeeding(true);
      await seedMenuItems();
      showToast('تم استيراد المنيو الأساسي (25 صنفاً) بنجاح إلى قاعدة البيانات!', 'success');
    } catch (err: any) {
      console.error('[AdminDashboard] Seed error:', err);
      showToast('حدث خطأ أثناء استيراد الأصناف: ' + (err.message || 'فشلت العملية'), 'error');
    } finally {
      setSeeding(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setFormData({
      name: '',
      categoryId: selectedCategory === 'all' ? 'sandwiches' : selectedCategory,
      price: 50,
      description: '',
      image: '/images/dishes/sandwich-kofta.webp',
      imageUrl: '',
      ingredientsText: '',
      badge: '',
      isAvailable: true,
      weights: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: MenuItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      description: item.description,
      image: item.image,
      imageUrl: item.imageUrl || '',
      ingredientsText: item.ingredients ? item.ingredients.join('، ') : '',
      badge: item.badge || '',
      isAvailable: item.isAvailable !== false,
      weights: item.weights ? JSON.parse(JSON.stringify(item.weights)) : [],
    });
    setIsModalOpen(true);
  };

  // Handle Image File Selection and Zero-Cost Canvas Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const compressedDataUrl = await compressImage(file, 720, 0.8);
      setFormData((prev) => ({
        ...prev,
        imageUrl: compressedDataUrl,
      }));
      showToast('تم ضغط الصورة وحفظها بنجاح (< 75KB)', 'info');
    } catch (err: any) {
      console.error('[AdminDashboard] Image compression error:', err);
      showToast('تعذر ضغط الصورة: ' + (err.message || 'صيغة غير مدعومة'), 'error');
    } finally {
      setCompressing(false);
      // Reset input value so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Dynamic weight rows management
  const addWeightRow = () => {
    setFormData((prev) => ({
      ...prev,
      weights: [
        ...prev.weights,
        {
          id: `w-${Date.now()}`,
          label: 'ربع كيلو',
          price: 100,
        },
      ],
    }));
  };

  const updateWeightRow = (index: number, field: 'label' | 'price', value: string | number) => {
    setFormData((prev) => {
      const nextWeights = [...prev.weights];
      nextWeights[index] = {
        ...nextWeights[index],
        [field]: value,
      };
      return { ...prev, weights: nextWeights };
    });
  };

  const removeWeightRow = (index: number) => {
    setFormData((prev) => {
      const nextWeights = prev.weights.filter((_, i) => i !== index);
      return { ...prev, weights: nextWeights };
    });
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('يرجى كتابة اسم الصنف', 'error');
      return;
    }

    const catMeta = CATEGORY_OPTIONS.find((c) => c.id === formData.categoryId);
    const categoryName = catMeta ? catMeta.name : 'ساندوتشات';

    const ingredients = formData.ingredientsText
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // If category is weights and has weight rows, base price defaults to first weight
    let finalPrice = Number(formData.price) || 0;
    if (formData.categoryId === 'weights' && formData.weights.length > 0) {
      finalPrice = formData.weights[0].price;
    }

    try {
      setSaving(true);
      const payload: Partial<MenuItem> & { id?: string } = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        categoryName,
        price: finalPrice,
        description: formData.description.trim(),
        image: formData.image || '/images/dishes/sandwich-kofta.webp',
        isAvailable: formData.isAvailable,
      };

      if (formData.id) payload.id = formData.id;
      if (formData.imageUrl) payload.imageUrl = formData.imageUrl;
      if (formData.badge.trim()) payload.badge = formData.badge.trim();
      if (ingredients.length > 0) payload.ingredients = ingredients;
      if (formData.categoryId === 'weights' && formData.weights.length > 0) {
        payload.weights = formData.weights;
      }

      await saveMenuItem(payload);
      setIsModalOpen(false);
      showToast('تم حفظ التعديلات وتحديث المنيو بنجاح', 'success');
    } catch (err: any) {
      console.error('[AdminDashboard] Save item error:', err);
      showToast('فشل حفظ الصنف: ' + (err.message || 'خطأ غير معروف'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Instant Availability Toggle
  const handleToggle = async (item: MenuItem) => {
    const current = item.isAvailable !== false;
    try {
      await toggleAvailability(item.id, current);
      showToast(
        current
          ? `تم تحويل «${item.name}» إلى غير متاح`
          : `تم تفعيل إتاحة «${item.name}» للطلب`,
        'info'
      );
    } catch (err: any) {
      console.error('[AdminDashboard] Toggle error:', err);
      showToast('تعذر تغيير حالة الصنف', 'error');
    }
  };

  // Handle Delete Item
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setDeleting(true);
      await deleteMenuItem(deleteConfirmItem.id);
      showToast(`تم حذف «${deleteConfirmItem.name}» بنجاح`, 'success');
      setDeleteConfirmItem(null);
    } catch (err: any) {
      console.error('[AdminDashboard] Delete error:', err);
      showToast('فشل حذف الصنف: ' + (err.message || 'خطأ غير معروف'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-['Cairo',sans-serif] selection:bg-[#D92D16] selection:text-white"
      dir="rtl"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 start-6 z-50 animate-bounce duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-[#D92D16] border-[#FF5A1F]'
                : toast.type === 'info'
                ? 'bg-[#1C1C21] border-[#FF5A1F]'
                : 'bg-[#141417] border-emerald-500'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-white" />
            ) : toast.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-[#FF5A1F]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#141417]/95 backdrop-blur-md border-b border-[#27272A] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#09090B] border border-[#27272A] p-1 flex items-center justify-center shadow-inner flex-shrink-0">
              <img
                src="/images/logo/fire-ash-logo.webp"
                alt="FIRE & ASH"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                  لوحة تحكم المدير
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D92D16]/20 text-[#FF5A1F] border border-[#D92D16]/30">
                  <Flame className="w-3 h-3" />
                  FIRE &amp; ASH
                </span>
              </div>
              <span className="text-[11px] text-[#A1A1AA] block">
                إدارة أصناف المنيو، الأسعار، وحالة التوفر المباشرة
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link
              to="/cashier"
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] border border-[#FF5A1F]/30 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-[#D92D16]/20"
              title="فتح نقطة بيع الكاشير"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>فتح الكاشير</span>
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-white transition-colors cursor-pointer"
              title="معاينة المنيو كما يظهر للعملاء"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span className="hidden xs:inline">عرض المنيو</span>
            </a>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] border border-[#27272A] text-xs font-bold text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D92D16]" />
              <span className="hidden xs:inline">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#71717A] block">إجمالي الأصناف</span>
              <span className="text-xl sm:text-2xl font-black text-white font-['Oswald'] tabular-nums">
                {totalCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1C1C21] flex items-center justify-center text-[#FF5A1F]">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#71717A] block">متاح للطلب</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-['Oswald'] tabular-nums">
                {availableCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1C1C21] flex items-center justify-center text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#71717A] block">غير متاح حالياً</span>
              <span className="text-xl sm:text-2xl font-black text-[#D92D16] font-['Oswald'] tabular-nums">
                {unavailableCount}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1C1C21] flex items-center justify-center text-[#D92D16]">
              <XSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#141417] border border-[#27272A] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#71717A] block">حالة المزامنة</span>
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {isLive ? 'سحابي مباشر' : 'محلي (احتياطي)'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#1C1C21] flex items-center justify-center text-[#FFB020]">
              <UploadCloud className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 1-Click Initial Seed Banner if Firestore has 0 docs */}
        {firestoreItemCount === 0 && !loading && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#141417] to-[#1C1C21] border border-[#FF5A1F]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D92D16]/20 border border-[#D92D16]/40 flex items-center justify-center text-[#FF5A1F] flex-shrink-0 mt-0.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  قاعدة البيانات السحابية جاهزة للتهيئة الأولى
                </h3>
                <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed max-w-2xl">
                  لم يتم استيراد الأصناف بعد إلى الفايربيس. اضغط الزر لاستيراد كامل المنيو المعتمد لـ FIRE &amp; ASH (25 صنفاً بكل الأوزان والأسعار) لتفعيل المزامنة المباشرة الفورية.
                </p>
              </div>
            </div>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-white font-bold text-xs shadow-lg shadow-[#D92D16]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0 active:scale-98"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الاستيراد...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>استيراد المنيو الأساسي (25 صنف)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Controls: Search, Category Filter & Add Item */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-[#D92D16] text-white shadow-md shadow-[#D92D16]/20'
                  : 'bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#27272A]'
              }`}
            >
              <span>الكل</span>
              <span className="text-[10px] font-mono opacity-80">({totalCount})</span>
            </button>

            {CATEGORY_OPTIONS.map((cat) => {
              const count = items.filter((i) => i.categoryId === cat.id).length;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#D92D16] text-white shadow-md shadow-[#D92D16]/20'
                      : 'bg-[#141417] text-[#A1A1AA] hover:text-white border border-[#27272A]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Add Item Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الصنف..."
                className="w-full bg-[#141417] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl py-2 ps-9 pe-8 text-xs text-white placeholder-[#71717A] focus:outline-none transition-colors"
              />
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-[#71717A]">
                <Search className="w-3.5 h-3.5" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 end-0 pe-2.5 flex items-center text-[#71717A] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={openCreateModal}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-white font-bold text-xs shadow-md shadow-[#D92D16]/20 transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف جديد</span>
            </button>
          </div>
        </div>

        {/* Items Grid / Table */}
        <div className="bg-[#141417] border border-[#27272A] rounded-2xl overflow-hidden shadow-xl">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-[#71717A] flex flex-col items-center justify-center">
              <Search className="w-8 h-8 text-[#FF5A1F] mb-2 opacity-50" />
              <p className="text-sm font-bold text-[#A1A1AA]">لم يتم العثور على أصناف مطابقة للبحث</p>
              <p className="text-xs text-[#52525B] mt-1">جرب تغيير شروط البحث أو مسح الفلتر</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-[#27272A] bg-[#0E0E11] text-[#A1A1AA] font-bold">
                    <th className="py-3 px-4">الصورة</th>
                    <th className="py-3 px-4">اسم الصنف والتفاصيل</th>
                    <th className="py-3 px-4">القسم</th>
                    <th className="py-3 px-4">السعر</th>
                    <th className="py-3 px-4 text-center">حالة التوفر</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]/60">
                  {filteredItems.map((item) => {
                    const isAvail = item.isAvailable !== false;
                    const hasWeights = Boolean(item.weights && item.weights.length > 0);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#1C1C21]/50 transition-colors group"
                      >
                        {/* Image */}
                        <td className="py-3 px-4 w-16">
                          <div className="w-12 h-12 rounded-xl bg-[#09090B] border border-[#27272A] overflow-hidden flex-shrink-0">
                            <img
                              src={item.imageUrl || item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  '/images/dishes/sandwich-kofta.webp';
                              }}
                            />
                          </div>
                        </td>

                        {/* Name & Desc */}
                        <td className="py-3 px-4 max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm group-hover:text-[#FF5A1F] transition-colors">
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D92D16]/20 text-[#FF5A1F] border border-[#D92D16]/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#A1A1AA] line-clamp-1 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-[#A1A1AA] text-[11px] font-medium">
                            {item.categoryName}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasWeights ? (
                            <div>
                              <span className="font-black text-white font-['Oswald'] text-sm tabular-nums">
                                {item.price} ج.م
                              </span>
                              <span className="text-[10px] text-[#71717A] block">
                                ({item.weights?.length} أوزان)
                              </span>
                            </div>
                          ) : (
                            <div className="font-black text-white font-['Oswald'] text-sm tabular-nums">
                              {item.price} <span className="text-xs font-normal text-[#FF5A1F]">ج.م</span>
                            </div>
                          )}
                        </td>

                        {/* 1-Tap Availability Toggle */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggle(item)}
                            className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isAvail
                                ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/60'
                                : 'bg-[#D92D16]/20 border border-[#D92D16]/50 text-[#FF5A1F] hover:bg-[#D92D16]/30'
                            }`}
                            title="انقر لتغيير التوفر فورياً"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isAvail ? 'bg-emerald-400' : 'bg-[#D92D16]'
                              }`}
                            />
                            <span>{isAvail ? 'متاح' : 'غير متاح'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              className="w-8 h-8 rounded-lg bg-[#09090B] hover:bg-[#27272A] text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors border border-[#27272A] cursor-pointer"
                              title="تعديل الصنف"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem(item)}
                              className="w-8 h-8 rounded-lg bg-[#09090B] hover:bg-[#D92D16]/20 text-[#71717A] hover:text-[#FF5A1F] flex items-center justify-center transition-colors border border-[#27272A] hover:border-[#D92D16]/40 cursor-pointer"
                              title="حذف الصنف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CRUD Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {modalMode === 'create' ? 'إضافة صنف جديد للمنيو' : `تعديل: ${editingItem?.name}`}
                </h3>
                <span className="text-[11px] text-[#A1A1AA]">
                  يتم تحديث المنيو فوراً بعد الحفظ
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#09090B] text-[#71717A] hover:text-white flex items-center justify-center border border-[#27272A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="mt-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                  اسم الصنف <span className="text-[#D92D16]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: ساندوتش كفتة مشوية"
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#52525B] focus:outline-none"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                    القسم <span className="text-[#D92D16]">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value as CategoryId })
                    }
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                    شارة ترويجية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="مثال: الأكثر طلباً، نكهة نار"
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#52525B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Price / Weights */}
              {formData.categoryId === 'weights' ? (
                <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#FF5A1F]" />
                      <span>أسعار الأوزان (ديناميكية):</span>
                    </span>
                    <button
                      type="button"
                      onClick={addWeightRow}
                      className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[#1C1C21] hover:bg-[#27272A] border border-[#27272A] text-[11px] font-bold text-[#FF5A1F] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة وزن جديد</span>
                    </button>
                  </div>

                  {formData.weights.length === 0 ? (
                    <p className="text-[11px] text-[#71717A]">
                      لم تتم إضافة أوزان بعد. اضغط «إضافة وزن جديد» لإدراج أوزان مثل (1/4 فرخة، 1/2 كيلو...).
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.weights.map((w, idx) => (
                        <div key={w.id || idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={w.label}
                            onChange={(e) => updateWeightRow(idx, 'label', e.target.value)}
                            placeholder="اسم الوزن (مثال: 1/4 كيلو)"
                            className="flex-1 bg-[#141417] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                          <div className="flex items-center gap-1 w-28">
                            <input
                              type="number"
                              min="0"
                              value={w.price}
                              onChange={(e) =>
                                updateWeightRow(idx, 'price', Number(e.target.value))
                              }
                              placeholder="السعر"
                              className="w-full bg-[#141417] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                            />
                            <span className="text-[10px] text-[#A1A1AA]">ج</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeWeightRow(idx)}
                            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#D92D16] hover:bg-[#1C1C21] transition-colors cursor-pointer"
                            title="حذف هذا الوزن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                    السعر الثابت (ج.م) <span className="text-[#D92D16]">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="50"
                    className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                  الوصف والمكونات
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب وصفاً جذاباً للصنف وطريقة شويه على الفحم..."
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#52525B] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Ingredients comma-separated */}
              <div>
                <label className="block text-xs font-bold text-[#A1A1AA] mb-1">
                  المكونات الرئيسية (افصل بينها بفاصلة)
                </label>
                <input
                  type="text"
                  value={formData.ingredientsText}
                  onChange={(e) => setFormData({ ...formData, ingredientsText: e.target.value })}
                  placeholder="مثال: كفتة بلدي، طحينة سمسم، بقدونس، خبز طازج"
                  className="w-full bg-[#09090B] border border-[#27272A] focus:border-[#FF5A1F] rounded-xl px-3 py-2 text-xs text-white placeholder-[#52525B] focus:outline-none"
                />
              </div>

              {/* Zero-Cost Image Upload (HTML5 Canvas Compression) */}
              <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    <span>صورة الصنف (ضغط تلقائي مجاني &lt; 75KB)</span>
                  </span>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="text-[11px] text-[#A1A1AA] hover:text-[#D92D16] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>إعادة للصورة الأصلية</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-xl bg-[#141417] border border-[#27272A] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src={formData.imageUrl || formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          '/images/dishes/sandwich-kofta.webp';
                      }}
                    />
                  </div>

                  {/* Upload Trigger */}
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={compressing}
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-[#1C1C21] hover:bg-[#27272A] border border-[#27272A] text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {compressing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5A1F]" />
                          <span>جاري ضغط ومعالجة الصورة...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-[#FF5A1F]" />
                          <span>رفع صورة من الجهاز أو الكاميرا</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-[#71717A] block mt-1">
                      يتم ضغط الصورة بتقنية WebP/Canvas وتخزينها مباشرة في الفايربيس دون تكلفة تخزين إضافية.
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#09090B] border-[#27272A] text-[#D92D16] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">
                    الصنف متاح للطلب على المنيو الديجيتال
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#27272A] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] text-[#A1A1AA] text-xs font-bold border border-[#27272A] transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving || compressing}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#D92D16] to-[#FF5A1F] hover:from-[#FF5A1F] hover:to-[#D92D16] text-white font-bold text-xs shadow-lg shadow-[#D92D16]/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed active:scale-98"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ والمزامنة...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>حفظ الصنف وتحديث المنيو</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#D92D16]/20 border border-[#D92D16]/40 text-[#FF5A1F] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              تأكيد حذف الصنف من المنيو
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6">
              هل أنت متأكد من حذف <strong className="text-white">«{deleteConfirmItem.name}»</strong>؟ لن يظهر هذا الصنف للعملاء بعد الحذف.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="py-2 px-4 rounded-xl bg-[#09090B] hover:bg-[#1C1C21] text-[#A1A1AA] text-xs font-bold border border-[#27272A] transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="py-2 px-4 rounded-xl bg-[#D92D16] hover:bg-[#FF5A1F] text-white text-xs font-bold shadow-md shadow-[#D92D16]/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <span>نعم، حذف الصنف</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
