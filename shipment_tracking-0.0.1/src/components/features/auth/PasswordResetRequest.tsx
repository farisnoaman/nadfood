import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../../components/Icons';

const PasswordResetRequest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-green-50 dark:bg-green-900/20 p-8 text-center">
              <Icons.Mail className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                تم إرسال رابط إعادة التعيين
              </h1>
              <p className="text-green-700 dark:text-green-300 mb-6">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                يرجى التحقق من بريدك الإلكتروني والنقر على الرابط لإعادة تعيين كلمة المرور
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                  <Icons.Clock className="h-4 w-4 ml-2" />
                  <span>قد تستغرق العملية بضع دقائق للوصول</span>
                </div>
                
                <div className="flex justify-center space-x-4 space-x-reverse">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    العودة لتسجيل الدخول
                  </button>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    إرسال مرة أخرى
                  </button>
                </div>
              </div>
            </div>
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="text-center">
              <Icons.Lock className="h-12 w-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">إعادة تعيين كلمة المرور</h1>
              <p className="text-blue-100">
                أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="example@company.com"
                  dir="ltr"
                  required
                />
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
                disabled={loading || !email}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Icons.Loader className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Icons.Send className="h-4 w-4 ml-2" />
                    إرسال رابط إعادة التعيين
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              تذكرت كلمة المرور؟{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetRequest;