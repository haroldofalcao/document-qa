import React, { useState, useEffect } from 'react';
import { getPacientes } from '../services/pacientesService';
import { getInternacoes, updateStatusInternacao, deleteInternacao } from '../services/internacoesService';
import { getVisitasPorInternacao } from '../services/visitasService';
import { Plus, UserMinus, UserCheck, Edit, Trash2 } from 'lucide-react';
import AdmissaoForm from '../components/AdmissaoForm';

export default function AdmissoesList() {
    const [admissoes, setAdmissoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [admissaoEditing, setAdmissaoEditing] = useState(null);

    useEffect(() => {
        loadAdmissoes();
    }, []);

    const loadAdmissoes = async () => {
        try {
            setLoading(true);
            // Busca todas as internações
            const internacoesData = await getInternacoes();
            // Busca todos os pacientes para fazer o join manual
            const pacientesData = await getPacientes();

            const pacientesMap = pacientesData.reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
            }, {});

            const admissoesCompletas = internacoesData.map(int => ({
                ...int,
                paciente: pacientesMap[int.pacienteId] || { nome: 'Desconhecido', prontuario: '-', rg: '-' }
            }));

            setAdmissoes(admissoesCompletas);
        } catch (error) {
            alert("Erro ao carregar admissões");
        } finally {
            setLoading(false);
        }
    };

    const handleAlta = async (id, nomePaciente, historicoId) => {
        if (window.confirm(`Tem certeza que deseja registrar a ALTA para a internação atual de ${nomePaciente}? Esta ação o inativará para novas visitas diárias.`)) {
            try {
                await updateStatusInternacao(id, 'alta', historicoId || []);
                loadAdmissoes();
            } catch (error) {
                alert("Erro ao dar alta: " + error.message);
            }
        }
    };

    const handleReadmitir = async (id, nomePaciente, historicoId) => {
        if (window.confirm(`Deseja READMITIR o paciente ${nomePaciente} neste mesmo Registro de Atendimento? Ele voltará a aparecer na lista ativa de visitas.`)) {
            try {
                // Passa o histórico atual daquela internação
                await updateStatusInternacao(id, 'ativo', historicoId || []);
                loadAdmissoes();
            } catch (error) {
                alert("Erro ao readmitir paciente: " + error.message);
            }
        }
    };

    const handleEdit = (adm) => {
        setAdmissaoEditing(adm);
        setIsModalOpen(true);
    };

    const handleDelete = async (adm) => {
        if (window.confirm(`ATENÇÃO: Tem certeza que deseja DELETAR completamente a admissão de ${adm.paciente.nome}? Esta ação é irreversível.`)) {
            try {
                // Checar se há visitas primeiro
                const visitas = await getVisitasPorInternacao(adm.id);
                if (visitas.length > 0) {
                    alert(`Não é possível excluir esta admissão porque existem ${visitas.length} visita(s) financeira(s) atrelada(s) a ela. Por favor, exclua as visitas primeiro.`);
                    return;
                }

                await deleteInternacao(adm.id);
                loadAdmissoes();
            } catch (error) {
                alert("Erro ao deletar admissão: " + error.message);
            }
        }
    };

    const formatDataCurta = (isoString) => {
        if (!isoString) return '-';
        if (isoString.length === 10) {
            const [y, m, d] = isoString.split('-');
            return `${d}/${m}/${y}`;
        }
        return new Date(isoString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-6">
            <AdmissaoForm
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setAdmissaoEditing(null);
                }}
                onSuccess={loadAdmissoes}
                admissaoParaEditar={admissaoEditing}
            />

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Admissões (Leitos)</h2>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} />
                    Nova Admissão
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando internações...</div>
                ) : admissoes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhuma internação encontrada no momento.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                <th className="p-4">Admissão</th>
                                <th className="p-4">Registro (Atend.)</th>
                                <th className="p-4">Prontuário</th>
                                <th className="p-4">Paciente</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {admissoes.map((adm) => (
                                <tr key={adm.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-500">{formatDataCurta(adm.data_admissao)}</td>
                                    <td className="p-4 font-medium text-blue-600">{adm.numero_registro}</td>
                                    <td className="p-4 font-medium text-gray-900">{adm.paciente.prontuario}</td>
                                    <td className="p-4 text-gray-700">{adm.paciente.nome}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${adm.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                            {adm.status === 'ativo' ? 'Internado' : `Alta em ${formatDataCurta(adm.data_alta)}`}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-3">
                                        <button
                                            onClick={() => handleEdit(adm)}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Editar Admissão"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {/* Ação Dinâmica baseada no Status */}
                                        {adm.status === 'ativo' ? (
                                            <button
                                                onClick={() => handleAlta(adm.id, adm.paciente.nome, adm.historico)}
                                                className="text-gray-400 hover:text-orange-500 transition-colors"
                                                title="Registrar Alta"
                                            >
                                                <UserMinus size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleReadmitir(adm.id, adm.paciente.nome, adm.historico)}
                                                className="text-gray-400 hover:text-green-600 transition-colors"
                                                title="Readmitir neste mesmo Registro"
                                            >
                                                <UserCheck size={18} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(adm)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Excluir Admissão"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
