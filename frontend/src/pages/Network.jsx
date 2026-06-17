import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { BrandLoader } from '../components/Loader';
import useConfirmStore from '../store/confirmStore';

const Network = () => {
    const { user: currentUser } = useAuthStore();
    const { showConfirm } = useConfirmStore();
    const [users, setUsers] = useState([]);
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingAi, setLoadingAi] = useState(false);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchNetwork();
        fetchAiSuggestions();
    }, []);

    const fetchNetwork = async () => {
        setLoading(true);
        try {
            const response = await api.get('/network');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch network', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAiSuggestions = async () => {
        setLoadingAi(true);
        try {
            const response = await api.get('/ai/connections');
            setAiSuggestions(response.data);
        } catch (error) {
            console.error('Failed to fetch AI suggestions', error);
        } finally {
            setLoadingAi(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearch(query);
        if (query.trim() === '') {
            fetchNetwork();
            return;
        }

        try {
            const response = await api.get(`/network/search?q=${query}`);
            setUsers(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendRequest = async (userId) => {
        try {
            await api.post(`/network/request/${userId}`);
            setUsers(users.map(u => u.id === userId ? { ...u, connection_status: 'PENDING', is_sender: true } : u));
            setAiSuggestions(aiSuggestions.map(item => item.user.id === userId ? { ...item, user: { ...item.user, connection_status: 'PENDING', is_sender: true } } : item));
        } catch (error) {
            console.error(error);
        }
    };

    const handleAcceptRequest = async (userId) => {
        try {
            await api.post(`/network/accept/${userId}`);
            setUsers(users.map(u => u.id === userId ? { ...u, connection_status: 'ACCEPTED' } : u));
            setAiSuggestions(aiSuggestions.map(item => item.user.id === userId ? { ...item, user: { ...item.user, connection_status: 'ACCEPTED' } } : item));
        } catch (error) {
            console.error(error);
        }
    };

    const handleRemoveConnection = async (userId) => {
        showConfirm('Voulez-vous supprimer cette connexion ?', async () => {
            try {
                await api.delete(`/network/remove/${userId}`);
                setUsers(users.map(u => u.id === userId ? { ...u, connection_status: 'NONE' } : u));
                setAiSuggestions(aiSuggestions.map(item => item.user.id === userId ? { ...item, user: { ...item.user, connection_status: 'NONE', is_sender: false } } : item));
            } catch (error) {
                console.error(error);
            }
        });
    };

    const filteredUsers = filter === 'ALL' 
        ? users 
        : users.filter(u => u.role === filter);

    // Simple HSL hash generator for custom profile covers
    const getDynamicGradient = (userId) => {
        const h = (userId * 77) % 360;
        return `linear-gradient(135deg, hsl(${h}, 70%, 55%) 0%, hsl(${(h + 60) % 360}, 60%, 45%) 100%)`;
    };

    if (loading) return <BrandLoader />;

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6">
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                    
                    {/* Left Sidebar - Sticky network management */}
                    <div className="w-full lg:w-[280px] space-y-4 lg:sticky lg:top-[60px] self-start flex-shrink-0">
                        <div className="bg-white rounded-[20px] border border-black/10 p-5 shadow-apple-xs text-left animate-fadeInUp">
                            <h3 className="font-bold text-[#1d1d1f] text-[14px] leading-tight mb-4">Gérer mon réseau</h3>
                            
                            <nav className="space-y-3.5">
                                <div className="flex justify-between items-center text-xs font-semibold text-[#1d1d1f] cursor-pointer hover:text-[#0071e3] transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#6e6e73]">group</span>
                                        <span>Relations</span>
                                    </div>
                                    <span className="text-[#86868b] font-bold">
                                        {users.filter(u => u.connection_status === 'ACCEPTED').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-[#1d1d1f] cursor-pointer hover:text-[#0071e3] transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#6e6e73]">contact_page</span>
                                        <span>Contacts</span>
                                    </div>
                                    <span className="text-[#86868b] font-bold">
                                        {users.length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-[#1d1d1f] cursor-pointer hover:text-[#0071e3] transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#6e6e73]">domain</span>
                                        <span>Pages</span>
                                    </div>
                                    <span className="text-[#86868b] font-bold">1</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-[#1d1d1f] cursor-pointer hover:text-[#0071e3] transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-[#6e6e73]">calendar_month</span>
                                        <span>Événements</span>
                                    </div>
                                    <span className="text-[#86868b] font-bold">0</span>
                                </div>
                            </nav>
                            
                            <div className="border-t border-black/5 mt-4 pt-4 text-center">
                                <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">
                                    IGA Casablanca
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Main Container */}
                    <div className="flex-grow min-w-0 w-full space-y-5">
                        
                        {/* Header Section Apple-Style */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeInUp">
                            <div>
                                <h1 className="text-[26px] font-bold text-[#1d1d1f] tracking-[-0.02em]">
                                    Mon Réseau Académique
                                </h1>
                                <p className="text-[#6e6e73] text-xs font-semibold mt-0.5 uppercase tracking-wider">
                                    IGA Casablanca · {users.length} membres actifs
                                </p>
                            </div>

                    {/* macOS Spotlight Search Bar */}
                    <div className="relative group w-full md:w-80">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] group-focus-within:text-[#0071e3] text-[18px] transition-colors pointer-events-none">
                            search
                        </span>
                        <input 
                            type="search" 
                            className="w-full h-[36px] bg-white border border-black/5 pl-9 pr-3 text-sm focus:outline-2 focus:outline-[#0071e3] rounded-[10px] outline-none text-[#1d1d1f] transition-all duration-200 shadow-apple-xs" 
                            placeholder="Rechercher par nom, filière..." 
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                {search.trim() === '' && aiSuggestions.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-500/[0.04] to-violet-500/[0.01] rounded-[20px] border border-indigo-500/10 p-5 shadow-apple-xs mb-1 animate-fadeInUp">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-[20px] text-indigo-500 animate-pulse">auto_awesome</span>
                            <h2 className="font-bold text-[14px] text-indigo-950 tracking-[-0.01em]">Suggestions de connexions intelligentes (IA)</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {aiSuggestions.map((item) => {
                                const u = item.user;
                                return (
                                    <div 
                                        key={`ai-${u.id}`} 
                                        className="bg-white rounded-[12px] border border-black/5 hover:border-indigo-500/30 shadow-apple-xs hover:shadow-apple-sm transition-all duration-300 relative flex flex-col justify-between overflow-hidden"
                                        style={{ minHeight: '260px' }}
                                    >
                                        {/* Dismiss Button */}
                                        <button 
                                            onClick={() => setAiSuggestions(prev => prev.filter(s => s.user.id !== u.id))}
                                            className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all cursor-pointer z-20 border-none animate-none"
                                            title="Ignorer"
                                        >
                                            <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                                        </button>

                                        {/* Mini Gradient Banner */}
                                        <div 
                                            className="h-[48px] relative w-full flex-shrink-0 bg-slate-50 overflow-hidden"
                                        >
                                            <div className="w-full h-full" style={{ background: getDynamicGradient(u.id) }} />
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                                        </div>

                                        {/* Avatar */}
                                        <div className="relative z-10 flex justify-center -mt-[28px] flex-shrink-0">
                                            <Link to={`/profile/${u.id}`} className="inline-block press-effect">
                                                <div className="h-[56px] w-[56px] rounded-full bg-white p-0.5 shadow-apple-md overflow-hidden mx-auto border-2 border-white">
                                                    <div className="h-full w-full bg-[#f5f5f7] flex items-center justify-center text-xl rounded-full overflow-hidden border border-slate-100 uppercase">
                                                        {u.profile?.photo_url ? (
                                                            <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${u.profile.photo_url}`} className="object-cover h-full w-full rounded-full" alt="" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                                                        ) : (
                                                            <span className="font-bold text-[#86868b] text-sm uppercase">{u.first_name[0]}{u.last_name[0]}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Name, Role & AI reason */}
                                        <div className="px-3 pb-3 pt-1 text-center flex-grow flex flex-col justify-between items-stretch">
                                            <div className="space-y-1">
                                                <Link to={`/profile/${u.id}`} className="block hover:underline truncate">
                                                    <h4 className="font-bold text-[#1d1d1f] text-[13px] leading-tight">
                                                        {u.first_name} {u.last_name}
                                                    </h4>
                                                </Link>
                                                <p className="text-[10.5px] text-[#6e6e73] font-semibold truncate leading-none">
                                                    {u.role === 'STUDENT' ? 'Étudiant' : u.role === 'TEACHER' ? 'Enseignant' : 'Chercheur'} · {u.profile?.field || 'Ingénierie'}
                                                </p>
                                                
                                                {/* Reason Box */}
                                                <div className="mt-2.5 p-2 rounded-[8px] bg-indigo-500/[0.03] border border-indigo-500/5 text-[10px] text-indigo-650 font-medium leading-normal text-left">
                                                    ✨ {item.reason}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-3 flex-shrink-0">
                                                {u.connection_status === 'ACCEPTED' ? (
                                                    <span className="inline-flex w-full h-[28px] items-center justify-center border border-[#34c759]/30 bg-[#34c759]/[0.04] text-[#34c759] font-bold text-[10.5px] rounded-full select-none cursor-default">
                                                        Amis
                                                    </span>
                                                ) : u.connection_status === 'PENDING' ? (
                                                    <span className="inline-flex w-full h-[28px] items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-bold text-[10.5px] rounded-full select-none cursor-default">
                                                        En attente...
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleSendRequest(u.id)}
                                                        className="w-full inline-flex items-center justify-center gap-1 h-[28px] rounded-full border border-indigo-500 text-indigo-600 hover:bg-indigo-50 text-[10.5px] font-bold transition-all press-effect bg-transparent cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px] font-bold">person_add</span>
                                                        <span>Se connecter</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-5">
                    {/* iOS Segmented Tab Filters */}
                    <div className="flex justify-start">
                        <div className="inline-flex bg-[#e5e5ea] rounded-[9px] p-[3px] gap-0.5 animate-fadeInUp">
                            {[
                                { id: 'ALL', label: 'Communauté' },
                                { id: 'STUDENT', label: 'Étudiants' },
                                { id: 'TEACHER', label: 'Enseignants' },
                                { id: 'RESEARCHER', label: 'Chercheurs' }
                            ].map(r => (
                                <button 
                                    key={r.id}
                                    onClick={() => setFilter(r.id)}
                                    className={`px-5 py-1.5 rounded-[7px] text-[13px] font-semibold transition-all press-effect ${
                                        filter === r.id 
                                        ? 'bg-white text-[#1d1d1f] shadow-apple-xs' 
                                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grids users directory */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="bg-white rounded-[20px] shadow-apple-sm h-64 apple-shimmer border border-transparent" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
                            {filteredUsers.map((u, idx) => (
                                <div 
                                    key={u.id} 
                                    className="bg-white rounded-[12px] border border-black/10 hover:border-black/20 shadow-apple-xs hover:shadow-apple-sm transition-all duration-300 relative flex flex-col justify-between overflow-hidden apple-fade-up"
                                    style={{ animationDelay: `${idx * 40}ms`, minHeight: '270px' }}
                                >
                                    {/* Dismiss / Close X button */}
                                    <button 
                                        onClick={() => setUsers(prev => prev.filter(item => item.id !== u.id))}
                                        className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer z-20 border-none"
                                        title="Ignorer cette suggestion"
                                    >
                                        <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                                    </button>

                                    {/* Cover Mini Gradient Banner */}
                                    <div 
                                        className="h-[64px] relative w-full flex-shrink-0 bg-slate-100 overflow-hidden"
                                    >
                                        {u.profile?.website_url ? (
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${u.profile.website_url}`} 
                                                className="w-full h-full object-cover" 
                                                alt="" 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.style.background = getDynamicGradient(u.id);
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full" style={{ background: getDynamicGradient(u.id) }} />
                                        )}
                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
                                    </div>

                                    {/* Avatar at horse cover (Overlapping) */}
                                    <div className="relative z-10 flex justify-center -mt-[36px] flex-shrink-0">
                                        <Link to={`/profile/${u.id}`} className="inline-block press-effect">
                                            <div className="h-[72px] w-[72px] rounded-full bg-white p-0.5 shadow-apple-md overflow-hidden mx-auto border-2 border-white">
                                                <div className="h-full w-full bg-[#f5f5f7] flex items-center justify-center text-xl rounded-full overflow-hidden border border-slate-100 uppercase">
                                                    {u.profile?.photo_url ? (
                                                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${u.profile.photo_url}`} className="object-cover h-full w-full rounded-full" alt="" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                                                    ) : (
                                                        <span className="font-bold text-[#86868b] text-base uppercase">{u.first_name[0]}{u.last_name[0]}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Main info text column */}
                                    <div className="px-4 pb-4 pt-1.5 text-center flex-grow flex flex-col justify-between items-stretch">
                                        <div className="space-y-1">
                                            <Link to={`/profile/${u.id}`} className="block hover:underline truncate">
                                                <h3 className="font-bold text-[#1d1d1f] text-[14.5px] leading-tight">
                                                    {u.first_name} {u.last_name}
                                                </h3>
                                            </Link>
                                            
                                            <p className="text-[11.5px] text-[#6e6e73] font-semibold truncate leading-none">
                                                {u.role === 'STUDENT' ? 'Étudiant' : u.role === 'TEACHER' ? 'Enseignant' : 'Chercheur'} · {u.profile?.field || 'Ingénierie'}
                                            </p>
                                            
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">
                                                {u.profile?.institution || 'IGA Casablanca'}
                                            </p>

                                            {/* Mock Mutual Connections Row */}
                                            <div className="flex items-center justify-center gap-1.5 py-1">
                                                <div className="flex -space-x-1 flex-shrink-0">
                                                    <img 
                                                        src={`https://images.unsplash.com/photo-${1535713875002 + u.id % 10}?w=50&q=80`} 
                                                        className="w-3.5 h-3.5 rounded-full border border-white object-cover" 
                                                        alt="" 
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                                                    />
                                                    <img 
                                                        src={`https://images.unsplash.com/photo-${157029599991 + u.id % 10}?w=50&q=80`} 
                                                        className="w-3.5 h-3.5 rounded-full border border-white object-cover" 
                                                        alt="" 
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1570295999919?w=150&q=80'; }}
                                                    />
                                                </div>
                                                <span className="text-[9.5px] text-[#86868b] font-bold truncate max-w-[120px]">
                                                    {u.id % 2 === 0 ? "Relations communes" : `${(u.id * 3) % 8 + 1} relation(s) commune(s)`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-3 flex-shrink-0">
                                            {u.connection_status === 'ACCEPTED' ? (
                                                <div className="flex gap-1.5 justify-center w-full">
                                                    <span className="flex-grow inline-flex w-full h-[32px] items-center justify-center border border-[#34c759]/30 bg-[#34c759]/[0.04] text-[#34c759] font-bold text-xs rounded-full select-none cursor-default">
                                                        Amis
                                                    </span>
                                                    <button 
                                                        onClick={() => handleRemoveConnection(u.id)}
                                                        className="h-[32px] w-[32px] rounded-full bg-[#ffeeed] hover:bg-[#ffd6d4] text-[#ff3b30] flex items-center justify-center flex-shrink-0 transition-all press-effect border-none cursor-pointer"
                                                        title="Retirer de mes relations"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">person_remove</span>
                                                    </button>
                                                </div>
                                            ) : u.connection_status === 'PENDING' ? (
                                                u.is_sender ? (
                                                    <span className="inline-flex w-full h-[32px] items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 font-bold text-xs rounded-full select-none cursor-default">
                                                        En attente...
                                                    </span>
                                                ) : (
                                                    <div className="flex gap-1.5 justify-center w-full">
                                                        <button 
                                                            onClick={() => handleAcceptRequest(u.id)}
                                                            className="flex-grow inline-flex items-center justify-center h-[32px] bg-[#34c759] hover:bg-[#28b248] text-white text-xs font-bold rounded-full transition-all press-effect shadow-apple-xs border-none cursor-pointer"
                                                        >
                                                            Accepter
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRemoveConnection(u.id)}
                                                            className="h-[32px] w-[32px] rounded-full bg-[#ffeeed] hover:bg-[#ffd6d4] text-[#ff3b30] flex items-center justify-center flex-shrink-0 transition-all press-effect border-none cursor-pointer"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <button 
                                                    onClick={() => handleSendRequest(u.id)}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 h-[32px] rounded-full border border-[#0071e3] text-[#0071e3] hover:bg-[#edf3f8] hover:border-[1.5px] text-xs font-bold transition-all press-effect bg-transparent cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[16px] font-bold">person_add</span>
                                                    <span>Se connecter</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredUsers.length === 0 && (
                        <div className="py-24 text-center bg-white border border-dashed border-gray-200 rounded-[20px] shadow-none animate-fadeInUp">
                            <span className="material-symbols-outlined text-[48px] text-gray-300 mb-2">
                                group
                            </span>
                            <h3 className="text-sm font-bold text-[#1d1d1f] mb-1">Aucun membre trouvé</h3>
                            <p className="text-gray-400 text-xs max-w-xs mx-auto">
                                Essayez d'ajuster vos filtres ou votre recherche pour découvrir d'autres membres.
                            </p>
                        </div>
                    )}
                    </div>
                </div>
            </div>
            </main>
        </div>
    );
};

export default Network;
