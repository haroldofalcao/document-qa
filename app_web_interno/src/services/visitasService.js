import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';

const collectionName = 'visitas';

// Criar nova visita
export const createVisita = async (visitaData) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...visitaData,
            data_hora: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao registrar visita: ", error);
        throw error;
    }
};

// Ler todas as visitas (ordenadas por data decrescente)
export const getVisitas = async () => {
    try {
        const q = query(collection(db, collectionName), orderBy("data_hora", "desc"));
        const querySnapshot = await getDocs(q);
        const visitas = [];
        querySnapshot.forEach((doc) => {
            visitas.push({ id: doc.id, ...doc.data() });
        });
        return visitas;
    } catch (error) {
        console.error("Erro ao buscar visitas: ", error);
        throw error;
    }
};

// Deletar visita
export const deleteVisita = async (id) => {
    try {
        const visitaRef = doc(db, collectionName, id);
        await deleteDoc(visitaRef);
    } catch (error) {
        console.error("Erro ao deletar visita: ", error);
        throw error;
    }
};

// Ler visitas filtradas por status de pagamento
export const getVisitasPorPagamento = async (status_pagamento) => {
    try {
        let q;
        if (status_pagamento === 'Todos') {
            q = query(collection(db, collectionName), orderBy("data_hora", "desc"));
        } else {
            q = query(
                collection(db, collectionName),
                where("status_pagamento", "==", status_pagamento)
            );
        }

        const querySnapshot = await getDocs(q);
        const visitas = [];
        querySnapshot.forEach((doc) => {
            visitas.push({ id: doc.id, ...doc.data() });
        });

        // Firestore requires composite index for where+orderBy, sorting manually in mem for 'Pendente'/'Pago' to avoid complex setup
        if (status_pagamento !== 'Todos') {
            visitas.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));
        }

        return visitas;
    } catch (error) {
        console.error("Erro ao buscar visitas por pagamento: ", error);
        throw error;
    }
};

// Ler visitas por internação
export const getVisitasPorInternacao = async (internacaoId) => {
    try {
        const q = query(
            collection(db, collectionName),
            where("internacaoId", "==", internacaoId)
        );
        const querySnapshot = await getDocs(q);
        const visitas = [];
        querySnapshot.forEach((doc) => {
            visitas.push({ id: doc.id, ...doc.data() });
        });
        return visitas;
    } catch (error) {
        console.error("Erro ao buscar visitas da internação: ", error);
        throw error;
    }
};

// Atualizar dados financeiros da visita
export const updatePagamentoVisita = async (id, dadosPagamento) => {
    try {
        const visitaRef = doc(db, collectionName, id);
        await updateDoc(visitaRef, dadosPagamento);
    } catch (error) {
        console.error("Erro ao atualizar pagamento da visita: ", error);
        throw error;
    }
}
