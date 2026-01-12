import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../../components/Icons';

const PasswordResetConfirm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Check if we have the reset token
    const token = searchParams.get('token');
    
    if (!token) {
      setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      const token = searchParams.get('token');
      
      // Update password using the reset token
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      
      // Auto-login after successful password reset
      setTimeout(async () => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Icons.Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
            تم إعادة تعيين كلمة المرور بنجاح!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            سيتم توجيهك إلى صفحة تسجيل الدخول...
          </p>
          <div className="flex justify-center">
            <Icons.Loader className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  const token = searchParams.get('token');
  if (!token || error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Icons.AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
            رابط غير صالح
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية'}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/reset-password')}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              طلب رابط جديد
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
            <div className="text-center">
              <Icons.Unlock className="h-12 w-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">تعيين كلمة مرور جديدة</h1>
              <p className="text-green-100">
                أدخل كلمة المرور الجديدة لحسابك
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="اختر كلمة مرور قوية"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  6 أحرف على الأقل
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تأكيد كلمة المرور *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    كلمات المرور غير متطابقة
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Icons.Info className="h-4 w-4 text-blue-600 ml-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">نصائح لكلمة مرور قوية:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>استخدم 8 أحرف على الأقل</li>
                      <li>اجمع بين الأحرف الكبيرة والصغيرة</li>
                      <li>أضف أرقاماً ورموزاً</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <Icons.AlertCircle className="h-4 w-4 text-red-600 ml-2" />
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.password || !formData.confirmPassword}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Icons.Loader className="h-4 w-4 ml-2 animate-spin" />
                    جاري التعيين...
                  </>
                ) : (
                  <>
                    <Icons.Check className="h-4 w-4 ml-2" />
                    تعيين كلمة المرور الجديدة
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              تذكرت كلمة المرور؟{' '}
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

export default PasswordResetConfirm;