import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { token, user } = useAuthStore();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/feed" replace />;
    }

    if (user && user.status === 'PENDING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-yellow-100">
                    <div className="text-5xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Compte en attente</h2>
                    <p className="text-slate-600 mb-6">
                        Votre compte Enseignant ou Chercheur doit être validé par un administrateur avant d'accéder à la plateforme.
                    </p>
                    <button 
                        onClick={() => window.location.href = '/login'} 
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Retour à la connexion
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
