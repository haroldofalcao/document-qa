import React, { useState, useEffect } from 'react';
import { getVisitas, deleteVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { getInternacoes } from '../services/internacoesService';
import { Plus, Trash2, Calendar, User, Activity, Droplets, FlaskConical } from 'lucide-react';
import VisitaForm from '../components/VisitaForm';
import ConfirmModal from '../components/ConfirmModal';
import { getTipoVisitaLabel } from '../utils/visitaUtils';

export default function VisitasList() {
    const [visitas, setVisitas] = useState([]);
    const [internacoesMap, setInternacoesMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            pacs.forEach(p => pMap[p.id] = p.nome);

            const ints = await getInternacoes(false);
            const iMap = {};
            ints.forEach(i => {
                iMap[i.id] = {
                    numero_registro: i.numero_registro,
                    paciente_nome: pMap[i.pacienteId] || 'Paciente Desconhecido'
                };
            });
            setInternacoesMap(iMap);

            const data = await getVisitas();

            // Filtra apenas as visitas do dia de hoje (timezone local)
            const today = new Date();
            const todayStr = [
                today.getFullYear(),
                String(today.getMonth() + 1).padStart(2, '0'),
                String(today.getDate()).padStart(2, '0'),
            ].join('-');

            const visitasDeHoje = data.filter(v => {
                if (!v.data_hora) return false;
                const d = new Date(v.data_hora);
                const dStr = [
                    d.getFullYear(),
                    String(d.getMonth() + 1).padStart(2, '0'),
                    String(d.getDate()).padStart(2, '0'),
                ].join('-');
                return dStr === todayStr;
            });

            setVisitas(visitasDeHoje);
        } catch (error) {
            setPaginaErro('Erro ao carregar dados do dashboard. Tente recarregar a página.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        setConfirm({
            title: 'Excluir Visita',
            message: 'Tem certeza que deseja excluir este registro de visita? A pendência financeira associada também será removida.',
            variant: 'danger',
            confirmLabel: 'Excluir',
            onConfirm: async () => {
                setConfirm(null);
                try {
                    await deleteVisita(id);
                    loadData();
                } catch (error) {
                    setPaginaErro('Erro ao excluir visita: ' + error.message);
                }
            },
        });
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return '-';
        const d = new Date(isoString);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    // Contagens para os cards
    const totalE = visitas.filter(v => v.tipo_visita === 'E' || v.tipo_visita === 'EP').length;
    const totalP = visitas.filter(v => v.tipo_visita === 'P' || v.tipo_visita === 'EP').length;

    return (
        <div className="space-y-6">
            <VisitaForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadData}
            />

            <ConfirmModal
                isOpen={!!confirm}
                title={confirm?.title}
                message={confirm?.message}
                variant={confirm?.variant}
                confirmLabel={confirm?.confirmLabel}
                onConfirm={confirm?.onConfirm}
                onCancel={() => setConfirm(null)}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Visitas Diárias</h2>
                    <p className="text-gray-500 mt-1 hidden sm:block">Acompanhe e registre os atendimentos realizados.</p>
                </div>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Registrar Visita</span>
                    <span className="sm:hidden">Registrar</span>
                </button>
            </div>

            {/* Erro de página */}
            {paginaErro && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex justify-between items-center">
                    <span>{paginaErro}</span>
                    <button onClick={() => setPaginaErro('')} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                </div>
            )}

            {/* Cards Estatísticos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total de Visitas Hoje</p>
                        <p className="text-2xl font-bold text-gray-800">{visitas.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Droplets size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Procedimentos Enterais</p>
                        <p className="text-2xl font-bold text-gray-800">{totalE}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Visitas tipo E e EP</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                        <FlaskConical size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Procedimentos Parenterais</p>
                        <p className="text-2xl font-bold text-gray-800">{totalP}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Visitas tipo P e EP</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>
                ) : visitas.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                        <Calendar size={48} className="text-gray-300" />
                        <p>Nenhuma visita registrada ainda hoje.</p>
                    </div>
                ) : (
                    <>
                        {/* Tabela — desktop */}
                        <div className="hidden md:block overflow-x-auto">
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
                                            <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(v.data_hora)}</td>
                                            <td className="p-4 font-medium text-gray-900 leading-tight">
                                                {internacoesMap[v.internacaoId]?.paciente_nome || 'Paciente Desconhecido'}
                                                <div className="text-xs text-blue-500 font-normal mt-0.5">
                                                    Reg: {internacoesMap[v.internacaoId]?.numero_registro || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">{getTipoVisitaLabel(v.tipo_visita)}</td>
                                            <td className="p-4 flex items-center gap-2 text-sm text-gray-600">
                                                <User size={16} className="text-gray-400" />
                                                {v.nome_medico}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center">
                                                    <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Excluir Visita">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards — mobile */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {visitas.map((v) => (
                                <div key={v.id} className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">
                                                {internacoesMap[v.internacaoId]?.paciente_nome || 'Paciente Desconhecido'}
                                            </p>
                                            <p className="text-xs text-blue-500 mt-0.5">
                                                Reg: {internacoesMap[v.internacaoId]?.numero_registro || '-'}
                                            </p>
                                        </div>
                                        <div className="shrink-0">{getTipoVisitaLabel(v.tipo_visita)}</div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <User size={14} className="text-gray-400" />
                                            <span className="truncate max-w-[160px]">{v.nome_medico}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{formatDateTime(v.data_hora)}</span>
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <button onClick={() => handleDelete(v.id)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
