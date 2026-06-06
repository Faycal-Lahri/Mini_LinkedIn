import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import useConfirmStore from '../store/confirmStore';
import useToastStore from '../store/toastStore';
import Navbar from '../components/Navbar';
import CommentSection from '../components/CommentSection';
import SkeletonPost from '../components/SkeletonPost';
import { 
  Home, Users, Bell, ShieldAlert, FolderGit2, BookOpen, 
  MessageSquare, MoreHorizontal, FileText, Sparkles, 
  Image, X, Heart, ThumbsUp, Lightbulb, Smile, MessageCircle, Share2
} from 'lucide-react';

import ReactionsListModal from '../components/ReactionsListModal';
import SharesListModal from '../components/SharesListModal';
import ShareModal from '../components/ShareModal';
import VideoPlayer from '../components/VideoPlayer';
import MediaLightbox from '../components/MediaLightbox';
import ReactionIcon from '../components/ReactionIcon';

const REACTIONS = [
  { type: 'LIKE',        emoji: '👍', label: 'J\'aime',       color: '#0071e3' },
  { type: 'LOVE',        emoji: '❤️', label: 'J\'adore',      color: '#ff3b30' },
  { type: 'CLAP',        emoji: '👏', label: 'Bravo',          color: '#ff9500' },
  { type: 'INSIGHTFUL',  emoji: '💡', label: 'Instructif',    color: '#af52de' },
  { type: 'DISLIKE',     emoji: '👎', label: 'Je n\'aime pas', color: '#86868b' },
];

const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const OriginalPostEmbed = ({ originalPost }) => {
  if (!originalPost) return null;

  const author = originalPost.author || {};
  const authorName = `${author.first_name || ''} ${author.last_name || ''}`;
  const authorHeadline = author.profile?.biography?.split('\n')[0] || author.role || 'Membre';
  const authorAvatar = author.profile?.photo_url ? `${STORAGE}/storage/${author.profile.photo_url}` : null;
  const authorInitials = `${author.first_name?.[0] || ''}${author.last_name?.[0] || ''}`;

  return (
    <div className="border border-[#dad8d6] rounded-[12px] p-4 bg-white hover:bg-black/[0.01] transition-all duration-200 mt-3.5 text-left">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#e8e8ed] border border-black/5 flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold text-gray-500">
          {authorAvatar ? (
            <img src={authorAvatar} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          ) : (
            authorInitials || '?'
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[12px] text-[#1d1d1f] truncate leading-none mb-1">{authorName}</p>
          <p className="text-[9.5px] text-[#86868b] font-semibold truncate uppercase tracking-wide leading-none">{authorHeadline}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {originalPost.title && (
          <h5 className="font-bold text-[13.5px] text-[#1d1d1f] leading-snug">{originalPost.title}</h5>
        )}
        {originalPost.article_title && (
          <h5 className="font-bold text-[13.5px] text-[#1d1d1f] leading-snug">{originalPost.article_title}</h5>
        )}
        {originalPost.content && (
          <p className="text-[12.5px] text-[#48484a] leading-relaxed line-clamp-4 whitespace-pre-wrap font-normal">
            {originalPost.content}
          </p>
        )}
      </div>

      {/* Embedded Original Media */}
      {(() => {
        const fileUrls = originalPost.file_urls || (originalPost.file_url ? [originalPost.file_url] : []);
        if (fileUrls.length === 0) return null;

        if (originalPost.media_type === 'IMAGE' || (!originalPost.media_type && originalPost.file_url && originalPost.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
          return (
            <div className="w-full rounded-lg overflow-hidden border border-black/5 mt-3">
              <img 
                src={`${STORAGE}/storage/${fileUrls[0]}`} 
                alt="" 
                className="w-full max-h-[300px] object-cover block"
              />
            </div>
          );
        } else if (originalPost.media_type === 'VIDEO' || (!originalPost.media_type && originalPost.file_url && originalPost.file_url.match(/\.(mp4|mov|avi|mpeg)$/i))) {
          return (
            <div className="w-full rounded-lg overflow-hidden border border-black/5 mt-3">
              <video src={`${STORAGE}/storage/${originalPost.file_url}`} controls className="w-full max-h-[220px] object-cover block bg-black" />
            </div>
          );
        } else {
          // PDF / Document preview
          return (
            <div className="p-3 flex items-center gap-3 bg-[#fcfcfc] border border-black/5 rounded-lg mt-3">
              <span className="material-symbols-outlined text-[24px] text-red-500">picture_as_pdf</span>
              <div className="min-w-0 text-left">
                <p className="text-[11.5px] font-bold text-[#1d1d1f] truncate leading-tight">Document PDF Joint</p>
                <p className="text-[9px] text-[#86868b] font-bold uppercase mt-0.5 tracking-wider">PDF</p>
              </div>
            </div>
          );
        }
      })()}
    </div>
  );
};

const Feed = () => {
  const { user } = useAuthStore();
  const { showConfirm } = useConfirmStore();
  const { addToast } = useToastStore();
  const [posts, setPosts] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'GENERAL', mediaType: null, files: [], file: null });
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [assistingPost, setAssistingPost] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [selectedPostReactions, setSelectedPostReactions] = useState([]);
  const [showSharesModal, setShowSharesModal] = useState(false);
  const [selectedPostShares, setSelectedPostShares] = useState([]);
  const [isPostTypeOpen, setIsPostTypeOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState({}); // { [postId]: boolean }
  const [sharingPost, setSharingPost] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Lightbox media states
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    mediaType: 'IMAGE',
    src: '',
    srcList: [],
    initialIndex: 0
  });

  const openLightbox = (mediaType, src, srcList = [], initialIndex = 0) => {
    setLightbox({
      isOpen: true,
      mediaType,
      src,
      srcList,
      initialIndex
    });
  };

  // LinkedIn reactions states
  const [reactionMenuOpen, setReactionMenuOpen] = useState({}); // { [postId]: bool }
  const [userReactions, setUserReactions] = useState({}); // { [postId]: 'LIKE'|'LOVE'|'CLAP'|'INSIGHTFUL'|'DISLIKE'|null }
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [allUserPosts, setAllUserPosts] = useState([]);

  // Hover menu delay ref and helpers to prevent gap traps
  const hoverTimeouts = React.useRef({});

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

  useEffect(() => {
    fetchPosts();
    fetchSuggestions();
    fetchNetworkStats();
  }, [filterType, user?.id]);

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

  const myPosts = useMemo(() => {
    return posts.filter(p => p.author_id === user?.id);
  }, [posts, user]);

  const postImpressions = useMemo(() => {
    return allUserPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  }, [allUserPosts]);

  const userArticlesCount = useMemo(() => {
    return allUserPosts.filter(p => p.type === 'SCIENTIFIC_ARTICLE').length;
  }, [allUserPosts]);

  const userProjectsCount = useMemo(() => {
    return allUserPosts.filter(p => p.type === 'UNIVERSITY_PROJECT').length;
  }, [allUserPosts]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts', {
        params: { type: filterType }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim() && !newPost.file && (!newPost.files || newPost.files.length === 0)) return;

    // Double check size constraints
    if (newPost.mediaType === 'IMAGE') {
      const oversized = newPost.files.some(f => f.size > 20 * 1024 * 1024);
      if (oversized) {
        addToast("Chaque image ne doit pas dépasser 20 Mo.", "error");
        return;
      }
      if (newPost.files.length > 5) {
        addToast("Vous ne pouvez pas ajouter plus de 5 images.", "error");
        return;
      }
    } else if (newPost.mediaType === 'VIDEO') {
      if (newPost.file && newPost.file.size > 100 * 1024 * 1024) {
        addToast("La vidéo ne doit pas dépasser 100 Mo.", "error");
        return;
      }
    } else if (newPost.mediaType === 'PDF') {
      if (newPost.file && newPost.file.size > 20 * 1024 * 1024) {
        addToast("Le document PDF ne doit pas dépasser 20 Mo.", "error");
        return;
      }
    }

    setPosting(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title', newPost.title || '');
      formData.append('content', newPost.content || '');
      formData.append('type', newPost.type);
      if (newPost.mediaType) {
        formData.append('media_type', newPost.mediaType);
      }
      if (newPost.mediaType === 'IMAGE') {
        newPost.files.forEach(f => {
          formData.append('files[]', f);
        });
      } else if (newPost.file) {
        formData.append('file', newPost.file);
      }

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      setPosts([response.data, ...posts]);
      setAllUserPosts(prev => [response.data, ...prev]);
      setNewPost({ title: '', content: '', type: 'GENERAL', mediaType: null, files: [], file: null });
      setIsCreateModalOpen(false);
      addToast("Publication créée avec succès !", "success");
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || "Erreur lors de la création de la publication";
      addToast(errMsg, "error");
    } finally {
      setPosting(false);
      setUploadProgress(0);
    }
  };

  const handleReact = async (postId, reactionType) => {
    if (hoverTimeouts.current[postId]) {
      clearTimeout(hoverTimeouts.current[postId]);
      delete hoverTimeouts.current[postId];
    }
    const targetPost = posts.find(p => p.id === postId);
    const current = userReactions[postId] !== undefined 
      ? userReactions[postId] 
      : (targetPost ? targetPost.user_reaction : null);
    const newType = current === reactionType ? null : reactionType;
    setUserReactions(prev => ({ ...prev, [postId]: newType }));
    setReactionMenuOpen(prev => ({ ...prev, [postId]: false }));
    try {
      const response = await api.post(`/posts/${postId}/like`, { reaction: newType || 'LIKE' });
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id !== postId) return p;
        
        const updatedLikes = [...(p.likes || [])];
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
          ...p,
          is_liked: newType !== null,
          user_reaction: newType,
          likes_count: response.data.likes_count,
          likes: updatedLikes
        };
      }));
      // update user's own reactions list in stats
      setAllUserPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        likes_count: response.data.likes_count
      } : p));
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleShare = async (post, shareComment = '') => {
    try {
      await api.post(`/posts/${post.id}/share`, { share_comment: shareComment });
      fetchPosts();
      fetchNetworkStats(); // refresh stats on share
      addToast(shareComment ? "Publication partagée avec vos pensées !" : "Publication repartagée !", "success");
    } catch (error) {
      console.error(error);
      addToast("Erreur lors du partage", "error");
    }
  };

  const handleDeletePost = async (postId) => {
    showConfirm("Êtes-vous sûr de vouloir supprimer cette publication ?", async () => {
      try {
        await api.delete(`/posts/${postId}`);
        setPosts(posts.filter(p => p.id !== postId));
        setAllUserPosts(prev => prev.filter(p => p.id !== postId));
      } catch (error) {
        console.error(error);
      }
    });
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleAssistPost = async () => {
    setAssistingPost(true);
    try {
      const response = await api.post('/ai/assist-post', {
        content: newPost.content,
        type: newPost.type,
        has_file: !!newPost.file,
        file_name: newPost.file ? newPost.file.name : null
      });
      setNewPost({ ...newPost, content: response.data.content });
    } catch (error) {
      console.error(error);
    } finally {
      setAssistingPost(false);
    }
  };

  const trendingPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.likes_count - a.likes_count).slice(0, 3);
  }, [posts]);

  const typeConfig = {
    UNIVERSITY_PROJECT: { label: 'Projet', icon: FolderGit2, color: 'ap-badge-green' },
    SCIENTIFIC_ARTICLE: { label: 'Article', icon: BookOpen, color: 'ap-badge-purple' },
    GENERAL: { label: 'Général', icon: Users, color: 'ap-badge-gray' }
  };

  const filters = [
    { id: 'ALL', label: 'Tout le flux', icon: Users },
    { id: 'UNIVERSITY_PROJECT', label: 'Projets', icon: FolderGit2 },
    { id: 'SCIENTIFIC_ARTICLE', label: 'Articles', icon: BookOpen },
  ];

  const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ee' }}>
      <Navbar />
      
      <main style={{ maxWidth: 1128, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[225px_1fr_300px] gap-5 items-start" style={{ alignItems: 'start' }}>
          
          {/* ── SIDEBAR GAUCHE (identique LinkedIn) ── */}
          <aside className="hidden lg:block" style={{ position: 'sticky', top: 64, alignSelf: 'start', maxHeight: 'calc(100vh - 76px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div className="ap-card anim-in">
              {/* Banner + Avatar */}
              <div style={{ height: 56, background: 'linear-gradient(135deg, #004e99, #0071e3)', position: 'relative' }}>
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
                  <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid white', overflow: 'hidden', background: '#e8e8ed', margin: '-32px auto 10px', boxShadow: '0 2px 10px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                    {user?.profile?.photo_url ? (
                      <img 
                        src={`${STORAGE}/storage/${user.profile.photo_url}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        alt="" 
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                      />
                    ) : (
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#86868b' }}>
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

              {/* Raccourcis LinkedIn */}
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

              {/* Accès rapide */}
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

          {/* ── FEED CENTRAL ── */}
          <section style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            
            {/* Créer un post card */}
            <div className="bg-white border border-[#e8e8ed] rounded-[8px] p-4 anim-in">
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: '#e8e8ed', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{ flex: 1, height: 48, borderRadius: 9999, border: '1px solid rgba(0,0,0,.15)', background: 'transparent', padding: '0 16px', textAlign: 'left', fontSize: 14, color: 'rgba(0,0,0,0.6)', cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'} 
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Commencer un post académique...
                </button>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-2 mt-1">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 bg-transparent border-none rounded-[4px] hover:bg-black/[0.03] cursor-pointer text-black/60 font-semibold text-[13px] transition-colors"
                >
                  <span className="text-emerald-500 material-symbols-outlined text-[20px]">smart_display</span>
                  <span>Vidéo</span>
                </button>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 bg-transparent border-none rounded-[4px] hover:bg-black/[0.03] cursor-pointer text-black/60 font-semibold text-[13px] transition-colors"
                >
                  <span className="text-blue-500 material-symbols-outlined text-[20px]">image</span>
                  <span>Média</span>
                </button>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 bg-transparent border-none rounded-[4px] hover:bg-black/[0.03] cursor-pointer text-black/60 font-semibold text-[13px] transition-colors"
                >
                  <span className="text-amber-600 material-symbols-outlined text-[20px]">feed</span>
                  <span>Rédiger un article</span>
                </button>
              </div>
            </div>

            {/* Commutateurs de filtres */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
              {filters.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => { setLoading(true); setFilterType(f.id); }}
                  className="ap-press"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 9999, border: filterType === f.id ? 'none' : '1.5px solid rgba(0,0,0,.12)', background: filterType === f.id ? '#0071e3' : 'white', color: filterType === f.id ? 'white' : '#1d1d1f', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .18s ease', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                >
                  <f.icon style={{ width: 14, height: 14 }} />{f.label}
                </button>
              ))}
            </div>

            {/* Liste des posts */}
            {loading ? (
              [1, 2, 3].map(i => <SkeletonPost key={i} />)
            ) : posts.length === 0 ? (
              <div className="ap-card text-center" style={{ padding: '48px 16px' }}>
                <FolderGit2 style={{ width: 48, height: 48, color: '#aeaeb2', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#86868b' }}>Aucun post dans cette catégorie</p>
              </div>
            ) : (
              posts.map((post, idx) => {
                const tconf = typeConfig[post.type] || typeConfig.GENERAL;
                const TIcon = tconf.icon;
                const isOwner = post.author_id === user?.id;
                const isCommentsExpanded = expandedComments[post.id];
                const currentReaction = userReactions[post.id] !== undefined 
                  ? userReactions[post.id] 
                  : post.user_reaction;
                const reactionInfo = currentReaction ? REACTIONS.find(r => r.type === currentReaction) : null;

                return (
                  <div 
                    key={post.id} 
                    id={`post-${post.id}`}
                    className="bg-white border border-[#dad8d6] rounded-[8px] mb-2.5 overflow-visible text-left anim-up" 
                    style={{ animationDelay: `${idx * 45}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 pt-3 px-4 pb-2">
                      <Link to={`/profile/${post.author_id}`}>
                        <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-[#e8e8ed] flex-shrink-0 flex items-center justify-center border border-black/5 hover:opacity-90 transition-opacity">
                          {post.author?.profile?.photo_url ? (
                            <img src={`${STORAGE}/storage/${post.author.profile.photo_url}`} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                          ) : (
                            <span className="text-sm font-bold text-[#86868b]">
                              {post.author?.first_name?.[0]}{post.author?.last_name?.[0]}
                            </span>
                          )}
                        </div>
                      </Link>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/profile/${post.author_id}`} className="text-[14px] font-semibold text-black/90 hover:text-[#0a66c2] hover:underline leading-snug">
                            {post.author?.first_name} {post.author?.last_name}
                          </Link>
                          <span className="text-[11px] text-black/45 font-medium flex items-center gap-1">
                            • 1er
                          </span>
                          <span className={`ap-badge ${tconf.color} scale-90`}>
                            <TIcon style={{ width: 10, height: 10 }} />{tconf.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-black/60 truncate mt-0.5 font-normal leading-normal">
                          {post.author?.profile?.biography || post.author?.role}
                        </p>
                        <p className="text-[11px] text-black/45 mt-0.5 flex items-center gap-1 font-medium leading-none">
                          <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>
                          <span>•</span>
                          <span className="material-symbols-outlined text-[12px] text-black/40 leading-none">public</span>
                        </p>
                      </div>
                      
                      {isOwner && (
                        <button className="w-8 h-8 rounded-full hover:bg-black/[0.04] text-black/60 hover:text-black/85 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer" onClick={() => handleDeletePost(post.id)}>
                          <MoreHorizontal style={{ width: 18, height: 18 }} />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="px-4 pb-2.5 pt-1 text-left">
                      {post.title && (
                        <h4 className="font-bold text-[15px] text-black/90 mb-1.5 leading-snug">
                          {post.title}
                        </h4>
                      )}
                      {post.content && post.content.trim() !== '' && (
                        <p className="text-[14px] text-black/90 leading-[1.5] whitespace-pre-wrap font-normal">{post.content}</p>
                      )}
                      
                      {/* Repost original post embed */}
                      {post.original_post_id && (
                        <OriginalPostEmbed originalPost={post.original_post || post.originalPost} />
                      )}
                    </div>

                    {/* Image / File Preview - 100% Flush Width */}
                    {(() => {
                      const fileUrls = post.file_urls || (post.file_url ? [post.file_url] : []);
                      if (fileUrls.length === 0) return null;

                      if (post.media_type === 'IMAGE' || (!post.media_type && post.file_url && post.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
                        if (fileUrls.length > 1) {
                          return (
                            <div className="w-full border-t border-b border-[#dad8d6]/50 bg-[#f4f2ee] overflow-hidden mb-3">
                              <div className={`grid gap-0.5 ${
                                fileUrls.length === 2 ? 'grid-cols-2' :
                                fileUrls.length === 3 ? 'grid-cols-3' :
                                fileUrls.length === 4 ? 'grid-cols-2' :
                                'grid-cols-3'
                              }`}>
                                {fileUrls.slice(0, 5).map((url, idx) => (
                                  <div key={idx} className="relative overflow-hidden aspect-video border border-black/5 bg-[#f4f2ee]">
                                    <img 
                                      src={`${STORAGE}/storage/${url}`} 
                                      alt="" 
                                      className="w-full h-full object-cover hover:scale-[1.03] transition-all duration-300 cursor-pointer block"
                                      onClick={() => openLightbox('IMAGE', `${STORAGE}/storage/${url}`, fileUrls.map(u => `${STORAGE}/storage/${u}`), idx)}
                                    />
                                    {idx === 4 && fileUrls.length > 5 && (
                                      <div 
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-lg font-bold cursor-pointer"
                                        onClick={() => openLightbox('IMAGE', `${STORAGE}/storage/${url}`, fileUrls.map(u => `${STORAGE}/storage/${u}`), idx)}
                                      >
                                        +{fileUrls.length - 5}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="w-full border-t border-b border-[#dad8d6]/50 bg-[#f4f2ee] mb-3 overflow-hidden">
                              <img 
                                src={`${STORAGE}/storage/${fileUrls[0]}`} 
                                alt="" 
                                className="w-full max-h-[500px] object-cover cursor-pointer block mx-auto"
                                onClick={() => openLightbox('IMAGE', `${STORAGE}/storage/${fileUrls[0]}`)}
                              />
                            </div>
                          );
                        }
                      } else if (post.media_type === 'VIDEO' || (!post.media_type && post.file_url && post.file_url.match(/\.(mp4|mov|avi|mpeg)$/i))) {
                        return (
                          <div className="w-full bg-black overflow-hidden border-t border-b border-[#dad8d6]/50 relative group mb-3">
                            <VideoPlayer src={`${STORAGE}/storage/${post.file_url}`} />
                            <button
                              onClick={() => openLightbox('VIDEO', `${STORAGE}/storage/${post.file_url}`)}
                              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 z-10 cursor-pointer border-none"
                              title="Agrandir la vidéo"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                            </button>
                          </div>
                        );
                      } else {
                        // PDF / Document preview
                        return (
                          <div 
                            onClick={() => openLightbox('PDF', `${STORAGE}/storage/${post.file_url}`)}
                            className="p-3.5 flex items-center gap-3.5 bg-[#fcfcfc] border border-black/5 rounded-xl mx-4 mb-3 cursor-pointer hover:bg-black/[0.02] transition-colors"
                          >
                            <div className="w-[44px] h-[44px] rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100 flex-shrink-0">
                              <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                            </div>
                            <div className="flex-grow min-w-0 text-left">
                              <p className="text-[13px] font-bold text-[#1d1d1f] truncate leading-tight">Document PDF Joint</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider flex items-center gap-1">
                                <span>OFFICIEL</span>
                                <span>•</span>
                                <span className="text-[#34c759] font-bold flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
                                  Vérifié
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                    })()}

                    {/* Stats metrics */}
                    <div className="py-2 px-4 flex justify-between items-center text-[12px] text-black/55 font-medium leading-none mb-1">
                      <div>
                        {post.likes_count > 0 && (
                          <div 
                            onClick={() => {
                              setSelectedPostReactions(post.likes || []);
                              setShowReactionsModal(true);
                            }}
                            className="flex items-center gap-1.5 cursor-pointer hover:text-[#0a66c2] transition-colors"
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }} className="mr-1">
                              {(() => {
                                const activeTypes = new Set();
                                if (post.likes && post.likes.length > 0) {
                                  post.likes.forEach(l => activeTypes.add(l.type));
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
                                    <ReactionIcon type={type} className="w-[15px] h-[15px]" />
                                  </div>
                                ));
                              })()}
                            </div>
                            
                            <span className="font-semibold text-black/60 hover:text-[#0a66c2] hover:underline">
                              {post.likes_count}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2.5 items-center">
                        <button onClick={() => toggleComments(post.id)} className="hover:underline hover:text-[#0a66c2] transition-colors border-none bg-transparent cursor-pointer text-[12px] text-black/60 font-semibold p-0">
                          {post.comments_count > 0 ? `${post.comments_count} commentaire${post.comments_count > 1 ? 's' : ''}` : '0 commentaire'}
                        </button>
                        {post.shares && post.shares.length > 0 && (
                          <>
                            <span className="text-[10px] text-gray-300">•</span>
                            <button 
                              onClick={() => {
                                setSelectedPostShares(post.shares || []);
                                setShowSharesModal(true);
                              }} 
                              className="hover:underline hover:text-[#0a66c2] transition-colors border-none bg-transparent cursor-pointer text-[12px] text-black/60 font-semibold p-0"
                            >
                              {post.shares.length} partage{post.shares.length > 1 ? 's' : ''}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions bar (Reactions + Comment + Share) */}
                    <div className="px-3 py-1 flex items-center justify-between gap-1 relative border-t border-[#f4f2ee] mx-1 bg-transparent mt-1">
                      
                      {/* LinkedIn Reactions Menu Container */}
                      <div 
                        className="relative flex-1"
                        onMouseEnter={() => handleMouseEnterReaction(post.id)}
                        onMouseLeave={() => handleMouseLeaveReaction(post.id)}
                      >
                        {reactionMenuOpen[post.id] && (
                          <div 
                            className="absolute bottom-[85%] left-0 pb-3 z-30 animate-apple-spring"
                            onMouseEnter={() => handleMouseEnterReaction(post.id)}
                            onMouseLeave={() => handleMouseLeaveReaction(post.id)}
                          >
                            <div className="p-2 bg-white rounded-full shadow-apple-lg flex gap-3 border border-black/5">
                              {REACTIONS.map(r => (
                                <button
                                  key={r.type}
                                  onClick={() => handleReact(post.id, r.type)}
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
                          onMouseEnter={() => handleMouseEnterReaction(post.id)}
                          onClick={() => handleReact(post.id, currentReaction || 'LIKE')}
                          className="w-full py-2 hover:bg-black/[0.04] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors cursor-pointer border-none bg-transparent font-sans"
                          style={{ 
                            color: reactionInfo ? reactionInfo.color : 'rgba(0,0,0,0.6)'
                          }}
                        >
                          {currentReaction ? (
                            <ReactionIcon type={currentReaction} className="w-[18px] h-[18px] animate-spring" />
                          ) : (
                            <ThumbsUp className="w-[18px] h-[18px] text-black/60" />
                          )}
                          <span>{reactionInfo ? reactionInfo.label : "J'aime"}</span>
                        </button>
                      </div>

                      {/* Comment action */}
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex-1 py-2 hover:bg-black/[0.04] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-semibold text-black/60 hover:text-black/85 transition-colors border-none bg-transparent cursor-pointer font-sans"
                      >
                        <MessageCircle style={{ width: 18, height: 18 }} />
                        <span>Commenter</span>
                      </button>

                      {/* Share action */}
                      {!post.original_post_id && (
                        <div className="flex-1 relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShareMenuOpen(prev => ({ ...prev, [post.id]: !prev[post.id] }));
                            }}
                            className="w-full py-2 hover:bg-black/[0.04] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-semibold text-black/60 hover:text-black/85 transition-colors border-none bg-transparent cursor-pointer font-sans"
                          >
                            <Share2 style={{ width: 18, height: 18 }} />
                            <span>Repartager</span>
                          </button>
                          
                          {/* Premium Share Dropdown Menu (LinkedIn-like) */}
                          {shareMenuOpen[post.id] && (
                            <>
                              {/* Backdrop click handler to close the dropdown */}
                              <div 
                                className="fixed inset-0 z-40 bg-transparent" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareMenuOpen(prev => ({ ...prev, [post.id]: false }));
                                }} 
                              />
                              <div 
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-black/5 rounded-[12px] shadow-apple-md py-1.5 min-w-[220px] z-50 animate-fadeIn text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setShareMenuOpen(prev => ({ ...prev, [post.id]: false }));
                                    handleShare(post); // instant share
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
                                    setShareMenuOpen(prev => ({ ...prev, [post.id]: false }));
                                    setSharingPost(post);
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
                      )}
                    </div>

                    {/* Expansion Comments */}
                    {isCommentsExpanded && (
                      <CommentSection 
                        postId={post.id} 
                        initialComments={post.comments}
                        onCommentAdded={() => {
                          setPosts(posts.map(p => p.id === post.id ? { ...p, comments_count: p.comments_count + 1 } : p));
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* ── SIDEBAR DROITE (structure LinkedIn / Apple Premium) ── */}
          <aside className="hidden md:block" style={{ position: 'sticky', top: 64, alignSelf: 'start', maxHeight: 'calc(100vh - 76px)', overflowY: 'auto', scrollbarWidth: 'none' }}>
            <div className="space-y-5">
            
            {/* Spotlight Widget */}
            <div className="bg-white/80 backdrop-blur-md border border-black/[0.05] rounded-[16px] p-5 shadow-apple-sm hover:shadow-apple-md transition-all duration-300 anim-in">
              <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86868b', marginBottom: 16 }} className="flex items-center gap-2">
                <span className="text-[#ff9500]">⚡</span>À la une (Tendances)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {trendingPosts.length > 0 ? (
                  trendingPosts.map((tp, i) => (
                    <div key={tp.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span className="font-black text-[#0071e3] text-[13.5px] min-w-[20px] mt-0.5">0{i+1}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <a href={`#post-${tp.id}`} style={{ fontSize: 12.5, fontWeight: 700, color: '#1d1d1f', textDecoration: 'none', lineHeight: 1.35 }} className="line-clamp-2 hover:text-[#0071e3] transition-colors">
                          {tp.content}
                        </a>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0071e3]/5 text-[#0071e3] text-[9.5px] font-extrabold tracking-wider">
                            <span className="text-[10px] mr-0.5">⚡</span>{tp.likes_count} réactions
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: 11, color: '#86868b' }} className="font-semibold text-center py-2">Aucun post populaire pour le moment.</p>
                )}
              </div>
            </div>

            {/* Suggestions Widget */}
            <div className="bg-white/80 backdrop-blur-md border border-black/[0.05] rounded-[16px] p-5 shadow-apple-sm hover:shadow-apple-md transition-all duration-300 anim-in">
              <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86868b', marginBottom: 16 }} className="flex items-center gap-2">
                <span className="text-[#0071e3]">👥</span>Suggestions réseau
              </h3>
              <div className="space-y-4">
                {suggestions.length > 0 ? (
                  suggestions.slice(0, 5).map(s => {
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
                        <div className="min-w-0 flex-grow text-left">
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
                            className="inline-flex items-center justify-center mt-2 h-[24px] px-3.5 rounded-full border border-[#0071e3] hover:bg-[#0071e3]/5 text-[10px] font-bold text-[#0071e3] transition-all select-none cursor-pointer bg-transparent"
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
                className="border-t border-black/[0.04] pt-3 mt-4 text-center block w-full text-[#0071e3] hover:text-[#0077ed] font-bold text-[12.5px] hover:underline"
                style={{ textDecoration: 'none' }}
              >
                Ouvrir mon réseau
              </Link>
            </div>
            
            {/* ScholarNet widget */}
            <div 
              style={{ 
                padding: 20, 
                background: 'linear-gradient(135deg, #1c1c21 0%, #070709 100%)', 
                borderRadius: 18, 
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }} 
              className="anim-in text-white"
            >
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #0071e3 0%, #378fe9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 14, boxShadow: '0 2px 10px rgba(0,78,153,0.3)' }}>
                <FolderGit2 style={{ width: 18, height: 18 }} />
              </div>
              <h4 style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0071e3', marginBottom: 2 }}>ScholarNet IGA</h4>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>L'écosystème numérique d'élite pour les chercheurs, enseignants et étudiants de l'IGA Casablanca.</p>
            </div>
            </div>
          </aside>

        </div>
      </main>

      {/* Modal: "Créer une publication" */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md anim-fadein" onClick={() => setIsCreateModalOpen(false)}>
          <div 
            className="bg-white border border-black/5 rounded-ap-xl shadow-ap-xl w-full max-w-[540px] overflow-hidden anim-spring p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium Upload Progress Overlay */}
            {posting && (
              <div 
                className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-fadeIn" 
                style={{ borderRadius: '24px' }}
              >
                <div className="w-full max-w-[280px] text-center space-y-4">
                  {/* Premium Circular Spinner Loader */}
                  <div className="relative w-16 h-16 mx-auto">
                    {/* Ring background */}
                    <div className="absolute inset-0 rounded-full border-4 border-gray-100/80"></div>
                    {/* Animated spin indicator */}
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#0071e3] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    {/* Percentage text center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-extrabold text-[#1d1d1f]">{uploadProgress}%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-[#1d1d1f] tracking-tight">
                      {newPost.mediaType === 'VIDEO' ? 'Envoi de la vidéo...' : newPost.mediaType === 'IMAGE' ? 'Envoi des images...' : 'Publication de votre post...'}
                    </h4>
                    <p className="text-[11px] text-[#86868b] font-semibold leading-relaxed">
                      Veuillez patienter pendant le transfert.
                    </p>
                  </div>

                  {/* Horizontal Progress Track */}
                  <div className="w-full h-1.5 bg-[#f5f5f7] rounded-full overflow-hidden border border-black/5 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0071e3] to-[#34c759] rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-[#6e6e73]"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1d1d1f', marginBottom: 16 }}>Créer un post</h3>
            
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', bg: '#f5f5f7', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.profile?.photo_url ? (
                    <img src={`${STORAGE}/storage/${user.profile.photo_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#86868b' }}>{user?.first_name?.[0]}</span>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>{user?.first_name} {user?.last_name}</p>
                  
                  {/* Selective type post */}
                  <div className="relative inline-block mt-1 z-50">
                    <button
                      type="button"
                      onClick={() => setIsPostTypeOpen(!isPostTypeOpen)}
                      className="h-6 px-2.5 rounded-full border border-black/10 hover:bg-[#f5f5f7] bg-white text-[11px] font-bold text-[#0071e3] transition-all press-effect flex items-center gap-1 cursor-pointer select-none"
                    >
                      <span>
                        {newPost.type === 'GENERAL' && 'Général'}
                        {newPost.type === 'UNIVERSITY_PROJECT' && 'Projet Académique'}
                        {newPost.type === 'SCIENTIFIC_ARTICLE' && 'Article Scientifique'}
                      </span>
                      <span className="material-symbols-outlined text-[12px] text-gray-400 transition-transform duration-200" style={{ transform: isPostTypeOpen ? 'rotate(180deg)' : 'none' }}>
                        expand_more
                      </span>
                    </button>

                    {isPostTypeOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsPostTypeOpen(false)} />
                        <div className="absolute left-0 mt-1 min-w-[150px] bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-[11px] text-left">
                          {[
                            { value: 'GENERAL', label: 'Général' },
                            { value: 'UNIVERSITY_PROJECT', label: 'Projet Académique' },
                            ...((['TEACHER', 'RESEARCHER'].includes(user?.role)) ? [{ value: 'SCIENTIFIC_ARTICLE', label: 'Article Scientifique' }] : [])
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setNewPost({ ...newPost, type: opt.value });
                                setIsPostTypeOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between font-semibold ${
                                newPost.type === opt.value ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {newPost.type === opt.value && (
                                <span className="material-symbols-outlined text-[13px] text-[#0071e3] font-bold">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Title input */}
              <input 
                type="text" 
                className="w-full px-3.5 py-2.5 bg-white border border-[#d2d2d7] focus:border-[#0071e3] rounded-[10px] text-xs outline-none transition-all font-semibold text-[#1d1d1f]"
                placeholder="Titre de la publication (Optionnel)"
                value={newPost.title || ''}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />

              {/* Textarea */}
              <textarea 
                className="ap-textarea"
                style={{ minHeight: 120, fontSize: 14 }}
                placeholder="De quoi voulez-vous parler ?"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={4}
              />

              {/* Media Previews based on mediaType */}
              {newPost.mediaType === 'IMAGE' && newPost.files.length > 0 && (
                <div className="grid grid-cols-3 gap-2 p-2 bg-[#f5f5f7] rounded-[12px] border border-black/5 text-left animate-fadeIn">
                  {newPost.files.map((file, i) => (
                    <div key={i} className="relative aspect-video rounded-[8px] overflow-hidden bg-white border border-black/10">
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = newPost.files.filter((_, idx) => idx !== i);
                          setNewPost({ ...newPost, files: updated, mediaType: updated.length > 0 ? 'IMAGE' : null });
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border-none cursor-pointer p-0"
                      >
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {newPost.mediaType === 'VIDEO' && newPost.file && (
                <div className="p-3 bg-[#e8f0fe] rounded-[12px] border border-black/5 flex items-center gap-3 text-left animate-fadeIn">
                  <div className="h-9 w-9 rounded-[8px] bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">smart_display</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h5 className="text-[12px] font-bold text-[#1d1d1f] truncate leading-tight">{newPost.file.name}</h5>
                    <span className="text-[9px] text-[#0071e3] font-bold uppercase tracking-wider mt-0.5 block">Vidéo Jointée</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setNewPost({ ...newPost, file: null, mediaType: null })}
                    className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-red-500 border-none cursor-pointer"
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              )}

              {newPost.mediaType === 'PDF' && newPost.file && (
                <div className="p-3 bg-red-50/50 rounded-[12px] border border-red-100 flex items-center gap-3 text-left animate-fadeIn">
                  <div className="h-9 w-9 rounded-[8px] bg-red-50 text-red-500 flex items-center justify-center border border-red-100 flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h5 className="text-[12px] font-bold text-[#1d1d1f] truncate leading-tight">{newPost.file.name}</h5>
                    <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider mt-0.5 block">Document PDF</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setNewPost({ ...newPost, file: null, mediaType: null })}
                    className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-red-500 border-none cursor-pointer"
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              )}

              {/* Action footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '.5px solid rgba(0,0,0,.08)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="file" 
                    id="modal-feed-images" 
                    className="hidden" 
                    multiple
                    accept="image/*"
                    disabled={newPost.mediaType !== null && newPost.mediaType !== 'IMAGE'}
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files);
                      if (selectedFiles.length > 5) {
                        addToast("Limite dépassée : Seules les 5 premières images ont été conservées.", "warning");
                      }
                      const keptFiles = selectedFiles.slice(0, 5);
                      const oversized = keptFiles.some(f => f.size > 20 * 1024 * 1024);
                      if (oversized) {
                        addToast("Chaque image ne doit pas dépasser 20 Mo.", "error");
                        return;
                      }
                      setNewPost({ ...newPost, mediaType: 'IMAGE', files: keptFiles, file: null });
                    }}
                  />
                  <label 
                    htmlFor="modal-feed-images" 
                    className={`ap-icon-btn ${newPost.mediaType !== null && newPost.mediaType !== 'IMAGE' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Ajouter des images (max 5)"
                    style={{ background: '#f5f5f7', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (newPost.mediaType !== null && newPost.mediaType !== 'IMAGE') ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">image</span>
                  </label>

                  <input 
                    type="file" 
                    id="modal-feed-video" 
                    className="hidden" 
                    accept="video/*"
                    disabled={newPost.mediaType !== null && newPost.mediaType !== 'VIDEO'}
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];
                      if (selectedFile) {
                        if (selectedFile.size > 100 * 1024 * 1024) {
                          addToast("La vidéo ne doit pas dépasser 100 Mo.", "error");
                          return;
                        }
                        setNewPost({ ...newPost, mediaType: 'VIDEO', file: selectedFile, files: [] });
                      }
                    }}
                  />
                  <label 
                    htmlFor="modal-feed-video" 
                    className={`ap-icon-btn ${newPost.mediaType !== null && newPost.mediaType !== 'VIDEO' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Ajouter une vidéo (max 1)"
                    style={{ background: '#f5f5f7', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (newPost.mediaType !== null && newPost.mediaType !== 'VIDEO') ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">smart_display</span>
                  </label>

                  <input 
                    type="file" 
                    id="modal-feed-pdf" 
                    className="hidden" 
                    accept="application/pdf"
                    disabled={newPost.mediaType !== null && newPost.mediaType !== 'PDF'}
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];
                      if (selectedFile) {
                        if (selectedFile.size > 20 * 1024 * 1024) {
                          addToast("Le document PDF ne doit pas dépasser 20 Mo.", "error");
                          return;
                        }
                        setNewPost({ ...newPost, mediaType: 'PDF', file: selectedFile, files: [] });
                      }
                    }}
                  />
                  <label 
                    htmlFor="modal-feed-pdf" 
                    className={`ap-icon-btn ${newPost.mediaType !== null && newPost.mediaType !== 'PDF' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title="Ajouter un document PDF (max 1)"
                    style={{ background: '#f5f5f7', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (newPost.mediaType !== null && newPost.mediaType !== 'PDF') ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  </label>

                  {newPost.mediaType && (
                    <button 
                      type="button"
                      onClick={() => setNewPost({ ...newPost, mediaType: null, file: null, files: [] })}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100/50 px-2.5 rounded-full border border-red-200 transition-colors cursor-pointer self-center h-7 font-sans"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={posting || (!newPost.content.trim() && !newPost.file && (!newPost.files || newPost.files.length === 0))}
                  className="ap-btn ap-btn-primary"
                  style={{ height: 34, fontSize: 12, padding: '0 16px' }}
                >
                  {posting ? 'Publication...' : 'Publier'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADVANCED LIGHTBOX MODALS */}
      <ReactionsListModal 
        isOpen={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
        likes={selectedPostReactions}
      />

      <SharesListModal 
        isOpen={showSharesModal}
        onClose={() => setShowSharesModal(false)}
        shares={selectedPostShares}
      />

      <MediaLightbox 
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
        mediaType={lightbox.mediaType}
        src={lightbox.src}
        srcList={lightbox.srcList}
        initialIndex={lightbox.initialIndex}
      />

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSharingPost(null);
        }}
        post={sharingPost}
        onConfirm={(shareComment) => handleShare(sharingPost, shareComment)}
      />

    </div>
  );
};

export default Feed;
