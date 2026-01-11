import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { Icons } from '../../../components/Icons';

const UserInvite: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [inviteData, setInviteData] = useState<{
    companyName: string;
    companySlug: string;
    adminName: string;
    email: string;
    role: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Parse invite token from URL parameters
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      setError('رابط الدعوة غير صالح');
      return;
    }

    // In a real implementation, you would verify the token with Supabase
    // For now, we'll simulate by extracting company info from token
    // The token would contain: {companyId, companyName, role, email}
    try {
      // This is a simplified example - in production, verify with Supabase
      const decodedToken = JSON.parse(atob(token || ''));
      
      setInviteData({
        companyName: decodedToken.companyName || 'شركة افتراضية',
        companySlug: decodedToken.companySlug || 'default-company',
        adminName: decodedToken.adminName || 'المدير',
        email: email,
        role: decodedToken.role || 'مسؤول الحركة',
      });
      
      // Pre-fill username from email
      const username = email.split('@')[0];
      setFormData(prev => ({ ...prev, username }));
      
    } catch (err) {
      setError('رابط الدعوة غير صالح أو منتهي الصلاحية');
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
      // Create user account using Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData?.email || '',
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            role: inviteData?.role,
            company_id: inviteData?.companySlug, // This would be the actual company UUID in production
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!authData.user) {
        throw new Error('فشل إنشاء الحساب');
      }

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: formData.username,
          email: inviteData?.email,
          role: inviteData?.role,
          company_id: inviteData?.companySlug, // This would be the actual company UUID
        });

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('فشل إنشاء الملف الشخصي');
      }

      setSuccess(true);
      
      // Auto-login after successful signup
      setTimeout(async () => {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: inviteData?.email || '',
          password: formData.password,
        });

        if (!loginError) {
          navigate('/');
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!inviteData && !error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Icons.Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الدعوة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Icons.AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
            خطأ في الدعوة
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Icons.Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-4">
            تم إنشاء الحساب بنجاح!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            سيتم توجيهك تلقائياً إلى لوحة التحكم...
          </p>
          <div className="flex justify-center">
            <Icons.Loader className="h-5 w-5 animate-spin text-blue-600" />
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="text-center">
              <Icons.Mail className="h-12 w-12 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">دعوة للانضمام</h1>
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur">
                <p className="text-sm font-medium">{inviteData?.companyName}</p>
                <p className="text-xs opacity-80 mt-1">تمت دعوتك للانضمام كـ: {inviteData?.role}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={inviteData?.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  البريد الإلكتروني المستلم في الدعوة
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم المستخدم *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="اختر اسم مستخدم"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  كلمة المرور *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="أعد إدخال كلمة المرور"
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">
                    كلمات المرور غير متطابقة
                  </p>
                )}
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
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Icons.Loader className="h-4 w-4 ml-2 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    <Icons.UserPlus className="h-4 w-4 ml-2" />
                    قبول الدعوة وإنشاء الحساب
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
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

export default UserInvite;