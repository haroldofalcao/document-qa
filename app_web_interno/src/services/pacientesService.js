import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';

const collectionName = 'pacientes';

// Criar um novo paciente
export const createPaciente = async (pacienteData) => {
    try {
        // Basic validation to check for duplicate prontuario
        const q = query(collection(db, collectionName), where("prontuario", "==", pacienteData.prontuario));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            throw new Error("Já existe um paciente cadastrado com este prontuário.");
        }

        const docRef = await addDoc(collection(db, collectionName), {
            ...pacienteData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Erro ao adicionar paciente: ", error);
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

// Atualizar um paciente
export const updatePaciente = async (id, updatedData) => {
    try {
        const pacienteRef = doc(db, collectionName, id);
        await updateDoc(pacienteRef, updatedData);
    } catch (error) {
        console.error("Erro ao atualizar paciente: ", error);
        throw error;
    }
}

// Deletar (ou dar alta) um paciente
export const deletePaciente = async (id) => {
    try {
        const pacienteRef = doc(db, collectionName, id);
        await deleteDoc(pacienteRef);
    } catch (error) {
        console.error("Erro ao deletar paciente: ", error);
        throw error;
    }
}
