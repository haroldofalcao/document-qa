import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdmissoesList from './pages/AdmissoesList';
import VisitasList from './pages/VisitasList';
import VisitasRetroativasList from './pages/VisitasRetroativasList';
import VisitasFinanceiroList from './pages/VisitasFinanceiroList';
import RelatoriosList from './pages/RelatoriosList';
import Login from './pages/Login';
import ImportData from './pages/ImportData';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Renderiza os filhos apenas se houver usuário, senão redireciona pro Login
const PrivateRoute = ({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
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
                        {/* Aba 2: Visitas Diárias */}
                        <Route index element={<VisitasList />} />

                        {/* Aba 3: Visitas Antigas */}
                        <Route path="visitas/retroativas" element={<VisitasRetroativasList />} />

                        {/* Aba 4: Registro de Pagamento */}
                        <Route path="pagamentos" element={<VisitasFinanceiroList />} />

                        {/* Aba 5: Extratos e Relatórios unificados */}
                        <Route path="relatorios" element={<RelatoriosList />} />

                        {/* Rota Temporária de Migração */}
                        <Route path="import" element={<ImportData />} />

                        {/* Aba 1: Admissões (Leitos) */}
                        <Route path="admissoes" element={<AdmissoesList />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
