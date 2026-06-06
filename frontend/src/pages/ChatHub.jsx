import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Navbar from '../components/Navbar';
import { BrandLoader } from '../components/Loader';
import { 
  Send, Paperclip, FileText, ChevronRight, Search, Plus, X, 
  MessageSquare, FolderGit2, BookOpen, Users, Download, CornerDownRight,
  Phone, Video, MoreVertical, MessageCircle
} from 'lucide-react';

const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to format channel time dynamically (no more hardcoded 11:30)
const formatChannelTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
    dateText = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="flex justify-center my-4 select-none animate-fadeIn">
      <span className="bg-black/5 backdrop-blur-md text-[#6e6e73] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full">
        {dateText}
      </span>
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
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
                {filteredChannels.map(c => {
                  const isActive = activeChannel?.id === c.id;
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
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#34c759] rounded-full border-2 border-white ring-1 ring-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`font-bold text-xs truncate ${isActive ? 'text-[#0071e3]' : 'text-black/90'}`}>
                            {c.name}
                          </span>
                          <span className="text-[9px] text-[#86868b] font-bold uppercase shrink-0">
                            {formatChannelTime(c.updated_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-[11.5px] truncate font-medium ${c.unread_count > 0 ? 'text-[#1d1d1f] font-bold' : 'text-[#6e6e73]'}`}>
                            {c.description || "Cliquez pour démarrer la discussion..."}
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
              {/* Frosted Glass Header */}
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
                      <span className="material-symbols-outlined text-[#86868b] text-[18px]">person</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[13.5px] text-[#1d1d1f] leading-none">
                        {activeChannel.name}
                      </h3>
                      {activeChannel.other_user?.role && (
                        <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider ${
                          activeChannel.other_user.role === 'TEACHER' ? 'bg-[#af52de]/10 text-[#af52de]' :
                          activeChannel.other_user.role === 'RESEARCHER' ? 'bg-[#0071e3]/10 text-[#0071e3]' :
                          'bg-[#34c759]/10 text-[#34c759]'
                        }`}>
                          {activeChannel.other_user.role === 'TEACHER' ? 'Enseignant' : activeChannel.other_user.role === 'RESEARCHER' ? 'Chercheur' : 'Étudiant'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-[#34c759] rounded-full animate-pulse"></span>
                      <span className="text-[9px] font-bold text-[#34c759] uppercase tracking-wider">Actif maintenant</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Call / Option triggers */}
                <div className="flex items-center gap-1 text-gray-500">
                  <button className="p-1.5 hover:bg-black/[0.04] rounded-full transition-colors border-none bg-transparent cursor-pointer text-gray-600"><Phone className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-black/[0.04] rounded-full transition-colors border-none bg-transparent cursor-pointer text-gray-600"><Video className="w-4 h-4" /></button>
                  <button className="p-1.5 hover:bg-black/[0.04] rounded-full transition-colors border-none bg-transparent cursor-pointer text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </header>

              {/* Messages Space */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 flex flex-col no-scrollbar bg-[#f4f2ee]">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 select-none">
                    <MessageCircle className="w-12 h-12 mb-2 text-gray-400" />
                    <p className="font-bold uppercase tracking-wider text-xs">Début de la conversation</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender?.id === user?.id;
                    const prevMessage = idx > 0 ? messages[idx - 1] : null;
                    
                    // Grouping logic: hide redundant avatars/labels for consecutive messages
                    const isConsecutive = prevMessage && prevMessage.sender?.id === m.sender?.id && 
                      (new Date(m.created_at) - new Date(prevMessage.created_at) < 2 * 60 * 1000);
                    
                    const showAvatar = !isMe && !isConsecutive;

                    return (
                      <React.Fragment key={m.id}>
                        {/* Conditional Date Divider */}
                        {renderDateDivider(m, prevMessage)}

                        <div className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse self-end' : 'self-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'} animate-fadeInUp`}>
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-black/5 bg-[#f5f5f7] flex items-center justify-center text-[10px] font-bold shadow-apple-xs">
                              {showAvatar ? (
                                <div className="w-full h-full bg-white flex items-center justify-center">
                                  {m.sender?.profile?.photo_url ? (
                                    <img src={`${STORAGE}/storage/${m.sender.profile.photo_url}`} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} alt="" />
                                  ) : (
                                    <div className="w-full h-full text-gray-400 font-bold flex items-center justify-center uppercase">{m.sender?.first_name?.charAt(0)}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full opacity-0" />
                              )}
                            </div>
                          )}

                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            {/* Bubble Card with Apple iMessage curves */}
                            <div className={`px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-apple-xs ${
                              isMe 
                              ? 'bg-[#0071e3] text-white rounded-[18px] rounded-br-[4px]' 
                              : 'bg-white text-black/90 border border-black/5 rounded-[18px] rounded-tl-[4px]'
                            }`}>
                              {m.content && m.content.trim() !== '' && (
                                <p className="text-[13px] font-medium leading-relaxed">
                                  {renderMessageContent(m.content, isMe)}
                                </p>
                              )}
                              
                              {/* Attachment preview */}
                              {renderAttachment(m.file_url, m.content, isMe)}
                            </div>

                            {/* Small timestamp below only on last bubble of sequence */}
                            {(!prevMessage || idx === messages.length - 1 || messages[idx + 1]?.sender?.id !== m.sender?.id) && (
                              <span className="text-[9px] font-bold text-gray-400 mt-1 px-1 uppercase tracking-wider">
                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

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
