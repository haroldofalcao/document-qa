import React, { useState, useEffect } from 'react';
import { getPacientes, updatePaciente } from '../services/pacientesService';
import { Plus, UserMinus, Edit } from 'lucide-react';
import PacienteForm from '../components/PacienteForm';

export default function PacientesList() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadPacientes();
    }, []);

    const loadPacientes = async () => {
        try {
            setLoading(true);
            const data = await getPacientes();
            setPacientes(data);
        } catch (error) {
            alert("Erro ao carregar pacientes");
        } finally {
            setLoading(false);
        }
    };

    const handleAlta = async (id, nome) => {
        if (window.confirm(`Tem certeza que deseja registrar a alta para o paciente ${nome}? Esta ação o inativará para novas visitas.`)) {
            try {
                // We use updatePaciente from the service
                await updatePaciente(id, {
                    status: 'alta',
                    data_alta: new Date().toISOString().split('T')[0]
                });
                loadPacientes(); // re-fetch list
            } catch (error) {
                alert("Erro ao dar alta no paciente: " + error.message);
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
            <PacienteForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadPacientes}
            />

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Pacientes</h2>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus size={20} />
                    Novo Paciente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando pacientes...</div>
                ) : pacientes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum paciente encontrado. Cadastre o primeiro!</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                <th className="p-4">Data Inclusão</th>
                                <th className="p-4">Prontuário</th>
                                <th className="p-4">Nome</th>
                                <th className="p-4">RG</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {pacientes.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-500">{formatDataCurta(p.data_inicio)}</td>
                                    <td className="p-4 font-medium text-gray-900">{p.prontuario}</td>
                                    <td className="p-4 text-gray-700">{p.nome}</td>
                                    <td className="p-4 text-gray-500">{p.rg}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                            {p.status === 'ativo' ? 'Ativo' : `Alta em ${formatDataCurta(p.data_alta)}`}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-3">
                                        <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        {p.status === 'ativo' && (
                                            <button
                                                onClick={() => handleAlta(p.id, p.nome)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Dar Alta"
                                            >
                                                <UserMinus size={18} />
                                            </button>
                                        )}
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
