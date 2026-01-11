
import React, { useEffect, useState } from 'react';
import { Icons } from '../../Icons';
import Button from '../ui/Button';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if the app is already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
        // For iOS, we still respect the session storage dismissal to avoid annoyance
        if (sessionStorage.getItem('installPromptDismissed')) return;
        setIsVisible(true);
    } else {
        // For Android/Desktop
        
        // 1. Check if event was already captured globally (in index.html script)
        if ((window as any).deferredPrompt) {
            setDeferredPrompt((window as any).deferredPrompt);
            setIsVisible(true);
        }

        // 2. Listen for future events
        const handler = (e: any) => {
          // Prevent the mini-infobar from appearing on mobile
          e.preventDefault();
          // Stash the event so it can be triggered later.
          setDeferredPrompt(e);
          // Update UI notify the user they can install the PWA
          setIsVisible(true);
          // Update global variable for consistency
          (window as any).deferredPrompt = e;
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
  };

  const handleDismiss = () => {
      setIsVisible(false);
      sessionStorage.setItem('installPromptDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-[100] animate-slide-in-up">
      <div className="bg-white dark:bg-secondary-800 p-5 rounded-xl shadow-2xl border border-primary-100 dark:border-secondary-700 flex flex-col gap-4">
         <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full text-primary-600 dark:text-primary-400 shrink-0">
                <Icons.FileDown className="h-6 w-6" />
            </div>
            <div>
                <h3 className="font-bold text-lg text-secondary-900 dark:text-secondary-100 mb-1">تثبيت التطبيق</h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed">
                    قم بتثبيت التطبيق على جهازك للحصول على أفضل تجربة استخدام، وصول سريع، وإمكانية العمل بدون إنترنت.
                </p>
                
                {isIOS && (
                    <div className="mt-3 p-3 bg-secondary-100 dark:bg-secondary-700/50 rounded-lg text-xs text-secondary-700 dark:text-secondary-300">
                        <p className="flex items-center gap-2 mb-1">
                            1. اضغط على أيقونة المشاركة <Icons.Share className="h-4 w-4" />
                        </p>
                        <p className="flex items-center gap-2">
                            2. اختر "إضافة إلى الشاشة الرئيسية" <Icons.Plus className="h-4 w-4 border border-current rounded-[4px]" />
                        </p>
                    </div>
                )}
            </div>
         </div>
         <div className="flex gap-3 justify-end">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>ليس الآن</Button>
            {!isIOS && (
                <Button size="sm" onClick={handleInstall} className="shadow-lg shadow-primary-500/20">
                    <Icons.FileDown className="ml-2 h-4 w-4" />
                    تثبيت
                </Button>
            )}
         </div>
      </div>
    </div>
  );
};

export default InstallPrompt;