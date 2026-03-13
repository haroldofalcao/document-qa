import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

/**
 * Modal de confirmação reutilizável — substitui window.confirm e window.alert.
 *
 * Props:
 *   isOpen        — boolean
 *   title         — string
 *   message       — string
 *   confirmLabel  — string (padrão: "Confirmar")
 *   cancelLabel   — string (padrão: "Cancelar") | null para ocultar botão cancelar
 *   variant       — 'danger' | 'warning' | 'info'
 *   confirmPhrase — string opcional: se fornecido, exige que o usuário digite a frase antes de confirmar
 *   onConfirm     — função chamada ao clicar em confirmar
 *   onCancel      — função chamada ao clicar em cancelar ou fora do modal
 */
export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    confirmPhrase,
    onConfirm,
    onCancel,
}) {
    const [typed, setTyped] = useState('');

    useEffect(() => {
        if (isOpen) setTyped('');
    }, [isOpen]);

    if (!isOpen) return null;

    const phraseOk = !confirmPhrase || typed === confirmPhrase;

    const styles = {
        danger: {
            icon: <AlertTriangle size={22} className="text-red-500 flex-shrink-0" />,
            headerBg: 'bg-red-50 border-red-100',
            titleColor: 'text-red-800',
            btn: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: <AlertTriangle size={22} className="text-orange-500 flex-shrink-0" />,
            headerBg: 'bg-orange-50 border-orange-100',
            titleColor: 'text-orange-800',
            btn: 'bg-orange-600 hover:bg-orange-700 text-white',
        },
        info: {
            icon: <Info size={22} className="text-blue-500 flex-shrink-0" />,
            headerBg: 'bg-blue-50 border-blue-100',
            titleColor: 'text-blue-800',
            btn: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
        success: {
            icon: <CheckCircle size={22} className="text-green-500 flex-shrink-0" />,
            headerBg: 'bg-green-50 border-green-100',
            titleColor: 'text-green-800',
            btn: 'bg-green-600 hover:bg-green-700 text-white',
        },
    };

    const s = styles[variant] || styles.danger;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`flex items-center gap-3 p-5 border-b ${s.headerBg}`}>
                    {s.icon}
                    <h3 className={`font-bold text-base ${s.titleColor}`}>{title}</h3>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                    {confirmPhrase && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1.5">
                                Para confirmar, digite: <span className="font-semibold text-red-600">{confirmPhrase}</span>
                            </p>
                            <input
                                type="text"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                placeholder={confirmPhrase}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-3 justify-end px-5 pb-5">
                    {cancelLabel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        disabled={!phraseOk}
                        className={`px-5 py-2 rounded-lg font-medium transition-colors text-sm ${s.btn} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
