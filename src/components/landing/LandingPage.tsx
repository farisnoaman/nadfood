import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { supabase } from '../../utils/supabaseClient';

// =====================================================
// Design Tokens (inline for this component set)
// =====================================================
// Using Tailwind with custom gradients and a bold, premium aesthetic
// Color Palette: Deep Slate + Emerald Accent
// Style: Bold Editorial meets Premium SaaS

// =====================================================
// Navbar Component
// =====================================================
const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                        <Icons.Truck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white">ناد<span className="text-emerald-500">فود</span></span>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-slate-600 dark:text-slate-300 font-medium hover:text-emerald-500 transition-colors">المميزات</a>
                    <a href="#pricing" className="text-slate-600 dark:text-slate-300 font-medium hover:text-emerald-500 transition-colors">الباقات</a>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-slate-700 dark:text-slate-200 font-bold hover:text-emerald-600 transition-colors">
                        تسجيل الدخول
                    </button>
                    <button onClick={() => navigate('/signup')} className="px-6 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:-translate-y-0.5">
                        ابدأ مجاناً
                    </button>
                </div>
            </div>
        </nav>
    );
};

// =====================================================
// Hero Component
// =====================================================
const Hero: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20" />
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-1000" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
                <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold mb-6">
                        <Icons.Zap className="w-4 h-4" />
                        <span>منصة إدارة الشحنات الأكثر تطوراً</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                        أدِر شحناتك
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-500 to-emerald-600">بكفاءة عالية</span>
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-lg mr-auto">
                        حلول متكاملة لتتبع الشحنات، إدارة السائقين، وتحليل البيانات المالية في منصة واحدة سهلة الاستخدام.
                    </p>

                    <div className="flex flex-wrap gap-4 justify-end">
                        <button onClick={() => navigate('/signup')} className="px-8 py-4 bg-emerald-500 text-white font-black text-lg rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:-translate-y-1 flex items-center gap-2">
                            <span>ابدأ تجربتك المجانية</span>
                            <Icons.ArrowLeft className="w-5 h-5" />
                        </button>
                        <a href="#features" className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex items-center gap-2">
                            <span>استكشف المميزات</span>
                        </a>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex items-center gap-6 justify-end">
                        <div className="text-right">
                            <div className="text-3xl font-black text-slate-900 dark:text-white">+500</div>
                            <div className="text-sm text-slate-500">شركة نقل</div>
                        </div>
                        <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-slate-900 dark:text-white">+10K</div>
                            <div className="text-sm text-slate-500">شحنة يومياً</div>
                        </div>
                        <div className="w-px h-12 bg-slate-200 dark:bg-slate-700" />
                        <div className="text-right">
                            <div className="text-3xl font-black text-slate-900 dark:text-white">99.9%</div>
                            <div className="text-sm text-slate-500">وقت التشغيل</div>
                        </div>
                    </div>
                </div>

                {/* Hero Visual */}
                <div className="relative hidden lg:block">
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-red-400 rounded-full" />
                            <div className="w-3 h-3 bg-amber-400 rounded-full" />
                            <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-lg w-3/4" />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    <Icons.Truck className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div className="h-24 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                    <Icons.MapPin className="w-8 h-8 text-blue-500" />
                                </div>
                                <div className="h-24 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                                    <Icons.DollarSign className="w-8 h-8 text-amber-500" />
                                </div>
                            </div>
                            <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                        </div>
                    </div>
                    {/* Floating Elements */}
                    <div className="absolute -top-4 -right-4 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl animate-bounce">
                        <Icons.TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">تم التوصيل!</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// =====================================================
// Features Component
// =====================================================
const FEATURES = [
    { icon: Icons.Truck, title: 'تتبع الشحنات', description: 'راقب جميع شحناتك في الوقت الفعلي من لحظة الإرسال حتى التسليم.', color: 'emerald' },
    { icon: Icons.Users, title: 'إدارة السائقين', description: 'نظّم فريقك بكفاءة، ووزّع المهام، وتابع أداء كل سائق.', color: 'blue' },
    { icon: Icons.DollarSign, title: 'التحليل المالي', description: 'تقارير مفصلة عن الإيرادات والمصروفات والأرباح لكل شحنة.', color: 'amber' },
    { icon: Icons.FileText, title: 'التقارير الذكية', description: 'تقارير PDF و CSV قابلة للتصدير مع رسوم بيانية تفاعلية.', color: 'purple' },
    { icon: Icons.Shield, title: 'أمان متقدم', description: 'حماية كاملة لبياناتك مع صلاحيات مخصصة لكل مستخدم.', color: 'rose' },
    { icon: Icons.Zap, title: 'أداء فائق', description: 'واجهة سريعة الاستجابة تعمل على جميع الأجهزة بسلاسة.', color: 'cyan' },
];

const Features: React.FC = () => {
    return (
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                        كل ما تحتاجه في <span className="text-emerald-500">منصة واحدة</span>
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        أدوات متكاملة صُممت خصيصاً لشركات النقل والشحن
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURES.map((feature, index) => (
                        <div key={index} className="group bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`w-7 h-7 text-${feature.color}-500`} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// =====================================================
// Pricing Component
// =====================================================
type BillingPeriod = 'monthly' | 'bi_annual' | 'annual';

const BILLING_PERIODS: { value: BillingPeriod; label: string; priceMultiplier: number; shipmentMultiplier: number; badge?: string }[] = [
    { value: 'monthly', label: 'شهري', priceMultiplier: 1, shipmentMultiplier: 1 },
    { value: 'bi_annual', label: 'نصف سنوي', priceMultiplier: 5, shipmentMultiplier: 5, badge: 'وفّر 17%' },
    { value: 'annual', label: 'سنوي', priceMultiplier: 10, shipmentMultiplier: 15, badge: 'وفّر 25%' },
];

const Pricing: React.FC = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState<BillingPeriod>('monthly');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            const { data } = await supabase.from('subscription_plans' as any).select('*').neq('name', 'Free Trial').order('monthly_price', { ascending: true });
            setPlans(data || []);
            setLoading(false);
        };
        fetchPlans();
    }, []);

    const currentPeriod = BILLING_PERIODS.find(p => p.value === activePeriod)!;
    const getPrice = (plan: any) => (plan.monthly_price || 0) * currentPeriod.priceMultiplier;
    const getShipments = (plan: any) => plan.max_shipments ? (plan.max_shipments * currentPeriod.shipmentMultiplier) : null;

    const handleChoosePlan = (planId: string) => {
        navigate(`/signup?plan=${planId}&cycle=${activePeriod}`);
    };

    return (
        <section id="pricing" className="py-24">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                        اختر الباقة <span className="text-emerald-500">المناسبة لك</span>
                    </h2>
                    <p className="text-xl text-slate-600 dark:text-slate-400">
                        ابدأ مجاناً لمدة 7 أيام، ثم اختر ما يناسب احتياجاتك
                    </p>
                </div>

                {/* Billing Period Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5">
                        {BILLING_PERIODS.map(period => (
                            <button
                                key={period.value}
                                onClick={() => setActivePeriod(period.value)}
                                className={`relative px-6 py-3 rounded-xl text-sm font-bold transition-all ${activePeriod === period.value ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                {period.label}
                                {period.badge && (
                                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black rounded-full">
                                        {period.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Icons.Loader className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <div key={plan.id} className={`relative bg-white dark:bg-slate-800 rounded-3xl border-2 ${index === 1 ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105' : 'border-slate-200 dark:border-slate-700 shadow-xl'} overflow-hidden flex flex-col`}>
                                {index === 1 && (
                                    <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-center py-2 text-sm font-bold">
                                        الأكثر شعبية
                                    </div>
                                )}

                                <div className={`p-8 ${index === 1 ? 'pt-14' : ''}`}>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-5xl font-black text-slate-900 dark:text-white">{getPrice(plan).toLocaleString()}</span>
                                        <span className="text-slate-500 font-medium">ر.ي</span>
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Icons.CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span>{getShipments(plan) ? `${getShipments(plan)} شحنة` : 'شحنات غير محدودة'}</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Icons.CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span>{plan.max_users || '∞'} مستخدم</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Icons.CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span>{plan.max_drivers || '∞'} سائق</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                            <Icons.CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span>دعم فني متميز</span>
                                        </li>
                                    </ul>

                                    <button
                                        onClick={() => handleChoosePlan(plan.id)}
                                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${index === 1 ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white'}`}
                                    >
                                        اختر هذه الباقة
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Free Trial CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                        <Icons.Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            جرّب مجاناً لمدة 7 أيام بدون بطاقة ائتمان!
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
};

// =====================================================
// Footer Component
// =====================================================
const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 text-white py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                <Icons.Truck className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black">ناد<span className="text-emerald-400">فود</span></span>
                        </div>
                        <p className="text-slate-400 max-w-md leading-relaxed">
                            منصة متكاملة لإدارة عمليات النقل والشحن، صُممت لمساعدة الشركات على تحسين الكفاءة وزيادة الأرباح.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-4">روابط سريعة</h4>
                        <ul className="space-y-2 text-slate-400">
                            <li><a href="#features" className="hover:text-emerald-400 transition-colors">المميزات</a></li>
                            <li><a href="#pricing" className="hover:text-emerald-400 transition-colors">الباقات</a></li>
                            <li><Link to="/login" className="hover:text-emerald-400 transition-colors">تسجيل الدخول</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-4">تواصل معنا</h4>
                        <ul className="space-y-2 text-slate-400">
                            <li className="flex items-center gap-2">
                                <Icons.Mail className="w-4 h-4" />
                                <span>support@nadfood.com</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Icons.Phone className="w-4 h-4" />
                                <span dir="ltr">+967 XXX XXX XXX</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
                    <p>© {new Date().getFullYear()} نادفود. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    );
};

// =====================================================
// Main Landing Page Component
// =====================================================
const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 selection:bg-emerald-500/30">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <Pricing />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
