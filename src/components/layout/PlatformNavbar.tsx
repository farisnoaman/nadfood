import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { useAppContext } from '../../providers/AppContext';
import { useTenant } from '../../providers/TenantContext';

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
        <nav className="bg-slate-900 text-white shadow-md sticky top-0 z-40 print:hidden border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Brand & Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center ml-4 cursor-pointer" onClick={() => navigate('/platform')}>
                            <Icons.ShieldCheck className="h-8 w-8 text-emerald-500 ml-2" />
                            <div>
                                <h1 className="text-lg font-bold">مدير المنصة</h1>
                                <p className="text-xs text-slate-400">إدارة النظام المركزي</p>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-8 md:space-x-reverse">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5 ml-2" />
                                {item.text}
                            </NavLink>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center">
                        <div className="flex items-center ml-4 pl-4 border-l border-slate-700">
                            <div className="text-left ml-3">
                                <p className="text-sm font-medium text-white">{currentUser?.username}</p>
                                <p className="text-xs text-emerald-400">Super Admin</p>
                            </div>
                            <div className="bg-slate-800 p-2 rounded-full">
                                <Icons.User className="h-5 w-5 text-slate-300" />
                            </div>
                        </div>
                        <button
                            onClick={handleLogoutClick}
                            className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-red-900/50 transition-colors"
                            title="تسجيل الخروج"
                        >
                            <Icons.LogOut className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
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
                <div className="md:hidden bg-slate-800 border-t border-slate-700">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5 ml-2" />
                                {item.text}
                            </NavLink>
                        ))}
                        <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-slate-700 hover:text-red-300"
                        >
                            <Icons.LogOut className="h-5 w-5 ml-2" />
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default PlatformNavbar;
