
import React, { useState, useEffect, useRef } from 'react';
import Calculator from './components/Calculator';
import PlanGrid from './components/PlanGrid';
import KetoPlanView from './components/KetoPlanView';
import Keto1100PlanView from './components/Keto1100PlanView';
import Keto1300PlanView from './components/Keto1300PlanView';
import Keto1500PlanView from './components/Keto1500PlanView';
import Keto1700PlanView from './components/Keto1700PlanView';
import Keto1900PlanView from './components/Keto1900PlanView';
import Keto2100PlanView from './components/Keto2100PlanView';
import Balanced1100PlanView from './components/Balanced1100PlanView';
import Balanced1300PlanView from './components/Balanced1300PlanView';
import Balanced1500PlanView from './components/Balanced1500PlanView';
import Balanced1700PlanView from './components/Balanced1700PlanView';
import Balanced1900PlanView from './components/Balanced1900PlanView';
import Balanced2100PlanView from './components/Balanced2100PlanView';
import LowCarb1100PlanView from './components/LowCarb1100PlanView';
import LowCarb1300PlanView from './components/LowCarb1300PlanView';
import LowCarb1500PlanView from './components/LowCarb1500PlanView';
import LowCarb1700PlanView from './components/LowCarb1700PlanView';
import LowCarb1900PlanView from './components/LowCarb1900PlanView';
import LowCarb2100PlanView from './components/LowCarb2100PlanView';
import { IconKeto, IconSun, IconMoon } from './components/Icons';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const [recommendedCalories, setRecommendedCalories] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Auth integration - ensures secure data access
  const { isReady, error: authError } = useAuth();

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCalculation = (calories: number) => {
    setRecommendedCalories(calories);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSelectPlan = (planId: string) => {
    // Validate plan ID
    const validPlans = [
      'keto-2000', 'keto-1100', 'keto-1300', 'keto-1500', 
      'keto-1700', 'keto-1900', 'keto-2100',
      'balanced-1100', 'balanced-1300', 'balanced-1500', 
      'balanced-1700', 'balanced-1900', 'balanced-2100',
      'low-carb-1100', 'low-carb-1300', 'low-carb-1500', 
      'low-carb-1700', 'low-carb-1900', 'low-carb-2100'
    ];
    
    if (validPlans.includes(planId)) {
      setSelectedPlanId(planId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('تفاصيل هذه الخطة ستكون متاحة قريباً!');
    }
  };

  // Show loading state while authenticating
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show error state if auth failed
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            خطأ في الاتصال
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // Plan view component mapping - DRY principle
  const planViews: Record<string, React.ReactNode> = {
    'keto-2000': <KetoPlanView onBack={() => setSelectedPlanId(null)} />,
    'keto-1100': <Keto1100PlanView onBack={() => setSelectedPlanId(null)} />,
    'keto-1300': <Keto1300PlanView onBack={() => setSelectedPlanId(null)} />,
    'keto-1500': <Keto1500PlanView onBack={() => setSelectedPlanId(null)} />,
    'keto-1700': <Keto1700PlanView onBack={() => setSelectedPlanId(null)} />,
    'keto-1900': <Keto1900PlanView onBack={() => setSelectedPlanId(null)} />,
    'keto-2100': <Keto2100PlanView onBack={() => setSelectedPlanId(null)} />,
    'balanced-1100': <Balanced1100PlanView onBack={() => setSelectedPlanId(null)} />,
    'balanced-1300': <Balanced1300PlanView onBack={() => setSelectedPlanId(null)} />,
    'balanced-1500': <Balanced1500PlanView onBack={() => setSelectedPlanId(null)} />,
    'balanced-1700': <Balanced1700PlanView onBack={() => setSelectedPlanId(null)} />,
    'balanced-1900': <Balanced1900PlanView onBack={() => setSelectedPlanId(null)} />,
    'balanced-2100': <Balanced2100PlanView onBack={() => setSelectedPlanId(null)} />,
    'low-carb-1100': <LowCarb1100PlanView onBack={() => setSelectedPlanId(null)} />,
    'low-carb-1300': <LowCarb1300PlanView onBack={() => setSelectedPlanId(null)} />,
    'low-carb-1500': <LowCarb1500PlanView onBack={() => setSelectedPlanId(null)} />,
    'low-carb-1700': <LowCarb1700PlanView onBack={() => setSelectedPlanId(null)} />,
    'low-carb-1900': <LowCarb1900PlanView onBack={() => setSelectedPlanId(null)} />,
    'low-carb-2100': <LowCarb2100PlanView onBack={() => setSelectedPlanId(null)} />,
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-950 text-white selection:bg-purple-500 selection:text-white' : 'bg-slate-50 text-gray-900 selection:bg-purple-100 selection:text-purple-900'} pb-20`}>
      {/* Background Texture */}
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 ${isDarkMode ? 'opacity-10' : 'opacity-40'}`} style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '32px 32px', color: isDarkMode ? '#4c1d95' : '#e9d5ff' }}></div>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-900/80 border-gray-800 text-white' : 'bg-white/80 border-purple-100 text-gray-900'} backdrop-blur-lg`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSelectedPlanId(null)}>
            <div className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-purple-600 text-white group-hover:bg-purple-500' : 'bg-purple-600 text-white group-hover:bg-purple-700'}`}>
              <IconKeto className="w-5 h-5" />
            </div>
            <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="text-purple-700 dark:text-purple-400">دليلي</span> <span className="text-emerald-600 dark:text-emerald-400">الغذائي</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 text-sm font-bold">
              <button onClick={() => setSelectedPlanId(null)} className={`transition-colors ${isDarkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-500 hover:text-purple-600'}`}>الرئيسية</button>
              <a href="#" className={`transition-colors ${isDarkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'}`}>عن الأنظمة</a>
            </nav>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-12 md:pt-16">
        {selectedPlanId && planViews[selectedPlanId] ? (
          planViews[selectedPlanId]
        ) : (
          <>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className={`text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                اكتشف النظام الغذائي <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-emerald-500">
                   المثالي لجسدك
                </span>
              </h2>
              <p className={`text-lg md:text-xl leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                أدخل بياناتك بدقة وسنقوم بحساب احتياجك اليومي من السعرات الحرارية واقتراح أفضل الخطط الغذائية التي تناسب أهدافك الصحية.
              </p>
            </div>

            <div className="transform hover:scale-[1.01] transition-transform duration-500">
              <Calculator onCalculate={handleCalculation} />
            </div>

            <div ref={resultsRef}>
              <PlanGrid recommendedCalories={recommendedCalories} onSelectPlan={handleSelectPlan} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`relative z-10 mt-32 border-t py-12 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-purple-100'}`}>
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4 opacity-70 grayscale hover:grayscale-0 transition-all">
             <IconKeto className="w-6 h-6 text-purple-600" />
             <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>دليلي الغذائي</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
          <p className="text-gray-500 text-xs max-w-md mx-auto leading-relaxed">
            تنبيه: المعلومات المقدمة في هذا التطبيق هي للأغراض التثقيفية فقط ولا تغني عن استشارة الطبيب أو أخصائي التغذية المختص قبل البدء في أي نظام غذائي جديد.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
