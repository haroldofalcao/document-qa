import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, LogOut, DollarSign, Database, Printer, BarChart2, Stethoscope, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
    const { currentUser, medicoData, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Erro no logout", error);
        }
    };

    const navItems = [
        { to: '/panorama', icon: <BarChart2 size={20} />, label: 'Panorama' },
        { to: '/admissoes', icon: <Users size={20} />, label: 'Admissões (Leitos)' },
        { to: '/', icon: <LayoutDashboard size={20} />, label: 'Visitas Diárias' },
        { to: '/import', icon: <Database size={20} />, label: 'Migrar Dados' },
        { to: '/pagamentos', icon: <DollarSign size={20} />, label: 'Repasses / Pagamentos' },
        { to: '/relatorios', icon: <Printer size={20} />, label: 'Extratos e Relatórios' },
    ];

    const NavLink = ({ to, icon, label }) => (
        <Link
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === to ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h1 className="text-xl font-bold text-blue-600">Sistema Interno</h1>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
                    <X size={22} />
                </button>
            </div>

            <nav className="p-4 space-y-2 flex-1">
                {navItems.map(item => <NavLink key={item.to} {...item} />)}
            </nav>

            <div className="p-4 border-t border-gray-200">
                {isAdmin && (
                    <div className="px-4 mb-2">
                        <Link
                            to="/medicos"
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm ${location.pathname === '/medicos' ? 'bg-yellow-50 text-yellow-700 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <Stethoscope size={18} />
                            <span className="font-medium">Médicos</span>
                        </Link>
                    </div>
                )}
                <div className="mb-4 px-4">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Logado como</p>
                    <p className="text-sm font-semibold text-gray-800 truncate" title={currentUser?.email}>
                        {medicoData?.nome || currentUser?.displayName || currentUser?.email || 'Médico'}
                    </p>
                    {isAdmin && <p className="text-xs text-yellow-600 font-medium mt-0.5">Administrador</p>}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Sair</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-100">

            {/* Sidebar — desktop (sempre visível) */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
                <SidebarContent />
            </aside>

            {/* Gaveta mobile — fundo escurecido */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Gaveta mobile — painel lateral */}
            <aside className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-xl transform transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* Área principal */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Cabeçalho mobile */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-blue-600 transition-colors">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-blue-600">Sistema Interno</h1>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
