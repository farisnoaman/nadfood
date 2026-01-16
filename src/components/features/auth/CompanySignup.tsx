import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../../components/Icons';
import logger from '../../../utils/logger';

interface FormData {
  companyName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  max_users: number | null;
  max_drivers: number | null;
  max_shipments: number | null;
  monthly_price: number;
}

const CompanySignup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');

  const [companyData, setCompanyData] = useState<FormData>({
    companyName: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Read plan from URL params if present
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl && plans.length > 0) {
      const matchingPlan = plans.find(p => p.id === planFromUrl);
      if (matchingPlan) {
        setSelectedPlan(matchingPlan.id);
      }
    }
  }, [searchParams, plans]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.from('subscription_plans' as any).select('*').order('monthly_price', { ascending: true });
      if (error) throw error;
      const plansData = (data || []) as SubscriptionPlan[];
      setPlans(plansData);
      if (plansData.length > 0 && !selectedPlan) {
        setSelectedPlan(plansData[0].id);
      }
    } catch (err) {
      logger.error('Error fetching plans:', err);
      setError('فشل تحميل باقات الاشتراك. يرجى المحاولة لاحقاً.');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  };

  const handleCompanyNameChange = (name: string) => {
    setCompanyData(prev => ({ ...prev, companyName: name, slug: generateSlug(name) }));
  };

  const validateStep = () => {
    switch (step) {
      case 1: return companyData.companyName && companyData.slug && companyData.adminName;
      case 2: return companyData.adminEmail && companyData.adminPassword && companyData.confirmPassword && companyData.adminPassword === companyData.confirmPassword && companyData.adminPassword.length >= 6;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => { if (validateStep()) { setStep(step + 1); } else { setError('يرجى إكمال جميع الحقول المطلوبة'); } };
  const handlePrevious = () => { setStep(step - 1); setError(null); };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-tenant', {
        body: { companyName: companyData.companyName, slug: companyData.slug, adminEmail: companyData.adminEmail, adminPassword: companyData.adminPassword, planId: selectedPlan }
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const { error: loginError } = await supabase.auth.signInWithPassword({ email: companyData.adminEmail, password: companyData.adminPassword });
      if (loginError) throw new Error('تم إنشاء الشركة بنجاح، ولكن فشل تسجيل الدخول.');

      const currentHost = window.location.host;
      const isLocalhost = currentHost.includes('localhost') || currentHost.includes('127.0.0.1');
      if (isLocalhost) {
        const port = window.location.port;
        window.location.href = `http://${companyData.slug}.localhost${port ? ':' + port : ''}/manager`;
      } else {
        const baseDomain = currentHost.split('.').slice(-2).join('.');
        window.location.href = `https://${companyData.slug}.${baseDomain}/manager`;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium";
  const labelClasses = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2";

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <label className={labelClasses}>اسم الشركة *</label>
        <input type="text" value={companyData.companyName} onChange={(e) => handleCompanyNameChange(e.target.value)} className={inputClasses} placeholder="مثال: شركة النقل السريع" />
      </div>
      <div>
        <label className={labelClasses}>الرمز المميز (Slug) *</label>
        <input type="text" value={companyData.slug} onChange={(e) => setCompanyData(prev => ({ ...prev, slug: e.target.value }))} className={inputClasses} placeholder="example-company" dir="ltr" />
        <p className="mt-2 text-sm text-slate-500">يُستخدم في عنوان التطبيق: <span className="font-mono text-emerald-600">{companyData.slug || 'your-company'}.nadfood.com</span></p>
      </div>
      <div>
        <label className={labelClasses}>اسم المدير *</label>
        <input type="text" value={companyData.adminName} onChange={(e) => setCompanyData(prev => ({ ...prev, adminName: e.target.value }))} className={inputClasses} placeholder="مثال: أحمد محمد" />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <label className={labelClasses}>البريد الإلكتروني *</label>
        <input type="email" value={companyData.adminEmail} onChange={(e) => setCompanyData(prev => ({ ...prev, adminEmail: e.target.value }))} className={inputClasses} placeholder="admin@company.com" dir="ltr" />
      </div>
      <div>
        <label className={labelClasses}>كلمة المرور *</label>
        <input type="password" value={companyData.adminPassword} onChange={(e) => setCompanyData(prev => ({ ...prev, adminPassword: e.target.value }))} className={inputClasses} placeholder="اختر كلمة مرور قوية (6 أحرف على الأقل)" dir="ltr" />
      </div>
      <div>
        <label className={labelClasses}>تأكيد كلمة المرور *</label>
        <input type="password" value={companyData.confirmPassword} onChange={(e) => setCompanyData(prev => ({ ...prev, confirmPassword: e.target.value }))} className={inputClasses} placeholder="أعد إدخال كلمة المرور" dir="ltr" />
        {companyData.confirmPassword && companyData.adminPassword !== companyData.confirmPassword && (
          <p className="mt-2 text-sm text-red-500 font-medium">كلمات المرور غير متطابقة</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      {plans.length === 0 ? (
        <div className="text-center py-8"><Icons.Loader className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-1 ${selectedPlan === plan.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-xl shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
              {index === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">الأكثر شعبية</div>}
              <div className="text-center">
                <h4 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h4>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 my-3">
                  {plan.monthly_price === 0 ? 'مجاني' : `${plan.monthly_price.toLocaleString()}`}
                  {plan.monthly_price > 0 && <span className="text-sm text-slate-400 font-medium"> ر.ي/شهر</span>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {plan.max_users ? `${plan.max_users} مستخدم` : 'مستخدمون ∞'} • {plan.max_drivers ? `${plan.max_drivers} سائق` : 'سائقون ∞'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-center py-12 px-4">
      {/* Background Elements */}
      <div className="fixed top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -left-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Logo & Back */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Icons.Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">ناد<span className="text-emerald-500">فود</span></span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">إنشاء شركة جديدة</h1>
                <p className="text-emerald-100 mt-1">انضم إلى منصتنا لإدارة الشحنات بكفاءة</p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                <Icons.Building className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[1, 2, 3].map((stepNumber, i) => (
                <React.Fragment key={stepNumber}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= stepNumber ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                    {step > stepNumber ? <Icons.Check className="w-5 h-5" /> : stepNumber}
                  </div>
                  {i < 2 && <div className={`flex-1 h-1 mx-2 rounded-full ${step > stepNumber ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              <span>معلومات الشركة</span>
              <span>حساب المدير</span>
              <span>اختيار الباقة</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
                <Icons.AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <div>
                {step > 1 && (
                  <button onClick={handlePrevious} className="px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
                    <Icons.ArrowRight className="w-4 h-4" />
                    السابق
                  </button>
                )}
              </div>
              <div>
                {step < 3 ? (
                  <button onClick={handleNext} disabled={!validateStep()} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                    التالي
                    <Icons.ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 disabled:opacity-50 transition-all flex items-center gap-2">
                    {loading ? <><Icons.Loader className="h-5 w-5 animate-spin" /> جاري الإنشاء...</> : <><Icons.Check className="h-5 w-5" /> إنشاء الشركة</>}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold">تسجيل الدخول</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySignup;