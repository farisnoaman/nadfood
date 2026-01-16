import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { useAppContext } from '../../providers/AppContext';
import logger from '../../utils/logger';

const PlatformNavbar: React.FC = () => {
    const { handleLogout, currentUser } = useAppContext();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogoutClick = async () => {
        try {
            await handleLogout();
            navigate('/login');
        } catch (error) {
            logger.error('Logout failed:', error);
        }
    };

    const navItems = [
        { to: '/platform', icon: Icons.LayoutDashboard, text: 'لوحة التحكم', end: true },
        { to: '/platform/companies', icon: Icons.Building, text: 'الشركات' },
        { to: '/platform/catalog', icon: Icons.Package, text: 'الدليل الشامل' },
        { to: '/platform/plans', icon: Icons.CreditCard, text: 'الخطط' },
        { to: '/platform/backups', icon: Icons.Database, text: 'النسخ الاحتياطي' },
    ];

    return (
        <nav className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg sticky top-0 z-40 print:hidden">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Brand & Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center ml-4 cursor-pointer group" onClick={() => navigate('/platform')}>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <Icons.Truck className="h-5 w-5 text-white" />
                            </div>
                            <div className="mr-3">
                                <h1 className="text-lg font-black">ناد<span className="text-emerald-200">فود</span></h1>
                                <p className="text-[10px] text-emerald-100 -mt-1">إدارة المنصة</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-1 md:space-x-reverse">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-white text-emerald-600 shadow-md'
                                        : 'text-white/90 hover:bg-white/20'
                                    }`
                                }
                            >
                                <item.icon className="h-4 w-4 ml-2" />
                                {item.text}
                            </NavLink>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-xl">
                            <div className="text-left">
                                <p className="text-sm font-bold text-white">{currentUser?.username}</p>
                                <p className="text-[10px] text-emerald-200">Super Admin</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Icons.User className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <button
                            onClick={handleLogoutClick}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500 text-white transition-colors"
                            title="تسجيل الخروج"
                        >
                            <Icons.LogOut className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-white hover:bg-white/20 focus:outline-none"
                        >
                            {isMenuOpen ? (
                                <Icons.X className="block h-6 w-6" />
                            ) : (
                                <Icons.Menu className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-emerald-700 border-t border-emerald-400/30">
                    <div className="px-3 pt-3 pb-4 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-xl text-base font-bold ${isActive
                                        ? 'bg-white text-emerald-600'
                                        : 'text-white hover:bg-white/10'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5 ml-3" />
                                {item.text}
                            </NavLink>
                        ))}
                        <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center px-4 py-3 rounded-xl text-base font-bold text-white hover:bg-red-500/80"
                        >
                            <Icons.LogOut className="h-5 w-5 ml-3" />
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default PlatformNavbar;
