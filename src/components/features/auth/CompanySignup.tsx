import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../../components/Icons';

interface CompanyData {
  companyName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  planId: string;
}

interface FormData {
  companyName: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
}

const CompanySignup: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [companyData, setCompanyData] = useState<FormData>({
    companyName: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
  });

  const plans = [
    { id: 'free', name: 'مجاني', description: 'حتى 3 مستخدمين، 50 شحنة شهرياً', price: '0$' },
    { id: 'starter', name: 'بداية', description: 'حتى 10 مستخدمين، 500 شحنة شهرياً', price: '29$' },
    { id: 'professional', name: 'احترافي', description: 'حتى 50 مستخدم، 5000 شحنة شهرياً', price: '99$' },
    { id: 'enterprise', name: 'مؤسسة', description: 'مستخدمون غير محدودين، شحنات غير محدودة', price: '299$' },
  ];

  const [selectedPlan, setSelectedPlan] = useState('starter');

  // Auto-generate slug from company name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCompanyNameChange = (name: string) => {
    setCompanyData(prev => ({
      ...prev,
      companyName: name,
      slug: generateSlug(name),
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return companyData.companyName && companyData.slug && companyData.adminName;
      case 2:
        return companyData.adminEmail && 
               companyData.adminPassword && 
               companyData.confirmPassword &&
               companyData.adminPassword === companyData.confirmPassword &&
               companyData.adminPassword.length >= 6;
      case 3:
        return true; // Plan is always selected
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    } else {
      setError('يرجى إكمال جميع الحقول المطلوبة');
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the create-tenant edge function
      const { data, error } = await supabase.functions.invoke('create-tenant', {
        body: {
          companyName: companyData.companyName,
          slug: companyData.slug,
          adminEmail: companyData.adminEmail,
          adminPassword: companyData.adminPassword,
          planId: selectedPlan,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Auto-login the new admin user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: companyData.adminEmail,
        password: companyData.adminPassword,
      });

      if (loginError) {
        throw new Error('تم إنشاء الشركة بنجاح، ولكن فشل تسجيل الدخول. يرجى المحاولة يدوياً.');
      }

      // Navigate to dashboard
      navigate('/manager');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">معلومات الشركة الأساسية</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          اسم الشركة *
        </label>
        <input
          type="text"
          value={companyData.companyName}
          onChange={(e) => handleCompanyNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="مثال: شركة النقل السريع"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          الرمز المميز (Slug) *
        </label>
        <input
          type="text"
          value={companyData.slug}
          onChange={(e) => setCompanyData(prev => ({ ...prev, slug: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="example-company"
          dir="ltr"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          يستخدم لعنوان التطبيق (example-company.yourapp.com)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          اسم المدير *
        </label>
        <input
          type="text"
          value={companyData.adminName}
          onChange={(e) => setCompanyData(prev => ({ ...prev, adminName: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="مثال: أحمد محمد"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">معلومات حساب المدير</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          البريد الإلكتروني *
        </label>
        <input
          type="email"
          value={companyData.adminEmail}
          onChange={(e) => setCompanyData(prev => ({ ...prev, adminEmail: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="admin@company.com"
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          كلمة المرور *
        </label>
        <input
          type="password"
          value={companyData.adminPassword}
          onChange={(e) => setCompanyData(prev => ({ ...prev, adminPassword: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="اختر كلمة مرور قوية"
          dir="ltr"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          6 أحرف على الأقل
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          تأكيد كلمة المرور *
        </label>
        <input
          type="password"
          value={companyData.confirmPassword}
          onChange={(e) => setCompanyData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="أعد إدخال كلمة المرور"
          dir="ltr"
        />
        {companyData.confirmPassword && companyData.adminPassword !== companyData.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            كلمات المرور غير متطابقة
          </p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">اختر الباقة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {plan.name}
              </h4>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 my-2">
                {plan.price}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">إنشاء شركة جديدة</h1>
                <p className="text-blue-100">انضم إلى منصتنا لإدارة الشحنات</p>
              </div>
              <Icons.Truck className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          {/* Progress Steps */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">معلومات الشركة</span>
              <span className="text-gray-600 dark:text-gray-400">حساب المدير</span>
              <span className="text-gray-600 dark:text-gray-400">الباقة</span>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <Icons.AlertCircle className="h-5 w-5 text-red-600 ml-2" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <div>
                {step > 1 && (
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    السابق
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!validateStep()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <Icons.Loader className="h-4 w-4 ml-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Icons.Check className="h-4 w-4 ml-2" />
                        إنشاء الشركة
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySignup;