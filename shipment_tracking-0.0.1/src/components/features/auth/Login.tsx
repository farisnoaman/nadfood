import React, { useState } from 'react';
import Button from '../../common/ui/Button';
import Input from '../../common/ui/Input';
import Card from '../../common/display/Card';
import { Icons } from '../../Icons';
import TimeWidget from '../../common/display/TimeWidget';

import { useAppContext } from '../../../providers/AppContext';
import { supabase } from '../../../utils/supabaseClient';
import {
  storeOfflineCredentials,
  refreshOfflineCredentials,
} from '../../../utils/offlineAuth';
import { useOfflineAuth } from '../../../hooks/useOfflineAuth';
import logger from '../../../utils/logger';
import { checkLoginRateLimit, recordLoginAttempt, getBlockMessage } from '../../../utils/authProtection';

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<{ allowed: boolean; remainingAttempts: number; blockedUntil?: number; delayMs?: number } | null>(null);
  const { isTimeWidgetVisible, loadOfflineUser } = useAppContext();
  
  const {
    isOffline,
    hasStoredCredentials,
    hasOfflineSession,
    showReauthWarning,
    validateCredentials,
    createSession,
  } = useOfflineAuth();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if username/email is provided
    if (!usernameOrEmail) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      setLoading(false);
      return;
    }

    let emailToUse = usernameOrEmail;

    // Check if input looks like a username (no @ symbol) and try to find the email
    if (!usernameOrEmail.includes('@')) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', usernameOrEmail)
          .eq('is_active', true)
          .single();

        if (userError || !userData) {
          setError('اسم المستخدم غير صحيح');
          setLoading(false);
          return;
        }

        emailToUse = userData.email;
      } catch (err) {
        logger.error('Error looking up user:', err);
        setError('حدث خطأ في البحث عن المستخدم');
        setLoading(false);
        return;
      }
    }

    // Check rate limiting
    const rateLimit = checkLoginRateLimit(emailToUse);
    setRateLimitStatus(rateLimit);

    if (!rateLimit.allowed) {
      setError(getBlockMessage(rateLimit.blockedUntil, rateLimit.delayMs));
      setLoading(false);
      return;
    }

    try {
      // Check if offline
      if (isOffline) {
        // Try offline login
        if (!hasStoredCredentials) {
          setError('لا يمكن تسجيل الدخول دون اتصال بالإنترنت. يرجى الاتصال بالإنترنت لأول مرة.');
          setLoading(false);
          return;
        }

        const validation = await validateCredentials(emailToUse, password);

        if (!validation.valid) {
          recordLoginAttempt(email, false); // Record failed login attempt
          if ((validation as any).expired) {
            setError('انتهت صلاحية بيانات الدخول المحفوظة. يرجى الاتصال بالإنترنت لتسجيل الدخول مرة أخرى.');
          } else {
            setError('اسم المستخدم أو كلمة المرور غير صحيحة');
          }
          setLoading(false);
          return;
        }

        // Create offline session
        await createSession(validation.userId!, emailToUse);

        // Load offline user manually since no Supabase auth state change
        await loadOfflineUser();
        recordLoginAttempt(selectedEmail, true); // Record successful login
        logger.info('Offline login successful');
        setLoading(false);
        return;
      }

      // Online login
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      clearTimeout(timeoutId);

      if (authError) {
        // Record failed login attempt
        recordLoginAttempt(emailToUse, false);

        // Handle specific error cases
        if (authError.message.includes("Invalid login credentials")) {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else if (authError.message.includes("fetch") || authError.message.includes("network") || authError.name === 'AbortError') {
          setError('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
        } else if (!authError.message || authError.message === '{}' || authError.message === '') {
          setError('فشل تسجيل الدخول. يرجى التحقق من الاتصال بالإنترنت.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Fetch user profile
      if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profileError && userProfile) {
          // Store credentials for offline use
          await storeOfflineCredentials(emailToUse, password, data.user.id, userProfile);
          recordLoginAttempt(emailToUse, true); // Record successful login
          logger.info('Online login successful - credentials stored for offline use');
        } else {
          // Even if profile fetch failed, refresh existing credentials expiry
          await refreshOfflineCredentials();
          recordLoginAttempt(emailToUse, true); // Still record as successful login
        }
      }

      // onAuthStateChange in AppContext will handle the rest
    } catch (err: any) {
      // Handle network errors and timeouts
      if (err.name === 'AbortError') {
        setError('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.');
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
        setError('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
      } else {
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary-100 dark:bg-secondary-900">
      {isTimeWidgetVisible && <TimeWidget />}
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <div className="flex justify-center mb-6">
              <Icons.Truck className="h-12 w-12 text-primary-600" />
          </div>
          <Card>
              <h2 className="text-2xl font-bold text-center text-secondary-900 dark:text-secondary-100 mb-6">تسجيل الدخول</h2>
              
              {/* Offline indicator */}
              {isOffline && (
                <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg flex items-center gap-2">
                  <Icons.WifiOff className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-300">
                    {hasStoredCredentials ? 'وضع غير متصل - استخدام البيانات المحفوظة' : 'لا يوجد اتصال بالإنترنت'}
                  </span>
                </div>
              )}
              
              {/* Offline session indicator */}
              {hasOfflineSession && !isOffline && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 rounded-lg flex items-center gap-2">
                  <Icons.CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                  <span className="text-sm text-green-800 dark:text-green-300">
                    جلسة غير متصلة نشطة - يمكنك المتابعة بدون إنترنت
                  </span>
                </div>
              )}
              
              {/* Reauth warning */}
              {showReauthWarning && !isOffline && (
                <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 rounded-lg">
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    ℹ️ لم تقم بتسجيل الدخول عبر الإنترنت منذ أكثر من 7 أيام. يُنصح بتسجيل الدخول الآن لمزامنة بياناتك.
                  </span>
                </div>
              )}

              {/* Rate limit warning */}
              {rateLimitStatus && !rateLimitStatus.allowed && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-400" />
                    <span className="text-sm text-red-800 dark:text-red-300">
                      {getBlockMessage(rateLimitStatus.blockedUntil, rateLimitStatus.delayMs)}
                    </span>
                  </div>
                  {rateLimitStatus.remainingAttempts > 0 && rateLimitStatus.remainingAttempts < 3 && (
                    <div className="mt-2 text-xs text-red-700 dark:text-red-400">
                      المحاولات المتبقية: {rateLimitStatus.remainingAttempts}
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <div>
                <Input
                  id="usernameOrEmail"
                  label="اسم المستخدم أو البريد الإلكتروني"
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  Icon={Icons.User}
                  placeholder="أدخل اسم المستخدم أو البريد الإلكتروني"
                />
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400 text-right">
                  يمكنك تسجيل الدخول باستخدام اسم المستخدم أو البريد الإلكتروني الكامل
                </p>
              </div>
              <Input
                  id="password"
                  label="كلمة المرور"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  Icon={Icons.KeyRound}
                  actionIcon={showPassword ? Icons.EyeOff : Icons.Eye}
                  onActionClick={() => setShowPassword(!showPassword)}
              />
              <Button
                 type="submit"
                 className="w-full"
                 size="lg"
                 disabled={loading || !usernameOrEmail || (rateLimitStatus && !rateLimitStatus.allowed)}
               >
                  {loading ? 'جاري الدخول...' : (
                      <>
                        <Icons.LogIn className="ml-2 h-5 w-5" />
                        {isOffline && hasStoredCredentials ? 'دخول (غير متصل)' :
                         hasOfflineSession && !isOffline ? 'متابعة (جلسة نشطة)' : 'دخول'}
                      </>
                  )}
              </Button>
              </form>
          </Card>
        </div>
      </div>
       <footer className="py-4 px-4 text-center text-sm text-secondary-500 dark:text-secondary-400">
         <p>Copyright Reserved @ {new Date().getFullYear()}</p>
         <p>Designed with ❤️ by Faris Alsolmi</p>
         <p>Tel: 774485307</p>
       </footer>
    </div>
  );
};

export default Login;
