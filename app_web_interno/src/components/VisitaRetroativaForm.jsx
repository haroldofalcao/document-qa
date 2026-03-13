import React, { useState, useEffect } from 'react';
import { createVisita } from '../services/visitasService';
import { getPacientes } from '../services/pacientesService';
import { getInternacoes } from '../services/internacoesService';
import { X, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function VisitaRetroativaForm({ isOpen, onClose, onSuccess }) {
    const { currentUser } = useAuth();
    const nomeMedico = currentUser?.displayName || currentUser?.email || 'Médico Não Identificado';
    const emailMedico = currentUser?.email || '';

    const [admissoesAtivas, setAdmissoesAtivas] = useState([]);
    const [formData, setFormData] = useState({
        internacaoId: '',
        pacienteId: '',
        tipo_visita: 'E', // default
        nome_medico: nomeMedico,
        email_medico: emailMedico,
        data_retroativa: new Date().toISOString().split('T')[0] // Data selecionável
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadAdmissoesAtivas();
            // Reseta form sempre que abre
            setFormData({
                internacaoId: '',
                pacienteId: '',
                tipo_visita: 'E',
                nome_medico: nomeMedico,
                email_medico: emailMedico,
                data_retroativa: new Date().toISOString().split('T')[0]
            });
            setError('');
        }
    }, [isOpen]);

    const loadAdmissoesAtivas = async () => {
        try {
            const internacoes = await getInternacoes(true);
            const pacientesData = await getPacientes();

            const pacientesMap = pacientesData.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            const completas = internacoes.map(int => ({
                ...int,
                paciente: pacientesMap[int.pacienteId] || { nome: 'Desconhecido', prontuario: '-' }
            }));

            setAdmissoesAtivas(completas);
        } catch (err) {
            console.error("Erro ao carregar admissões", err);
        }
    };

    const handleSelectChange = (e) => {
        const selectedId = e.target.value;
        const selectedAdmissao = admissoesAtivas.find(a => a.id === selectedId);
        if (selectedAdmissao) {
            setFormData({
                ...formData,
                internacaoId: selectedAdmissao.id,
                pacienteId: selectedAdmissao.pacienteId
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.internacaoId || !formData.pacienteId) {
            setError('Por favor, selecione um paciente internado.');
            return;
        }

        if (!formData.data_retroativa) {
            setError('Por favor, informe a data em que a visita ocorreu.');
            return;
        }

        setLoading(true);
        setError('');

        try {
                await createVisita({
                internacaoId: formData.internacaoId,
                pacienteId: formData.pacienteId,
                tipo_visita: formData.tipo_visita,
                nome_medico: formData.nome_medico,
                email_medico: formData.email_medico,
                status_pagamento: 'Pendente',
                data_hora: formData.data_retroativa // YYYY-MM-DD — sem horário
            });

            // Sucesso
            onSuccess();
            onClose();
        } catch (err) {
            setError('Erro ao salvar visita retroativa. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-orange-50">
                    <h3 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                        <Calendar className="text-orange-600" />
                        Visita Retroativa
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Data Field - O Diferencial desta tela */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data da Visita Realizada *
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-orange-50/30"
                            value={formData.data_retroativa}
                            max={new Date().toISOString().split('T')[0]} // Não pode lançar no futuro
                            onChange={(e) => setFormData({ ...formData, data_retroativa: e.target.value })}
                        />
                    </div>

                    {/* Select Dinâmico */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paciente Internado (Leito Ativo) *
                        </label>
                        <select
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-white"
                            value={formData.internacaoId}
                            onChange={handleSelectChange}
                        >
                            <option value="">Selecione uma internação...</option>
                            {admissoesAtivas.map((adm) => (
                                <option key={adm.id} value={adm.id}>
                                    {adm.paciente.nome} - Reg: {adm.numero_registro}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Visita - Botões Segmentados */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Visita Clínico-Nutricional *
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {['E', 'P', 'EP'].map((tipo) => (
                                <button
                                    key={tipo}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tipo_visita: tipo })}
                                    className={`py-3 rounded-lg text-sm font-bold transition-all ${formData.tipo_visita === tipo
                                        ? 'bg-orange-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {tipo === 'E' ? 'Enteral (E)' : tipo === 'P' ? 'Parenteral (P)' : 'Ambas (EP)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {loading ? 'Salvando...' : 'Salvar no Passado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
