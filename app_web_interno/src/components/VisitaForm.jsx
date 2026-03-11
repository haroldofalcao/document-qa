import React, { useState, useEffect } from 'react';
import { createVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function VisitaForm({ isOpen, onClose, onSuccess }) {
    const { currentUser } = useAuth();
    const nomeMedico = currentUser?.displayName || currentUser?.email || 'Médico Não Identificado';

    const [pacientes, setPacientes] = useState([]);
    const [formData, setFormData] = useState({
        pacienteId: '',
        tipo_visita: 'E', // default
        nome_medico: nomeMedico
    });

    // Controle de estado
    const [loading, setLoading] = useState(false);
    const [loadingPacientes, setLoadingPacientes] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadPacientesAtivos();
        }
    }, [isOpen]);

    const loadPacientesAtivos = async () => {
        setLoadingPacientes(true);
        try {
            const allPacientes = await getPacientes();
            // Filtra simulando o "Slice_Pacientes_Ativos" do AppSheet
            const ativos = allPacientes.filter(p => p.status === 'ativo');
            setPacientes(ativos);
        } catch (err) {
            setError("Falha ao carregar lista de pacientes.");
        } finally {
            setLoadingPacientes(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.pacienteId) {
            setError("Selecione um paciente obrigatório.");
            return;
        }

        setLoading(true);
        try {
            await createVisita({
                ...formData,
                status_pagamento: 'Pendente'
                // data_hora é inserido no Backend Service
            });

            // Sucesso
            setFormData({ ...formData, pacienteId: '', tipo_visita: 'E', nome_medico: nomeMedico });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Erro ao salvar visita.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50">
                    <h2 className="text-xl font-bold text-blue-800">Registrar Visita Diária</h2>
                    <button onClick={onClose} className="text-blue-400 hover:text-blue-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Select de Paciente */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paciente (Somente Ativos)</label>
                        {loadingPacientes ? (
                            <div className="p-2 text-sm text-gray-500">Carregando carteira de pacientes...</div>
                        ) : (
                            <select
                                required
                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                                value={formData.pacienteId}
                                onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                            >
                                <option value="" disabled>--- Selecione o Paciente ---</option>
                                {pacientes.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nome} (RG: {p.rg})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Radio Group: Tipo de Visita */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Visita Realizada</label>
                        <div className="grid grid-cols-3 gap-3">
                            <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.tipo_visita === 'E' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                <input
                                    type="radio" name="tipoVisita" value="E" className="sr-only"
                                    checked={formData.tipo_visita === 'E'}
                                    onChange={(e) => setFormData({ ...formData, tipo_visita: e.target.value })}
                                />
                                <span className="block font-medium text-gray-900">Apenas 'E'</span>
                            </label>

                            <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.tipo_visita === 'P' ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                <input
                                    type="radio" name="tipoVisita" value="P" className="sr-only"
                                    checked={formData.tipo_visita === 'P'}
                                    onChange={(e) => setFormData({ ...formData, tipo_visita: e.target.value })}
                                />
                                <span className="block font-medium text-gray-900">Apenas 'P'</span>
                            </label>

                            <label className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.tipo_visita === 'EP' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-gray-50 border-gray-200'}`}>
                                <input
                                    type="radio" name="tipoVisita" value="EP" className="sr-only"
                                    checked={formData.tipo_visita === 'EP'}
                                    onChange={(e) => setFormData({ ...formData, tipo_visita: e.target.value })}
                                />
                                <span className="block font-medium text-gray-900">Fez 'E' e 'P'</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-6 !pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || loadingPacientes}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 shadow-sm"
                        >
                            {loading ? 'Registrando...' : 'Confirmar Visita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
