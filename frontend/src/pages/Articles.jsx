import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import useToastStore from '../store/toastStore';
import useConfirmStore from '../store/confirmStore';
import CommentSection from '../components/CommentSection';
import ReactionIcon from '../components/ReactionIcon';
import ReactionsListModal from '../components/ReactionsListModal';
import ShareModal from '../components/ShareModal';
import FormattedText from '../components/FormattedText';
import { Share2, MessageCircle, ThumbsUp, Users, BookOpen, FolderGit2, Bell, Search, Plus, Trash2, Globe, Heart, Lightbulb } from 'lucide-react';

const BLANK = {
  article_title: '', abstract: '', content: '',
  journal: '', doi: '', keywords: '', file: null, cover_image: null,
};

const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const REACTIONS = [
  { type: 'LIKE',        emoji: '👍', label: 'J\'aime',       color: '#0071e3' },
  { type: 'LOVE',        emoji: '❤️', label: 'J\'adore',      color: '#ff3b30' },
  { type: 'CLAP',        emoji: '👏', label: 'Bravo',          color: '#ff9500' },
  { type: 'INSIGHTFUL',  emoji: '💡', label: 'Instructif',    color: '#af52de' },
  { type: 'DISLIKE',     emoji: '👎', label: 'Je n\'aime pas', color: '#86868b' },
];

export default function Articles() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { showConfirm } = useConfirmStore();

  const [articles, setArticles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [posting, setPosting]             = useState(false);
  const [analyzingPdf, setAnalyzingPdf]   = useState(false);
  const [form, setForm]                   = useState(BLANK);
  const [search, setSearch]               = useState('');
  const [expandedComments, setExpandedComments] = useState({});
  const [expandedContent, setExpandedContent]   = useState({});

  // LinkedIn Reactions States
  const [reactionMenuOpen, setReactionMenuOpen] = useState({}); // { [postId]: bool }
  const [userReactions, setUserReactions] = useState({}); // { [postId]: type }
  const hoverTimeouts = useRef({});

  // Share tracking
  const [sharingId, setSharingId] = useState(null);
  const [shareMenuOpen, setShareMenuOpen] = useState({}); // { [postId]: boolean }
  const [sharingPost, setSharingPost] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Stats and Suggestions state (synchronized with Feed)
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [allUserPosts, setAllUserPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // Reactions Modal State
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [selectedArticleReactions, setSelectedArticleReactions] = useState([]);

  const canPublish = ['TEACHER', 'RESEARCHER'].includes(user?.role);

  const fetchArticles = () => {
    setLoading(true);
    api.get('/posts', { params: { type: 'SCIENTIFIC_ARTICLE' } })
      .then(r => setArticles(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchNetworkStats = async () => {
    try {
      const netRes = await api.get('/network');
      setConnectionsCount(netRes.data.length);
    } catch (e) {
      console.error(e);
    }
    try {
      const notifRes = await api.get('/notifications');
      setUnreadAlertsCount(notifRes.data.filter(n => !n.is_read).length);
    } catch (e) {
      console.error(e);
    }
    if (user?.id) {
      try {
        const postsRes = await api.get('/posts', { params: { user_id: user.id } });
        setAllUserPosts(postsRes.data);
      } catch (e) {
        console.error("Failed to fetch full user posts for stats:", e);
      }
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/network/suggestions');
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to fetch suggestions', error);
    }
  };

  const handleConnectSuggestion = async (userId) => {
    try {
      await api.post(`/network/request/${userId}`);
      setSuggestions(suggestions.filter(s => s.id !== userId));
      addToast('Demande de connexion envoyée !', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchNetworkStats();
    fetchSuggestions();
  }, []);

  const postImpressions = useMemo(() => {
    return allUserPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  }, [allUserPosts]);

  const userArticlesCount = useMemo(() => {
    return allUserPosts.filter(p => p.type === 'SCIENTIFIC_ARTICLE').length;
  }, [allUserPosts]);

  const userProjectsCount = useMemo(() => {
    return allUserPosts.filter(p => p.type === 'UNIVERSITY_PROJECT').length;
  }, [allUserPosts]);

  // Trending articles sidebar widget
  const trendingArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.likes_count - a.likes_count).slice(0, 3);
  }, [articles]);

  const handleMouseEnterReaction = (postId) => {
    if (hoverTimeouts.current[postId]) {
      clearTimeout(hoverTimeouts.current[postId]);
      delete hoverTimeouts.current[postId];
    }
    setReactionMenuOpen(prev => ({ ...prev, [postId]: true }));
  };

  const handleMouseLeaveReaction = (postId) => {
    hoverTimeouts.current[postId] = setTimeout(() => {
      setReactionMenuOpen(prev => ({ ...prev, [postId]: false }));
      delete hoverTimeouts.current[postId];
    }, 250);
  };

  const handleReact = async (postId, reactionType) => {
    if (hoverTimeouts.current[postId]) {
      clearTimeout(hoverTimeouts.current[postId]);
      delete hoverTimeouts.current[postId];
    }
    const targetArticle = articles.find(a => a.id === postId);
    const current = userReactions[postId] !== undefined 
      ? userReactions[postId] 
      : (targetArticle ? targetArticle.user_reaction : null);
    const newType = current === reactionType ? null : reactionType;
    setUserReactions(prev => ({ ...prev, [postId]: newType }));
    setReactionMenuOpen(prev => ({ ...prev, [postId]: false }));
    try {
      const response = await api.post(`/posts/${postId}/like`, { reaction: newType || 'LIKE' });
      setArticles(prevArticles => prevArticles.map(a => {
        if (a.id !== postId) return a;

        const updatedLikes = [...(a.likes || [])];
        const existingLikeIdx = updatedLikes.findIndex(l => l.user_id === user.id);

        if (newType === null) {
          if (existingLikeIdx > -1) updatedLikes.splice(existingLikeIdx, 1);
        } else {
          if (existingLikeIdx > -1) {
            updatedLikes[existingLikeIdx] = {
              ...updatedLikes[existingLikeIdx],
              type: newType
            };
          } else {
            updatedLikes.push({
              id: Date.now(),
              user_id: user.id,
              type: newType,
              user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                profile: user.profile
              }
            });
          }
        }

        return { 
          ...a, 
          is_liked: newType !== null, 
          user_reaction: newType,
          likes_count: response.data.likes_count,
          likes: updatedLikes
        };
      }));
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleShare = async (articleId, shareComment = '') => {
    if (sharingId === articleId) return; // prevent double-click
    setSharingId(articleId);
    try {
      await api.post(`/posts/${articleId}/share`, { share_comment: shareComment });
      addToast(shareComment ? 'Article partagé avec vos pensées !' : 'Article repartagé avec succès !', 'success');
      // Update local shares count
      setArticles(prev => prev.map(a => a.id === articleId ? {
        ...a,
        shares: [...(a.shares || []), { id: Date.now() }]
      } : a));
    } catch (err) {
      addToast(err.response?.data?.message || 'Erreur lors du partage.', 'error');
    } finally {
      setSharingId(null);
    }
  };

  /* ── Search filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(a =>
      a.article_title?.toLowerCase().includes(q) ||
      a.abstract?.toLowerCase().includes(q) ||
      a.keywords?.toLowerCase().includes(q) ||
      a.journal?.toLowerCase().includes(q) ||
      `${a.author?.first_name} ${a.author?.last_name}`.toLowerCase().includes(q)
    );
  }, [articles, search]);

  /* ── Analyze PDF with AI ── */
  const handleAnalyzePdf = async () => {
    if (!form.file) return;
    setAnalyzingPdf(true);
    const formData = new FormData();
    formData.append('pdf', form.file);

    try {
      addToast("Extraction et analyse du PDF par l'IA...", "info");
      const response = await api.post('/ai/analyze-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = response.data;
      setForm(prev => ({
        ...prev,
        article_title: data.title || prev.article_title,
        abstract: data.abstract || prev.abstract,
        content: data.content || prev.content,
        journal: data.journal || prev.journal,
        doi: data.doi || prev.doi,
        keywords: data.keywords || prev.keywords,
      }));
      addToast("Métadonnées de l'article générées avec succès !", "success");
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Erreur lors de l'analyse du PDF par l'IA";
      addToast(msg, "error");
    } finally {
      setAnalyzingPdf(false);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.article_title.trim()) { addToast('Le titre est requis.', 'error'); return; }
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('type', 'SCIENTIFIC_ARTICLE');
      fd.append('content', form.content || form.abstract || form.article_title);
      fd.append('article_title', form.article_title);
      fd.append('abstract', form.abstract);
      fd.append('journal', form.journal);
      fd.append('doi', form.doi);
      fd.append('keywords', form.keywords);
      if (form.file) fd.append('file', form.file);
      if (form.cover_image) fd.append('cover_image', form.cover_image);

      const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setArticles(prev => [res.data, ...prev]);
      setForm(BLANK);
      setShowForm(false);
      addToast('Article publié avec succès !', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Erreur lors de la publication.', 'error');
    } finally {
      setPosting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = (id) => showConfirm('Supprimer cet article ?', async () => {
    try {
      await api.delete(`/posts/${id}`);
      setArticles(prev => prev.filter(a => a.id !== id));
      addToast('Article supprimé.', 'info');
    } catch { addToast('Erreur.', 'error'); }
  });

  const toggleComments = (id) => setExpandedComments(p => ({ ...p, [id]: !p[id] }));
  const toggleContent = (id) => setExpandedContent(p => ({ ...p, [id]: !p[id] }));

  if (loading) return <BrandLoader />;

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex flex-col">
      <Navbar />

      <main style={{ maxWidth: 1128, margin: '0 auto', padding: '20px 16px 40px' }} className="flex-grow w-full">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[225px_1fr_300px] gap-5 items-start">
          
          {/* ── SIDEBAR GAUCHE (Sticky comme le Feed) ── */}
          <aside className="hidden lg:block" style={{ position: 'sticky', top: 64, alignSelf: 'start', maxHeight: 'calc(100vh - 76px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div className="ap-card anim-in">
              {/* Banner + Avatar */}
              <div style={{ height: 56, background: 'linear-gradient(135deg, #1d1d1f, #48484a)', position: 'relative' }}>
                {user?.profile?.website_url && (
                  <img 
                    src={`${STORAGE}/storage/${user.profile.website_url}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt="" 
                  />
                )}
              </div>
              <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
                <Link to="/profile">
                  <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid white', overflow: 'hidden', background: '#e8e8ed', margin: '-32px auto 10px', boxShadow: '0 2px 10px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }} className="mx-auto">
                    {user?.profile?.photo_url ? (
                      <img 
                        src={`${STORAGE}/storage/${user.profile.photo_url}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt="" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                      />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#86868b' }} className="flex items-center justify-center h-full w-full">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </span>
                    )}
                  </div>
                </Link>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-.01em' }}>
                    {user?.first_name} {user?.last_name}
                  </p>
                </Link>
                <p style={{ fontSize: 12, color: '#6e6e73', marginTop: 2, lineHeight: 1.4 }} className="truncate font-medium">
                  {user?.profile?.biography || user?.role}
                </p>
              </div>

              {/* Raccourcis statistiques */}
              <div style={{ borderTop: '.5px solid rgba(0,0,0,.08)' }} />
              <div style={{ padding: '6px 0' }}>
                <Link 
                  to="/profile"
                  className="flex justify-between items-center px-4 py-2 hover:bg-black/[0.03] transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="text-[12.5px] text-black/60 font-semibold">Impressions de vos posts</span>
                  <span className="text-[12.5px] text-[#0071e3] font-bold">{postImpressions}</span>
                </Link>
              </div>

              {/* Accès rapide aux pages */}
              <div style={{ borderTop: '.5px solid rgba(0,0,0,.08)' }} />
              <nav style={{ padding: '8px 0 4px' }}>
                {[
                  { icon: Users,      label: 'Mon réseau', count: connectionsCount, path: '/network' },
                  { icon: BookOpen,   label: 'Articles',   count: userArticlesCount, path: '/articles' },
                  { icon: FolderGit2, label: 'Projets',    count: userProjectsCount, path: '/projects' },
                  { icon: Bell,       label: 'Alertes',    count: unreadAlertsCount, path: '/notifications' },
                ].map(item => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className="flex justify-between items-center px-4 py-2 hover:bg-black/[0.03] transition-colors"
                    style={{ textDecoration: 'none', color: '#1d1d1f', fontSize: 13, fontWeight: 500 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <item.icon style={{ width: 16, height: 16, color: '#6e6e73' }} />
                      <span>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0071e3', background: '#e8f0fe', padding: '1px 6.5px', borderRadius: 9999 }}>
                      {item.count}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── CONTENU CENTRAL ── */}
          <section className="flex flex-col gap-4" style={{ minWidth: 0 }}>
            
            {/* Scientific Hub Intro Card */}
            <div className="bg-white border border-[#e8e8ed] rounded-[8px] p-5 shadow-apple-xs flex items-center gap-4 relative overflow-hidden animate-fadeIn">
              <div className="w-12 h-12 rounded-[12px] bg-[#af52de]/10 text-[#af52de] flex items-center justify-center flex-shrink-0 shadow-inner">
                <BookOpen style={{ width: 24, height: 24 }} />
              </div>
              <div className="flex-grow text-left">
                <h1 className="text-[18px] font-bold text-[#1d1d1f] tracking-tight">Articles & Publications</h1>
                <p className="text-[12px] text-[#6e6e73] mt-0.5 font-medium">
                  Consultez et publiez des recherches académiques, mémoires, revues scientifiques, et articles théoriques.
                </p>
              </div>
            </div>

            {/* Quick Publication Trigger (Feed Style) */}
            {canPublish && (
              <div className="bg-white border border-[#e8e8ed] rounded-[8px] p-4 animate-fadeIn">
                <div className="flex gap-2.5 items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#e8e8ed] flex-shrink-0 flex items-center justify-center border border-black/5">
                    {user?.profile?.photo_url ? (
                      <img 
                        src={`${STORAGE}/storage/${user.profile.photo_url}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt="" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                      />
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#86868b' }}>
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setShowForm(!showForm);
                      if(!showForm) setTimeout(() => window.scrollTo({ top: 120, behavior: 'smooth' }), 50);
                    }}
                    className="flex-grow h-10 rounded-full border border-black/15 bg-transparent px-4 text-left text-[13.5px] font-semibold text-black/60 hover:bg-black/[0.02] transition-all cursor-pointer"
                  >
                    {showForm ? "Annuler et fermer le formulaire" : "Publier un nouvel article scientifique..."}
                  </button>
                </div>
              </div>
            )}

            {/* Submission Form Container */}
            {showForm && canPublish && (
              <div className="bg-white border border-[#e8e8ed] rounded-[8px] p-5 shadow-apple-md animate-fadeInUp relative">
                <button 
                  onClick={() => setShowForm(false)} 
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] flex items-center justify-center text-gray-500 transition-all border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                </button>

                <h3 className="text-[14.5px] font-bold text-[#1d1d1f] flex items-center gap-2 mb-4 text-left">
                  <span className="w-8 h-8 rounded-full bg-[#af52de]/10 text-[#af52de] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                  </span>
                  Rédiger et soumettre une publication
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-left">
                    <label className="block text-[9.5px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Titre de l'article *</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Analyse des réseaux convolutifs pour l'imagerie..." 
                      className="w-full h-[36px] bg-[#f5f5f7] rounded-[8px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/10 transition-all font-medium text-black" 
                      value={form.article_title} 
                      onChange={e => setForm({ ...form, article_title: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-[9.5px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Résumé / Abstract *</label>
                    <textarea 
                      placeholder="Résumé succinct présentant le problème, la méthodologie et les conclusions de vos travaux..." 
                      className="w-full min-h-[80px] bg-[#f5f5f7] rounded-[8px] border border-transparent focus:border-[#0071e3] focus:bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/10 transition-all resize-none font-medium text-black" 
                      value={form.abstract} 
                      onChange={e => setForm({ ...form, abstract: e.target.value })} 
                      required
                    />
                  </div>

                  <div className="bg-[#f5f5f7] rounded-[8px] border border-black/5 overflow-hidden text-left">
                    <div className="px-3 py-1.5 bg-[#e8e8ed] border-b border-black/[0.05] flex items-center gap-1.5">
                      <button type="button" className="p-1 hover:bg-white rounded text-gray-500 font-bold text-xs" title="Titre 1">H1</button>
                      <button type="button" className="p-1 hover:bg-white rounded text-gray-500 font-bold text-xs" title="Titre 2">H2</button>
                      <span className="w-[1px] h-3.5 bg-black/10 mx-1"></span>
                      <button type="button" className="p-1 hover:bg-white rounded text-gray-500" title="Gras"><span className="material-symbols-outlined text-[16px] font-bold">format_bold</span></button>
                      <button type="button" className="p-1 hover:bg-white rounded text-gray-500" title="Italique"><span className="material-symbols-outlined text-[16px]">format_italic</span></button>
                    </div>
                    <textarea 
                      placeholder="Corps de l'article scientifique / Note de recherche..." 
                      className="w-full min-h-[120px] bg-transparent border-none p-3 text-sm focus:outline-none font-medium resize-y text-black" 
                      value={form.content} 
                      onChange={e => setForm({ ...form, content: e.target.value })} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="block text-[9.5px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Revue / Journal</label>
                      <input 
                        type="text" 
                        placeholder="Ex: IEEE Review, Scholar Journal..." 
                        className="w-full h-[36px] bg-[#f5f5f7] rounded-[8px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/10 transition-all font-medium text-black" 
                        value={form.journal} 
                        onChange={e => setForm({ ...form, journal: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">DOI</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 10.1109/TSE.2026.4529" 
                        className="w-full h-[36px] bg-[#f5f5f7] rounded-[8px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/10 transition-all font-medium text-black" 
                        value={form.doi} 
                        onChange={e => setForm({ ...form, doi: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[9.5px] font-bold text-[#86868b] uppercase tracking-widest mb-1 px-1">Mots-clés (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Intelligence Artificielle, Cloud, PHP" 
                      className="w-full h-[36px] bg-[#f5f5f7] rounded-[8px] border border-transparent focus:border-[#0071e3] focus:bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/10 transition-all font-medium text-black" 
                      value={form.keywords} 
                      onChange={e => setForm({ ...form, keywords: e.target.value })} 
                    />
                  </div>

                  {/* IMAGE DE COUVERTURE */}
                  <div className="text-left">
                    <label className="block text-[9.5px] font-bold text-[#86868b] uppercase tracking-widest mb-2 px-1">Image de couverture</label>
                    <div className="relative">
                      {form.cover_image ? (
                        <div className="relative rounded-[10px] overflow-hidden border border-[#af52de]/20 bg-[#f5f5f7]">
                          <img
                            src={URL.createObjectURL(form.cover_image)}
                            alt="Aperçu couverture"
                            className="w-full h-[140px] object-cover block"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                            <span className="text-white text-[10px] font-bold truncate max-w-[60%] drop-shadow">{form.cover_image.name}</span>
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, cover_image: null })}
                              className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all border-none cursor-pointer shadow"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="article-cover-image"
                          className="flex flex-col items-center justify-center w-full h-[100px] rounded-[10px] border-2 border-dashed border-[#af52de]/30 bg-[#f9f5ff] hover:bg-[#af52de]/5 hover:border-[#af52de]/60 transition-all cursor-pointer group"
                        >
                          <span className="material-symbols-outlined text-[28px] text-[#af52de]/60 group-hover:text-[#af52de] transition-colors mb-1">add_photo_alternate</span>
                          <span className="text-[11px] font-bold text-[#af52de]/70 group-hover:text-[#af52de]">Cliquer pour ajouter une photo</span>
                          <span className="text-[9.5px] text-[#86868b] mt-0.5">JPG, PNG, WebP (Max. 5 Mo)</span>
                        </label>
                      )}
                      <input
                        type="file"
                        id="article-cover-image"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) setForm({ ...form, cover_image: f });
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>

                  {/* PDF */}
                  <div className="bg-[#f5f5f7] rounded-[8px] p-3.5 border border-black/5 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-black/5 rounded-[6px] flex items-center justify-center text-[#af52de]">
                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-bold text-[#1d1d1f]">Attacher le PDF ou Document</h5>
                        <p className="text-[9.5px] text-[#86868b] mt-0.5">{form.file ? form.file.name : 'PDF ou Word (Max. 10 Mo)'}</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      id="article-file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={e => setForm({ ...form, file: e.target.files[0] })}
                    />
                    <label
                      htmlFor="article-file"
                      className="h-[28px] px-3.5 bg-white border border-black/10 hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-semibold rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-apple-xs select-none"
                    >
                      <span className="material-symbols-outlined text-[14px]">attach_file</span>
                      {form.file ? 'Changer' : 'Choisir'}
                    </label>
                  </div>

                  {form.file && form.file.name.toLowerCase().endsWith('.pdf') && (
                    <div className="flex justify-start pt-1 animate-fadeIn">
                      <button
                        type="button"
                        onClick={handleAnalyzePdf}
                        disabled={analyzingPdf}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-apple-xs border-none cursor-pointer"
                      >
                        {analyzingPdf ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[15px] font-bold">auto_awesome</span>
                        )}
                        <span>Générer résumé, mots-clés & revue avec l'IA Scholar ✨</span>
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="h-[34px] px-4 rounded-full border border-black/10 text-[#48484a] hover:bg-[#f5f5f7] text-xs font-semibold transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      disabled={posting}
                      className="h-[34px] px-5 rounded-full bg-[#af52de] hover:bg-[#a043ce] text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-apple-xs border-none"
                    >
                      {posting ? (
                        <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                      ) : (
                        <span className="material-symbols-outlined text-[15px]">send</span>
                      )}
                      Publier
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Articles List Feed */}
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="bg-white border border-[#e8e8ed] rounded-[8px] py-16 text-center shadow-apple-xs">
                  <span className="material-symbols-outlined text-[52px] text-gray-300 select-none">
                    menu_book
                  </span>
                  <p className="font-bold text-[#1d1d1f] text-[14px] mt-2">Aucun article publié correspondant</p>
                  {canPublish && <p className="text-[11.5px] text-[#86868b] mt-1">Lancez les débats en publiant votre propre recherche scientifique !</p>}
                </div>
              ) : (
                filtered.map((article, index) => {
                  const isOwner = article.author_id === user?.id;
                  const isAdmin = user?.role === 'ADMIN';
                  const commentsOpen = expandedComments[article.id];

                  // Use uploaded cover or fallback to a random Unsplash cover
                  const covers = [
                    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
                    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80",
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
                    "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
                    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80",
                  ];
                  const articleCover = article.cover_image_url
                    ? `${STORAGE}/storage/${article.cover_image_url}`
                    : covers[article.id % covers.length];

                  const currentReaction = userReactions[article.id] !== undefined 
                    ? userReactions[article.id] 
                    : article.user_reaction;
                  const reactionInfo = currentReaction ? REACTIONS.find(r => r.type === currentReaction) : null;

                  return (
                    <div 
                      key={article.id} 
                      id={`article-${article.id}`}
                      className="bg-white border border-[#dad8d6] rounded-[8px] text-left overflow-visible anim-up flex flex-col justify-between"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      {/* 1. Header (LinkedIn Post Header Style) */}
                      <div className="flex items-start gap-3 pt-3 px-4 pb-2">
                        <Link to={`/profile/${article.author_id}`}>
                          <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-[#e8e8ed] flex-shrink-0 flex items-center justify-center border border-black/5 hover:opacity-90 transition-opacity shadow-apple-xs">
                            {article.author?.profile?.photo_url ? (
                              <img src={`${STORAGE}/storage/${article.author.profile.photo_url}`} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} alt="" />
                            ) : (
                              <span className="text-sm font-bold text-[#86868b]">
                                {article.author?.first_name?.[0]}{article.author?.last_name?.[0]}
                              </span>
                            )}
                          </div>
                        </Link>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/profile/${article.author_id}`} className="text-[14px] font-semibold text-black/90 hover:text-[#0a66c2] hover:underline leading-snug">
                              {article.author?.first_name} {article.author?.last_name}
                            </Link>
                            <span className="text-[11px] text-black/45 font-medium flex items-center gap-1">
                              • 1er
                            </span>
                            <span className="ap-badge ap-badge-purple scale-90">
                              <BookOpen style={{ width: 10, height: 10 }} />Article
                            </span>
                          </div>
                          <p className="text-[12px] text-black/60 truncate mt-0.5 font-normal leading-normal">
                            {article.author?.profile?.biography || (article.author?.role === 'STUDENT' ? 'Étudiant' : article.author?.role === 'TEACHER' ? 'Enseignant' : 'Chercheur')}
                          </p>
                          <p className="text-[11px] text-black/45 mt-0.5 flex items-center gap-1 font-medium leading-none">
                            <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                            <span>•</span>
                            <span className="material-symbols-outlined text-[12px] text-black/40 leading-none">public</span>
                          </p>
                        </div>

                        {(isOwner || isAdmin) && (
                          <button 
                            onClick={() => handleDelete(article.id)} 
                            className="w-8 h-8 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
                            title="Supprimer l'article"
                          >
                            <Trash2 style={{ width: 16, height: 16 }} />
                          </button>
                        )}
                      </div>

                      {/* 2. Cover Banner */}
                      <div className="w-full max-h-[300px] overflow-hidden bg-gray-100 relative border-t border-b border-[#dad8d6]/50">
                        <img 
                          src={articleCover} 
                          className="w-full h-full object-cover max-h-[300px] block" 
                          alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </div>

                      {/* 3. Card Content Area (Text and details) */}
                      <div className="p-4 text-left space-y-3.5">
                        <div>
                          {/* Title */}
                          {article.article_title && (
                            <h2 className="text-[15.5px] font-bold text-black/90 mb-2 leading-snug">
                              {article.article_title}
                            </h2>
                          )}

                          {/* Metadata: Journal & DOI */}
                          {(article.journal || article.doi) && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {article.journal && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-gray-600 bg-gray-100 rounded px-2 py-0.5 font-bold">
                                  <BookOpen style={{ width: 11, height: 11 }} className="text-[#af52de]" />
                                  {article.journal}
                                </span>
                              )}
                              {article.doi && (
                                <a 
                                  href={`https://doi.org/${article.doi}`}
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-[#0071e3] hover:text-[#0077ed] bg-[#0071e3]/5 rounded px-2 py-0.5 font-extrabold transition-all border border-[#0071e3]/10 text-decoration-none"
                                >
                                  DOI: {article.doi}
                                </a>
                              )}
                            </div>
                          )}

                          {/* Abstract block quote */}
                          {article.abstract && (
                            <div className="bg-[#f2f4f7] border-l-[3px] border-[#af52de] rounded-r-lg p-3.5 mb-3">
                              <p className="text-[13px] text-black/75 leading-relaxed font-medium italic">
                                "{article.abstract}"
                              </p>
                            </div>
                          )}

                          {article.content && (
                            <div className="mt-3 text-left">
                              {expandedContent[article.id] ? (
                                <div className="border-t border-[#dad8d6]/50 pt-3 mt-3 animate-fadeIn space-y-2">
                                  <h4 className="font-bold text-[13.5px] text-black/90 mb-2">Note de recherche / Article complet :</h4>
                                  <FormattedText text={article.content} />
                                  <button 
                                    type="button"
                                    onClick={() => toggleContent(article.id)}
                                    className="text-[11.5px] font-bold text-[#af52de] hover:underline bg-transparent border-none p-0 cursor-pointer mt-2 flex items-center gap-0.5 leading-none"
                                  >
                                    <span>Réduire l'article</span>
                                    <span className="material-symbols-outlined text-[13px] font-bold">keyboard_arrow_up</span>
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={() => toggleContent(article.id)}
                                  className="text-[11.5px] font-bold text-[#af52de] hover:underline bg-transparent border-none p-0 cursor-pointer flex items-center gap-0.5 mt-2 leading-none"
                                >
                                  <span>Lire la suite (Article complet)</span>
                                  <span className="material-symbols-outlined text-[13px] font-bold">keyboard_arrow_down</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Keywords */}
                          {article.keywords && (
                            <div className="flex flex-wrap gap-1.5">
                              {article.keywords.split(',').map(kw => kw.trim()).filter(Boolean).slice(0, 4).map(kw => (
                                <span 
                                  key={kw}
                                  className="inline-flex items-center text-[10.5px] font-bold text-[#0071e3] bg-[#0071e3]/5 hover:bg-[#0071e3]/10 rounded-full px-2.5 py-0.5"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Attached File Download */}
                        {article.file_url && (
                          <div className="flex items-center justify-between bg-[#f8f9fa] border border-[#dad8d6]/50 rounded-xl p-3 shadow-apple-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-[36px] h-[36px] rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100 flex-shrink-0">
                                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="text-[12px] font-bold text-black/90 truncate leading-tight">Document PDF</p>
                                <p className="text-[9px] text-[#86868b] font-bold uppercase mt-0.5 tracking-wider">Publication Complète</p>
                              </div>
                            </div>
                            <a 
                              href={`${STORAGE}/storage/${article.file_url}`}
                              target="_blank" 
                              rel="noreferrer"
                              className="h-[26px] px-3.5 bg-[#af52de] hover:bg-[#a043ce] text-white text-[11px] font-bold rounded-full transition-all flex items-center gap-0.5 shrink-0 text-decoration-none border-none"
                            >
                              Télécharger
                            </a>
                          </div>
                        )}

                        {/* Metrics and Actions summary footer */}
                        <div className="border-t border-[#f4f2ee] pt-3 flex flex-col gap-2.5">
                          
                          {/* Metrics summary — reactions + comments + shares */}
                          <div className="flex justify-between items-center text-[12px] text-black/55 font-medium px-0.5 select-none">
                            {article.likes_count > 0 ? (
                              <div 
                                onClick={() => {
                                  setSelectedArticleReactions(article.likes || []);
                                  setShowReactionsModal(true);
                                }}
                                className="flex items-center gap-1.5 cursor-pointer hover:text-[#0a66c2] transition-colors"
                              >
                                <div className="flex items-center">
                                  {(() => {
                                    const activeTypes = new Set();
                                    if (article.likes && article.likes.length > 0) {
                                      article.likes.forEach(l => activeTypes.add(l.type));
                                    } else if (currentReaction) {
                                      activeTypes.add(currentReaction);
                                    } else {
                                      activeTypes.add('LIKE');
                                    }
                                    const list = Array.from(activeTypes).slice(0, 3);
                                    return list.map((type, idx) => (
                                      <div 
                                        key={type} 
                                        style={{ 
                                          marginLeft: idx > 0 ? -6 : 0, 
                                          zIndex: 3 - idx,
                                          border: '1.5px solid white',
                                          borderRadius: '50%',
                                          display: 'flex'
                                        }}
                                      >
                                        <ReactionIcon type={type} className="w-[14px] h-[14px]" />
                                      </div>
                                    ));
                                  })()}
                                </div>
                                <span className="font-semibold text-black/60 hover:text-[#0a66c2] hover:underline">
                                  {article.likes_count}
                                </span>
                              </div>
                            ) : (
                              <span>0 réaction</span>
                            )}
                            
                            <div className="flex items-center gap-2.5">
                              <button onClick={() => toggleComments(article.id)} className="hover:underline hover:text-[#0a66c2] border-none bg-transparent cursor-pointer font-semibold text-[12px] text-black/60 p-0">
                                {article.comments_count > 0 ? `${article.comments_count} commentaire${article.comments_count > 1 ? 's' : ''}` : '0 commentaire'}
                              </button>
                              {(article.shares?.length > 0) && (
                                <>
                                  <span className="text-[10px] text-gray-300">•</span>
                                  <span className="text-[12px] text-black/60 font-semibold">
                                    {article.shares.length} partage{article.shares.length > 1 ? 's' : ''}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Trigger actions buttons */}
                          <div className="flex items-center border-t border-[#f4f2ee] pt-1.5 relative">
                            
                            {/* J'aime reaction button with hover menu */}
                            <div 
                              className="relative flex-1"
                              onMouseEnter={() => handleMouseEnterReaction(article.id)}
                              onMouseLeave={() => handleMouseLeaveReaction(article.id)}
                            >
                              {reactionMenuOpen[article.id] && (
                                <div 
                                  className="absolute bottom-[85%] left-0 pb-3 z-30 animate-apple-spring"
                                  onMouseEnter={() => handleMouseEnterReaction(article.id)}
                                  onMouseLeave={() => handleMouseLeaveReaction(article.id)}
                                >
                                  <div className="p-2 bg-white rounded-full shadow-apple-lg flex gap-3 border border-black/5">
                                    {REACTIONS.map(r => (
                                      <button
                                        key={r.type}
                                        onClick={() => handleReact(article.id, r.type)}
                                        className="p-0 border-none cursor-pointer bg-transparent transition-transform duration-150 hover:scale-125 flex"
                                        title={r.label}
                                      >
                                        <ReactionIcon type={r.type} className="w-7 h-7" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <button 
                                onMouseEnter={() => handleMouseEnterReaction(article.id)}
                                onClick={() => handleReact(article.id, currentReaction || 'LIKE')}
                                className="w-full py-2 hover:bg-black/[0.04] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors cursor-pointer border-none bg-transparent font-sans"
                                style={{ color: reactionInfo ? reactionInfo.color : 'rgba(0,0,0,0.6)' }}
                              >
                                {currentReaction ? (
                                  <ReactionIcon type={currentReaction} className="w-[18px] h-[18px] animate-spring" />
                                ) : (
                                  <ThumbsUp className="w-[18px] h-[18px] text-black/60" />
                                )}
                                <span>{reactionInfo ? reactionInfo.label : "J'aime"}</span>
                              </button>
                            </div>

                            {/* Commenter */}
                            <button 
                              onClick={() => toggleComments(article.id)}
                              className={`flex-1 py-2 hover:bg-black/[0.04] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-semibold text-black/60 hover:text-black/85 transition-colors border-none bg-transparent cursor-pointer font-sans ${commentsOpen ? 'text-[#0071e3]' : ''}`}
                            >
                              <MessageCircle style={{ width: 18, height: 18 }} />
                              <span>Commenter</span>
                            </button>

                            {/* Repartager */}
                            <div className="flex-1 relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareMenuOpen(prev => ({ ...prev, [article.id]: !prev[article.id] }));
                                }}
                                disabled={sharingId === article.id}
                                className="w-full py-2 hover:bg-black/[0.04] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-semibold text-black/60 hover:text-black/85 transition-colors border-none bg-transparent cursor-pointer font-sans disabled:opacity-50"
                              >
                                <Share2 style={{ width: 18, height: 18 }} />
                                <span>{sharingId === article.id ? 'Partage...' : 'Repartager'}</span>
                              </button>

                              {/* Premium Share Dropdown Menu (LinkedIn-like) */}
                              {shareMenuOpen[article.id] && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShareMenuOpen(prev => ({ ...prev, [article.id]: false }));
                                    }} 
                                  />
                                  <div 
                                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-black/5 rounded-[12px] shadow-apple-md py-1.5 min-w-[220px] z-50 animate-fadeIn text-left"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setShareMenuOpen(prev => ({ ...prev, [article.id]: false }));
                                        handleShare(article.id); // instant share
                                      }}
                                      className="w-full px-4 py-2 hover:bg-[#f5f5f7] flex items-center gap-2.5 text-xs font-bold text-[#1d1d1f] border-none bg-transparent cursor-pointer transition-colors"
                                    >
                                      <Share2 size={15} className="text-[#86868b]" />
                                      <div className="flex flex-col text-left">
                                        <span className="leading-tight">Repartager instantanément</span>
                                        <span className="text-[9.5px] text-[#86868b] mt-0.5 font-medium leading-none">Partager directement sur votre fil</span>
                                      </div>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setShareMenuOpen(prev => ({ ...prev, [article.id]: false }));
                                        setSharingPost(article);
                                        setIsShareModalOpen(true);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-[#f5f5f7] flex items-center gap-2.5 text-xs font-bold text-[#1d1d1f] border-none bg-transparent cursor-pointer transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-[18px] text-[#86868b] leading-none" style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24' }}>edit_note</span>
                                      <div className="flex flex-col text-left">
                                        <span className="leading-tight">Partager avec vos pensées</span>
                                        <span className="text-[9.5px] text-[#86868b] mt-0.5 font-medium leading-none">Ajouter un commentaire ou avis</span>
                                      </div>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Comment section collapse */}
                      {commentsOpen && (
                        <CommentSection 
                          postId={article.id}
                          initialComments={article.comments}
                          onCommentAdded={() => setArticles(prev => prev.map(a => a.id === article.id ? { ...a, comments_count: a.comments_count + 1 } : a))}
                        />
                      )}

                    </div>
                  );
                })
              )}
            </div>

          </section>

          {/* ── SIDEBAR DROITE (Identique au Feed, avec Articles Populaires) ── */}
          <aside className="hidden md:block" style={{ position: 'sticky', top: 64, alignSelf: 'start', maxHeight: 'calc(100vh - 76px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div className="space-y-5">
              
              {/* Search Widget */}
              <div className="bg-white border border-[#dad8d6] rounded-[8px] p-4 text-left">
                <h4 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86868b', marginBottom: 12 }}>Recherche filtrée</h4>
                <div className="relative group">
                  <Search style={{ width: 16, height: 16, color: '#86868b' }} className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Mots-clés, DOI, Auteur..." 
                    className="w-full h-[36px] bg-[#f5f5f7] rounded-[8px] border border-transparent focus:border-[#0071e3] focus:bg-white pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0071e3]/10 transition-all font-medium text-black" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="w-full text-center text-[10.5px] font-bold text-[#0071e3] uppercase tracking-wider hover:underline py-1.5 mt-2 bg-transparent border-none cursor-pointer"
                  >
                    Effacer le filtre
                  </button>
                )}
              </div>

              {/* À la une (Articles Populaires) */}
              <div className="bg-white border border-[#dad8d6] rounded-[8px] p-4 text-left">
                <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86868b', marginBottom: 16 }} className="flex items-center gap-2">
                  <span className="text-[#ff9500]">⚡</span>Articles populaires
                </h3>
                <div className="flex flex-col gap-3">
                  {trendingArticles.length > 0 ? (
                    trendingArticles.map((ta, i) => (
                      <div key={ta.id} className="flex gap-2.5 items-start">
                        <span className="font-black text-[#af52de] text-[13.5px] min-w-[20px] mt-0.5">0{i+1}</span>
                        <div className="min-w-0 flex-1">
                          <a 
                            href={`#article-${ta.id}`} 
                            style={{ fontSize: 12.5, fontWeight: 700, color: '#1d1d1f', textDecoration: 'none', lineHeight: 1.35 }} 
                            className="line-clamp-2 hover:text-[#af52de] transition-colors"
                          >
                            {ta.article_title || ta.content}
                          </a>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#af52de]/5 text-[#af52de] text-[9.5px] font-extrabold tracking-wider">
                              ⚡ {ta.likes_count} réactions
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 11, color: '#86868b' }} className="font-semibold text-center py-2">Aucun article populaire.</p>
                  )}
                </div>
              </div>

              {/* Suggestions de réseau */}
              <div className="bg-white border border-[#dad8d6] rounded-[8px] p-4 text-left">
                <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86868b', marginBottom: 16 }} className="flex items-center gap-2">
                  <span className="text-[#0071e3]">👥</span>Suggestions réseau
                </h3>
                <div className="space-y-4">
                  {suggestions.length > 0 ? (
                    suggestions.slice(0, 4).map(s => {
                      const roleLabel = s.role === 'STUDENT' ? 'Étudiant' : s.role === 'TEACHER' ? 'Enseignant' : 'Chercheur';
                      return (
                        <div key={s.id} className="flex gap-3 items-start border-b border-black/[0.04] pb-3 last:border-0 last:pb-0">
                          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-black/5 bg-[#f5f5f7] flex items-center justify-center font-bold text-gray-400 text-xs">
                            {s.profile?.photo_url ? (
                              <img 
                                src={`${STORAGE}/storage/${s.profile.photo_url}`} 
                                className="w-full h-full object-cover" 
                                alt="" 
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                              />
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#86868b' }}>
                                {s.first_name[0]}{s.last_name[0]}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow">
                            <Link to={`/profile/${s.id}`} style={{ textDecoration: 'none' }} className="hover:underline">
                              <h4 className="text-xs font-bold text-[#1d1d1f] truncate leading-tight hover:text-[#0071e3] cursor-pointer">
                                {s.first_name} {s.last_name}
                              </h4>
                            </Link>
                            <p className="text-[10px] text-[#6e6e73] font-semibold truncate leading-tight mt-0.5">
                              {roleLabel} · {s.profile?.institution || 'IGA Casablanca'}
                            </p>
                            <button 
                              onClick={() => handleConnectSuggestion(s.id)}
                              className="inline-flex items-center justify-center mt-2 h-[22px] px-3 rounded-full border border-[#0071e3] hover:bg-[#0071e3]/5 text-[9.5px] font-bold text-[#0071e3] transition-all select-none cursor-pointer bg-transparent"
                              title="Suivre"
                            >
                              + Suivre
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: 11, color: '#86868b' }} className="font-semibold text-center py-2">Vous connaissez déjà tout le monde !</p>
                  )}
                </div>
                <Link 
                  to="/network" 
                  className="border-t border-black/[0.04] pt-3 mt-4 text-center block w-full text-[#0071e3] hover:text-[#0077ed] font-bold text-[12px] hover:underline"
                  style={{ textDecoration: 'none' }}
                >
                  Ouvrir mon réseau
                </Link>
              </div>

              {/* ScholarNet IGA Widget */}
              <div 
                style={{ 
                  padding: 16, 
                  background: 'linear-gradient(135deg, #1c1c21 0%, #070709 100%)', 
                  borderRadius: 8, 
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                }} 
                className="text-white"
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #af52de 0%, #ca7ff1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 10, boxShadow: '0 2px 10px rgba(175,82,222,0.3)' }}>
                  <BookOpen style={{ width: 14, height: 14 }} />
                </div>
                <h4 style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#af52de', marginBottom: 2 }} className="text-left">ScholarNet IGA</h4>
                <p style={{ fontSize: 11.5, color: '#e5e5ea', lineHeight: 1.35, fontWeight: 500 }} className="text-left">
                  Publiez vos mémoires et restez connectés aux dernières avancées de notre institut.
                </p>
              </div>

            </div>
          </aside>

        </div>
      </main>

      {/* Reactions List Modal (Synchronized with Feed/Component) */}
      <ReactionsListModal 
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        likes={selectedArticleReactions}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSharingPost(null);
        }}
        post={sharingPost}
        onConfirm={(shareComment) => handleShare(sharingPost.id, shareComment)}
      />
    </div>
  );
}
