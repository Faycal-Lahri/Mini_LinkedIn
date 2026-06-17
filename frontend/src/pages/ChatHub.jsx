import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import { 
  Send, Paperclip, FileText, ChevronRight, Search, Plus, X, 
  MessageSquare, FolderGit2, BookOpen, Users, CornerDownRight,
  MessageCircle, ChevronDown
} from 'lucide-react';

const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to format channel time dynamically
const formatChannelTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const today = new Date();
  const diffMs = today - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (d.toDateString() === today.toDateString()) {
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}min`;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// Relative time for message timestamps (like WhatsApp)
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Center Date Dividers like WhatsApp/iMessage
const DateDivider = ({ date }) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dateText = '';
  if (d.toDateString() === today.toDateString()) {
    dateText = "Aujourd'hui";
  } else if (d.toDateString() === yesterday.toDateString()) {
    dateText = "Hier";
  } else {
    dateText = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  return (
    <div className="flex items-center justify-center my-5 select-none animate-fadeIn gap-3">
      <div className="flex-1 h-[1px] bg-black/[0.06]" />
      <span className="bg-white border border-black/[0.06] text-[#86868b] text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-apple-xs whitespace-nowrap">
        {dateText}
      </span>
      <div className="flex-1 h-[1px] bg-black/[0.06]" />
    </div>
  );
};

const renderDateDivider = (currentMsg, prevMsg) => {
  if (!currentMsg) return null;
  const currentDate = new Date(currentMsg.created_at).toDateString();
  const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;

  if (currentDate !== prevDate) {
    return <DateDivider date={currentMsg.created_at} />;
  }
  return null;
};

// URL Link Parser to render clickable links in chat bubbles
const renderMessageContent = (text, isMe) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`underline font-bold break-all ${isMe ? 'text-white hover:text-white/80' : 'text-[#0071e3] hover:text-[#0077ed]'}`}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Custom Attachment Renderer supporting Images, Videos, and PDFs
const renderAttachment = (fileUrl, content, isMe) => {
  if (!fileUrl) return null;
  const isBlob = fileUrl.startsWith('blob:');
  
  // Detect file type
  const isImage = isBlob || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = fileUrl.match(/\.pdf$/i);
  const isVideo = fileUrl.match(/\.(mp4|webm|ogg)$/i);
  
  const fullUrl = isBlob ? fileUrl : `${STORAGE}/storage/${fileUrl}`;
  const filename = isBlob ? 'Fichier joint' : (fileUrl.split('/').pop() || 'Document');
  
  if (isImage) {
    return (
      <div className={`mt-2 rounded-lg overflow-hidden cursor-zoom-in max-w-[280px] ${content && content.trim() !== '' ? 'pt-2 border-t border-white/10' : ''}`}>
        <img 
          src={fullUrl} 
          alt="Attachment" 
          className="max-w-full rounded-md object-contain hover:scale-[1.01] transition-transform duration-300 block"
        />
      </div>
    );
  } else if (isVideo) {
    return (
      <div className={`mt-2 rounded-lg overflow-hidden max-w-[280px] ${content && content.trim() !== '' ? 'pt-2 border-t border-white/10' : ''}`}>
        <video 
          src={fullUrl} 
          controls 
          className="w-full rounded-md max-h-[200px] object-cover block"
        />
      </div>
    );
  } else if (isPdf) {
    return (
      <div className={`mt-2 p-3 rounded-lg flex items-center justify-between gap-3 border text-left ${
        isMe 
        ? 'bg-white/10 border-white/20 text-white' 
        : 'bg-[#f5f5f7] border-black/5 text-[#1d1d1f]'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-6 h-6 shrink-0 text-red-500" />
          <div className="min-w-0">
            <p className="text-xs font-bold truncate leading-tight">{filename}</p>
            <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>Document PDF</p>
          </div>
        </div>
        <a 
          href={fullUrl} 
          target="_blank" 
          rel="noreferrer" 
          className={`h-[24px] px-3 rounded-full font-bold text-[10px] flex items-center justify-center transition-all shrink-0 text-decoration-none border ${
            isMe 
            ? 'bg-white text-[#0071e3] hover:bg-white/95 border-transparent' 
            : 'bg-[#0071e3] text-white hover:bg-[#0077ed] border-transparent'
          }`}
        >
          Ouvrir
        </a>
      </div>
    );
  } else {
    return (
      <div className={`mt-2 p-3 rounded-lg flex items-center justify-between gap-3 border text-left ${
        isMe 
        ? 'bg-white/10 border-white/20 text-white' 
        : 'bg-[#f5f5f7] border-black/5 text-[#1d1d1f]'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="w-6 h-6 shrink-0 text-blue-500" />
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold truncate leading-tight">{filename}</p>
            <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>Document</p>
          </div>
        </div>
        <a 
          href={fullUrl} 
          target="_blank" 
          rel="noreferrer" 
          className={`h-[24px] px-3 rounded-full font-bold text-[10px] flex items-center justify-center transition-all shrink-0 text-decoration-none border ${
            isMe 
            ? 'bg-white text-[#0071e3] hover:bg-white/95 border-transparent' 
            : 'bg-[#0071e3] text-white hover:bg-[#0077ed] border-transparent'
          }`}
        >
          Télécharger
        </a>
      </div>
    );
  }
};

// Selection Connection Modal (Premium Apple Design)
const NewMessageModal = ({ isOpen, onClose, onSelect, connections, loading }) => {
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;

  const filtered = connections.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white border border-black/5 rounded-[22px] w-full max-w-md overflow-hidden shadow-apple-lg animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-white">
          <h3 className="text-[14.5px] font-bold tracking-tight text-[#1d1d1f]">Nouveau message</h3>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-colors border-none cursor-pointer"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] w-4.5 h-4.5" />
            <input 
              type="text" 
              placeholder="Rechercher une connexion..."
              className="w-full h-[36px] bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white border border-transparent focus:border-[#0071e3] rounded-[10px] pl-9 pr-3 text-xs outline-none transition-all focus:ring-4 focus:ring-[#0071e3]/12 font-medium text-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-100 border-t-[#0071e3] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-xs text-gray-400 font-bold uppercase tracking-wider">
                Aucune connexion trouvée
              </p>
            ) : (
              filtered.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[12px] hover:bg-black/[0.03] transition-all text-left border-none bg-transparent cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 border border-black/5 flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold text-gray-500">
                    {contact.profile?.photo_url ? (
                      <img src={`${STORAGE}/storage/${contact.profile.photo_url}`} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} alt="" />
                    ) : (
                      `${contact.first_name[0]}${contact.last_name[0]}`
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-xs text-[#1d1d1f] truncate leading-none mb-1">{contact.first_name} {contact.last_name}</p>
                    <p className="text-[9.5px] text-[#86868b] font-semibold truncate uppercase tracking-wide">{contact.profile?.biography?.split('\n')[0] || contact.role || 'Membre'}</p>
                  </div>
                  <ChevronRight className="text-gray-300 w-4 h-4 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function ChatHub() {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState({
    global: [],
    private: [],
    project: [],
    article: []
  });
  const [activeCategory, setActiveCategory] = useState('private');
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [allConnections, setAllConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const menuItems = [
    { id: 'private', icon: MessageSquare, label: 'Messages Directs' },
    { id: 'global', icon: Users, label: 'Général' },
    { id: 'project', icon: FolderGit2, label: 'Projets' },
    { id: 'article', icon: BookOpen, label: 'Articles' },
  ];

  // Quick replies suggestion list
  const quickReplies = ["Bonjour ! 👋", "Merci !", "D'accord 👍", "Super !", "Je regarde ça de suite", "À tout à l'heure"];

  const fetchChannels = async () => {
    try {
      const res = await api.get('/chat/channels');
      setCategories(res.data);
      return res.data;
    } catch (error) {
      console.error("Failed to load channels", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    const interval = setInterval(fetchChannels, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeChannel) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/channels/${activeChannel.id}/messages`);
        setMessages(res.data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  // Scroll to bottom when messages change (only if already near bottom)
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('smooth');
    } else {
      setShowScrollBtn(true);
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Scroll instantly when switching channels
  useEffect(() => {
    if (activeChannel) {
      setIsAtBottom(true);
      setShowScrollBtn(false);
      setTimeout(() => scrollToBottom('instant'), 50);
    }
  }, [activeChannel?.id, scrollToBottom]);

  const handleScroll = useCallback((e) => {
    const el = e.target;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distFromBottom < 60;
    setIsAtBottom(atBottom);
    setShowScrollBtn(!atBottom);
  }, []);

  const handleSendMessage = async (e, textToSendOverride = null) => {
    if (e) e.preventDefault();
    const contentText = textToSendOverride !== null ? textToSendOverride : newMessage;
    if ((!contentText.trim() && !attachedFile) || !activeChannel) return;

    setSending(true);
    const tempId = Date.now();
    const localFileUrl = attachedFile ? URL.createObjectURL(attachedFile) : null;
    const tempMessage = {
      id: tempId,
      content: contentText,
      sender: user,
      created_at: new Date().toISOString(),
      file_url: localFileUrl,
      isOptimistic: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setIsAtBottom(true);
    setShowScrollBtn(false);
    setTimeout(() => scrollToBottom('smooth'), 30);
    
    const contentToSend = contentText;
    const fileToSend = attachedFile;
    
    if (textToSendOverride === null) {
      setNewMessage('');
    }
    setAttachedFile(null);

    try {
      let res;
      if (fileToSend) {
        const formData = new FormData();
        formData.append('content', contentToSend || ' ');
        formData.append('file', fileToSend);
        res = await api.post(`/chat/channels/${activeChannel.id}/messages`, formData);
      } else {
        res = await api.post(`/chat/channels/${activeChannel.id}/messages`, { content: contentToSend });
      }
      
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
      if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const openNewChatModal = async () => {
    setIsNewChatModalOpen(true);
    setLoadingConnections(true);
    try {
      const res = await api.get('/network/connections');
      setAllConnections(res.data);
    } catch (error) {
      console.error("Failed to fetch connections", error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleSelectConnection = async (otherUser) => {
    try {
      const res = await api.post(`/chat/private/${otherUser.id}`);
      const newChannel = res.data;
      await fetchChannels();
      setActiveCategory('private');
      setActiveChannel(newChannel);
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error("Failed to start private chat", error);
    }
  };

  if (loading) return <BrandLoader />;

  const currentChannels = categories[activeCategory] || [];
  const filteredChannels = currentChannels.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f2ee] font-sans">
      <Navbar />

      <div className="flex-1 flex flex-row overflow-hidden" style={{ height: 'calc(100vh - 52px)' }}>
        
        {/* 1. Category Sidebar (Premium Light Theme) */}
        <div className="w-[76px] bg-[#f5f5f7] border-r border-[#e8e8ed] flex flex-col items-center py-5 gap-4 flex-shrink-0 z-20">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveCategory(item.id);
                  setActiveChannel(null);
                }}
                className={`w-15 h-15 rounded-xl flex flex-col items-center justify-center transition-all relative cursor-pointer border-none outline-none focus:outline-none ${
                  isActive 
                  ? 'bg-[#e8f0fe] text-[#0071e3] shadow-sm' 
                  : 'text-[#6e6e73] bg-transparent hover:bg-black/[0.03] hover:text-[#1d1d1f]'
                }`}
                title={item.label}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-[3.5px] bg-[#0071e3] rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0071e3]' : 'text-[#6e6e73]'}`} />
                <span className={`text-[9px] font-bold mt-1.5 tracking-tight leading-none ${isActive ? 'text-[#0071e3]' : 'text-[#86868b]'}`}>
                  {item.id === 'private' ? 'Directs' : item.id === 'global' ? 'Général' : item.id === 'project' ? 'Projets' : 'Articles'}
                </span>
                {categories[item.id]?.length > 0 && !isActive && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff3b30] rounded-full border border-[#f5f5f7] animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* 2. Contacts / Channels Sidebar */}
        <aside className="w-80 bg-white border-r border-[#e8e8ed] flex flex-col flex-shrink-0 overflow-hidden z-10">
          <div className="p-4 border-b border-black/[0.05] space-y-3.5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#1d1d1f] uppercase tracking-wider">
                {activeCategory === 'private' ? 'Messagerie' : menuItems.find(m => m.id === activeCategory)?.label}
              </h3>
              <button 
                onClick={openNewChatModal}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-[#0071e3] transition-colors border-none cursor-pointer"
                title="Nouvelle discussion"
              >
                <Plus className="w-[18px] h-[18px]" />
              </button>
            </div>
            
            {/* Search input bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b] w-4 h-4" />
              <input 
                type="text" 
                placeholder="Rechercher une discussion..."
                className="w-full h-[34px] bg-[#f5f5f7] hover:bg-[#ebebeb] focus:bg-white focus:border-[#0071e3] border border-transparent focus:ring-4 focus:ring-[#0071e3]/12 rounded-[10px] pl-9 pr-3 text-xs outline-none transition-all duration-200 font-medium text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List of discussions */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-none">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12 opacity-30 select-none">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Aucune discussion</p>
              </div>
            ) : (
              <>
                {activeCategory === 'private' && (
                  <p className="px-3 pb-2 text-[9px] font-bold text-[#86868b] uppercase tracking-widest text-left select-none">Récents</p>
                )}
                {activeCategory === 'article' && (
                  <p className="px-3 pb-2 text-[9px] font-bold text-[#86868b] uppercase tracking-widest text-left select-none">{filteredChannels.length} article{filteredChannels.length > 1 ? 's' : ''} scientifique{filteredChannels.length > 1 ? 's' : ''}</p>
                )}

                {filteredChannels.map(c => {
                  const isActive = activeChannel?.id === c.id;
                  const isArticle = activeCategory === 'article';
                  const ap = c.article_post;

                  // ── ARTICLE CARD ──────────────────────────────────────
                  if (isArticle) {
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveChannel(c)}
                        className={`w-full flex gap-3 p-3 rounded-xl transition-all text-left border-none bg-transparent cursor-pointer outline-none focus:outline-none ${
                          isActive
                            ? 'bg-[#e8f0fe] border-l-[3px] border-l-[#0071e3] pl-[9.5px]'
                            : 'hover:bg-black/[0.03]'
                        }`}
                      >
                        {/* Author photo / Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-100 border border-black/5 flex items-center justify-center font-bold text-[#86868b] overflow-hidden text-xs uppercase shadow-apple-xs">
                            {ap?.author?.photo_url ? (
                              <img
                                src={`${STORAGE}/storage/${ap.author.photo_url}`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                              />
                            ) : ap?.author ? (
                              <span>{ap.author.first_name[0]}{ap.author.last_name[0]}</span>
                            ) : (
                              <BookOpen className="w-5 h-5 text-[#86868b]" />
                            )}
                          </div>
                        </div>

                        <div className="flex-grow min-w-0">
                          {/* Article title */}
                          <p className={`text-[12px] font-bold leading-tight truncate ${
                            isActive ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
                          }`}>
                            {ap?.article_title || c.name}
                          </p>

                          {/* Journal badge */}
                          {ap?.journal && (
                            <p className="text-[9.5px] text-[#5856d6] font-bold truncate mt-0.5 uppercase tracking-wide">
                              {ap.journal}
                            </p>
                          )}

                          {/* Author + last message */}
                          <p className="text-[10.5px] text-[#86868b] truncate mt-0.5 font-medium">
                            {c.description
                              ? c.description
                              : ap?.author
                                ? `Par ${ap.author.first_name} ${ap.author.last_name}`
                                : 'Aucun message'}
                          </p>
                        </div>

                        {/* Time */}
                        <span className="text-[9.5px] text-[#86868b] font-medium shrink-0 mt-0.5">
                          {formatChannelTime(c.last_message_at || c.updated_at)}
                        </span>
                      </button>
                    );
                  }

                  // ── DEFAULT CARD (private / global / project) ─────────
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannel(c)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border-none bg-transparent cursor-pointer relative outline-none focus:outline-none ${
                        isActive
                          ? 'bg-[#e8f0fe] border-l-[3.5px] border-l-[#0071e3] pl-[9.5px]'
                          : 'hover:bg-black/[0.03]'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-black/5 flex items-center justify-center font-bold text-[#86868b] overflow-hidden text-xs uppercase shadow-apple-xs">
                          {c.other_user?.profile?.photo_url ? (
                            <img
                              src={`${STORAGE}/storage/${c.other_user.profile.photo_url}`}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                            />
                          ) : (
                            <span>{c.name.charAt(0)}</span>
                          )}
                        </div>
                        {activeCategory === 'private' && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#34c759] rounded-full border-2 border-white ring-1 ring-white" />
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`font-bold text-xs truncate ${isActive ? 'text-[#0071e3]' : 'text-black/90'}`}>
                            {c.name}
                          </span>
                          <span className="text-[10px] text-[#86868b] font-semibold shrink-0">
                            {formatChannelTime(c.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-[11.5px] truncate font-medium ${
                            c.unread_count > 0 ? 'text-[#1d1d1f] font-bold' : 'text-[#6e6e73]'
                          }`}>
                            {c.description || 'Cliquez pour démarrer la discussion...'}
                          </p>
                          {c.unread_count > 0 && (
                            <div className="w-4.5 h-4.5 rounded-full bg-[#0071e3] flex items-center justify-center shrink-0 shadow-apple-xs">
                              <span className="text-[8.5px] text-white font-extrabold">{c.unread_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        {/* 3. Main Chat Viewport */}
        <main className="flex-grow bg-[#f4f2ee] flex flex-col overflow-hidden relative">
          {activeChannel ? (
            <>
              {/* Header — adapts to channel type */}
              {activeChannel.type === 'ARTICLE' && activeChannel.article_post ? (
                // ── ARTICLE HEADER ───────────────────────────────────────
                <header className="px-5 py-3 border-b border-black/[0.06] bg-white/95 backdrop-blur-md z-10">
                  <div className="flex items-start gap-3">
                    {/* Author photo / Avatar */}
                    <div className="w-10 h-10 rounded-full border border-black/5 overflow-hidden bg-gray-100 flex items-center justify-center font-bold text-[#86868b] text-xs uppercase shadow-apple-sm flex-shrink-0">
                      {activeChannel.article_post.author?.photo_url ? (
                        <img
                          src={`${STORAGE}/storage/${activeChannel.article_post.author.photo_url}`}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                        />
                      ) : activeChannel.article_post.author ? (
                        <span>{activeChannel.article_post.author.first_name[0]}{activeChannel.article_post.author.last_name[0]}</span>
                      ) : (
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      {/* Title */}
                      <h3 className="font-bold text-[13px] text-[#1d1d1f] leading-snug line-clamp-2">
                        {activeChannel.article_post.article_title || activeChannel.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                        {/* Journal */}
                        {activeChannel.article_post.journal && (
                          <span className="text-[10px] font-bold text-[#5856d6] uppercase tracking-wide">
                            {activeChannel.article_post.journal}
                          </span>
                        )}
                        {/* Author */}
                        {activeChannel.article_post.author && (
                          <span className="text-[10.5px] text-[#86868b] font-medium">
                            {activeChannel.article_post.author.first_name} {activeChannel.article_post.author.last_name}
                          </span>
                        )}
                        {/* DOI */}
                        {activeChannel.article_post.doi && (
                          <a
                            href={`https://doi.org/${activeChannel.article_post.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9.5px] text-[#0071e3] font-bold hover:underline uppercase tracking-wide"
                          >
                            DOI ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </header>
              ) : (
                // ── DEFAULT HEADER (Private / Global / Project) ──────────
                <header className="h-[56px] px-6 flex items-center justify-between border-b border-black/[0.06] bg-white/90 backdrop-blur-md z-10 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-black/5 overflow-hidden flex items-center justify-center bg-gray-100 text-xs font-semibold shadow-apple-xs">
                      {activeChannel.other_user?.profile?.photo_url ? (
                        <img
                          src={`${STORAGE}/storage/${activeChannel.other_user.profile.photo_url}`}
                          alt={activeChannel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                        />
                      ) : (
                        <span className="text-[#86868b] font-bold text-sm">{activeChannel.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[13.5px] text-[#1d1d1f] leading-none">
                          {activeChannel.name}
                        </h3>
                        {activeChannel.other_user?.role && (
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                            activeChannel.other_user.role === 'TEACHER'    ? 'bg-[#af52de]/10 text-[#af52de]' :
                            activeChannel.other_user.role === 'RESEARCHER' ? 'bg-[#0071e3]/10 text-[#0071e3]' :
                            'bg-[#34c759]/10 text-[#34c759]'
                          }`}>
                            {activeChannel.other_user.role === 'TEACHER' ? 'Enseignant' :
                             activeChannel.other_user.role === 'RESEARCHER' ? 'Chercheur' : 'Étudiant'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-[#34c759] rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-[#34c759] uppercase tracking-wider">Actif maintenant</span>
                      </div>
                    </div>
                  </div>
                </header>
              )}

              {/* Abstract banner — shown for article channels */}
              {activeChannel.type === 'ARTICLE' && activeChannel.article_post?.abstract && (
                <div className="px-5 py-3 bg-[#f5f5f7] border-b border-black/[0.05] text-left">
                  <p className="text-[9px] font-bold text-[#86868b] uppercase tracking-widest mb-1">Résumé de l&apos;article</p>
                  <p className="text-[11.5px] text-[#48484a] font-medium leading-relaxed line-clamp-3">
                    {activeChannel.article_post.abstract}
                  </p>
                  {activeChannel.article_post.keywords && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeChannel.article_post.keywords.split(',').slice(0, 5).map((kw, i) => (
                        <span key={i} className="text-[9px] bg-[#0071e3]/8 text-[#0071e3] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-[#0071e3]/12">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages Space — scrollable container */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar bg-[#f4f2ee] relative"
                style={{ scrollBehavior: 'auto' }}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center select-none opacity-40">
                    {activeChannel.type === 'ARTICLE' ? (
                      <>
                        <div className="w-14 h-14 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-2xl flex items-center justify-center mb-4 shadow-apple-md">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <p className="font-bold text-[13px] text-[#1d1d1f]">Aucun commentaire pour l&apos;instant</p>
                        <p className="text-[11px] text-[#86868b] mt-1 font-medium">Soyez le premier à discuter de cet article !</p>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="font-bold uppercase tracking-wider text-xs text-gray-400">Début de la conversation</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col space-y-0.5 min-h-full justify-end">
                    {messages.map((m, idx) => {
                      const isMe = m.sender?.id === user?.id;
                      const prevMessage = idx > 0 ? messages[idx - 1] : null;
                      const nextMessage = idx < messages.length - 1 ? messages[idx + 1] : null;
                      const isLast = idx === messages.length - 1;

                      // Grouping: consecutive messages from same sender within 2 min
                      const isConsecutive = prevMessage &&
                        prevMessage.sender?.id === m.sender?.id &&
                        (new Date(m.created_at) - new Date(prevMessage.created_at) < 2 * 60 * 1000);

                      // Show timestamp below last message of a group
                      const isLastInGroup = !nextMessage ||
                        nextMessage.sender?.id !== m.sender?.id ||
                        (new Date(nextMessage.created_at) - new Date(m.created_at) >= 2 * 60 * 1000);

                      const showAvatar = !isMe && !isConsecutive;

                      return (
                        <React.Fragment key={m.id}>
                          {/* Date Divider */}
                          {renderDateDivider(m, prevMessage)}

                          <div className={`flex items-end gap-2 ${
                            isMe ? 'flex-row-reverse justify-start' : 'justify-start'
                          } ${isConsecutive ? 'mt-0.5' : 'mt-4'} animate-fadeInUp`}>

                            {/* Avatar (other user) */}
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-black/5 bg-[#f5f5f7] flex items-center justify-center text-[10px] font-bold">
                                {showAvatar ? (
                                  m.sender?.profile?.photo_url ? (
                                    <img
                                      src={`${STORAGE}/storage/${m.sender.profile.photo_url}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }}
                                      alt=""
                                    />
                                  ) : (
                                    <span className="text-[#86868b] uppercase">{m.sender?.first_name?.charAt(0)}</span>
                                  )
                                ) : (
                                  <div className="opacity-0 w-full h-full" />
                                )}
                              </div>
                            )}

                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[68%]`}>
                              {/* Sender name (first of group, not me) */}
                              {!isMe && !isConsecutive && (
                                <span className="text-[10px] font-bold text-[#86868b] mb-1 ml-1 tracking-tight">
                                  {m.sender?.first_name} {m.sender?.last_name}
                                </span>
                              )}

                              {/* Bubble */}
                              <div className={`px-4 py-2.5 shadow-apple-xs transition-all ${
                                isMe
                                  ? 'bg-[#0071e3] text-white rounded-[20px] rounded-br-[5px]'
                                  : 'bg-white text-[#1d1d1f] border border-black/[0.06] rounded-[20px] rounded-tl-[5px]'
                              }`}>
                                {m.content && m.content.trim() !== '' && (
                                  <p className="text-[13.5px] font-[450] leading-[1.5]">
                                    {renderMessageContent(m.content, isMe)}
                                  </p>
                                )}
                                {renderAttachment(m.file_url, m.content, isMe)}
                              </div>

                              {/* Timestamp — shown below last bubble of a group */}
                              {isLastInGroup && (
                                <div className={`flex items-center gap-1 mt-1 px-1 ${ isMe ? 'flex-row-reverse' : '' }`}>
                                  <span className="text-[10px] text-[#86868b] font-medium">
                                    {formatMessageTime(m.created_at)}
                                  </span>
                                  {isMe && isLast && (
                                    <span className="text-[9px] text-[#34c759] font-bold uppercase tracking-wide">✓ Envoyé</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {/* Anchor for scroll */}
                    <div id="chat-end" style={{ height: 1 }} />
                  </div>
                )}
              </div>

              {/* Floating scroll-to-bottom button */}
              {showScrollBtn && (
                <button
                  onClick={() => { setIsAtBottom(true); setShowScrollBtn(false); scrollToBottom('smooth'); }}
                  className="absolute bottom-[140px] right-6 w-9 h-9 bg-white border border-black/[0.08] rounded-full shadow-apple-md flex items-center justify-center text-[#0071e3] hover:bg-[#f5f5f7] transition-all cursor-pointer z-20 animate-fadeIn"
                  title="Aller au dernier message"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}

              {/* Suggestions Quick Replies (LinkedIn/Apple Premium Style) */}
              <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto bg-transparent scrollbar-none select-none">
                {quickReplies.map(qr => (
                  <button
                    key={qr}
                    onClick={(e) => handleSendMessage(e, qr)}
                    className="px-3.5 py-1.5 bg-white border border-[#dad8d6] hover:bg-gray-50 text-[11.5px] font-bold text-[#48484a] rounded-full shrink-0 shadow-apple-xs transition-colors cursor-pointer border-none"
                  >
                    {qr}
                  </button>
                ))}
              </div>

              {/* Message Input Container */}
              <div className="p-4 bg-white border-t border-black/[0.06] flex flex-col">
                {attachedFile && (
                  <div className="mb-3 animate-fadeInUp text-left">
                    <div className="bg-[#e8f0fe] rounded-[10px] p-2 flex items-center justify-between border border-[#0071e3]/10 max-w-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-5 h-5 text-[#0071e3]" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0071e3] truncate">{attachedFile.name}</p>
                          <p className="text-[9px] text-[#86868b] uppercase font-extrabold mt-0.5">
                            {(attachedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAttachedFile(null)}
                        className="p-1 hover:bg-white rounded-full text-gray-400 hover:text-[#ff3b30] transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-[#f5f5f7] hover:bg-[#ebebeb] focus-within:bg-white focus-within:border-[#0071e3] focus-within:ring-[3.5px] focus-within:ring-[#0071e3]/12 border border-transparent rounded-full px-3 py-1.5 transition-all shadow-apple-xs">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-gray-400 hover:text-[#0071e3] rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                    title="Joindre un fichier"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={(e) => setAttachedFile(e.target.files[0])}
                  />
                  <input 
                    type="text"
                    placeholder="Saisissez un message..."
                    className="flex-grow bg-transparent border-none py-1.5 text-[13px] font-semibold focus:ring-0 outline-none text-[#1d1d1f] placeholder:text-[#86868b]"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button 
                    type="submit"
                    disabled={sending || (!newMessage.trim() && !attachedFile)}
                    className="w-[30px] h-[30px] bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-35 border-none cursor-pointer"
                  >
                    <Send className="w-4 h-4 shrink-0 text-white fill-white" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-6 select-none">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-black/5 mb-4 shadow-apple-sm text-[#0071e3]">
                <MessageSquare style={{ width: 24, height: 24 }} />
              </div>
              <h2 className="text-xs font-extrabold text-[#1d1d1f] uppercase tracking-widest">Messagerie Académique</h2>
              <p className="text-[#6e6e73] text-[11px] mt-1.5 max-w-[280px] text-center font-semibold leading-relaxed leading-normal">
                Sélectionnez une discussion dans la colonne de gauche ou lancez une nouvelle conversation en cliquant sur le bouton d'ajout.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* New Chat Modal */}
      <NewMessageModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)}
        onSelect={handleSelectConnection}
        connections={allConnections}
        loading={loadingConnections}
      />
    </div>
  );
}

export default ChatHub;
