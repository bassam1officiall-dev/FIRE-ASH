import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('fire_ash_cart_v1');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center p-6 text-center" dir="rtl">
          <div className="max-w-md w-full bg-[#141417] border border-[#27272A] rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#D92D16]/10 border border-[#D92D16]/30 flex items-center justify-center text-[#FF5A1F]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-white">حدث خطأ غير متوقع</h1>
            <p className="text-[#A1A1AA] text-sm leading-relaxed mb-6">
              نعتذر عن هذا الخطأ المؤقت في تحميل منيو FIRE & ASH. تم عزل المشكلة تلقائياً لمنع توقف التطبيق.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#D92D16] hover:bg-[#FF5A1F] text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة تحميل الصفحة
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-[#1C1C21] hover:bg-[#27272A] text-[#A1A1AA] text-xs rounded-xl transition-colors cursor-pointer"
              >
                مسح البيانات المؤقتة وإعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
