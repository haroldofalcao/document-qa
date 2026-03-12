import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, LogOut, DollarSign, Database, Printer, BarChart2, Stethoscope } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
    const { currentUser, medicoData, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Erro no logout", error);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-blue-600">Sistema Interno</h1>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    <Link to="/panorama" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/panorama' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <BarChart2 size={20} />
                        <span className="font-medium">Panorama</span>
                    </Link>

                    <Link to="/admissoes" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/admissoes' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Users size={20} />
                        <span className="font-medium">Admissões (Leitos)</span>
                    </Link>

                    <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Visitas Diárias</span>
                    </Link>

                    <Link to="/import" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/import' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Database size={20} />
                        <span className="font-medium">Migrar Dados</span>
                    </Link>

                    <Link to="/pagamentos" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/pagamentos' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <DollarSign size={20} />
                        <span className="font-medium">Repasses / Pagamentos</span>
                    </Link>

                    <Link to="/relatorios" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/relatorios' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Printer size={20} />
                        <span className="font-medium">Extratos e Relatórios</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    {isAdmin && (
                        <div className="px-4 mb-2">
                            <Link
                                to="/medicos"
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
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
