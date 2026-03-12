import React from 'react';

/**
 * Retorna um badge colorido para o tipo de visita clínico-nutricional.
 * Usado em: VisitasList, VisitasFinanceiroList, VisitasRetroativasList.
 */
export function getTipoVisitaLabel(tipo) {
    switch (tipo) {
        case 'E':
            return (
                <span className="bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded text-xs">
                    Enteral (E)
                </span>
            );
        case 'P':
            return (
                <span className="bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded text-xs">
                    Parenteral (P)
                </span>
            );
        case 'EP':
            return (
                <span className="bg-indigo-100 text-indigo-700 font-medium px-2 py-1 rounded text-xs">
                    Ambas (EP)
                </span>
            );
        default:
            return (
                <span className="bg-gray-100 text-gray-700 font-medium px-2 py-1 rounded text-xs">
                    {tipo}
                </span>
            );
    }
}

/**
 * Retorna o rótulo textual do tipo de visita (sem JSX).
 * Usado em contextos onde não é possível renderizar JSX (ex: impressão, logs).
 */
export function getTipoVisitaTexto(tipo) {
    switch (tipo) {
        case 'E': return 'Enteral (E)';
        case 'P': return 'Parenteral (P)';
        case 'EP': return 'Ambas (EP)';
        default: return tipo || '-';
    }
}
