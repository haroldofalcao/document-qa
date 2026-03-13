import { db } from './firebase';
import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
    query, where, limit
} from 'firebase/firestore';

const COL = 'medicos';

/** Retorna todos os médicos cadastrados */
export async function getMedicos() {
    const snap = await getDocs(collection(db, COL));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Busca um médico pelo e-mail. Retorna null se não encontrado. */
export async function getMedicoByEmail(email) {
    const q = query(collection(db, COL), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
}

/** Verifica se a coleção está vazia (bootstrap) */
export async function isMedicosEmpty() {
    const q = query(collection(db, COL), limit(1));
    const snap = await getDocs(q);
    return snap.empty;
}

/** Cria um novo médico. Retorna o ID gerado. */
export async function createMedico({ email, nome, admin = false }) {
    const ref = await addDoc(collection(db, COL), {
        email,
        nome,
        ativo: true,
        admin,
        criadoEm: new Date().toISOString(),
    });
    return ref.id;
}

/** Atualiza campos de um médico (ativo, admin, nome) */
export async function updateMedico(id, data) {
    await updateDoc(doc(db, COL, id), data);
}

/** Remove um médico do sistema. Visitas anteriores são preservadas. */
export async function deleteMedico(id) {
    await deleteDoc(doc(db, COL, id));
}
