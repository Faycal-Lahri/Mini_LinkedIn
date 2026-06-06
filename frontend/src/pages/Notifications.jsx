import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import useToastStore from '../store/toastStore';
import useConfirmStore from '../store/confirmStore';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'
    const { addToast } = useToastStore();
    const { showConfirm } = useConfirmStore();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (userId, notificationId) => {
        try {
            await api.post(`/network/accept/${userId}`);
            await markAsRead(notificationId);
            addToast("Connexion acceptée !", "success");
        } catch (error) {
            console.error(error);
            addToast("Erreur lors de l'acceptation", "error");
        }
    };

    const handleRefuseRequest = async (userId, notificationId) => {
        try {
            await api.delete(`/network/remove/${userId}`);
            await markAsRead(notificationId);
            addToast("Demande refusée", "info");
        } catch (error) {
            console.error(error);
            addToast("Erreur lors du refus", "error");
        }
    };

    const handleAcceptProjectJoin = async (projectId, userId, notificationId) => {
        if (!userId) {
            addToast("ID de l'utilisateur manquant dans la notification.", "error");
            return;
        }
        try {
            await api.post(`/projects/${projectId}/members/${userId}/approve`);
            await markAsRead(notificationId);
            fetchNotifications();
            addToast("Demande d'adhésion acceptée !", "success");
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || "Erreur lors de l'approbation", "error");
        }
    };

    const handleRefuseProjectJoin = async (projectId, userId, notificationId) => {
        if (!userId) {
            addToast("ID de l'utilisateur manquant dans la notification.", "error");
            return;
        }
        try {
            await api.post(`/projects/${projectId}/members/${userId}/reject`);
            await markAsRead(notificationId);
            fetchNotifications();
            addToast("Demande d'adhésion refusée", "info");
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || "Erreur lors du refus", "error");
        }
    };

    const handleAcceptProjectInvitation = async (projectId, notificationId) => {
        try {
            await api.post(`/projects/${projectId}/invite/accept`);
            await markAsRead(notificationId);
            fetchNotifications();
            addToast("Invitation acceptée ! Vous êtes maintenant membre du projet.", "success");
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || "Erreur lors de l'acceptation", "error");
        }
    };

    const handleDeclineProjectInvitation = async (projectId, notificationId) => {
        try {
            await api.post(`/projects/${projectId}/invite/decline`);
            await markAsRead(notificationId);
            fetchNotifications();
            addToast("Invitation refusée.", "info");
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || "Erreur lors du refus", "error");
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (error) {
            console.error(error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            addToast("Toutes les notifications marquées comme lues", "success");
        } catch (error) {
            console.error(error);
        }
    };

    const clearAll = async () => {
        showConfirm('Supprimer toutes les notifications ?', async () => {
            try {
                await api.delete('/notifications');
                setNotifications([]);
                addToast("Notifications supprimées", "info");
            } catch (error) {
                console.error(error);
            }
        });
    };

    const getIconDetails = (type) => {
        switch(type) {
            case 'POST_LIKED': 
                return { icon: 'favorite', bg: 'bg-[#ff2d55]/10', text: 'text-[#ff2d55]' };
            case 'POST_COMMENTED': 
                return { icon: 'chat_bubble', bg: 'bg-[#34c759]/10', text: 'text-[#34c759]' };
            case 'CONNECTION_REQUEST': 
                return { icon: 'person_add', bg: 'bg-[#0071e3]/10', text: 'text-[#0071e3]' };
            case 'CONNECTION_ACCEPTED': 
                return { icon: 'group', bg: 'bg-[#5ac8fa]/10', text: 'text-[#5ac8fa]' };
            case 'ACCOUNT_VALIDATED': 
                return { icon: 'verified', bg: 'bg-[#34c759]/10', text: 'text-[#34c759]' };
            case 'ACCOUNT_REJECTED': 
                return { icon: 'gpp_bad', bg: 'bg-[#ff3b30]/10', text: 'text-[#ff3b30]' };
            case 'PROJECT_JOIN_REQUEST': 
                return { icon: 'folder_shared', bg: 'bg-[#af52de]/10', text: 'text-[#af52de]' };
            case 'PROJECT_JOIN_ACCEPTED': 
                return { icon: 'folder_managed', bg: 'bg-[#34c759]/10', text: 'text-[#34c759]' };
            case 'PROJECT_JOIN_REJECTED': 
                return { icon: 'folder_off', bg: 'bg-[#ff3b30]/10', text: 'text-[#ff3b30]' };
            case 'PROJECT_INVITATION': 
                return { icon: 'mail', bg: 'bg-[#ff9500]/10', text: 'text-[#ff9500]' };
            case 'ACCOUNT_PENDING_VALIDATION': 
                return { icon: 'hourglass_empty', bg: 'bg-[#ff9500]/10', text: 'text-[#ff9500]' };
            default: 
                return { icon: 'notifications', bg: 'bg-[#86868b]/10', text: 'text-[#86868b]' };
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'UNREAD') return !n.is_read;
        return true;
    });

    if (loading) return <BrandLoader />;

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
            <Navbar />
            
            <div className="max-w-[680px] mx-auto w-full px-4 py-8 flex-grow">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[28px] font-bold text-[#1d1d1f] tracking-tight">Notifications</h1>
                        <p className="text-[13px] text-[#6e6e73]">Toute l'activité de votre réseau académique</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* iOS Segmented Control */}
                        <div className="bg-[#e8e8ed] p-0.5 rounded-[9px] flex items-center shadow-inner">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={`px-4 py-1 text-xs font-semibold rounded-[7px] transition-all ${
                                    filter === 'ALL' 
                                        ? 'bg-white text-[#1d1d1f] shadow-apple-xs' 
                                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                                }`}
                            >
                                Toutes
                            </button>
                            <button
                                onClick={() => setFilter('UNREAD')}
                                className={`px-4 py-1 text-xs font-semibold rounded-[7px] transition-all flex items-center gap-1.5 ${
                                    filter === 'UNREAD' 
                                        ? 'bg-white text-[#1d1d1f] shadow-apple-xs' 
                                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                                }`}
                            >
                                Non lues
                                {notifications.some(n => !n.is_read) && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3]"></span>
                                )}
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1">
                            <button 
                                onClick={markAllRead}
                                className="w-8 h-8 rounded-full bg-white border border-black/5 hover:bg-[#f5f5f7] flex items-center justify-center text-[#6e6e73] hover:text-[#0071e3] transition-all shadow-apple-xs press-effect"
                                title="Tout marquer comme lu"
                            >
                                <span className="material-symbols-outlined text-[18px]">done_all</span>
                            </button>
                            <button 
                                onClick={clearAll}
                                className="w-8 h-8 rounded-full bg-white border border-black/5 hover:bg-[#ff3b30]/5 flex items-center justify-center text-[#6e6e73] hover:text-[#ff3b30] transition-all shadow-apple-xs press-effect"
                                title="Tout effacer"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications list */}
                <div className="space-y-3">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n, index) => {
                            const iconInfo = getIconDetails(n.type);
                            return (
                                <div 
                                    key={n.id} 
                                    onClick={() => !n.is_read && markAsRead(n.id)}
                                    className={`group relative p-4 flex gap-4 bg-white border border-black/5 rounded-[16px] transition-all duration-300 ${
                                        n.is_read 
                                            ? 'hover:border-black/10 hover:shadow-apple-xs' 
                                            : 'border-l-[3.5px] border-l-[#0071e3] bg-[#0071e3]/[0.02] shadow-apple-xs'
                                    } cursor-pointer apple-fade-up`}
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    {/* Icon badge wrapper */}
                                    <div className={`w-10 h-10 rounded-full ${iconInfo.bg} ${iconInfo.text} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 duration-200`}>
                                        <span className="material-symbols-outlined text-[20px]">
                                            {iconInfo.icon}
                                        </span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-grow min-w-0 pr-4">
                                        <p className={`text-[14px] leading-relaxed mb-1 ${n.is_read ? 'text-[#48484a]' : 'text-[#1d1d1f] font-semibold'}`}>
                                            {n.message}
                                        </p>
                                        <div className="flex items-center gap-1 text-[11px] text-[#86868b] font-medium">
                                            <span className="material-symbols-outlined text-[14px]">schedule</span> 
                                            {new Date(n.created_at).toLocaleDateString()} à {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>

                                        {/* Action items for requests */}
                                        {n.type === 'CONNECTION_REQUEST' && (
                                            <div className="flex gap-2 mt-3.5" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleAcceptRequest(n.reference_id, n.id)}
                                                    className="h-[28px] text-[12px] font-semibold px-4 bg-[#34c759] hover:bg-[#30b350] text-white rounded-full transition-all press-effect shadow-apple-xs"
                                                >
                                                    Accepter
                                                </button>
                                                <button 
                                                    onClick={() => handleRefuseRequest(n.reference_id, n.id)}
                                                    className="h-[28px] text-[12px] font-semibold px-4 bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#86868b] rounded-full transition-all press-effect"
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        )}

                                        {n.type === 'PROJECT_JOIN_REQUEST' && (
                                            <div className="flex gap-2 mt-3.5" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleAcceptProjectJoin(n.reference_id, n.data?.requester_id, n.id)}
                                                    className="h-[28px] text-[12px] font-semibold px-4 bg-[#34c759] hover:bg-[#30b350] text-white rounded-full transition-all press-effect shadow-apple-xs"
                                                >
                                                    Accepter
                                                </button>
                                                <button 
                                                    onClick={() => handleRefuseProjectJoin(n.reference_id, n.data?.requester_id, n.id)}
                                                    className="h-[28px] text-[12px] font-semibold px-4 bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#86868b] rounded-full transition-all press-effect"
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        )}

                                        {n.type === 'PROJECT_INVITATION' && (
                                            <div className="flex gap-2 mt-3.5" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleAcceptProjectInvitation(n.reference_id, n.id)}
                                                    className="h-[28px] text-[12px] font-semibold px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-all press-effect shadow-apple-xs"
                                                >
                                                    Rejoindre
                                                </button>
                                                <button 
                                                    onClick={() => handleDeclineProjectInvitation(n.reference_id, n.id)}
                                                    className="h-[28px] text-[12px] font-semibold px-4 bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#86868b] rounded-full transition-all press-effect"
                                                >
                                                    Décliner
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Unread Indicator dot on the side */}
                                    {!n.is_read && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                            <span className="h-2 w-2 rounded-full bg-[#0071e3] flex-shrink-0 animate-pulse"></span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center bg-white border border-black/5 rounded-[24px] shadow-apple-sm animate-fadeIn">
                            <div className="w-16 h-16 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-[32px] text-[#86868b]">
                                    notifications_off
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-[#1d1d1f] mb-1">Aucune notification</h3>
                            <p className="text-[13px] text-[#86868b] max-w-xs mx-auto">Vous êtes complètement à jour ! Rien de nouveau pour le moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
