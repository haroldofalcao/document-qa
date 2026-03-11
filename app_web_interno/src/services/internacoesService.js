import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

const collectionName = 'internacoes';

// Criar um novo registro de internação (admissão)
export const createInternacao = async (internacaoData) => {
    try {
        // Validação básica: não permitir abrir uma nova internação se já existe uma ativa para este paciente
        const q = query(
            collection(db, collectionName),
            where("pacienteId", "==", internacaoData.pacienteId),
            where("status", "==", "ativo")
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error("Este paciente já possui uma internação ativa.");
        }

        const docRef = await addDoc(collection(db, collectionName), {
            ...internacaoData,
            status: "ativo",
            historico: [{
                tipo: 'admissão',
                data: new Date().toISOString()
            }],
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao registrar internação: ", error);
        throw error;
    }
};

// Ler todas as internações (com opção de filtrar só as ativas)
export const getInternacoes = async (apenasAtivas = false) => {
    try {
        let q;
        if (apenasAtivas) {
            q = query(collection(db, collectionName), where("status", "==", "ativo"));
        } else {
            q = collection(db, collectionName); // Retorna todas (histórico geral)
        }

        const querySnapshot = await getDocs(q);
        const internacoes = [];
        querySnapshot.forEach((doc) => {
            internacoes.push({ id: doc.id, ...doc.data() });
        });

        // Vamos ordenar em memória pela data de admissão decrescente por padrão
        internacoes.sort((a, b) => new Date(b.data_admissao) - new Date(a.data_admissao));
        return internacoes;
    } catch (error) {
        console.error("Erro ao buscar internações: ", error);
        throw error;
    }
};

// Obter uma única internação pelo ID
export const getInternacaoById = async (id) => {
    // Para otimização, se precisar buscar uma específica. Se não usa getDocs no ID.
    // Usaremos getInternacoes para simplificar por enquanto se o volume não for absurdo
}

// Atualizar Status (Dar Alta ou Readmitir)
export const updateStatusInternacao = async (id, novoStatus, historicoAtual = []) => {
    try {
        const internacaoRef = doc(db, collectionName, id);

        const novoEvento = {
            tipo: novoStatus === 'alta' ? 'alta' : 'readmissão',
            data: new Date().toISOString()
        };

        const updatePayload = {
            status: novoStatus,
            historico: [...historicoAtual, novoEvento]
        };

        if (novoStatus === 'alta') {
            updatePayload.data_alta = new Date().toISOString(); // Marca a data da última alta
        } else {
            updatePayload.data_alta = null; // Limpa a data de alta se for readmitido
        }

        await updateDoc(internacaoRef, updatePayload);
    } catch (error) {
        console.error("Erro ao atualizar status da internação: ", error);
        throw error;
    }
};

// Atualizar dados de uma internação existente
export const updateInternacao = async (id, data) => {
    try {
        const internacaoRef = doc(db, collectionName, id);
        await updateDoc(internacaoRef, data);
    } catch (error) {
        console.error("Erro ao editar internação: ", error);
        throw error;
    }
};

// Deletar uma internação
export const deleteInternacao = async (id) => {
    try {
        const internacaoRef = doc(db, collectionName, id);
        await deleteDoc(internacaoRef);
    } catch (error) {
        console.error("Erro ao deletar internação: ", error);
        throw error;
    }
};
