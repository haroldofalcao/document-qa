import React, { useState, useEffect } from 'react';
import { getVisitasPorPagamento, updatePagamentoVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { DollarSign, Check, Clock, AlertCircle } from 'lucide-react';

export default function VisitasFinanceiroList() {
    const [visitas, setVisitas] = useState([]);
    const [pacientesMap, setPacientesMap] = useState({});
    const [loading, setLoading] = useState(true);

    // Filtro ativo na tela
    const [filtroStatus, setFiltroStatus] = useState('Pendente');

    useEffect(() => {
        loadData();
    }, [filtroStatus]);

    const loadData = async () => {
        try {
            setLoading(true);
            const pacs = await getPacientes();
            const pMap = {};
            pacs.forEach(p => pMap[p.id] = p.nome);
            setPacientesMap(pMap);

            const data = await getVisitasPorPagamento(filtroStatus);
            setVisitas(data);
        } catch (error) {
            alert("Erro ao carregar dados financeiros");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, novoStatus) => {
        try {
            await updatePagamentoVisita(id, {
                status_pagamento: novoStatus,
                data_pagamento: (novoStatus === 'Pago' || novoStatus === 'Glosa') ? new Date().toISOString().split('T')[0] : null
            });
            loadData(); // Recarrega a lista
        } catch (error) {
            alert("Erro ao atualizar status financeiro.");
        }
    };

    // Helper p/ Formatar Data da Visita ou Pagamento
    const formatDataCurta = (dateString) => {
        if (!dateString) return '-';
        // Se for string YYYY-MM-DD exata do input date
        if (dateString.length === 10) {
            const [y, m, d] = dateString.split('-');
            return `${d}/${m}/${y}`;
        }
        // Senão usa o parser de timezone local
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-green-600" />
                        Controle de Repasses
                    </h2>
                    <p className="text-gray-500 mt-1">Gerencie o pagamento das visitas realizadas.</p>
                </div>

                {/* Abas de Filtro */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['Pendente', 'Pago', 'Glosa', 'Todos'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFiltroStatus(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filtroStatus === status
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {status === 'Pendente' ? 'Em Aberto' : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Buscando pendências financeiras...</div>
                ) : visitas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                        {filtroStatus === 'Pendente' ? (
                            <>
                                <Check size={48} className="text-green-400 mb-2" />
                                <p className="text-lg font-medium text-gray-800">Tudo em dia!</p>
                                <p>Não há visitas aguardando repasse.</p>
                            </>
                        ) : (
                            <p>Nenhum registro encontrado para este filtro.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                    <th className="p-4">Data Visita</th>
                                    <th className="p-4">Paciente</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Médico</th>
                                    <th className="p-4 w-64">Status & Pagamento</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {visitas.map((v) => {
                                    return (
                                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600">
                                                {formatDataCurta(v.data_hora)}
                                            </td>
                                            <td className="p-4 font-medium text-gray-900 border-l-4 border-l-green-500 pl-3">
                                                {pacientesMap[v.pacienteId] || 'Paciente Desconhecido'}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-gray-700">{v.tipo_visita}</td>
                                            <td className="p-4 text-sm text-gray-600">{v.nome_medico}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={v.status_pagamento || 'Pendente'}
                                                        onChange={(e) => handleStatusChange(v.id, e.target.value)}
                                                        className={`text-sm rounded-lg p-2 font-medium border-2 focus:ring-0 outline-none transition-colors cursor-pointer ${v.status_pagamento === 'Pago' ? 'border-green-200 bg-green-50 text-green-700' :
                                                                v.status_pagamento === 'Glosa' ? 'border-red-200 bg-red-50 text-red-700' :
                                                                    'border-orange-200 bg-orange-50 text-orange-700'
                                                            }`}
                                                    >
                                                        <option value="Pendente">Em Aberto</option>
                                                        <option value="Pago">Pago</option>
                                                        <option value="Glosa">Glosa</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
