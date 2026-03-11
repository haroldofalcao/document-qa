import React, { useState } from 'react';
import { createPaciente } from '../services/pacientesService';
import { X } from 'lucide-react';

export default function PacienteForm({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        prontuario: '',
        nome: '',
        rg: '',
        status: 'ativo',
        data_inicio: new Date().toISOString().split('T')[0] // Defaults to today
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Basic empty field checks
            if (!formData.prontuario || !formData.nome || !formData.rg || !formData.data_inicio) {
                throw new Error("Por favor, preencha Prontuário, Nome, RG e Data Inicial.");
            }

            await createPaciente({
                ...formData,
                prontuario: Number(formData.prontuario) // force number
            });

            // Cleanup on success
            setFormData({ prontuario: '', nome: '', rg: '', status: 'ativo', data_inicio: new Date().toISOString().split('T')[0] });
            onSuccess(); // triggers list reload
            onClose();   // closes modal
        } catch (err) {
            setError(err.message || "Erro desconhecido ao salvar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Novo Paciente</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prontuário</label>
                        <input
                            type="number"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            value={formData.prontuario}
                            onChange={(e) => setFormData({ ...formData, prontuario: e.target.value })}
                            placeholder="Ex: 1054"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Maria da Silva"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            value={formData.rg}
                            onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                            placeholder="Apenas números e letras"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Inclusão / Admissão</label>
                        <input
                            type="date"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            value={formData.data_inicio}
                            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
                        >
                            {loading ? 'Salvando...' : 'Salvar Paciente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
