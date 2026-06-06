import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/login', { email, password });
            const { user, access_token } = response.data;
            
            localStorage.setItem('token', access_token);
            localStorage.setItem('user', JSON.stringify(user));
            
            set({ user, token: access_token, loading: false });
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Identifiants invalides';
            set({ error: message, loading: false });
            return { success: false, message };
        }
    },

    register: async (registerData) => {
        set({ loading: true, error: null });
        try {
            // If registerData contains files, we might need special handling, 
            // but axios handles FormData automatically.
            const response = await api.post('/register', registerData);
            const { user, access_token } = response.data;
            
            // Auto login if status is active (students)
            if (user.status === 'ACTIVE') {
                localStorage.setItem('token', access_token);
                localStorage.setItem('user', JSON.stringify(user));
                set({ user, token: access_token });
            }
            
            set({ loading: false });
            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || "Erreur lors de l'inscription";
            set({ error: message, loading: false });
            return { success: false, message };
        }
    },

    logout: async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.error('Logout failed', e);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null });
        }
    },

    fetchUser: async () => {
        if (!localStorage.getItem('token')) return;
        try {
            const response = await api.get('/user');
            set({ user: response.data });
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ user: null, token: null });
        }
    }
}));

export default useAuthStore;
