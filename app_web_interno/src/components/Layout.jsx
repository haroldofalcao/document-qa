import { Outlet, Link, useNavigate } from "react-router-dom";
import { Users, LayoutDashboard, LogOut, DollarSign, History, FileText, Printer } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Layout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

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
                    <Link to="/pacientes" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Users size={20} />
                        <span className="font-medium">Pacientes</span>
                    </Link>

                    <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Visitas Diárias</span>
                    </Link>

                    <Link to="/visitas/retroativas" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <History size={20} />
                        <span className="font-medium">Visitas Antigas</span>
                    </Link>

                    <Link to="/pagamentos" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <DollarSign size={20} />
                        <span className="font-medium">Repasses / Pagamentos</span>
                    </Link>

                    <Link to="/relatorios" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <Printer size={20} />
                        <span className="font-medium">Extratos e Relatórios</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="mb-4 px-4">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Logado como</p>
                        <p className="text-sm font-semibold text-gray-800 truncate" title={currentUser?.email}>
                            {currentUser?.displayName || currentUser?.email || 'Médico'}
                        </p>
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
