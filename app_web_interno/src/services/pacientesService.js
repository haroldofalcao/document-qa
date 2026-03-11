import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const collectionName = 'pacientes';

// Criar um novo paciente (Apenas dados de identidade)
export const createPaciente = async (pacienteData) => {
    try {
        // Validação: não permite dois prontuários iguais
        const q = query(collection(db, collectionName), where("prontuario", "==", pacienteData.prontuario));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error("Já existe um paciente cadastrado com este número de prontuário.");
        }

        const docRef = await addDoc(collection(db, collectionName), {
            prontuario: pacienteData.prontuario,
            nome: pacienteData.nome,
            rg: pacienteData.rg,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao adicionar paciente: ", error);
        throw error;
    }
};

// Buscar paciente específico por Prontuário (Útil para a tela de Admissão importar dados)
export const getPacienteByProntuario = async (prontuario) => {
    try {
        const q = query(collection(db, collectionName), where("prontuario", "==", Number(prontuario)));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        // Retorna o primeiro (e teoricamente único) match
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error("Erro ao buscar paciente por prontuário: ", error);
        throw error;
    }
};

// Ler todos os pacientes
export const getPacientes = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const pacientes = [];
        querySnapshot.forEach((doc) => {
            pacientes.push({ id: doc.id, ...doc.data() });
        });
        return pacientes;
    } catch (error) {
        console.error("Erro ao buscar pacientes: ", error);
        throw error;
    }
};

// Atualizar um paciente (Correção de nome ou RG)
export const updatePaciente = async (id, updatedData) => {
    try {
        const pacienteRef = doc(db, collectionName, id);
        await updateDoc(pacienteRef, {
            nome: updatedData.nome,
            rg: updatedData.rg
        });
    } catch (error) {
        console.error("Erro ao atualizar dados do paciente: ", error);
        throw error;
    }
}
