import React, { useState, useEffect } from 'react';
import { getVisitas, deleteVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { History, Plus, Trash2 } from 'lucide-react';
import VisitaRetroativaForm from '../components/VisitaRetroativaForm';
import ConfirmModal from '../components/ConfirmModal';
import { getTipoVisitaLabel } from '../utils/visitaUtils';

export default function VisitasRetroativasList() {
    const [visitas, setVisitas] = useState([]);
    const [pacientesMap, setPacientesMap] = useState({});
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [paginaErro, setPaginaErro] = useState('');
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setPaginaErro('');

            const pacs = await getPacientes();
            const pMap = {};
            pacs.forEach(p => {
                pMap[p.id] = p.nome;
            });
            setPacientesMap(pMap);

            const data = await getVisitas();
            setVisitas(data);
        } catch (error) {
            console.error(error);
            setPaginaErro('Erro ao carregar os dados das visitas. Tente recarregar a página.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirm({
            title: 'Excluir Visita',
            message: 'Tem certeza que deseja excluir este registro de visita? Isso removerá a pendência financeira associada.',
            variant: 'danger',
            confirmLabel: 'Excluir',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await deleteVisita(id);
                    loadData();
                } catch (error) {
                    setPaginaErro('Erro ao remover visita: ' + error.message);
                }
            },
        });
    };

    const formatDataCurta = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="space-y-6">
            <ConfirmModal
                isOpen={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                variant={confirm?.variant}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onCancel={() => setConfirm(null)}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <History className="text-orange-500" />
                        Visitas Antigas
                    </h2>
                    <p className="text-gray-500 mt-1">Lançamento histórico de visitas anteriores que não foram apontadas na data.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
                >
                    <Plus size={20} />
                    Lançar Retroativo
                </button>
            </div>

            {paginaErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex justify-between items-center">
                    <span>{paginaErro}</span>
                    <button onClick={() => setPaginaErro('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando histórico completo...</div>
                ) : visitas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p>Nenhuma visita registrada no banco de dados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                    <th className="p-4">Data Registrada</th>
                                    <th className="p-4">Paciente</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Médico</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {visitas.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-800">
                                            {formatDataCurta(v.data_hora)}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900 border-l-4 border-l-orange-500 pl-3">
                                            {pacientesMap[v.pacienteId] || 'Paciente Desconhecido'}
                                        </td>
                                        <td className="p-4">
                                            {getTipoVisitaLabel(v.tipo_visita)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{v.nome_medico}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDelete(v.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Excluir Visita"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <VisitaRetroativaForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
