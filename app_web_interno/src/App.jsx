import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdmissoesList from './pages/AdmissoesList';
import VisitasList from './pages/VisitasList';
import VisitasRetroativasList from './pages/VisitasRetroativasList';
import VisitasFinanceiroList from './pages/VisitasFinanceiroList';
import RelatoriosList from './pages/RelatoriosList';
import PanoramaPage from './pages/PanoramaPage';
import MedicosPage from './pages/MedicosPage';
import Login from './pages/Login';
import ImportData from './pages/ImportData';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Redireciona para login se não estiver autenticado
const PrivateRoute = ({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
};

// Redireciona para o dashboard se não for admin
const AdminRoute = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();
    if (!currentUser) return <Navigate to="/login" />;
    if (!isAdmin) return <Navigate to="/" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Rota Pública */}
                    <Route path="/login" element={<Login />} />

                    {/* Rotas Protegidas */}
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <Layout />
                            </PrivateRoute>
                        }
                    >
                        {/* Dashboard de Visitas Diárias */}
                        <Route index element={<VisitasList />} />

                        {/* Visitas Retroativas */}
                        <Route path="visitas/retroativas" element={<VisitasRetroativasList />} />

                        {/* Repasses / Pagamentos */}
                        <Route path="pagamentos" element={<VisitasFinanceiroList />} />

                        {/* Extratos e Relatórios */}
                        <Route path="relatorios" element={<RelatoriosList />} />

                        {/* Migração de Dados */}
                        <Route path="import" element={<ImportData />} />

                        {/* Admissões (Leitos) */}
                        <Route path="admissoes" element={<AdmissoesList />} />

                        {/* Panorama Operacional */}
                        <Route path="panorama" element={<PanoramaPage />} />

                        {/* Gestão de Médicos — somente admins */}
                        <Route
                            path="medicos"
                            element={
                                <AdminRoute>
                                    <MedicosPage />
                                </AdminRoute>
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
