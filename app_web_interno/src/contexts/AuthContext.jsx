import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { getMedicoByEmail, isMedicosEmpty, createMedico } from '../services/medicosService';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [medicoData, setMedicoData] = useState(null); // { id, nome, email, ativo, admin }
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(''); // Mensagem de acesso negado

    const googleProvider = new GoogleAuthProvider();

    const loginWithGoogle = async () => {
        setAuthError('');
        await signInWithPopup(auth, googleProvider);
        // A verificação de autorização ocorre no onAuthStateChanged abaixo
    };

    const logout = async () => {
        setMedicoData(null);
        setAuthError('');
        await signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // ── Bootstrap: se não há nenhum médico cadastrado, o primeiro login vira admin ──
                    const vazia = await isMedicosEmpty();
                    if (vazia) {
                        const id = await createMedico({
                            email: user.email,
                            nome: user.displayName || user.email,
                            admin: true,
                        });
                        setMedicoData({ id, email: user.email, nome: user.displayName || user.email, ativo: true, admin: true });
                        setCurrentUser(user);
                        setLoading(false);
                        return;
                    }

                    // ── Verificação normal: e-mail deve estar cadastrado e ativo ──
                    const medico = await getMedicoByEmail(user.email);

                    if (medico && medico.ativo) {
                        setMedicoData(medico);
                        setCurrentUser(user);
                    } else {
                        // Acesso não autorizado: faz logout silencioso e exibe mensagem
                        const motivo = medico && !medico.ativo
                            ? 'Sua conta está desativada. Entre em contato com o administrador.'
                            : 'Acesso não autorizado. Solicite ao administrador que cadastre seu e-mail.';
                        setAuthError(motivo);
                        setCurrentUser(null);
                        setMedicoData(null);
                        await signOut(auth);
                    }
                } catch (err) {
                    console.error('Erro ao verificar autorização:', err);
                    setAuthError('Erro ao verificar permissões. Tente novamente.');
                    setCurrentUser(null);
                    setMedicoData(null);
                    await signOut(auth);
                }
            } else {
                setCurrentUser(null);
                setMedicoData(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        medicoData,
        isAdmin: medicoData?.admin === true,
        authError,
        setAuthError,
        loginWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
