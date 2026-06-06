import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import useToastStore from '../store/toastStore';
import useConfirmStore from '../store/confirmStore';
import AppleDatePicker from '../components/AppleDatePicker';
import ReactionsListModal from '../components/ReactionsListModal';
import SharesListModal from '../components/SharesListModal';
import ShareModal from '../components/ShareModal';
import VideoPlayer from '../components/VideoPlayer';
import MediaLightbox from '../components/MediaLightbox';
import ReactionIcon from '../components/ReactionIcon';
import CommentSection from '../components/CommentSection';
import { X, Sparkles, ThumbsUp, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

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

const Profile = () => {
    const { addToast } = useToastStore();
    const { showConfirm } = useConfirmStore();
    const { id } = useParams();
    const { user: currentUser, fetchUser } = useAuthStore();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [bio, setBio] = useState('');
    const [headline, setHeadline] = useState('');
    const [about, setAbout] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [languages, setLanguages] = useState([]);
    const [otherMembers, setOtherMembers] = useState([]);
    const [otherMembersLoading, setOtherMembersLoading] = useState(true);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [newLangName, setNewLangName] = useState('');
    const [newLangLevel, setNewLangLevel] = useState('Natif');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [photoError, setPhotoError] = useState(false);
    const [bannerError, setBannerError] = useState(false);
    const [isSkillLevelOpen, setIsSkillLevelOpen] = useState(false);
    const [isSkillSourceOpen, setIsSkillSourceOpen] = useState(false);
    const [isLangLevelOpen, setIsLangLevelOpen] = useState(false);
    const [isExpTypeOpen, setIsExpTypeOpen] = useState(false);
    const [showAllExperiences, setShowAllExperiences] = useState(false);
    const [showAllCertifications, setShowAllCertifications] = useState(false);
    const [showAllEducations, setShowAllEducations] = useState(false);
    const [showAllSkills, setShowAllSkills] = useState(false);

    // Connections Pop-up modal states and fetcher
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);
    const [connectionsList, setConnectionsList] = useState([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [connectionsSearch, setConnectionsSearch] = useState('');
    const [connectionsRoleFilter, setConnectionsRoleFilter] = useState('ALL');

    const handleOpenConnections = async () => {
        if (!profileData?.id) return;
        setShowConnectionsModal(true);
        setConnectionsLoading(true);
        try {
            const res = await api.get(`/network/connections?user_id=${profileData.id}`);
            setConnectionsList(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            addToast('Erreur lors du chargement des relations', 'error');
        } finally {
            setConnectionsLoading(false);
        }
    };

    // Determine if we are viewing our own profile or someone else's
    const isPublicView = !!id && id !== String(currentUser?.id);
    const canEdit = !isPublicView || currentUser?.role === 'ADMIN';

    // Helper parsers for extra JSON data inside columns
    const parseExpDescription = (raw) => {
        try {
            if (raw && raw.trim().startsWith('{')) {
                const parsed = JSON.parse(raw);
                return {
                    description: parsed.description || '',
                    companyIcon: parsed.companyIcon || '',
                    documentUrl: parsed.documentUrl || ''
                };
            }
        } catch (e) {}
        return { description: raw || '', companyIcon: '', documentUrl: '' };
    };

    const parseCertDescription = (raw) => {
        try {
            if (raw && raw.trim().startsWith('{')) {
                const parsed = JSON.parse(raw);
                return {
                    description: parsed.description || '',
                    orgIcon: parsed.orgIcon || '',
                    certImage: parsed.certImage || ''
                };
            }
        } catch (e) {}
        return { description: raw || '', orgIcon: '', certImage: '' };
    };

    // Group experiences by organization for LinkedIn Premium timeline styling
    const groupExperiencesByOrg = (exps) => {
        if (!exps || exps.length === 0) return [];
        
        // 1. Sort all experiences by start_date descending
        const sorted = [...exps].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        
        // 2. Group by organization name (case-insensitive)
        const groups = [];
        const orgMap = {};
        
        sorted.forEach(exp => {
            const orgKey = exp.organization.trim().toLowerCase();
            if (!orgMap[orgKey]) {
                orgMap[orgKey] = {
                    organization: exp.organization,
                    logo: parseExpDescription(exp.description).companyIcon || '',
                    location: exp.location || '',
                    roles: [],
                    maxStartDate: new Date(exp.start_date)
                };
                groups.push(orgMap[orgKey]);
            }
            
            orgMap[orgKey].roles.push(exp);
            
            const parsedDesc = parseExpDescription(exp.description);
            if (parsedDesc.companyIcon && !orgMap[orgKey].logo) {
                orgMap[orgKey].logo = parsedDesc.companyIcon;
            }
            if (exp.location && !orgMap[orgKey].location) {
                orgMap[orgKey].location = exp.location;
            }
        });
        
        // 3. Sort groups by their most recent experience start date descending
        groups.sort((a, b) => b.maxStartDate - a.maxStartDate);
        
        return groups;
    };

    const getOverallDurationStr = (roles) => {
        if (!roles || roles.length === 0) return '';
        // Find oldest start date
        const startDates = roles.map(r => new Date(r.start_date));
        const minStart = new Date(Math.min(...startDates));
        
        // Find newest end date
        const hasCurrent = roles.some(r => !r.end_date);
        const endDates = roles.map(r => r.end_date ? new Date(r.end_date) : new Date());
        const maxEnd = hasCurrent ? new Date() : new Date(Math.max(...endDates));
        
        // Format overall date range (e.g. "septembre 2024 – Présent")
        const startStr = minStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const endStr = hasCurrent ? 'Présent' : maxEnd.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        // Calculate difference in months
        const diffMs = maxEnd - minStart;
        const diffMonths = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
        const yrs = Math.floor(diffMonths / 12);
        const mos = diffMonths % 12;
        
        let durationStr = '';
        if (yrs > 0) durationStr += `${yrs} an${yrs > 1 ? 's' : ''}`;
        if (mos > 0) durationStr += `${durationStr ? ' ' : ''}${mos} mois`;
        
        return `${startStr} – ${endStr} · ${durationStr}`;
    };

    const openBase64InNewTab = (base64Data) => {
        if (!base64Data) return;
        try {
            if (!base64Data.startsWith('data:')) {
                window.open(base64Data, '_blank');
                return;
            }
            
            const parts = base64Data.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            
            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }
            
            const blob = new Blob([uInt8Array], { type: contentType });
            const blobUrl = URL.createObjectURL(blob);
            window.open(blobUrl, '_blank');
        } catch (e) {
            console.error("Error opening document:", e);
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            }
        }
    };

    const renderInstitutionLogo = (instName) => {
        const nameLower = (instName || '').toLowerCase();
        const isIGA = nameLower.includes('iga');
        if (isIGA) {
            return (
                <div className="h-6 w-6 rounded-[4px] bg-gradient-to-br from-[#0071e3] to-[#34c759] flex items-center justify-center flex-shrink-0 text-white font-extrabold text-[8px] tracking-tight shadow-sm border border-black/5">
                    IGA
                </div>
            );
        }
        return (
            <div className="h-6 w-6 rounded-[4px] bg-[#f5f5f7] border border-black/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[14px] text-[#86868b]">school</span>
            </div>
        );
    };

    // Modal States for clean overlays
    const [showExpModal, setShowExpModal] = useState(false);
    const [expModalData, setExpModalData] = useState({
        id: null,
        title: '',
        organization: '',
        location: '',
        start_date: '',
        end_date: '',
        type: 'INTERNSHIP',
        duration: '',
        description: '',
        companyIcon: '',
        documentUrl: ''
    });

    const [showCertModal, setShowCertModal] = useState(false);
    const [certModalData, setCertModalData] = useState({
        id: null,
        title: '',
        organization: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: '',
        orgIcon: '',
        certImage: '',
        description: ''
    });

    const [showSkillModal, setShowSkillModal] = useState(false);
    const [skillModalData, setSkillModalData] = useState({
        id: null,
        name: '',
        level: 'INTERMEDIATE',
        education_id: '',
        is_autoformation: true
    });

    const [showEduModal, setShowEduModal] = useState(false);
    const [eduModalData, setEduModalData] = useState({
        id: null,
        school: '',
        degree: '',
        field_of_study: '',
        city: '',
        start_date: '',
        end_date: '',
        description: '',
        documentUrl: ''
    });

    const [activeActivityTab, setActiveActivityTab] = useState('posts');
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const [selectedPostReactions, setSelectedPostReactions] = useState([]);
    const [showSharesModal, setShowSharesModal] = useState(false);
    const [selectedPostShares, setSelectedPostShares] = useState([]);
    const [reactionMenuOpen, setReactionMenuOpen] = useState({}); // { [postId]: bool }
    const [userReactions, setUserReactions] = useState({}); // { [postId]: reactionType }
    const [expandedComments, setExpandedComments] = useState({}); // { [postId]: bool }
    
    const toggleComments = (postId) => {
        setExpandedComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState({}); // { [postId]: boolean }
    const [sharingPost, setSharingPost] = useState(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [posting, setPosting] = useState(false);
    const [isPostTypeOpen, setIsPostTypeOpen] = useState(false);
    const [assistingPost, setAssistingPost] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', type: 'GENERAL', mediaType: null, files: [], file: null });
    const [uploadProgress, setUploadProgress] = useState(0);

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

    const [department, setDepartment] = useState('');
    const [laboratory, setLaboratory] = useState('');
    const [field, setField] = useState('');
    const [studyLevel, setStudyLevel] = useState('');

    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const url = isPublicView ? `/profile/${id}` : '/profile';
                const response = await api.get(url);
                setProfileData(response.data);
                setFirstName(response.data.first_name || '');
                setLastName(response.data.last_name || '');
                const rawBio = response.data.profile?.biography || '';
                setBio(rawBio);
                const bioLines = rawBio.split('\n');
                setHeadline(bioLines[0] || '');
                setAbout(bioLines.slice(1).join('\n').trim());
                setDepartment(response.data.profile?.department || '');
                setLaboratory(response.data.profile?.laboratory || '');
                setField(response.data.profile?.field || '');
                setStudyLevel(response.data.profile?.study_level || '');
                setLocation(response.data.profile?.location || '');
                setPhone(response.data.profile?.phone || '');
                
                const defaultLangs = [
                    { language: "Français", level: "Natif" },
                    { language: "Anglais", level: "Professionnel" },
                    { language: "Arabe", level: "Bilingue" }
                ];
                setLanguages(response.data.profile?.languages || defaultLangs);

                // We will fetch posts dynamically in a dedicated useEffect below

                // Fetch other members consulted
                try {
                    setOtherMembersLoading(true);
                    const networkRes = await api.get('/network');
                    const filtered = networkRes.data.filter(
                        u => u.id !== response.data.id && u.id !== currentUser?.id
                    );
                    setOtherMembers(filtered.slice(0, 5));
                } catch (netErr) {
                    console.error("Error fetching other members:", netErr);
                } finally {
                    setOtherMembersLoading(false);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
                setPostsLoading(false);
            }
        };
        fetchProfile();
    }, [id, isPublicView, currentUser]);

    useEffect(() => {
        if (!profileData?.id) return;
        
        const fetchActivity = async () => {
            setPostsLoading(true);
            try {
                const params = {};
                if (activeActivityTab === 'posts') {
                    params.user_id = profileData.id;
                } else if (activeActivityTab === 'comments') {
                    params.commented_by = profileData.id;
                } else if (activeActivityTab === 'videos') {
                    params.user_id = profileData.id;
                    params.media_type = 'VIDEO';
                } else if (activeActivityTab === 'images') {
                    params.user_id = profileData.id;
                    params.media_type = 'IMAGE';
                } else if (activeActivityTab === 'documents') {
                    params.user_id = profileData.id;
                    params.media_type = 'PDF';
                }
                const response = await api.get('/posts', { params });
                setPosts(response.data);
            } catch (error) {
                console.error("Failed to fetch activity posts", error);
            } finally {
                setPostsLoading(false);
            }
        };
        
        fetchActivity();
    }, [activeActivityTab, profileData?.id]);

    const handleConnect = async () => {
        if (!profileData) return;
        try {
            const response = await api.post(`/network/request/${profileData.id}`);
            setProfileData(prev => ({
                ...prev,
                connection_status: 'PENDING',
                is_sender: true
            }));
            addToast(response.data.message || "Demande de connexion envoyée !", "success");
        } catch (error) {
            console.error("Failed to send network request", error);
            const errMsg = error.response?.data?.message || "Erreur lors de l'envoi de la demande.";
            addToast(errMsg, "error");
        }
    };

    const handleAcceptConnection = async () => {
        if (!profileData) return;
        try {
            const response = await api.post(`/network/accept/${profileData.id}`);
            setProfileData(prev => ({
                ...prev,
                connection_status: 'ACCEPTED',
                connections_count: (prev.connections_count || 0) + 1
            }));
            addToast(response.data.message || "Connexion acceptée !", "success");
        } catch (error) {
            console.error("Failed to accept network request", error);
            const errMsg = error.response?.data?.message || "Erreur lors de l'acceptation de la demande.";
            addToast(errMsg, "error");
        }
    };

    const handleReact = async (postId, reactionType) => {
        if (hoverTimeouts.current[postId]) {
            clearTimeout(hoverTimeouts.current[postId]);
            delete hoverTimeouts.current[postId];
        }
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        const current = userReactions[postId] !== undefined 
            ? userReactions[postId] 
            : (post.user_reaction || null);
        const newType = current === reactionType ? null : reactionType;
        
        setUserReactions(prev => ({ ...prev, [postId]: newType }));
        setReactionMenuOpen(prev => ({ ...prev, [postId]: false }));
        
        try {
            const response = await api.post(`/posts/${postId}/like`, { reaction: newType || 'LIKE' });
            
            // Sync likes array locally so that ReactionsListModal is perfectly updated instantly
            let updatedLikes = [...(post.likes || [])];
            if (newType === null) {
                updatedLikes = updatedLikes.filter(l => l.user_id !== currentUser.id);
            } else {
                const existingIdx = updatedLikes.findIndex(l => l.user_id === currentUser.id);
                if (existingIdx > -1) {
                    updatedLikes[existingIdx] = { ...updatedLikes[existingIdx], type: newType };
                } else {
                    updatedLikes.push({
                        user_id: currentUser.id,
                        type: newType,
                        user: currentUser
                    });
                }
            }
            
            setPosts(posts.map(p => p.id === postId ? { 
                ...p, 
                is_liked: newType !== null, 
                likes_count: response.data.likes_count,
                likes: updatedLikes
            } : p));
        } catch (err) { 
            console.error("Failed to submit reaction", err); 
        }
    };

    const handleShare = async (post, shareComment = '') => {
        try {
            await api.post(`/posts/${post.id}/share`, { share_comment: shareComment });
            addToast(shareComment ? "Publication partagée avec vos pensées !" : "Publication repartagée avec succès !", "success");
            if (profileData?.id) {
                const params = {};
                if (activeActivityTab === 'posts') {
                    params.user_id = profileData.id;
                } else if (activeActivityTab === 'comments') {
                    params.commented_by = profileData.id;
                } else if (activeActivityTab === 'videos') {
                    params.user_id = profileData.id;
                    params.media_type = 'VIDEO';
                } else if (activeActivityTab === 'images') {
                    params.user_id = profileData.id;
                    params.media_type = 'IMAGE';
                } else if (activeActivityTab === 'documents') {
                    params.user_id = profileData.id;
                    params.media_type = 'PDF';
                }
                const response = await api.get('/posts', { params });
                setPosts(response.data);
            }
        } catch (error) {
            console.error("Failed to share post", error);
            addToast("Erreur lors du partage", "error");
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
            
            // Add the post to user's activity posts list if we are viewing our own profile
            if (!isPublicView || profileData?.id === currentUser?.id) {
                setPosts([response.data, ...posts]);
            }
            
            setNewPost({ title: '', content: '', type: 'GENERAL', mediaType: null, files: [], file: null });
            setIsCreateModalOpen(false);
            addToast("Publication créée avec succès !", "success");
        } catch (error) {
            console.error("Failed to create post", error);
            const errMsg = error.response?.data?.message || "Erreur lors de la création de la publication";
            addToast(errMsg, "error");
        } finally {
            setPosting(false);
            setUploadProgress(0);
        }
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
            addToast("Contenu amélioré par l'IA !", "success");
        } catch (error) {
            console.error("Failed to assist post with AI", error);
            addToast("Erreur lors de la génération avec l'IA", "error");
        } finally {
            setAssistingPost(false);
        }
    };

    const handleDeletePost = (postId) => {
        showConfirm("Êtes-vous sûr de vouloir supprimer cette publication ?", async () => {
            try {
                await api.delete(`/posts/${postId}`);
                setPosts(posts.filter(p => p.id !== postId));
                addToast("Publication supprimée", "info");
            } catch (error) {
                console.error(error);
                addToast("Erreur lors de la suppression.", "error");
            }
        });
    };

    const [generatingBio, setGeneratingBio] = useState(false);

    const handleGenerateAiBio = async () => {
        setGeneratingBio(true);
        try {
            const response = await api.post('/profile/ai-bio');
            const rawBio = response.data.biography || '';
            setBio(rawBio);
            setAbout(rawBio);
            addToast(response.data.mock_mode ? "Note: Mode démo (Clé API manquante)" : "Biographie générée !", "success");
        } catch (error) {
            addToast("Erreur lors de la génération", "error");
        } finally {
            setGeneratingBio(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            const combinedBio = `${headline.trim()}\n\n${about.trim()}`.trim();
            const payload = { 
                first_name: firstName,
                last_name: lastName,
                biography: combinedBio,
                department,
                laboratory,
                field,
                study_level: studyLevel,
                location,
                phone,
                languages
            };
            if (isPublicView && currentUser?.role === 'ADMIN') {
                payload.user_id = id;
            }
            await api.post('/profile/update', payload);
            setEditMode(false);
            // Refresh
            const url = isPublicView ? `/profile/${id}` : '/profile';
            const response = await api.get(url);
            setProfileData(response.data);
            setFirstName(response.data.first_name || '');
            setLastName(response.data.last_name || '');
            const rawBio = response.data.profile?.biography || '';
            setBio(rawBio);
            const bioLines = rawBio.split('\n');
            setHeadline(bioLines[0] || '');
            setAbout(bioLines.slice(1).join('\n').trim());
            setDepartment(response.data.profile?.department || '');
            setLaboratory(response.data.profile?.laboratory || '');
            setField(response.data.profile?.field || '');
            setStudyLevel(response.data.profile?.study_level || '');
            setLocation(response.data.profile?.location || '');
            setPhone(response.data.profile?.phone || '');
            
            const defaultLangs = [
                { language: "Français", level: "Natif" },
                { language: "Anglais", level: "Professionnel" },
                { language: "Arabe", level: "Bilingue" }
            ];
            setLanguages(response.data.profile?.languages || defaultLangs);
            
            fetchUser(); // Sync top bar
            addToast("Profil mis à jour !", "success");
        } catch (error) {
            console.error(error);
            addToast("Erreur lors de la mise à jour", "error");
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('first_name', profileData.first_name);
            formData.append('last_name', profileData.last_name);
            if (isPublicView && currentUser?.role === 'ADMIN') {
                formData.append('user_id', id);
            }
            const response = await api.post('/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfileData(prev => ({
                ...prev,
                profile: { ...prev.profile, photo_url: response.data.user.profile.photo_url }
            }));
            fetchUser();
            addToast("Photo mise à jour avec succès !", "success");
        } catch (error) {
            addToast('Erreur lors du téléchargement de la photo', 'error');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append('banner', file);
            formData.append('first_name', profileData.first_name);
            formData.append('last_name', profileData.last_name);
            if (isPublicView && currentUser?.role === 'ADMIN') {
                formData.append('user_id', id);
            }
            const response = await api.post('/profile/update', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfileData(prev => ({
                ...prev,
                profile: { ...prev.profile, website_url: response.data.user.profile.website_url }
            }));
            addToast("Bannière de couverture mise à jour !", "success");
        } catch (error) {
            addToast('Erreur lors du téléchargement de la bannière', 'error');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: skillModalData.name,
                level: skillModalData.level,
                education_id: skillModalData.education_id || null,
                is_autoformation: !!skillModalData.is_autoformation
            };
            if (isPublicView && currentUser?.role === 'ADMIN') {
                payload.user_id = id;
            }
            await api.post('/profile/skills', payload);
            // Refresh profileData
            const url = isPublicView ? `/profile/${id}` : '/profile';
            const profileRes = await api.get(url);
            setProfileData(profileRes.data);
            setShowSkillModal(false);
            addToast("Compétence ajoutée !", "success");
        } catch (error) {
            addToast("Erreur lors de l'ajout", "error");
        }
    };

    const handleRemoveSkill = (skillId) => {
        showConfirm("Êtes-vous sûr de vouloir retirer cette compétence ?", async () => {
            try {
                await api.delete(`/profile/skills/${skillId}`);
                setProfileData({
                    ...profileData,
                    profile: { ...profileData.profile, skills: profileData.profile.skills.filter(s => s.id !== skillId) }
                });
                addToast("Compétence retirée !", "info");
            } catch (error) {
                console.error(error);
            }
        });
    };

    const handleAddExperience = async (e) => {
        e.preventDefault();
        try {
            const serializedDesc = JSON.stringify({
                description: expModalData.description,
                companyIcon: expModalData.companyIcon,
                documentUrl: expModalData.documentUrl
            });
            const payload = {
                title: expModalData.title,
                organization: expModalData.organization,
                location: expModalData.location,
                start_date: expModalData.start_date,
                end_date: expModalData.end_date || null,
                type: expModalData.type,
                duration: expModalData.duration,
                description: serializedDesc
            };
            if (isPublicView && currentUser?.role === 'ADMIN') {
                payload.user_id = id;
            }
            const response = await api.post('/profile/experiences', payload);
            setProfileData({
                ...profileData,
                profile: { ...profileData.profile, experiences: [...(profileData.profile?.experiences || []), response.data] }
            });
            setShowExpModal(false);
            addToast("Expérience ajoutée !", "success");
        } catch (error) {
            addToast("Erreur lors de l'ajout de l'expérience", "error");
        }
    };

    const handleRemoveExperience = (expId) => {
        showConfirm("Êtes-vous sûr de vouloir supprimer cette expérience ?", async () => {
            try {
                await api.delete(`/profile/experiences/${expId}`);
                setProfileData({
                    ...profileData,
                    profile: { ...profileData.profile, experiences: profileData.profile.experiences.filter(e => e.id !== expId) }
                });
                addToast("Expérience supprimée !", "info");
            } catch (error) {
                console.error(error);
            }
        });
    };

    const handleUpdateExperience = async (e) => {
        e.preventDefault();
        try {
            const serializedDesc = JSON.stringify({
                description: expModalData.description,
                companyIcon: expModalData.companyIcon,
                documentUrl: expModalData.documentUrl
            });
            const payload = {
                title: expModalData.title,
                organization: expModalData.organization,
                location: expModalData.location,
                start_date: expModalData.start_date,
                end_date: expModalData.end_date || null,
                type: expModalData.type,
                duration: expModalData.duration,
                description: serializedDesc
            };
            const response = await api.patch(`/profile/experiences/${expModalData.id}`, payload);
            setProfileData({
                ...profileData,
                profile: { 
                    ...profileData.profile, 
                    experiences: profileData.profile.experiences.map(exp => exp.id === expModalData.id ? response.data : exp) 
                }
            });
            setShowExpModal(false);
            addToast("Expérience modifiée !", "success");
        } catch (error) {
            addToast("Erreur lors de la modification", "error");
        }
    };

    const handleAddCertification = async (e) => {
        e.preventDefault();
        if (!certModalData.certImage) {
            addToast("L'aperçu du certificat (Image ou PDF) est obligatoire !", "error");
            return;
        }
        try {
            const serializedDesc = JSON.stringify({
                description: certModalData.description,
                orgIcon: certModalData.orgIcon,
                certImage: certModalData.certImage
            });
            const payload = {
                title: certModalData.title,
                organization: certModalData.organization,
                issue_date: certModalData.issue_date || null,
                expiry_date: certModalData.expiry_date || null,
                credential_url: certModalData.credential_url || null,
                credential_id: certModalData.credential_id || null,
                description: serializedDesc
            };
            if (isPublicView && currentUser?.role === 'ADMIN') {
                payload.user_id = id;
            }
            const response = await api.post('/profile/certifications', payload);
            setProfileData({
                ...profileData,
                profile: { ...profileData.profile, certifications: [...(profileData.profile?.certifications || []), response.data] }
            });
            setShowCertModal(false);
            addToast("Certification ajoutée !", "success");
        } catch (error) {
            addToast("Erreur lors de l'ajout de la certification", "error");
        }
    };

    const handleUpdateCertification = async (e) => {
        e.preventDefault();
        if (!certModalData.certImage) {
            addToast("L'aperçu du certificat (Image ou PDF) est obligatoire !", "error");
            return;
        }
        try {
            const serializedDesc = JSON.stringify({
                description: certModalData.description,
                orgIcon: certModalData.orgIcon,
                certImage: certModalData.certImage
            });
            const payload = {
                title: certModalData.title,
                organization: certModalData.organization,
                issue_date: certModalData.issue_date || null,
                expiry_date: certModalData.expiry_date || null,
                credential_url: certModalData.credential_url || null,
                credential_id: certModalData.credential_id || null,
                description: serializedDesc
            };
            const response = await api.patch(`/profile/certifications/${certModalData.id}`, payload);
            setProfileData({
                ...profileData,
                profile: { 
                    ...profileData.profile, 
                    certifications: profileData.profile.certifications.map(c => c.id === certModalData.id ? response.data : c) 
                }
            });
            setShowCertModal(false);
            addToast("Certification modifiée !", "success");
        } catch (error) {
            addToast("Erreur lors de la modification", "error");
        }
    };

    const handleRemoveCertification = (certId) => {
        showConfirm("Êtes-vous sûr de vouloir supprimer cette certification ?", async () => {
            try {
                await api.delete(`/profile/certifications/${certId}`);
                setProfileData({
                    ...profileData,
                    profile: { ...profileData.profile, certifications: profileData.profile.certifications.filter(c => c.id !== certId) }
                });
                addToast("Certification supprimée !", "info");
            } catch (error) {
                console.error(error);
            }
        });
    };

    const handleSaveEducation = async (e) => {
        e.preventDefault();
        try {
            const serializedDesc = JSON.stringify({
                description: eduModalData.description,
                documentUrl: eduModalData.documentUrl
            });
            const payload = {
                school: eduModalData.school,
                degree: eduModalData.degree,
                field_of_study: eduModalData.field_of_study || '',
                city: eduModalData.city || '',
                start_date: eduModalData.start_date,
                end_date: eduModalData.end_date || null,
                description: serializedDesc
            };
            if (isPublicView && currentUser?.role === 'ADMIN') {
                payload.user_id = id;
            }
            if (eduModalData.id) {
                await api.patch(`/profile/educations/${eduModalData.id}`, payload);
                addToast("Éducation modifiée !", "success");
            } else {
                await api.post('/profile/educations', payload);
                addToast("Éducation ajoutée !", "success");
            }

            // Refresh profileData
            const url = isPublicView ? `/profile/${id}` : '/profile';
            const profileRes = await api.get(url);
            setProfileData(profileRes.data);
            setShowEduModal(false);
            fetchUser();
        } catch (error) {
            console.error(error);
            addToast("Erreur lors de l'enregistrement", "error");
        }
    };

    const handleRemoveEducation = (eduId) => {
        showConfirm("Êtes-vous sûr de vouloir supprimer cette formation ?", async () => {
            try {
                await api.delete(`/profile/educations/${eduId}`);
                setProfileData({
                    ...profileData,
                    profile: { 
                        ...profileData.profile, 
                        educations: (profileData.profile?.educations || []).filter(e => e.id !== eduId) 
                    }
                });
                addToast("Éducation supprimée !", "info");
            } catch (error) {
                console.error(error);
                addToast("Erreur lors de la suppression", "error");
            }
        });
    };

    const handleOpenAddEdu = () => {
        setEduModalData({
            id: null,
            school: '',
            degree: '',
            field_of_study: '',
            city: '',
            start_date: '',
            end_date: '',
            description: '',
            documentUrl: ''
        });
        setShowEduModal(true);
    };

    const handleOpenEditEdu = (edu) => {
        const parsed = parseExpDescription(edu.description);
        setEduModalData({
            id: edu.id,
            school: edu.school,
            degree: edu.degree,
            field_of_study: edu.field_of_study || '',
            city: edu.city || '',
            start_date: edu.start_date ? edu.start_date.substring(0, 10) : '',
            end_date: edu.end_date ? edu.end_date.substring(0, 10) : '',
            description: parsed.description || '',
            documentUrl: parsed.documentUrl || ''
        });
        setShowEduModal(true);
    };

    const handleOpenEditExp = (exp) => {
        const parsed = parseExpDescription(exp.description);
        setExpModalData({
            id: exp.id,
            title: exp.title,
            organization: exp.organization,
            location: exp.location || '',
            start_date: exp.start_date,
            end_date: exp.end_date || '',
            type: exp.type,
            duration: exp.duration || '',
            description: parsed.description,
            companyIcon: parsed.companyIcon,
            documentUrl: parsed.documentUrl
        });
        setShowExpModal(true);
    };

    const handleOpenAddExp = () => {
        setExpModalData({
            id: null,
            title: '',
            organization: '',
            location: '',
            start_date: '',
            end_date: '',
            type: 'INTERNSHIP',
            duration: '',
            description: '',
            companyIcon: '',
            documentUrl: ''
        });
        setShowExpModal(true);
    };

    const handleOpenEditCert = (cert) => {
        const parsed = parseCertDescription(cert.description);
        setCertModalData({
            id: cert.id,
            title: cert.title,
            organization: cert.issuing_organization,
            issue_date: cert.issue_date || '',
            expiry_date: cert.expiry_date || '',
            credential_id: cert.credential_id || '',
            credential_url: cert.credential_url || '',
            orgIcon: parsed.orgIcon,
            certImage: parsed.certImage,
            description: parsed.description
        });
        setShowCertModal(true);
    };

    const handleOpenAddCert = () => {
        setCertModalData({
            id: null,
            title: '',
            organization: '',
            issue_date: '',
            expiry_date: '',
            credential_id: '',
            credential_url: '',
            orgIcon: '',
            certImage: '',
            description: ''
        });
        setShowCertModal(true);
    };

    const handleOpenAddSkill = () => {
        setSkillModalData({
            id: null,
            name: '',
            level: 'INTERMEDIATE',
            education_id: '',
            is_autoformation: true
        });
        setShowSkillModal(true);
    };

    if (loading) return <BrandLoader />;

    if (!profileData) return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col pt-20 items-center">
            <Navbar />
            <div className="bg-white border border-black/5 rounded-[20px] p-10 text-center max-w-sm shadow-apple-md">
                <span className="material-symbols-outlined text-[48px] text-gray-300 mb-4">person_off</span>
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">Profil Introuvable</h3>
                <p className="text-xs text-[#6e6e73] font-medium mb-6">Désolé, nous ne parvenons pas à charger ce profil.</p>
                <Link to="/feed" className="inline-flex items-center justify-center h-[38px] px-6 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold press-effect">Retour à l'accueil</Link>
            </div>
        </div>
    );

    const experiences = profileData?.profile?.experiences || [];
    const latestExp = experiences.length > 0 ? experiences[experiences.length - 1] : null;
    const parsedLatestExp = latestExp ? parseExpDescription(latestExp.description) : null;

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CO';
    };
    const getDynamicGradient = (name) => {
        const code = name ? name.charCodeAt(0) : 65;
        const h = (code * 17) % 360;
        return `linear-gradient(135deg, hsl(${h}, 70%, 55%) 0%, hsl(${(h + 60) % 360}, 60%, 45%) 100%)`;
    };

    return (
        <div className="min-h-screen bg-[#f4f2ee] pb-20">
            <Navbar />

            {/* Apple Cover banner */}
            <div className="h-[240px] bg-[#f5f5f7] relative overflow-hidden">
                {profileData.profile?.website_url && !bannerError ? (
                    <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${profileData.profile.website_url}`} 
                        className="w-full h-full object-cover" 
                        alt="Bannière de couverture" 
                        onError={() => setBannerError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#0071e3] to-[#af52de] opacity-80 flex items-center justify-center relative">
                        <img 
                            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" 
                            className="w-full h-full object-cover opacity-15 pointer-events-none absolute inset-0" 
                            alt="" 
                        />
                    </div>
                )}

                {uploadingBanner && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-[30px] h-[30px] border-3 border-[#e5e5ea] border-t-[#0071e3] rounded-full animate-spin" />
                    </div>
                )}

                {canEdit && (
                    <label className="absolute bottom-4 right-4 h-9 px-4 bg-white/80 hover:bg-white text-[#1d1d1f] rounded-full shadow-apple-md flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md press-effect z-20">
                        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                        <span className="text-xs font-semibold">Modifier la bannière</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                    </label>
                )}

                {isPublicView && (
                    <div className="max-w-[1000px] mx-auto px-6 pt-6 relative z-10">
                        <Link to="/network" className="inline-flex items-center gap-1 text-white bg-black/25 hover:bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md transition-all press-effect text-xs font-bold shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Retour au réseau
                        </Link>
                    </div>
                )}
            </div>
            
            {/* LIGHTBOX MODAL: POST REACTIONS */}
            {showReactionsModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-[24px] shadow-apple-lg border border-black/5 w-full max-w-sm p-6 animate-scaleUp">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight">Réactions</h3>
                                <p className="text-[10px] font-bold text-[#0071e3] uppercase mt-0.5">{selectedPostReactions.length} personne(s)</p>
                            </div>
                            <button 
                                onClick={() => setShowReactionsModal(false)} 
                                className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                            {selectedPostReactions.map((like, index) => {
                                const user = like.user;
                                if (!user) return null;
                                const reactionEmoji = ['👍', '❤️', '👏', '💡'][index % 4];
                                
                                return (
                                    <div key={like.id || index} className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-[#f5f5f7] overflow-hidden flex-shrink-0 relative">
                                            {user.profile?.photo_url ? (
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${user.profile.photo_url}`} 
                                                    className="w-full h-full object-cover" 
                                                    alt="" 
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                                                    {user.first_name[0]}{user.last_name[0]}
                                                </div>
                                            )}
                                            {/* Mini reaction badge */}
                                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-white rounded-full flex items-center justify-center text-[9px] shadow-sm border border-black/5">
                                                {reactionEmoji}
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-0 text-left">
                                            <h4 className="text-xs font-bold text-[#1d1d1f] truncate leading-tight">
                                                {user.first_name} {user.last_name}
                                            </h4>
                                            <p className="text-[10px] text-[#86868b] truncate leading-tight mt-0.5">
                                                {user.profile?.biography?.split('\n')[0] || user.role}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {selectedPostReactions.length === 0 && (
                                <p className="text-xs text-gray-400 italic py-6 text-center">Aucune réaction pour le moment.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="max-w-[1128px] mx-auto px-4 lg:px-6 -mt-[80px] relative z-10">
                <div className="flex gap-5 items-start">
                    
                    {/* Left Column - Main profile details */}
                    <div className="space-y-4 min-w-0 flex-grow">
                        
                        {/* Profile Main Info Card */}
                        <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-apple-md overflow-visible animate-fadeInUp">
                    {/* Circle Avatar Overlap row */}
                    <div className="flex justify-between items-end mb-4 relative">
                        <div className="relative group -mt-[90px]">
                            <div className="h-[140px] w-[140px] rounded-full bg-white p-[3px] shadow-apple-lg overflow-hidden relative border-4 border-white">
                                {profileData.profile?.photo_url && !photoError ? (
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${profileData.profile.photo_url}`} 
                                        alt="" 
                                        className="h-full w-full object-cover rounded-full"
                                        onError={() => setPhotoError(true)}
                                    />
                                ) : (
                                    <div className="h-full w-full bg-[#f5f5f7] flex items-center justify-center text-4xl rounded-full text-[#86868b] uppercase font-bold">
                                        {profileData.first_name?.[0]}{profileData.last_name?.[0]}
                                    </div>
                                )}
                                {uploadingPhoto && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-full">
                                        <div className="w-[24px] h-[24px] border-2 border-[#e5e5ea] border-t-[#0071e3] rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            {canEdit && (
                                <label className="absolute bottom-1 right-1 h-9 w-9 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full shadow-apple-md flex items-center justify-center transition-all cursor-pointer press-effect">
                                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                            )}
                        </div>

                        {/* Top-Right Pencil Edit buttons */}
                        {canEdit && (
                            <div className="flex gap-2">
                                {!editMode ? (
                                    <button 
                                        onClick={() => setEditMode(true)} 
                                        className="h-[36px] w-[36px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] flex items-center justify-center transition-all press-effect shadow-sm"
                                        title="Modifier le profil"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                    </button>
                                ) : (
                                    <div className="flex gap-1.5">
                                        <button onClick={handleUpdateProfile} className="h-[32px] px-3.5 rounded-full bg-[#34c759] hover:bg-[#28b248] text-white text-[11px] font-bold transition-all press-effect shadow-sm">
                                            Sauver
                                        </button>
                                        <button onClick={() => setEditMode(false)} className="h-[32px] px-3.5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-[11px] font-bold transition-all press-effect shadow-sm">
                                            Fermer
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* LinkedIn Two Column Content Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-left mt-3">
                        
                        {/* Left/Center Details (2/3 width) */}
                        <div className="md:col-span-2 space-y-3">
                            {editMode ? (
                                <div className="space-y-3.5 animate-fadeInUp text-left">
                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div className="relative">
                                            <input 
                                                id="first_name_input"
                                                className="peer w-full h-[52px] px-3.5 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white border border-transparent focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 rounded-[12px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-sm" 
                                                value={firstName} 
                                                onChange={e => setFirstName(e.target.value)} 
                                                placeholder=" " 
                                            />
                                            <label htmlFor="first_name_input" className="absolute left-3.5 top-1.5 text-[8px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Prénom</label>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                id="last_name_input"
                                                className="peer w-full h-[52px] px-3.5 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white border border-transparent focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 rounded-[12px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-sm" 
                                                value={lastName} 
                                                onChange={e => setLastName(e.target.value)} 
                                                placeholder=" " 
                                            />
                                            <label htmlFor="last_name_input" className="absolute left-3.5 top-1.5 text-[8px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Nom</label>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            id="headline_input"
                                            className="peer w-full h-[52px] px-3.5 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white border border-transparent focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 rounded-[12px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-sm" 
                                            value={headline} 
                                            onChange={e => setHeadline(e.target.value)} 
                                            placeholder=" " 
                                        />
                                        <label htmlFor="headline_input" className="absolute left-3.5 top-1.5 text-[8px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Titre professionnel / Titre (Headline)</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div className="relative">
                                            <input 
                                                id="location_input"
                                                className="peer w-full h-[52px] px-3.5 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white border border-transparent focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 rounded-[12px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-sm" 
                                                value={location} 
                                                onChange={e => setLocation(e.target.value)} 
                                                placeholder=" " 
                                            />
                                            <label htmlFor="location_input" className="absolute left-3.5 top-1.5 text-[8px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Localisation</label>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                id="phone_input"
                                                className="peer w-full h-[52px] px-3.5 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white border border-transparent focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15 rounded-[12px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-sm" 
                                                value={phone} 
                                                onChange={e => setPhone(e.target.value)} 
                                                placeholder=" " 
                                            />
                                            <label htmlFor="phone_input" className="absolute left-3.5 top-1.5 text-[8px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Téléphone</label>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-[24px] font-bold text-[#1d1d1f] tracking-tight flex items-center gap-1.5">
                                            {profileData.first_name} {profileData.last_name}
                                            <span className="material-symbols-outlined text-[#0071e3] text-[20px] fill-1" title="Profil vérifié Scholar">verified</span>
                                        </h1>
                                        <span className="apple-badge apple-badge-blue">
                                            {profileData.role === 'STUDENT' ? 'Étudiant' : profileData.role === 'TEACHER' ? 'Enseignant' : 'Chercheur'}
                                        </span>
                                    </div>

                                    <p className="text-[14px] font-medium text-[#1d1d1f] leading-relaxed">
                                        {profileData.profile?.biography?.split('\n')[0] || 'Engineering Student at IGA | Full Stack & AI Developer | Web Projects & Automation'}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-[#86868b] font-semibold">
                                        <span className="text-[#6e6e73]">{profileData.profile?.location || 'Casablanca, Maroc'}</span>
                                        <span className="text-gray-300">•</span>
                                        <button 
                                            onClick={() => setShowContactModal(true)} 
                                            className="text-[#0071e3] hover:underline font-bold"
                                        >
                                            Contact info
                                        </button>
                                    </div>
                                </>
                            )}

                            <div 
                                onClick={handleOpenConnections}
                                className="text-xs font-bold text-[#0071e3] hover:underline cursor-pointer block mt-1 text-left"
                            >
                                {profileData.connections_count !== undefined ? `${profileData.connections_count} relation(s)` : '0 relation'}
                            </div>

                            {/* Dynamic Mutual Connections Row */}
                            {profileData.mutual_connections && profileData.mutual_connections.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 bg-[#f5f5f7] border border-black/5 rounded-[12px] p-2.5 animate-fadeIn max-w-sm">
                                    <div className="flex -space-x-1.5 flex-shrink-0">
                                        {profileData.mutual_connections.slice(0, 3).map(mu => (
                                            <div key={mu.id} className="h-5 w-5 rounded-full border border-white bg-slate-100 overflow-hidden shadow-sm flex-shrink-0">
                                                {mu.profile?.photo_url ? (
                                                    <img 
                                                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${mu.profile.photo_url}`} 
                                                        className="object-cover h-full w-full" 
                                                        alt="" 
                                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} 
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-[7px] font-bold uppercase text-gray-500 bg-gray-200">
                                                        {mu.first_name[0]}{mu.last_name[0]}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-[10px] text-[#6e6e73] font-semibold leading-tight text-left">
                                        Partagé par <span className="text-[#1d1d1f] font-bold">{profileData.mutual_connections[0].first_name} {profileData.mutual_connections[0].last_name}</span>
                                        {profileData.mutual_count > 1 ? ` et ${profileData.mutual_count - 1} autre(s) relation(s) commune(s)` : ' (relation commune)'}
                                    </div>
                                </div>
                            )}

                            {/* LinkedIn Pill Action Row */}
                            <div className="flex flex-wrap gap-2 pt-3">
                                {!isPublicView ? (
                                    <>
                                        <button className="h-[36px] px-5 rounded-full border border-black/10 text-gray-600 hover:bg-[#f5f5f7] text-[13px] font-bold transition-all press-effect">
                                            Améliorer le profil
                                        </button>
                                        <button className="h-[36px] w-[36px] rounded-full border border-black/10 text-gray-600 hover:bg-[#f5f5f7] flex items-center justify-center transition-all press-effect">
                                            <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {(profileData.connection_status === 'NONE' || !profileData.connection_status) && (
                                            <button 
                                                onClick={handleConnect}
                                                className="h-[36px] px-5 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] text-[13px] font-bold flex items-center gap-1.5 transition-all press-effect border border-transparent shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">person_add</span>
                                                Ajouter
                                            </button>
                                        )}
                                        {profileData.connection_status === 'PENDING' && profileData.is_sender && (
                                            <button 
                                                className="h-[36px] px-5 rounded-full border border-amber-500/30 bg-amber-500/[0.04] text-amber-600 hover:bg-amber-500/[0.08] text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-default"
                                            >
                                                <span className="material-symbols-outlined text-[18px] text-amber-500">pending</span>
                                                En attente
                                            </button>
                                        )}
                                        {profileData.connection_status === 'PENDING' && !profileData.is_sender && (
                                            <button 
                                                onClick={handleAcceptConnection}
                                                className="h-[36px] px-5 rounded-full bg-[#34c759] text-white hover:bg-[#30b652] text-[13px] font-bold flex items-center gap-1.5 transition-all press-effect border border-transparent shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                                Accepter l'invitation
                                            </button>
                                        )}
                                        {profileData.connection_status === 'ACCEPTED' && (
                                            <button 
                                                className="h-[36px] px-5 rounded-full border border-[#34c759]/30 bg-[#34c759]/[0.04] text-[#34c759] hover:bg-[#34c759]/[0.08] text-[13px] font-bold flex items-center gap-1.5 transition-all cursor-default"
                                            >
                                                <span className="material-symbols-outlined text-[18px] text-[#34c759]">check_circle</span>
                                                Amis
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Column Institutions (1/3 width, hidden on mobile) */}
                        <div className="hidden md:flex flex-col gap-3.5 pl-4 border-l border-black/5 self-stretch justify-start min-w-0 flex-shrink-0 w-[240px]">
                            {/* Latest Experience Badge */}
                            {latestExp && (
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="h-8 w-8 rounded-[4px] border border-black/10 overflow-hidden flex-shrink-0 bg-[#f5f5f7] flex items-center justify-center">
                                        {parsedLatestExp?.companyIcon ? (
                                            <img src={parsedLatestExp.companyIcon} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: getDynamicGradient(latestExp.organization) }}>
                                                {getInitials(latestExp.organization)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <h4 className="text-[12px] font-bold text-[#1d1d1f] hover:text-[#0071e3] cursor-pointer truncate leading-tight">
                                            {latestExp.organization}
                                        </h4>
                                        <p className="text-[10px] text-[#86868b] font-medium truncate leading-none mt-0.5">{latestExp.title}</p>
                                    </div>
                                </div>
                            )}

                            {/* Institution Badge */}
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-8 w-8 rounded-[4px] border border-black/10 bg-[#e8f0fe] flex-shrink-0 flex items-center justify-center font-bold text-[#0071e3] text-[10px] shadow-sm select-none">
                                    IGA
                                </div>
                                <div className="text-left min-w-0">
                                    <h4 className="text-[12px] font-bold text-[#1d1d1f] hover:text-[#0071e3] cursor-pointer truncate leading-tight">
                                        {profileData.profile?.institution || 'IGA - Institut supérieur du Génie Appliqué'}
                                    </h4>
                                    <p className="text-[10px] text-[#86868b] font-medium truncate leading-none mt-0.5">
                                        {profileData.profile?.field || (profileData.role === 'STUDENT' ? 'Filière Génie Appliqué' : 'Corps Enseignant')}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                    {/* ABOUT / À PROPOS CARD (Separate card like LinkedIn) */}
                    <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-apple-md animate-fadeInUp">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-[#1d1d1f] text-[15px] uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0071e3] text-[22px]">info</span>
                                À propos
                            </h3>
                        </div>
                        {editMode ? (
                            <div className="space-y-4 animate-fadeInUp">
                                <div className="grid grid-cols-2 gap-4">
                                    {profileData.role === 'STUDENT' ? (
                                        <>
                                            <div className="relative">
                                                <input 
                                                    id="field"
                                                    className="peer w-full h-[52px] px-4 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/15 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f]" 
                                                    value={field} 
                                                    onChange={e => setField(e.target.value)} 
                                                    placeholder=" " 
                                                />
                                                <label htmlFor="field" className="absolute left-4 top-1.5 text-[9px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Filière</label>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    id="study_level"
                                                    className="peer w-full h-[52px] px-4 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/15 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f]" 
                                                    value={studyLevel} 
                                                    onChange={e => setStudyLevel(e.target.value)} 
                                                    placeholder=" " 
                                                />
                                                <label htmlFor="study_level" className="absolute left-4 top-1.5 text-[9px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Niveau d'études</label>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <input 
                                                    id="department"
                                                    className="peer w-full h-[52px] px-4 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/15 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f]" 
                                                    value={department} 
                                                    onChange={e => setDepartment(e.target.value)} 
                                                    placeholder=" " 
                                                />
                                                <label htmlFor="department" className="absolute left-4 top-1.5 text-[9px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Département</label>
                                            </div>
                                            <div className="relative">
                                                <input 
                                                    id="laboratory"
                                                    className="peer w-full h-[52px] px-4 pt-5 pb-1 bg-[#f5f5f7] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/15 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f]" 
                                                    value={laboratory} 
                                                    onChange={e => setLaboratory(e.target.value)} 
                                                    placeholder=" " 
                                                />
                                                <label htmlFor="laboratory" className="absolute left-4 top-1.5 text-[9px] font-bold text-[#86868b] uppercase peer-placeholder-shown:top-[18px] peer-placeholder-shown:text-xs peer-placeholder-shown:text-gray-400 peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-[#0071e3] peer-focus:font-bold transition-all pointer-events-none">Laboratoire</label>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1 ml-0.5">
                                        <label className="block text-[10px] font-bold text-[#86868b] uppercase">Biographie</label>
                                        <button 
                                            type="button"
                                            onClick={handleGenerateAiBio}
                                            disabled={generatingBio}
                                            className="flex items-center gap-1 px-3 py-1 bg-[#e8f0fe] text-[#0071e3] hover:bg-[#c8e2ff] rounded-full text-[10px] font-bold transition-all press-effect"
                                        >
                                            {generatingBio ? (
                                                <div className="w-3 h-3 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                                            )}
                                            <span>{generatingBio ? 'Génération...' : 'Générer avec l\'IA ✨'}</span>
                                        </button>
                                    </div>
                                    <textarea 
                                        className="w-full bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/15 rounded-[14px] p-3.5 text-sm outline-none transition-all duration-200 resize-none min-h-[110px]"
                                        value={about}
                                        onChange={(e) => setAbout(e.target.value)}
                                        placeholder="Décrivez votre parcours académique..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-[#1d1d1f] text-[14px] leading-relaxed whitespace-pre-wrap font-normal">
                                {(() => {
                                    const rawBio = profileData.profile?.biography || '';
                                    const bioLines = rawBio.split('\n');
                                    const rest = bioLines.slice(1).join('\n').trim();
                                    return rest || "Aucune description détaillée n'a été rédigée.";
                                })()}
                            </p>
                        )}
                    </div>

                {/* ACTIVITY / PUBLICATIONS SECTION (LinkedIn-Style Centerpiece) */}
                <div className="bg-white rounded-[24px] border border-black/5 p-6 shadow-apple-md animate-fadeInUp">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-[#1d1d1f] text-[15px] uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0071e3] text-[22px]">send</span>
                            Activité
                        </h3>
                        {canEdit && (
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center justify-center h-[28px] px-3 rounded-full border border-black/10 hover:bg-[#f5f5f7] text-[#1d1d1f] text-xs font-bold press-effect bg-transparent cursor-pointer"
                            >
                                Créer un post
                            </button>
                        )}
                    </div>
                    
                    <p className="text-[11px] font-bold text-[#0071e3] mb-4">
                        {posts.length} publication{posts.length > 1 ? 's' : ''} au total
                    </p>

                    {/* LinkedIn Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-black/5 scrollbar-thin">
                        {[
                            { key: 'posts', label: 'Publications' },
                            { key: 'comments', label: 'Commentaires' },
                            { key: 'videos', label: 'Vidéos' },
                            { key: 'images', label: 'Images' },
                            { key: 'documents', label: 'Documents' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveActivityTab(tab.key)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all press-effect whitespace-nowrap ${
                                    activeActivityTab === tab.key 
                                        ? 'bg-[#0071e3] text-white shadow-apple-sm' 
                                        : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#ebebeb]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filtered Posts List */}
                    <div className="space-y-4">
                        {postsLoading ? (
                            <div className="py-12 flex justify-center">
                                <div className="w-[30px] h-[30px] border-2 border-[#e5e5ea] border-t-[#0071e3] rounded-full animate-spin" />
                            </div>
                        ) : posts.length > 0 ? (
                            posts.slice(0, 6).map((post) => {
                                const isOwner = post.author_id === currentUser?.id;
                                const currentReaction = userReactions[post.id] !== undefined ? userReactions[post.id] : post.user_reaction;
                                const reactionInfo = currentReaction ? REACTIONS.find(r => r.type === currentReaction) : null;
                                const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                
                                const authorName = `${post.author?.first_name || ''} ${post.author?.last_name || ''}`;
                                const authorPhoto = post.author?.profile?.photo_url;
                                const authorBio = post.author?.profile?.biography?.split('\n')[0] || post.author?.role || 'Membre académique';
                                
                                return (
                                    <div 
                                        key={post.id} 
                                        id={`post-${post.id}`}
                                        className="bg-white border border-[#dad8d6] rounded-[8px] mb-2.5 overflow-hidden text-left anim-up" 
                                    >
                                        {/* Header */}
                                        <div className="flex items-start gap-3 pt-3 px-4 pb-2">
                                            <div className="w-[48px] h-[48px] rounded-full overflow-hidden bg-[#e8e8ed] flex-shrink-0 flex items-center justify-center border border-black/5">
                                                {authorPhoto ? (
                                                    <img src={`${STORAGE}/storage/${authorPhoto}`} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} />
                                                ) : (
                                                    <span className="text-sm font-bold text-[#86868b]">
                                                        {authorName ? authorName.split(' ').map(n => n[0]).join('').toUpperCase() : 'CO'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link to={`/profile/${post.author_id}`} className="text-[14px] font-semibold text-black/90 hover:text-[#0a66c2] hover:underline leading-snug">
                                                        {authorName}
                                                    </Link>
                                                    {isOwner ? (
                                                        <span className="text-[11px] text-black/45 font-medium flex items-center gap-1">• Vous</span>
                                                    ) : (
                                                        <span className="text-[11px] text-black/45 font-medium flex items-center gap-1">• 1er</span>
                                                    )}
                                                </div>
                                                <p className="text-[12px] text-black/60 truncate mt-0.5 font-normal leading-normal">
                                                    {authorBio}
                                                </p>
                                                <p className="text-[11px] text-black/45 mt-0.5 flex items-center gap-1 font-medium leading-none">
                                                    <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>
                                                    <span>•</span>
                                                    <span className="material-symbols-outlined text-[12px] text-black/40 leading-none">public</span>
                                                </p>
                                            </div>
                                            
                                            {(isOwner || currentUser?.role === 'ADMIN') && (
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
                                        {expandedComments[post.id] && (
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
                        ) : (
                            <p className="text-xs text-gray-400 italic py-6 text-center">Aucune publication dans cette catégorie.</p>
                        )}
                    </div>
                </div>

                {/* EXPERIENCES CARD (LinkedIn Stacked Layout) */}
                <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-md p-6 animate-fadeInUp">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#1d1d1f] text-[15px] uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0071e3] text-[22px]">work</span>
                            Expériences
                        </h3>
                        {canEdit && (
                            <button 
                                onClick={handleOpenAddExp} 
                                className="w-[32px] h-[32px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-[#1d1d1f] transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-6 divide-y divide-black/5">
                        {(() => {
                            const allGroups = groupExperiencesByOrg(profileData.profile?.experiences || []);
                            const visibleGroups = showAllExperiences ? allGroups : allGroups.slice(0, 2);
                            return visibleGroups.map((group, idx) => {
                                const hasMultipleRoles = group.roles.length > 1;
                            
                            if (!hasMultipleRoles) {
                                // RENDER SINGLE ROLE (Just as before, maintaining its beautiful original look!)
                                const exp = group.roles[0];
                                const parsed = parseExpDescription(exp.description);
                                return (
                                    <div key={exp.id} className={`flex gap-4 items-start ${idx > 0 ? 'pt-6' : ''} group/exp`}>
                                        {/* Company Icon Column */}
                                        <div className="h-12 w-12 rounded-[8px] overflow-hidden border border-black/10 flex-shrink-0 bg-[#f5f5f7] flex items-center justify-center">
                                            {group.logo ? (
                                                <img src={group.logo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[26px] text-gray-400">domain</span>
                                            )}
                                        </div>

                                        {/* Experience Text Column */}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h4 className="font-bold text-[15px] text-[#1d1d1f] leading-snug">{exp.title}</h4>
                                                    <p className="text-[13px] font-semibold text-[#6e6e73] mt-0.5">
                                                        {exp.organization} • <span className="text-gray-400 font-medium">{exp.type}</span>
                                                    </p>
                                                </div>
                                                
                                                {canEdit && (
                                                    <div className="flex gap-1.5 opacity-0 group-hover/exp:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleOpenEditExp(exp)} 
                                                            className="p-1 text-gray-400 hover:text-[#0071e3] transition-colors press-effect"
                                                        >
                                                            <span className="material-symbols-outlined text-[17px]">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRemoveExperience(exp.id)} 
                                                            className="p-1 text-gray-400 hover:text-[#ff3b30] transition-colors press-effect"
                                                        >
                                                            <span className="material-symbols-outlined text-[17px]">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#86868b] font-semibold mt-1">
                                                <span>
                                                    {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} – {
                                                        exp.end_date 
                                                            ? new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) 
                                                            : 'Présent'
                                                    }
                                                </span>
                                                {exp.duration && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-[#0071e3]">{exp.duration}</span>
                                                    </>
                                                )}
                                                {exp.location && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{exp.location}</span>
                                                    </>
                                                )}
                                            </div>

                                            {parsed.description && (
                                                <p className="mt-2.5 text-xs text-[#6e6e73] leading-relaxed max-w-2xl font-normal whitespace-pre-wrap">
                                                    {parsed.description}
                                                </p>
                                            )}

                                            {/* Clickable Justificatory Document or Image Preview */}
                                            {parsed.documentUrl && (
                                                parsed.documentUrl.startsWith('data:application/pdf') ? (
                                                    // PDF Badge
                                                    <div 
                                                        onClick={() => openBase64InNewTab(parsed.documentUrl)}
                                                        className="mt-3 max-w-[340px] bg-[#f5f5f7] border border-black/5 hover:border-black/10 rounded-[12px] p-3 shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 group/doc overflow-hidden cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-[8px] bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 border border-red-100 shadow-sm overflow-hidden">
                                                                <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                                                            </div>
                                                            <div className="text-left min-w-0 flex-grow">
                                                                <h5 className="text-[12px] font-bold text-[#1d1d1f] group-hover/doc:text-[#0071e3] transition-colors truncate">
                                                                    Justificatif - {exp.organization}
                                                                </h5>
                                                                <p className="text-[10px] text-[#86868b] font-medium mt-0.5 uppercase tracking-wider flex items-center gap-1">
                                                                    <span>PDF</span>
                                                                    <span>•</span>
                                                                    <span className="text-[#34c759] font-bold flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
                                                                        Vérifié
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <span className="material-symbols-outlined text-gray-400 text-[16px] group-hover/doc:translate-x-0.5 transition-transform flex-shrink-0">
                                                                open_in_new
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Image Visual Thumbnail Card
                                                    <div className="mt-3 text-left animate-fadeInUp">
                                                        <div 
                                                            onClick={() => openBase64InNewTab(parsed.documentUrl)}
                                                            className="group/img-preview relative inline-block rounded-[12px] overflow-hidden border border-black/10 cursor-pointer shadow-apple-xs hover:shadow-apple-md hover:scale-[1.01] transition-all duration-200 bg-white"
                                                        >
                                                            <img 
                                                                src={parsed.documentUrl} 
                                                                className="h-[140px] max-w-[280px] object-cover rounded-[12px] group-hover/img-preview:brightness-95 transition-all" 
                                                                alt="Justificatif" 
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img-preview:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 text-[#1d1d1f] shadow-apple-md">
                                                                    <span className="material-symbols-outlined text-[20px] font-semibold block">visibility</span>
                                                                </div>
                                                            </div>
                                                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                                                                <span className="material-symbols-outlined text-[10px] font-bold text-[#34c759]">verified</span>
                                                                Vérifié
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            } else {
                                // RENDER MULTIPLE ROLES GROUPED UNDER SAME ORGANIZATION (LinkedIn Premium Timeline Style!)
                                return (
                                    <div key={group.organization} className={`flex gap-4 items-start ${idx > 0 ? 'pt-6' : ''}`}>
                                        {/* Company Icon Column */}
                                        <div className="h-12 w-12 rounded-[8px] overflow-hidden border border-black/10 flex-shrink-0 bg-[#f5f5f7] flex items-center justify-center relative z-10">
                                            {group.logo ? (
                                                <img src={group.logo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-[26px] text-gray-400">domain</span>
                                            )}
                                        </div>

                                        {/* Group Text Column */}
                                        <div className="flex-grow min-w-0">
                                            <div>
                                                <h4 className="font-bold text-[15px] text-[#1d1d1f] leading-snug">{group.organization}</h4>
                                                <p className="text-[12px] font-semibold text-[#86868b] mt-0.5">
                                                    {getOverallDurationStr(group.roles)}
                                                </p>
                                                {group.location && (
                                                    <p className="text-[12px] font-medium text-[#86868b] mt-0.5">
                                                        {group.location}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Roles List with Vertical Line connector */}
                                            <div className="mt-4 relative pl-6 border-l-2 border-[#e5e5ea] ml-[-40px]">
                                                {group.roles.map((exp, roleIdx) => {
                                                    const parsed = parseExpDescription(exp.description);
                                                    return (
                                                        <div key={exp.id} className={`relative group/role ${roleIdx > 0 ? 'mt-6' : ''}`}>
                                                            {/* Vertical connection dot centered mathematically */}
                                                            <div 
                                                                className="absolute w-[9px] h-[9px] rounded-full bg-[#c7c7cc] border-2 border-white ring-2 ring-[#e5e5ea] z-20 group-hover/role:bg-[#0071e3] transition-colors" 
                                                                style={{ left: '-29.5px', top: '4px' }}
                                                            />

                                                            {/* Role details */}
                                                            <div className="text-left pl-2">
                                                                <div className="flex justify-between items-start gap-4">
                                                                    <div>
                                                                        <h5 className="font-bold text-[14px] text-[#1d1d1f] leading-snug group-hover/role:text-[#0071e3] transition-colors">
                                                                            {exp.title}
                                                                        </h5>
                                                                        <p className="text-[12px] font-semibold text-[#6e6e73] mt-0.5">
                                                                            {exp.type}
                                                                        </p>
                                                                    </div>
                                                                    
                                                                    {canEdit && (
                                                                        <div className="flex gap-1.5 opacity-0 group-hover/role:opacity-100 transition-opacity">
                                                                            <button 
                                                                                onClick={() => handleOpenEditExp(exp)} 
                                                                                className="p-1 text-gray-400 hover:text-[#0071e3] transition-colors press-effect"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleRemoveExperience(exp.id)} 
                                                                                className="p-1 text-gray-400 hover:text-[#ff3b30] transition-colors press-effect"
                                                                            >
                                                                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#86868b] font-semibold mt-1">
                                                                    <span>
                                                                        {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} – {
                                                                            exp.end_date 
                                                                                ? new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) 
                                                                                : 'Présent'
                                                                        }
                                                                    </span>
                                                                    {exp.duration && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="text-[#0071e3]">{exp.duration}</span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {parsed.description && (
                                                                    <p className="mt-2 text-xs text-[#6e6e73] leading-relaxed max-w-xl font-normal whitespace-pre-wrap">
                                                                        {parsed.description}
                                                                    </p>
                                                                )}

                                                                {/* Clickable Justificatory Document or Image Preview */}
                                                                {parsed.documentUrl && (
                                                                    parsed.documentUrl.startsWith('data:application/pdf') ? (
                                                                        // PDF Badge
                                                                        <div 
                                                                            onClick={() => openBase64InNewTab(parsed.documentUrl)}
                                                                            className="mt-2.5 max-w-[320px] bg-[#f5f5f7] border border-black/5 hover:border-black/10 rounded-[10px] p-2.5 shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 group/doc overflow-hidden cursor-pointer"
                                                                        >
                                                                            <div className="flex items-center gap-2.5">
                                                                                <div className="h-[34px] w-[34px] rounded-[6px] bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 border border-red-100 shadow-sm overflow-hidden">
                                                                                    <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                                                                </div>
                                                                                <div className="text-left min-w-0 flex-grow">
                                                                                    <h6 className="text-[11px] font-bold text-[#1d1d1f] group-hover/doc:text-[#0071e3] transition-colors truncate">
                                                                                        Justificatif - {group.organization}
                                                                                    </h6>
                                                                                    <p className="text-[9px] text-[#86868b] font-medium mt-0.5 uppercase tracking-wider flex items-center gap-1">
                                                                                        <span>PDF</span>
                                                                                        <span>•</span>
                                                                                        <span className="text-[#34c759] font-bold">Vérifié</span>
                                                                                    </p>
                                                                                </div>
                                                                                <span className="material-symbols-outlined text-gray-400 text-[14px] group-hover/doc:translate-x-0.5 transition-transform flex-shrink-0">
                                                                                    open_in_new
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        // Image Visual Thumbnail Card
                                                                        <div className="mt-2.5 text-left animate-fadeInUp">
                                                                            <div 
                                                                                onClick={() => openBase64InNewTab(parsed.documentUrl)}
                                                                                className="group/img-preview relative inline-block rounded-[10px] overflow-hidden border border-black/10 cursor-pointer shadow-apple-xs hover:shadow-apple-md hover:scale-[1.01] transition-all duration-200 bg-white"
                                                                            >
                                                                                <img 
                                                                                    src={parsed.documentUrl} 
                                                                                    className="h-[120px] max-w-[240px] object-cover rounded-[10px] group-hover/img-preview:brightness-95 transition-all" 
                                                                                    alt="Justificatif" 
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img-preview:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                                                                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 text-[#1d1d1f] shadow-apple-md">
                                                                                        <span className="material-symbols-outlined text-[16px] font-semibold block">visibility</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase flex items-center gap-0.5 shadow-sm">
                                                                                    <span className="material-symbols-outlined text-[8px] font-bold text-[#34c759]">verified</span>
                                                                                    Vérifié
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        });
                        })()}
                        {profileData.profile?.experiences?.length === 0 && (
                            <p className="text-xs text-gray-400 italic py-2">Aucune expérience répertoriée pour le moment.</p>
                        )}
                        {(() => {
                            const allGroups = groupExperiencesByOrg(profileData.profile?.experiences || []);
                            if (allGroups.length > 2) {
                                return (
                                    <div className="pt-4 mt-2 border-t border-black/5 flex justify-center">
                                        <button 
                                            onClick={() => setShowAllExperiences(!showAllExperiences)}
                                            className="w-full py-2.5 rounded-[12px] bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#0071e3] hover:text-[#005bb5] font-bold text-xs flex items-center justify-center gap-1.5 transition-all press-effect cursor-pointer"
                                        >
                                            <span>{showAllExperiences ? 'Afficher moins' : `Afficher les ${allGroups.length - 2} autres expériences`}</span>
                                            <span className="material-symbols-outlined text-[16px] font-bold transition-transform duration-200">
                                                {showAllExperiences ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                                            </span>
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* EDUCATION CARD (LinkedIn Chronological Stacked Layout) */}
                <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-md p-6 animate-fadeInUp">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-[#1d1d1f] text-[18px] tracking-tight">
                            Éducation
                        </h3>
                        {canEdit && (
                            <button 
                                onClick={handleOpenAddEdu} 
                                className="w-[32px] h-[32px] rounded-full hover:bg-black/[0.04] flex items-center justify-center text-[#5e5e5e] hover:text-[#1d1d1f] transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[22px]">add</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-1 divide-y divide-black/5">
                        {(() => {
                            const allEdus = [...(profileData.profile?.educations || [])].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
                            const visibleEdus = showAllEducations ? allEdus : allEdus.slice(0, 2);
                            return visibleEdus.map((edu, idx) => {
                                const parsed = parseExpDescription(edu.description);
                                return (
                                    <div key={edu.id} className="flex gap-4 items-start py-4 first:pt-1 last:pb-2 group/edu">
                                        {/* School Icon Column */}
                                        <div className="h-12 w-12 rounded-[8px] overflow-hidden border border-black/10 flex-shrink-0 bg-[#f5f5f7] flex items-center justify-center">
                                            {renderInstitutionLogo(edu.school)}
                                        </div>

                                        {/* Education Text Column */}
                                        <div className="flex-grow min-w-0 text-left">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h4 className="font-bold text-[15px] text-[#1d1d1f] leading-snug">{edu.school}</h4>
                                                    <p className="text-[13px] font-semibold text-[#6e6e73] mt-0.5">
                                                        {edu.degree} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}
                                                    </p>
                                                </div>
                                                
                                                {canEdit && (
                                                    <div className="flex gap-1 opacity-0 group-hover/edu:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleOpenEditEdu(edu)} 
                                                            className="p-1.5 text-gray-400 hover:text-[#0071e3] hover:bg-[#e0f1ff] rounded-full transition-colors press-effect"
                                                        >
                                                            <span className="material-symbols-outlined text-[17px]">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRemoveEducation(edu.id)} 
                                                            className="p-1.5 text-gray-400 hover:text-[#ff3b30] hover:bg-[#ffeeed] rounded-full transition-colors press-effect"
                                                        >
                                                            <span className="material-symbols-outlined text-[17px]">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#86868b] font-semibold mt-1">
                                                <span>
                                                    {new Date(edu.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} – {
                                                        edu.end_date 
                                                            ? new Date(edu.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) 
                                                            : 'Présent'
                                                    }
                                                </span>
                                                {edu.city && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{edu.city}</span>
                                                    </>
                                                )}
                                            </div>

                                            {parsed.description && (
                                                <p className="mt-2.5 text-xs text-[#6e6e73] leading-relaxed max-w-2xl font-normal whitespace-pre-wrap">
                                                    {parsed.description}
                                                </p>
                                            )}

                                            {/* Clickable Justificatory Document Badge */}
                                            {parsed.documentUrl && (
                                                parsed.documentUrl.startsWith('data:application/pdf') ? (
                                                    // PDF Badge
                                                    <div 
                                                        onClick={() => openBase64InNewTab(parsed.documentUrl)}
                                                        className="mt-3 max-w-[340px] bg-[#f5f5f7] border border-black/5 hover:border-black/10 rounded-[12px] p-3 shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 group/doc overflow-hidden cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-[8px] bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 border border-red-100 shadow-sm overflow-hidden">
                                                                <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
                                                            </div>
                                                            <div className="text-left min-w-0 flex-grow">
                                                                <h5 className="text-[12px] font-bold text-[#1d1d1f] group-hover/doc:text-[#0071e3] transition-colors truncate">
                                                                    Justificatif - {edu.school}
                                                                </h5>
                                                                <p className="text-[10px] text-[#86868b] font-medium mt-0.5 uppercase tracking-wider flex items-center gap-1">
                                                                    <span>PDF</span>
                                                                    <span>•</span>
                                                                    <span className="text-[#34c759] font-bold flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-[10px] font-bold">verified</span>
                                                                        Vérifié
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <span className="material-symbols-outlined text-gray-400 text-[16px] group-hover/doc:translate-x-0.5 transition-transform flex-shrink-0">
                                                                open_in_new
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Image Visual Thumbnail Card
                                                    <div className="mt-3 text-left animate-fadeInUp">
                                                        <div 
                                                            onClick={() => openBase64InNewTab(parsed.documentUrl)}
                                                            className="group/img-preview relative inline-block rounded-[12px] overflow-hidden border border-black/10 cursor-pointer shadow-apple-xs hover:shadow-apple-md hover:scale-[1.01] transition-all duration-200 bg-white"
                                                        >
                                                            <img 
                                                                src={parsed.documentUrl} 
                                                                className="h-[140px] max-w-[280px] object-cover rounded-[12px] group-hover/img-preview:brightness-95 transition-all" 
                                                                alt="Justificatif" 
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img-preview:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 text-[#1d1d1f] shadow-apple-md">
                                                                    <span className="material-symbols-outlined text-[20px] font-semibold block">visibility</span>
                                                                </div>
                                                            </div>
                                                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-sm">
                                                                <span className="material-symbols-outlined text-[10px] font-bold text-[#34c759]">verified</span>
                                                                Vérifié
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                        {(!profileData.profile?.educations || profileData.profile.educations.length === 0) && (
                            <p className="text-xs text-gray-400 italic py-2 text-center">Aucune éducation répertoriée.</p>
                        )}
                        {(() => {
                            const allEdus = profileData.profile?.educations || [];
                            if (allEdus.length > 2) {
                                return (
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => setShowAllEducations(!showAllEducations)}
                                            className="w-full py-3 border-t border-black/5 hover:bg-black/[0.02] text-[#5e5e5e] hover:text-[#1d1d1f] font-semibold text-sm flex items-center justify-center gap-1 transition-all cursor-pointer rounded-b-[24px]"
                                        >
                                            <span>{showAllEducations ? 'Afficher moins' : `Afficher les ${allEdus.length} formations`}</span>
                                            <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: showAllEducations ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* CERTIFICATIONS CARD (LinkedIn Stacked Layout) */}
                <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-md p-6 animate-fadeInUp">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-[#1d1d1f] text-[18px] tracking-tight">
                            Certifications
                        </h3>
                        {canEdit && (
                            <button 
                                onClick={handleOpenAddCert} 
                                className="w-[32px] h-[32px] rounded-full hover:bg-black/[0.04] flex items-center justify-center text-[#5e5e5e] hover:text-[#1d1d1f] transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[22px]">add</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-1 divide-y divide-black/5">
                        {(() => {
                            const allCerts = [...(profileData.profile?.certifications || [])].sort((a, b) => {
                                if (!a.issue_date) return 1;
                                if (!b.issue_date) return -1;
                                return new Date(b.issue_date) - new Date(a.issue_date);
                            });
                            const visibleCerts = showAllCertifications ? allCerts : allCerts.slice(0, 2);
                            return visibleCerts.map((cert, idx) => {
                            const parsed = parseCertDescription(cert.description);
                            return (
                                <div key={cert.id} className="flex gap-4 items-start py-4 first:pt-1 last:pb-2 group/cert">
                                    {/* Org Icon Column */}
                                    <div className="h-12 w-12 rounded-[8px] overflow-hidden border border-black/10 flex-shrink-0 bg-[#fff8f2] flex items-center justify-center text-orange-500">
                                        {parsed.orgIcon ? (
                                            <img src={parsed.orgIcon} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[26px]">workspace_premium</span>
                                        )}
                                    </div>

                                    {/* Certification Text Column */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="text-left">
                                                <h4 className="font-bold text-[15px] text-[#1d1d1f] leading-snug">{cert.title}</h4>
                                                <p className="text-[13px] font-semibold text-[#0071e3] mt-0.5">
                                                    {cert.issuing_organization || cert.organization}
                                                </p>
                                            </div>
                                            
                                            {canEdit && (
                                                <div className="flex gap-1 opacity-0 group-hover/cert:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleOpenEditCert(cert)} 
                                                        className="p-1.5 text-gray-400 hover:text-[#0071e3] hover:bg-[#e0f1ff] rounded-full transition-colors press-effect"
                                                    >
                                                        <span className="material-symbols-outlined text-[17px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveCertification(cert.id)} 
                                                        className="p-1.5 text-gray-400 hover:text-[#ff3b30] hover:bg-[#ffeeed] rounded-full transition-colors press-effect"
                                                    >
                                                        <span className="material-symbols-outlined text-[17px]">delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#86868b] font-semibold mt-1 text-left">
                                            <span>
                                                Émission : {
                                                    cert.issue_date 
                                                        ? new Date(cert.issue_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) 
                                                        : 'Non renseignée'
                                                }
                                            </span>
                                            {cert.expiry_date && (
                                                <>
                                                    <span>•</span>
                                                    <span>Expira : {new Date(cert.expiry_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                                                </>
                                            )}
                                        </div>

                                        {cert.credential_id && (
                                            <p className="text-[11px] text-[#86868b] font-bold uppercase tracking-wider mt-1.5 text-left">
                                                ID de la créance : <span className="text-[#1d1d1f] font-semibold tracking-normal normal-case">{cert.credential_id}</span>
                                            </p>
                                        )}

                                        {parsed.description && (
                                            <p className="mt-2 text-xs text-[#6e6e73] font-normal leading-relaxed text-left">
                                                {parsed.description}
                                            </p>
                                        )}

                                        {/* Action Buttons Row: Show credential & thumbnail/image preview (LinkedIn Premium Style!) */}
                                        {parsed.certImage && (
                                            <div className="mt-3.5 space-y-3 text-left">
                                                {/* Show Credential Button */}
                                                <div>
                                                    <button 
                                                        onClick={() => openBase64InNewTab(parsed.certImage)}
                                                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full border border-black/15 hover:border-black/35 text-gray-700 hover:bg-[#f5f5f7] hover:text-[#1d1d1f] text-[11px] font-bold transition-all press-effect shadow-apple-xs cursor-pointer"
                                                    >
                                                        <span>Afficher le justificatif</span>
                                                        <span className="material-symbols-outlined text-[13px] font-semibold">open_in_new</span>
                                                    </button>
                                                </div>

                                                {/* Large inline image or PDF thumbnail link */}
                                                {!parsed.certImage.startsWith('data:application/pdf') ? (
                                                    // Beautiful Large Image Preview Card
                                                    <div className="mt-1 animate-fadeInUp">
                                                        <div 
                                                            onClick={() => openBase64InNewTab(parsed.certImage)}
                                                            className="group/img-preview relative inline-block rounded-[12px] overflow-hidden border border-black/10 cursor-pointer shadow-apple-xs hover:shadow-apple-md hover:scale-[1.01] transition-all duration-200 bg-white"
                                                        >
                                                            <img 
                                                                src={parsed.certImage} 
                                                                className="h-[140px] max-w-[280px] object-cover rounded-[12px] group-hover/img-preview:brightness-95 transition-all" 
                                                                alt={cert.title} 
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img-preview:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 text-[#1d1d1f] shadow-apple-md">
                                                                    <span className="material-symbols-outlined text-[20px] font-semibold block">visibility</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Small Inline Rectangular PDF Thumbnail Link
                                                    <div 
                                                        onClick={() => openBase64InNewTab(parsed.certImage)}
                                                        className="inline-flex items-center gap-3 group/cert-thumb p-1 rounded-[8px] hover:bg-[#f5f5f7]/60 transition-colors cursor-pointer"
                                                    >
                                                        <div className="w-[80px] h-[48px] rounded-[6px] bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shadow-apple-xs transition-transform group-hover/cert-thumb:scale-[1.02] flex-shrink-0">
                                                            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                                        </div>
                                                        <span className="text-[12px] font-bold text-[#6e6e73] group-hover/cert-thumb:text-[#0071e3] transition-colors truncate max-w-[200px]">
                                                            Aperçu PDF - {cert.title}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                            });
                        })()}
                        {(!profileData.profile?.certifications || profileData.profile.certifications.length === 0) && (
                            <p className="text-xs text-gray-400 italic py-2 text-center">Aucune certification répertoriée.</p>
                        )}
                        {(() => {
                            const allCerts = profileData.profile?.certifications || [];
                            if (allCerts.length > 2) {
                                return (
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => setShowAllCertifications(!showAllCertifications)}
                                            className="w-full py-3 border-t border-black/5 hover:bg-black/[0.02] text-[#5e5e5e] hover:text-[#1d1d1f] font-semibold text-sm flex items-center justify-center gap-1 transition-all cursor-pointer rounded-b-[24px]"
                                        >
                                            <span>{showAllCertifications ? 'Afficher moins' : `Afficher les ${allCerts.length} certifications`}</span>
                                            <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: showAllCertifications ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* SKILLS CARD */}
                <div className="bg-white border border-black/5 rounded-[24px] shadow-apple-md p-6 animate-fadeInUp">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-[#1d1d1f] text-[18px] tracking-tight">
                            Compétences
                        </h3>
                        {canEdit && (
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={handleOpenAddSkill} 
                                    className="w-[32px] h-[32px] rounded-full hover:bg-black/[0.04] flex items-center justify-center text-[#5e5e5e] hover:text-[#1d1d1f] transition-all press-effect"
                                >
                                    <span className="material-symbols-outlined text-[22px]">add</span>
                                </button>
                                <button 
                                    onClick={handleOpenAddSkill} 
                                    className="w-[32px] h-[32px] rounded-full hover:bg-black/[0.04] flex items-center justify-center text-[#5e5e5e] hover:text-[#1d1d1f] transition-all press-effect"
                                >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1 divide-y divide-black/5">
                        {(() => {
                            const allSkills = profileData.profile?.skills || [];
                            const visibleSkills = showAllSkills ? allSkills : allSkills.slice(0, 2);
                            return visibleSkills.map((skill, idx) => (
                                <div key={skill.id} className="py-4 first:pt-1 last:pb-2 group/skill text-left">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1.5">
                                            {/* Skill Name & Mastery Badge */}
                                            <div className="flex items-center flex-wrap gap-2">
                                                <h4 className="font-semibold text-[15px] text-[#1d1d1f]">{skill.name}</h4>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                                                    skill.level === 'EXPERT' ? 'bg-[#e3fcf0] text-[#0ea254]' :
                                                    skill.level === 'ADVANCED' ? 'bg-[#e0f1ff] text-[#0071e3]' :
                                                    skill.level === 'INTERMEDIATE' ? 'bg-[#fff3e0] text-[#b78103]' :
                                                    'bg-[#f5f5f7] text-[#86868b]'
                                                }`}>
                                                    {(() => {
                                                        const mapping = {
                                                            'BEGINNER': 'Débutant',
                                                            'INTERMEDIATE': 'Intermédiaire',
                                                            'ADVANCED': 'Avancé',
                                                            'EXPERT': 'Expert'
                                                        };
                                                        return mapping[skill.level] || skill.level;
                                                    })()}
                                                </span>
                                            </div>

                                            {/* Institution/Association details */}
                                            <div className="flex items-start gap-2.5 mt-1">
                                                {skill.education ? (
                                                    <>
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            {renderInstitutionLogo(skill.education.school)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] text-[#5e5e5e]">
                                                                Formation à <strong className="text-[#1d1d1f] font-semibold">{skill.education.school}</strong>
                                                            </span>
                                                            <span className="text-[11px] text-[#86868b] mt-0.5">
                                                                Associé à vos études • {skill.education.degree}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="h-6 w-6 rounded-[4px] bg-[#f5f5f7] border border-black/10 flex items-center justify-center flex-shrink-0 text-[#0071e3] shadow-sm mt-0.5">
                                                            <span className="material-symbols-outlined text-[13px] font-bold">self_improvement</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] text-[#5e5e5e]">
                                                                Acquis en <strong className="text-[#1d1d1f] font-semibold">Autoformation / Apprentissage autonome</strong>
                                                            </span>
                                                            <span className="text-[11px] text-[#86868b] mt-0.5">
                                                                Travail personnel et auto-apprentissage
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <button 
                                                onClick={() => handleRemoveSkill(skill.id)} 
                                                className="p-1.5 text-gray-400 hover:text-[#ff3b30] hover:bg-[#ffeeed] rounded-full transition-all press-effect opacity-0 group-hover/skill:opacity-100"
                                            >
                                                <span className="material-symbols-outlined text-[17px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ));
                        })()}
                        {(!profileData.profile?.skills || profileData.profile.skills.length === 0) && (
                            <p className="text-xs text-gray-400 italic py-2 text-center">Aucune compétence répertoriée.</p>
                        )}
                        {(() => {
                            const allSkills = profileData.profile?.skills || [];
                            if (allSkills.length > 2) {
                                return (
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => setShowAllSkills(!showAllSkills)}
                                            className="w-full py-3 border-t border-black/5 hover:bg-black/[0.02] text-[#5e5e5e] hover:text-[#1d1d1f] font-semibold text-sm flex items-center justify-center gap-1 transition-all cursor-pointer rounded-b-[24px]"
                                        >
                                            <span>{showAllSkills ? 'Afficher moins' : `Afficher les ${allSkills.length} compétences`}</span>
                                            <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: showAllSkills ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                    </div>{/* END Left Column */}

                    {/* Right Column - Sticky Sidebar */}
                    <div className="hidden lg:block space-y-4 sticky top-[60px] self-start flex-shrink-0 w-[300px]">
                        
                        {/* Langues du profil */}
                        <div className="bg-white rounded-[24px] border border-black/10 p-5 shadow-apple-xs text-left animate-fadeInUp">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-[#1d1d1f] text-[13px] uppercase tracking-wider">Langue du profil</h3>
                                {canEdit && (
                                    <span 
                                        onClick={() => setShowLanguageModal(true)} 
                                        className="material-symbols-outlined text-gray-400 text-[18px] cursor-pointer hover:text-[#0071e3] transition-all press-effect"
                                    >
                                        edit
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                {languages && languages.length > 0 ? (
                                    languages.map((l, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs border-b border-black/[0.04] pb-2 last:border-0 last:pb-0">
                                            <span className="font-bold text-[#1d1d1f]">{l.language}</span>
                                            <span className="text-[#86868b] font-medium">{l.level}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Aucune langue renseignée.</p>
                                )}
                            </div>
                        </div>

                        {/* Profil public et URL */}
                        <div className="bg-white rounded-[24px] border border-black/10 p-5 shadow-apple-xs text-left animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-[#1d1d1f] text-[13px] uppercase tracking-wider">Profil public et URL</h3>
                                {canEdit && (
                                    <span className="material-symbols-outlined text-gray-400 text-[18px] cursor-pointer hover:text-[#0071e3]">edit</span>
                                )}
                            </div>
                            <p className="text-[11px] text-[#6e6e73] font-semibold break-all hover:underline cursor-pointer hover:text-[#0071e3]">
                                www.scholar.com/in/{profileData.first_name.toLowerCase()}-{profileData.last_name.toLowerCase()}-{profileData.id}
                            </p>
                        </div>

                        {/* Autres membres consultés (People also viewed) */}
                        <div className="bg-white rounded-[24px] border border-black/10 p-5 shadow-apple-xs text-left animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                            <h3 className="font-bold text-[#1d1d1f] text-[13px] uppercase tracking-wider mb-4">Autres membres consultés</h3>
                            <div className="space-y-4">
                                {otherMembersLoading ? (
                                    <div className="flex flex-col gap-3">
                                        {[1, 2, 3].map(n => (
                                            <div key={n} className="flex gap-3 items-center animate-pulse">
                                                <div className="w-9 h-9 rounded-full bg-gray-200" />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="h-2.5 bg-gray-200 rounded w-2/3" />
                                                    <div className="h-2 bg-gray-200 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : otherMembers && otherMembers.length > 0 ? (
                                    otherMembers.map((m) => {
                                        const roleLabel = m.role === 'STUDENT' ? 'Étudiant' : m.role === 'TEACHER' ? 'Enseignant' : 'Chercheur';
                                        return (
                                            <div key={m.id} className="flex gap-3 items-start border-b border-black/[0.04] pb-3 last:border-0 last:pb-0">
                                                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-black/5 bg-[#f5f5f7] flex items-center justify-center font-bold text-gray-400 text-xs">
                                                    {m.profile?.photo_url ? (
                                                        <img 
                                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${m.profile.photo_url}`} 
                                                            className="w-full h-full object-cover" 
                                                            alt="" 
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#f5f5f7] flex items-center justify-center text-xs uppercase font-bold text-[#86868b]">
                                                            {m.first_name?.[0]}{m.last_name?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-grow text-left">
                                                    <Link to={`/profile/${m.id}`} className="hover:underline">
                                                        <h4 className="text-xs font-bold text-[#1d1d1f] truncate leading-tight hover:text-[#0071e3] cursor-pointer">
                                                            {m.first_name} {m.last_name}
                                                        </h4>
                                                    </Link>
                                                    <p className="text-[10px] text-[#6e6e73] font-semibold truncate leading-tight mt-0.5">
                                                        {roleLabel} · {m.profile?.institution || 'IGA'}
                                                    </p>
                                                    <Link 
                                                        to={`/profile/${m.id}`} 
                                                        className="inline-flex items-center justify-center mt-2 h-[24px] px-3 rounded-full border border-black/15 hover:bg-[#f5f5f7] text-[10px] font-bold text-gray-600 transition-all press-effect"
                                                    >
                                                        Voir le profil
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Aucun membre trouvé.</p>
                                )}
                            </div>
                        </div>
                    </div>{/* END Right Column */}

                </div>{/* END flex grid */}
            </div>{/* END max-w wrapper */}

            {/* LIGHTBOX MODAL: EXPERIENCE (Unified Add/Edit) */}
            {showExpModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex justify-end animate-fadeIn" onClick={() => setShowExpModal(false)}>
                    <div 
                        className="bg-white h-full w-full max-w-md p-6 shadow-apple-xl border-l border-black/5 overflow-y-auto flex flex-col justify-start anim-slide-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                                {expModalData.id ? "Modifier l'expérience" : "Ajouter une expérience"}
                            </h3>
                            <button 
                                onClick={() => setShowExpModal(false)} 
                                className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={expModalData.id ? handleUpdateExperience : handleAddExperience} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Intitulé du poste *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={expModalData.title}
                                    onChange={e => setExpModalData({...expModalData, title: e.target.value})}
                                    placeholder="Ex: Développeur React Full Stack"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Entreprise / Organisation *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={expModalData.organization}
                                    onChange={e => setExpModalData({...expModalData, organization: e.target.value})}
                                    placeholder="Ex: IGA Casablanca"
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Type de poste</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsExpTypeOpen(!isExpTypeOpen)}
                                            className="w-full h-[40px] px-3 bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[10px] text-xs outline-none transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                                        >
                                            <span>
                                                {expModalData.type === 'INTERNSHIP' && 'STAGE'}
                                                {expModalData.type === 'TEACHING' && 'ENSEIGNEMENT'}
                                                {expModalData.type === 'RESEARCH' && 'RECHERCHE'}
                                                {expModalData.type === 'OTHER' && 'AUTRE'}
                                            </span>
                                            <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isExpTypeOpen ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>

                                        {isExpTypeOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsExpTypeOpen(false)} />
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs">
                                                    {[
                                                        { value: 'INTERNSHIP', label: 'STAGE' },
                                                        { value: 'TEACHING', label: 'ENSEIGNEMENT' },
                                                        { value: 'RESEARCH', label: 'RECHERCHE' },
                                                        { value: 'OTHER', label: 'AUTRE' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setExpModalData({ ...expModalData, type: opt.value });
                                                                setIsExpTypeOpen(false);
                                                            }}
                                                            className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                                expModalData.type === opt.value ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                            }`}
                                                        >
                                                            <span>{opt.label}</span>
                                                            {expModalData.type === opt.value && (
                                                                <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Durée *</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                        value={expModalData.duration}
                                        onChange={e => setExpModalData({...expModalData, duration: e.target.value})}
                                        placeholder="Ex: 6 mois" 
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Date de début *</label>
                                    <AppleDatePicker 
                                        value={expModalData.start_date}
                                        onChange={val => setExpModalData({...expModalData, start_date: val})}
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Date de fin</label>
                                    <AppleDatePicker 
                                        value={expModalData.end_date}
                                        onChange={val => setExpModalData({...expModalData, end_date: val})} 
                                        align="right"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Lieu / Ville</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={expModalData.location}
                                    onChange={e => setExpModalData({...expModalData, location: e.target.value})}
                                    placeholder="Ex: Casablanca, Maroc" 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1.5 ml-0.5">Logo de l'entreprise (Optionnel)</label>
                                
                                <div className="flex gap-2 items-center">
                                    <label className="h-[36px] px-4 bg-white hover:bg-[#f5f5f7] border border-black/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-apple-xs transition-all press-effect text-[11px] font-bold text-[#1d1d1f]">
                                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">upload_file</span>
                                        <span>Sélectionner une icône</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setExpModalData({...expModalData, companyIcon: reader.result});
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                    
                                    {expModalData.companyIcon && (
                                        <div className="flex items-center gap-2 animate-fadeIn flex-grow bg-[#f5f5f7] p-1.5 rounded-[10px] border border-black/5 justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-[4px] bg-white border border-black/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    <img src={expModalData.companyIcon} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Icône sélectionnée</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setExpModalData({...expModalData, companyIcon: ''})} 
                                                className="text-[9px] text-[#ff3b30] hover:underline font-bold mr-1 block"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1.5 ml-0.5">Document justificatif (Image ou PDF)</label>
                                
                                <div className="flex gap-2 items-center">
                                    <label className="h-[36px] px-4 bg-white hover:bg-[#f5f5f7] border border-black/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-apple-xs transition-all press-effect text-[11px] font-bold text-[#1d1d1f]">
                                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">upload_file</span>
                                        <span>Sélectionner le document</span>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setExpModalData({...expModalData, documentUrl: reader.result});
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                    
                                    {expModalData.documentUrl && (
                                        <div className="flex items-center gap-2 animate-fadeIn flex-grow bg-[#f5f5f7] p-1.5 rounded-[10px] border border-black/5 justify-between max-w-[240px]">
                                            <div className="flex items-center gap-1.5 truncate">
                                                {expModalData.documentUrl.startsWith('data:application/pdf') ? (
                                                    <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">image</span>
                                                )}
                                                <span className="text-[10px] text-gray-500 font-bold uppercase truncate">Justificatif chargé</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setExpModalData({...expModalData, documentUrl: ''})} 
                                                className="text-[9px] text-[#ff3b30] hover:underline font-bold mr-1 block"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Description des missions *</label>
                                <textarea 
                                    className="w-full bg-[#f5f5f7] focus:bg-white focus:outline-[#0071e3] border border-transparent rounded-[12px] p-3 text-xs font-semibold text-[#1d1d1f] min-h-[80px]"
                                    value={expModalData.description}
                                    onChange={e => setExpModalData({...expModalData, description: e.target.value})}
                                    placeholder="Décrivez vos missions et réalisations..." 
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    className="flex-grow h-[38px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold press-effect shadow-apple-sm"
                                >
                                    Enregistrer
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowExpModal(false)} 
                                    className="h-[38px] px-5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-xs font-semibold press-effect"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL: CERTIFICATION (Unified Add/Edit) */}
            {showCertModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex justify-end animate-fadeIn" onClick={() => setShowCertModal(false)}>
                    <div 
                        className="bg-white h-full w-full max-w-md p-6 shadow-apple-xl border-l border-black/5 overflow-y-auto flex flex-col justify-start anim-slide-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                                {certModalData.id ? "Modifier la certification" : "Ajouter une certification"}
                            </h3>
                            <button 
                                onClick={() => setShowCertModal(false)} 
                                className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={certModalData.id ? handleUpdateCertification : handleAddCertification} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Nom de la certification *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={certModalData.title}
                                    onChange={e => setCertModalData({...certModalData, title: e.target.value})}
                                    placeholder="Ex: AWS Certified Solutions Architect"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Organisme émetteur *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={certModalData.organization}
                                    onChange={e => setCertModalData({...certModalData, organization: e.target.value})}
                                    placeholder="Ex: Amazon Web Services"
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Date d'émission</label>
                                    <AppleDatePicker 
                                        value={certModalData.issue_date}
                                        onChange={val => setCertModalData({...certModalData, issue_date: val})} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Date d'expiration</label>
                                    <AppleDatePicker 
                                        value={certModalData.expiry_date}
                                        onChange={val => setCertModalData({...certModalData, expiry_date: val})} 
                                        align="right"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">ID de la créance (Code de la certif) *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={certModalData.credential_id}
                                    onChange={e => setCertModalData({...certModalData, credential_id: e.target.value})}
                                    placeholder="Ex: AWS-10293847" 
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1.5 ml-0.5">Icône de l'organisme (Optionnelle)</label>
                                
                                <div className="flex gap-2 items-center">
                                    <label className="h-[36px] px-4 bg-white hover:bg-[#f5f5f7] border border-black/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-apple-xs transition-all press-effect text-[11px] font-bold text-[#1d1d1f]">
                                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">upload_file</span>
                                        <span>Sélectionner une icône</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setCertModalData({...certModalData, orgIcon: reader.result});
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                    
                                    {certModalData.orgIcon && (
                                        <div className="flex items-center gap-2 animate-fadeIn flex-grow bg-[#f5f5f7] p-1.5 rounded-[10px] border border-black/5 justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-[4px] bg-white border border-black/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    <img src={certModalData.orgIcon} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Icône sélectionnée</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setCertModalData({...certModalData, orgIcon: ''})} 
                                                className="text-[9px] text-[#ff3b30] hover:underline font-bold mr-1 block"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1.5 ml-0.5">Image / Aperçu du certificat * (Image ou PDF)</label>
                                
                                <div className="flex gap-2 items-center">
                                    <label className="h-[36px] px-4 bg-white hover:bg-[#f5f5f7] border border-black/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-apple-xs transition-all press-effect text-[11px] font-bold text-[#1d1d1f]">
                                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">upload_file</span>
                                        <span>Sélectionner le certificat</span>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setCertModalData({...certModalData, certImage: reader.result});
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                    
                                    {certModalData.certImage && (
                                        <div className="flex items-center gap-2 animate-fadeIn flex-grow bg-[#f5f5f7] p-1.5 rounded-[10px] border border-black/5 justify-between max-w-[240px]">
                                            <div className="flex items-center gap-1.5 truncate">
                                                {certModalData.certImage.startsWith('data:application/pdf') ? (
                                                    <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">image</span>
                                                )}
                                                <span className="text-[10px] text-gray-500 font-bold uppercase truncate">Certificat chargé</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setCertModalData({...certModalData, certImage: ''})} 
                                                className="text-[9px] text-[#ff3b30] hover:underline font-bold mr-1 block"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Description facultative</label>
                                <textarea 
                                    className="w-full bg-[#f5f5f7] focus:bg-white focus:outline-[#0071e3] border border-transparent rounded-[12px] p-3 text-xs font-semibold text-[#1d1d1f] min-h-[60px]"
                                    value={certModalData.description}
                                    onChange={e => setCertModalData({...certModalData, description: e.target.value})}
                                    placeholder="Détails supplémentaires..." 
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    className="flex-grow h-[38px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold press-effect shadow-apple-sm"
                                >
                                    Enregistrer
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowCertModal(false)} 
                                    className="h-[38px] px-5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-xs font-semibold press-effect"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* LIGHTBOX MODAL: EDUCATION (Slide Drawer Right-to-Left) */}
            {showEduModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex justify-end animate-fadeIn" onClick={() => setShowEduModal(false)}>
                    <div 
                        className="bg-white h-full w-full max-w-md p-6 shadow-apple-xl border-l border-black/5 overflow-y-auto flex flex-col justify-start anim-slide-left text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                                {eduModalData.id ? "Modifier la formation" : "Ajouter une formation"}
                            </h3>
                            <button 
                                onClick={() => setShowEduModal(false)} 
                                className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveEducation} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">École / Université *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={eduModalData.school}
                                    onChange={e => setEduModalData({...eduModalData, school: e.target.value})}
                                    placeholder="Ex: IGA - Institut supérieur du Génie Appliqué"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Diplôme préparé / obtenu *</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={eduModalData.degree}
                                    onChange={e => setEduModalData({...eduModalData, degree: e.target.value})}
                                    placeholder="Ex: Ingénieur d'état en Génie Logiciel"
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Filière / Spécialisation</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={eduModalData.field_of_study}
                                    onChange={e => setEduModalData({...eduModalData, field_of_study: e.target.value})}
                                    placeholder="Ex: Informatique / Web"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Ville</label>
                                <input 
                                    type="text" 
                                    className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                    value={eduModalData.city}
                                    onChange={e => setEduModalData({...eduModalData, city: e.target.value})}
                                    placeholder="Ex: Casablanca"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Date de début *</label>
                                    <AppleDatePicker 
                                        value={eduModalData.start_date}
                                        onChange={val => setEduModalData({...eduModalData, start_date: val})} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Date de fin (ou prévue)</label>
                                    <AppleDatePicker 
                                        value={eduModalData.end_date}
                                        onChange={val => setEduModalData({...eduModalData, end_date: val})} 
                                        align="right"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1.5 ml-0.5">Document justificatif (Image ou PDF - Optionnel)</label>
                                <div className="flex gap-2 items-center">
                                    <label className="h-[36px] px-4 bg-white hover:bg-[#f5f5f7] border border-black/10 rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-apple-xs transition-all press-effect text-[11px] font-bold text-[#1d1d1f]">
                                        <span className="material-symbols-outlined text-[16px] text-[#0071e3]">upload_file</span>
                                        <span>Sélectionner le justificatif</span>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setEduModalData({...eduModalData, documentUrl: reader.result});
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                    
                                    {eduModalData.documentUrl && (
                                        <div className="flex items-center gap-2 animate-fadeIn flex-grow bg-[#f5f5f7] p-1.5 rounded-[10px] border border-black/5 justify-between max-w-[240px]">
                                            <div className="flex items-center gap-1.5 truncate">
                                                {eduModalData.documentUrl.startsWith('data:application/pdf') ? (
                                                    <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">image</span>
                                                )}
                                                <span className="text-[10px] text-gray-500 font-bold uppercase truncate">Fichier chargé</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => setEduModalData({...eduModalData, documentUrl: ''})} 
                                                className="text-[9px] text-[#ff3b30] hover:underline font-bold mr-1 block"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Détails / Projets / Description (Optionnelle)</label>
                                <textarea 
                                    className="w-full bg-[#f5f5f7] focus:bg-white focus:outline-[#0071e3] border border-transparent rounded-[12px] p-3 text-xs font-semibold text-[#1d1d1f] min-h-[70px]"
                                    value={eduModalData.description}
                                    onChange={e => setEduModalData({...eduModalData, description: e.target.value})}
                                    placeholder="Décrivez les cours suivis, projets notables, etc..." 
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    className="flex-grow h-[38px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold press-effect shadow-apple-sm"
                                >
                                    Enregistrer
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowEduModal(false)} 
                                    className="h-[38px] px-5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-xs font-semibold press-effect"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL: SKILL */}
            {showSkillModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex justify-end animate-fadeIn" onClick={() => setShowSkillModal(false)}>
                    <div 
                        className="bg-white h-full w-full max-w-sm p-6 shadow-apple-xl border-l border-black/5 overflow-y-auto flex flex-col justify-start anim-slide-left text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">Ajouter une compétence</h3>
                                <button 
                                    onClick={() => setShowSkillModal(false)} 
                                    className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleAddSkill} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Nom de la compétence *</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-[40px] px-3.5 bg-[#f5f5f7] hover:bg-[#e8e8ed]/80 focus:bg-white border border-black/[0.03] hover:border-black/[0.08] focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] outline-none text-xs font-semibold text-[#1d1d1f] transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                                        value={skillModalData.name}
                                        onChange={e => setSkillModalData({...skillModalData, name: e.target.value})}
                                        placeholder="Ex: Machine Learning, React, Swift..."
                                        required 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Niveau de maîtrise</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsSkillLevelOpen(!isSkillLevelOpen)}
                                            className="w-full h-[40px] px-3.5 bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[10px] text-xs outline-none transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                                        >
                                            <span>
                                                {skillModalData.level === 'BEGINNER' && 'Débutant'}
                                                {skillModalData.level === 'INTERMEDIATE' && 'Intermédiaire'}
                                                {skillModalData.level === 'ADVANCED' && 'Avancé'}
                                                {skillModalData.level === 'EXPERT' && 'Expert'}
                                            </span>
                                            <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isSkillLevelOpen ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>

                                        {isSkillLevelOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsSkillLevelOpen(false)} />
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs">
                                                    {[
                                                        { value: 'BEGINNER', label: 'Débutant' },
                                                        { value: 'INTERMEDIATE', label: 'Intermédiaire' },
                                                        { value: 'ADVANCED', label: 'Avancé' },
                                                        { value: 'EXPERT', label: 'Expert' }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setSkillModalData({ ...skillModalData, level: opt.value });
                                                                setIsSkillLevelOpen(false);
                                                            }}
                                                            className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                                skillModalData.level === opt.value ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                            }`}
                                                        >
                                                            <span>{opt.label}</span>
                                                            {skillModalData.level === opt.value && (
                                                                <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Source / Lieu d'acquisition</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsSkillSourceOpen(!isSkillSourceOpen)}
                                            className="w-full h-[40px] px-3.5 bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[10px] text-xs outline-none transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                                        >
                                            <span>
                                                {skillModalData.is_autoformation ? (
                                                    "Autoformation / Auto-apprentissage"
                                                ) : (
                                                    (() => {
                                                        const edu = (profileData.profile?.educations || []).find(e => String(e.id) === String(skillModalData.education_id));
                                                        return edu ? `${edu.school} (${edu.degree})` : "Sélectionner une école";
                                                    })()
                                                )}
                                            </span>
                                            <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isSkillSourceOpen ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>

                                        {isSkillSourceOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsSkillSourceOpen(false)} />
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs text-left max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSkillModalData({ ...skillModalData, is_autoformation: true, education_id: '' });
                                                            setIsSkillSourceOpen(false);
                                                        }}
                                                        className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                            skillModalData.is_autoformation ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                        }`}
                                                    >
                                                        <span>Autoformation / Auto-apprentissage</span>
                                                        {skillModalData.is_autoformation && (
                                                            <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                                        )}
                                                    </button>

                                                    {(profileData.profile?.educations || []).map((edu) => {
                                                        const isSelected = !skillModalData.is_autoformation && String(edu.id) === String(skillModalData.education_id);
                                                        return (
                                                            <button
                                                                key={edu.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSkillModalData({ ...skillModalData, is_autoformation: false, education_id: edu.id });
                                                                    setIsSkillSourceOpen(false);
                                                                }}
                                                                className={`w-full px-3.5 py-2.5 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                                    isSelected ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                                }`}
                                                            >
                                                                <span>{edu.school} ({edu.degree})</span>
                                                                {isSelected && (
                                                                    <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="submit" 
                                        className="flex-grow h-[38px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold press-effect shadow-apple-sm"
                                    >
                                        Ajouter
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowSkillModal(false)} 
                                        className="h-[38px] px-5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-xs font-semibold press-effect"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL: CONTACT INFO */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex justify-end animate-fadeIn" onClick={() => setShowContactModal(false)}>
                    <div 
                        className="bg-white h-full w-full max-w-sm p-6 shadow-apple-xl border-l border-black/5 overflow-y-auto flex flex-col justify-start gap-6 anim-slide-left text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#0071e3] text-[22px]">contact_mail</span>
                                    <h3 className="text-md font-bold text-[#1d1d1f] tracking-tight">Coordonnées</h3>
                                </div>
                                <button 
                                    onClick={() => setShowContactModal(false)} 
                                    className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="border-b border-black/[0.04] pb-3">
                                    <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1">Nom Complet</h4>
                                    <p className="text-xs font-bold text-[#1d1d1f]">{profileData.first_name} {profileData.last_name}</p>
                                </div>
                                
                                <div className="border-b border-black/[0.04] pb-3">
                                    <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1">E-mail de contact</h4>
                                    <a href={`mailto:${profileData.email}`} className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1.5 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">mail</span>
                                        {profileData.email}
                                    </a>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1">Numéro de téléphone</h4>
                                    {profileData.profile?.phone ? (
                                        <a href={`tel:${profileData.profile.phone}`} className="text-xs font-bold text-[#1d1d1f] hover:underline flex items-center gap-1.5 mt-1">
                                            <span className="material-symbols-outlined text-[14px]">phone_iphone</span>
                                            {profileData.profile.phone}
                                        </a>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic font-semibold mt-1">Aucun numéro de téléphone renseigné.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex">
                            <button 
                                onClick={() => setShowContactModal(false)} 
                                className="w-full h-[38px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-xs font-semibold press-effect transition-all"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL: RELATION LIST (POP-UP DETAILED) */}
            {showConnectionsModal && (
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn" 
                    onClick={() => setShowConnectionsModal(false)}
                >
                    <div 
                        className="bg-white/95 backdrop-blur-2xl border border-black/5 h-[80vh] w-full max-w-lg rounded-[24px] shadow-apple-2xl overflow-hidden flex flex-col anim-scale-up text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-black/[0.04] flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[#0071e3] text-[22px] fill-1">group</span>
                                <div>
                                    <h3 className="text-md font-bold text-[#1d1d1f] tracking-tight">
                                        Relations de {profileData.first_name}
                                    </h3>
                                    <p className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider mt-0.5">
                                        {profileData.connections_count || 0} relation(s) au total
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowConnectionsModal(false)} 
                                className="w-[32px] h-[32px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect border-none cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Search & Role Filters */}
                        <div className="p-4 bg-white/40 border-b border-black/[0.04] space-y-3">
                            {/* Search bar */}
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Rechercher par nom ou prénom..." 
                                    className="w-full h-[38px] bg-[#f5f5f7] rounded-[10px] border border-transparent focus:border-[#0071e3] focus:bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#0071e3]/15 transition-all font-medium placeholder-gray-400"
                                    value={connectionsSearch}
                                    onChange={(e) => setConnectionsSearch(e.target.value)}
                                />
                            </div>

                            {/* Segmented Filter */}
                            <div className="flex gap-1 bg-[#f5f5f7] p-0.5 rounded-[10px] text-xs font-bold text-[#6e6e73]">
                                {[
                                    { key: 'ALL', label: 'Tous' },
                                    { key: 'STUDENT', label: 'Étudiants' },
                                    { key: 'TEACHER', label: 'Enseignants' },
                                    { key: 'RESEARCHER', label: 'Chercheurs' }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setConnectionsRoleFilter(tab.key)}
                                        className={`flex-1 py-1.5 rounded-[8px] border-none cursor-pointer text-center transition-all ${
                                            connectionsRoleFilter === tab.key 
                                                ? 'bg-white text-[#1d1d1f] shadow-apple-xs' 
                                                : 'bg-transparent text-[#6e6e73] hover:text-[#1d1d1f]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Connections List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin">
                            {connectionsLoading ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0071e3] border-t-transparent"></div>
                                    <p className="text-xs text-[#86868b] font-semibold">Chargement des relations...</p>
                                </div>
                            ) : (
                                (() => {
                                    const filtered = connectionsList.filter(c => {
                                        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
                                        const matchesSearch = fullName.includes(connectionsSearch.toLowerCase());
                                        const matchesRole = connectionsRoleFilter === 'ALL' || c.role === connectionsRoleFilter;
                                        return matchesSearch && matchesRole;
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="py-16 text-center text-[#86868b]">
                                                <span className="material-symbols-outlined text-[32px] opacity-40">group_off</span>
                                                <p className="text-xs font-bold uppercase tracking-wider mt-2">Aucune relation trouvée</p>
                                                <p className="text-[10px] mt-0.5">Essayez une autre recherche ou filtre.</p>
                                            </div>
                                        );
                                    }

                                    return filtered.map((c) => {
                                        const cAvatar = c.profile?.photo_url 
                                            ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${c.profile.photo_url}` 
                                            : null;
                                        const cInitials = `${c.first_name?.[0]||''}${c.last_name?.[0]||''}`;
                                        
                                        return (
                                            <div 
                                                key={c.id} 
                                                className="flex items-center justify-between p-3 bg-[#f5f5f7]/60 hover:bg-white border border-black/[0.02] rounded-[16px] transition-all shadow-apple-xs hover:shadow-apple-sm"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-full border border-black/5 bg-[#e8e8ed] flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold text-[#86868b]">
                                                        {cAvatar ? (
                                                            <img 
                                                                src={cAvatar} 
                                                                className="w-full h-full object-cover" 
                                                                alt=""
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                                                            />
                                                        ) : cInitials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <h4 className="text-xs font-bold text-[#1d1d1f] truncate leading-none">
                                                                {c.first_name} {c.last_name}
                                                            </h4>
                                                            <span className="apple-badge apple-badge-blue text-[9px] px-1 py-0 flex-shrink-0">
                                                                {c.role === 'STUDENT' ? 'Étudiant' : c.role === 'TEACHER' ? 'Enseignant' : 'Chercheur'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-[#86868b] font-semibold truncate leading-none mt-1">
                                                            {c.profile?.headline || 'Membre du réseau Scholar'}
                                                        </p>
                                                        <p className="text-[9px] text-[#86868b]/75 font-semibold truncate leading-none mt-0.5">
                                                            {c.profile?.institution || 'IGA Casablanca'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Link 
                                                        to={`/profile/${c.id}`}
                                                        onClick={() => setShowConnectionsModal(false)}
                                                        className="h-[28px] px-3.5 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[10px] font-bold text-[#1d1d1f] transition-all flex items-center justify-center text-decoration-none shadow-apple-xs border-none cursor-pointer"
                                                    >
                                                        Profil
                                                    </Link>
                                                    <Link 
                                                        to="/chat"
                                                        onClick={() => setShowConnectionsModal(false)}
                                                        className="h-[28px] w-[28px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all flex items-center justify-center text-decoration-none shadow-apple-xs border-none cursor-pointer"
                                                        title="Envoyer un message"
                                                    >
                                                        <span className="material-symbols-outlined text-[15px]">send</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX MODAL: GESTION DES LANGUES */}
            {showLanguageModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-xs z-50 flex justify-end animate-fadeIn" onClick={() => setShowLanguageModal(false)}>
                    <div 
                        className="bg-white h-full w-full max-w-sm p-6 shadow-apple-xl border-l border-black/5 overflow-y-auto flex flex-col justify-start gap-6 anim-slide-left text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-md font-bold text-[#1d1d1f] tracking-tight">Gérer les langues</h3>
                                <button 
                                    onClick={() => setShowLanguageModal(false)} 
                                    className="w-[30px] h-[30px] rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-all press-effect"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            {/* List of current languages */}
                            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 mb-4 scrollbar-thin">
                                {languages && languages.length > 0 ? (
                                    languages.map((l, index) => (
                                        <div key={index} className="flex justify-between items-center p-2.5 bg-[#f5f5f7] rounded-[12px] border border-black/5">
                                            <div className="text-left">
                                                <p className="text-xs font-bold text-[#1d1d1f] leading-none">{l.language}</p>
                                                <p className="text-[10px] text-[#86868b] font-semibold leading-none mt-1">{l.level}</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    showConfirm("Êtes-vous sûr de vouloir retirer cette langue ?", () => {
                                                        const updated = languages.filter((_, idx) => idx !== index);
                                                        setLanguages(updated);
                                                    });
                                                }}
                                                className="w-6 h-6 rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-[#ff3b30] flex items-center justify-center shadow-sm transition-all press-effect"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic py-2">Aucune langue renseignée. Ajoutez-en une ci-dessous.</p>
                                )}
                            </div>

                            {/* Form to add a new language */}
                            <div className="bg-[#f5f5f7] p-3 rounded-[16px] border border-black/5 space-y-3 mb-4">
                                <p className="text-[10px] font-bold text-[#0071e3] uppercase tracking-wider">Ajouter une langue</p>
                                
                                <div>
                                    <label className="block text-[8px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Nom de la langue</label>
                                    <input 
                                        type="text" 
                                        className="w-full h-[36px] px-3 bg-white rounded-[8px] focus:outline-[#0071e3] border border-[#d2d2d7] text-xs font-semibold text-[#1d1d1f]"
                                        value={newLangName}
                                        onChange={e => setNewLangName(e.target.value)}
                                        placeholder="Ex: Espagnol, Allemand..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-[8px] font-bold text-[#86868b] uppercase mb-1 ml-0.5">Niveau de maîtrise</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsLangLevelOpen(!isLangLevelOpen)}
                                            className="w-full h-[36px] px-3 bg-white border border-[#d2d2d7] hover:border-[#86868b] focus:border-[#0071e3] rounded-[8px] text-xs outline-none transition-all cursor-pointer shadow-sm font-semibold flex items-center justify-between text-[#1d1d1f]"
                                        >
                                            <span>{newLangLevel}</span>
                                            <span className="material-symbols-outlined text-[15px] text-gray-400 transition-transform duration-200" style={{ transform: isLangLevelOpen ? 'rotate(180deg)' : 'none' }}>
                                                expand_more
                                            </span>
                                        </button>

                                        {isLangLevelOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsLangLevelOpen(false)} />
                                                <div className="absolute left-0 right-0 mt-1 bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-xs">
                                                    {['Natif', 'Professionnel', 'Bilingue', 'Courant', 'Avancé'].map((level) => (
                                                        <button
                                                            key={level}
                                                            type="button"
                                                            onClick={() => {
                                                                setNewLangLevel(level);
                                                                setIsLangLevelOpen(false);
                                                            }}
                                                            className={`w-full px-3 py-2 text-left hover:bg-[#0071e3]/5 transition-colors flex items-center justify-between ${
                                                                newLangLevel === level ? 'text-[#0071e3] bg-[#0071e3]/5 font-bold' : 'text-[#1d1d1f]'
                                                            }`}
                                                        >
                                                            <span>{level}</span>
                                                            {newLangLevel === level && (
                                                                <span className="material-symbols-outlined text-[14px] text-[#0071e3]">check</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (!newLangName.trim()) {
                                            addToast("Veuillez saisir le nom de la langue.", "warning");
                                            return;
                                        }
                                        if (languages.some(l => l.language.toLowerCase() === newLangName.trim().toLowerCase())) {
                                            addToast("Cette langue existe déjà.", "warning");
                                            return;
                                        }
                                        setLanguages([...languages, { language: newLangName.trim(), level: newLangLevel }]);
                                        setNewLangName('');
                                        setNewLangLevel('Natif');
                                    }}
                                    className="w-full h-[32px] rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all press-effect shadow-apple-xs"
                                >
                                    Ajouter à la liste
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={async () => {
                                    try {
                                        const payload = { languages };
                                        if (isPublicView && currentUser?.role === 'ADMIN') {
                                            payload.user_id = id;
                                        }
                                        await api.post('/profile/update', payload);
                                        setShowLanguageModal(false);
                                        addToast("Langues mises à jour !", "success");
                                    } catch (err) {
                                        addToast("Erreur lors de la sauvegarde.", "error");
                                    }
                                }}
                                className="flex-grow h-[38px] rounded-full bg-[#34c759] hover:bg-[#28b248] text-white text-xs font-semibold press-effect shadow-apple-sm"
                            >
                                Sauvegarder en BD
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowLanguageModal(false)} 
                                className="h-[38px] px-5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] text-xs font-semibold press-effect"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POST CREATION MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-[20px] shadow-apple-xl max-w-lg w-full overflow-hidden anim-scale-in flex flex-col relative">
                        
                        {/* Premium Upload Progress Overlay */}
                        {posting && (
                            <div 
                                className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-fadeIn" 
                                style={{ borderRadius: '20px' }}
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
                        
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '.5px solid rgba(0,0,0,.08)' }}>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#0071e3] text-[22px]">edit_note</span>
                                <h3 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight">Créer un post académique</h3>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 border-none cursor-pointer p-0"
                            >
                                <X style={{ width: 14, height: 14 }} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="p-5 flex flex-col gap-4">
                            
                            {/* User Identity and Post Type Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#e8e8ed', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {currentUser?.profile?.photo_url ? (
                                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${currentUser.profile.photo_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                    ) : (
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#86868b' }}>
                                            {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                                        </span>
                                    )}
                                </div>
                                <div className="text-left relative">
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f' }}>
                                        {currentUser?.first_name} {currentUser?.last_name}
                                    </h4>
                                    
                                    {/* Custom dropdown trigger */}
                                    <div className="relative mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsPostTypeOpen(!isPostTypeOpen)}
                                            className="px-2.5 py-1 bg-[#f5f5f7] border border-black/5 hover:border-black/10 rounded-full text-[10px] font-bold text-[#6e6e73] hover:text-[#1d1d1f] transition-all flex items-center gap-1 cursor-pointer select-none"
                                        >
                                            <span>{newPost.type === 'SCIENTIFIC_ARTICLE' ? '🎓 Article Scientifique' : newPost.type === 'UNIVERSITY_PROJECT' ? '🔬 Projet Académique' : '🌐 Général'}</span>
                                            <span className="material-symbols-outlined text-[12px] transition-transform duration-200" style={{ transform: isPostTypeOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                                        </button>

                                        {isPostTypeOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsPostTypeOpen(false)} />
                                                <div className="absolute left-0 mt-1 min-w-[150px] bg-white border border-black/5 rounded-[10px] shadow-apple-lg py-1 z-50 animate-fadeIn text-[#1d1d1f] font-semibold text-[11px] text-left">
                                                    {[
                                                        { value: 'GENERAL', label: 'Général' },
                                                        { value: 'UNIVERSITY_PROJECT', label: 'Projet Académique' },
                                                        ...((['TEACHER', 'RESEARCHER'].includes(currentUser?.role)) ? [{ value: 'SCIENTIFIC_ARTICLE', label: 'Article Scientifique' }] : [])
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

                                {/* AI Assist Button */}
                                <button
                                    type="button"
                                    onClick={handleAssistPost}
                                    disabled={assistingPost || !newPost.content.trim()}
                                    className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 bg-[#e8f0fe] hover:bg-[#c8e2ff] disabled:opacity-50 disabled:cursor-not-allowed text-[#0071e3] rounded-full text-[11px] font-bold transition-all press-effect border-none cursor-pointer"
                                >
                                    {assistingPost ? (
                                        <div className="w-3.5 h-3.5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    <span>Améliorer avec l'IA ✨</span>
                                </button>
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
                                className="w-full bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white border border-transparent focus:border-[#0071e3] rounded-[14px] p-3.5 text-sm outline-none transition-all duration-200 resize-none min-h-[120px]"
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
                                        id="modal-profile-images" 
                                        className="hidden" 
                                        multiple
                                        accept="image/*"
                                        disabled={newPost.mediaType !== null && newPost.mediaType !== 'IMAGE'}
                                        onChange={(e) => {
                                            const rawFiles = Array.from(e.target.files);
                                            if (rawFiles.length > 5) {
                                                addToast("Vous ne pouvez pas ajouter plus de 5 images.", "error");
                                            }
                                            const selectedFiles = rawFiles.slice(0, 5);
                                            const oversized = selectedFiles.some(f => f.size > 20 * 1024 * 1024);
                                            if (oversized) {
                                                addToast("Chaque image ne doit pas dépasser 20 Mo.", "error");
                                                return;
                                            }
                                            setNewPost({ ...newPost, mediaType: 'IMAGE', files: selectedFiles, file: null });
                                        }}
                                    />
                                    <label 
                                        htmlFor="modal-profile-images" 
                                        className={`ap-icon-btn ${newPost.mediaType !== null && newPost.mediaType !== 'IMAGE' ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        title="Ajouter des images (max 5)"
                                        style={{ background: '#f5f5f7', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (newPost.mediaType !== null && newPost.mediaType !== 'IMAGE') ? 'not-allowed' : 'pointer' }}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">image</span>
                                    </label>

                                    <input 
                                        type="file" 
                                        id="modal-profile-video" 
                                        className="hidden" 
                                        accept="video/*"
                                        disabled={newPost.mediaType !== null && newPost.mediaType !== 'VIDEO'}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 100 * 1024 * 1024) {
                                                    addToast("La vidéo ne doit pas dépasser 100 Mo.", "error");
                                                    return;
                                                }
                                                setNewPost({ ...newPost, mediaType: 'VIDEO', file: file, files: [] });
                                            }
                                        }}
                                    />
                                    <label 
                                        htmlFor="modal-profile-video" 
                                        className={`ap-icon-btn ${newPost.mediaType !== null && newPost.mediaType !== 'VIDEO' ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        title="Ajouter une vidéo (max 1)"
                                        style={{ background: '#f5f5f7', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (newPost.mediaType !== null && newPost.mediaType !== 'VIDEO') ? 'not-allowed' : 'pointer' }}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">smart_display</span>
                                    </label>

                                    <input 
                                        type="file" 
                                        id="modal-profile-pdf" 
                                        className="hidden" 
                                        accept="application/pdf"
                                        disabled={newPost.mediaType !== null && newPost.mediaType !== 'PDF'}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 20 * 1024 * 1024) {
                                                    addToast("Le document PDF ne doit pas dépasser 20 Mo.", "error");
                                                    return;
                                                }
                                                setNewPost({ ...newPost, mediaType: 'PDF', file: file, files: [] });
                                            }
                                        }}
                                    />
                                    <label 
                                        htmlFor="modal-profile-pdf" 
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
                                    className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full text-xs font-bold transition-all press-effect border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Profile;
