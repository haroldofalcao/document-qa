import React, { useState, useEffect } from 'react';
import { getVisitas, deleteVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { Plus, Trash2, Calendar, User, Activity } from 'lucide-react';
import VisitaForm from '../components/VisitaForm';

export default function VisitasList() {
    const [visitas, setVisitas] = useState([]);
    const [pacientesMap, setPacientesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Carrega pacientes para criar um mapa de ID -> Nome para exibição na tabela
            const pacs = await getPacientes();
            const pMap = {};
            pacs.forEach(p => pMap[p.id] = p.nome);
            setPacientesMap(pMap);

            // Carrega visitas
            const data = await getVisitas();
            setVisitas(data);
        } catch (error) {
            alert("Erro ao carregar dados do dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(`Tem certeza que deseja deletar este registro de visita?`)) {
            try {
                await deleteVisita(id);
                loadData();
            } catch (error) {
                alert("Erro ao deletar: " + error.message);
            }
        }
    };

    // Helper para formatar a data (ISO -> DD/MM/YYYY HH:MM)
    const formatDateTime = (isoString) => {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Helper para exibir tipo de visita formatado
    const getTipoVisitaLabel = (tipo) => {
        switch (tipo) {
            case 'E': return <span className="bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded text-xs">Apenas 'E'</span>;
            case 'P': return <span className="bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded text-xs">Apenas 'P'</span>;
            case 'EP': return <span className="bg-indigo-100 text-indigo-700 font-medium px-2 py-1 rounded text-xs">Fez 'E' e 'P'</span>;
            default: return tipo;
        }
    };

    return (
        <div className="space-y-6">
            <VisitaForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard Diário de Visitas</h2>
                    <p className="text-gray-500 mt-1">Acompanhe e registre os atendimentos realizados.</p>
                </div>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} />
                    Registrar Visita
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Exemplo de Cards Estatísticos Simples */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total de Visitas</p>
                        <p className="text-2xl font-bold text-gray-800">{visitas.length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>
                ) : visitas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                        <Calendar size={48} className="text-gray-300" />
                        <p>Nenhuma visita registrada ainda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                    <th className="p-4">Data e Hora</th>
                                    <th className="p-4">Paciente</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Médico</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {visitas.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDateTime(v.data_hora)}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900">
                                            {pacientesMap[v.pacienteId] || 'Paciente Desconhecido'}
                                        </td>
                                        <td className="p-4">
                                            {getTipoVisitaLabel(v.tipo_visita)}
                                        </td>
                                        <td className="p-4 flex items-center gap-2 text-sm text-gray-600">
                                            <User size={16} className="text-gray-400" />
                                            {v.nome_medico}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleDelete(v.id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    title="Deletar Visita"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
