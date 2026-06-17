import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { Home, Users, Bell, LogOut, ShieldAlert, FolderGit2, MessageSquare, BookOpen, Menu, X, Search, ChevronDown, User, Settings, Check } from 'lucide-react';
import useToastStore from '../store/toastStore';

const Logo = () => (
  <div style={{ display:'flex', alignItems:'center', gap:7, textDecoration:'none' }}>
    <div style={{ width:32, height:32, borderRadius:8, background:'#0071e3', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 3l8 4.5-8 4.5-8-4.5L10 3z" fill="white" fillOpacity=".9"/>
        <path d="M4 10.5V16l6 3.5 6-3.5v-5.5" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <span style={{ fontSize:18, fontWeight:700, letterSpacing:'-.025em', color:'#1d1d1f' }}>
      Schol<span style={{ color:'#0071e3' }}>ar</span>
    </span>
  </div>
);

// Helper to format channel time dynamically in Navbar drawer list & floating windows
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

const FloatingChatWindow = ({ channel, onClose, currentUserId, STORAGE }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attachedFile, setAttachedFile] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const otherUser = channel.other_user;
  const otherUserAvatar = otherUser?.profile?.photo_url 
    ? `${STORAGE}/storage/${otherUser.profile.photo_url}` 
    : null;
  const otherUserInitials = `${otherUser?.first_name?.[0]||''}${otherUser?.last_name?.[0]||''}`;

  // Fetch messages every 3 seconds
  useEffect(() => {
    const fetchMsgs = () => {
      api.get(`/chat/channels/${channel.id}/messages`)
        .then(res => {
          setMessages(res.data);
          setLoading(false);
        })
        .catch(() => {});
    };

    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [channel.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, minimized]);

  const handleSend = async (textToSend) => {
    const msg = textToSend || inputText;
    if (!msg.trim() && !attachedFile) return;

    // Optimistic update
    const tempId = Date.now();
    const localFileUrl = attachedFile ? URL.createObjectURL(attachedFile) : null;
    const tempMsg = {
      id: tempId,
      content: msg,
      sender: { id: currentUserId },
      created_at: new Date().toISOString(),
      file_url: localFileUrl,
      isOptimistic: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');
    setAttachedFile(null);

    try {
      let res;
      if (attachedFile) {
        const formData = new FormData();
        formData.append('content', msg || ' ');
        formData.append('file', attachedFile);
        res = await api.post(`/chat/channels/${channel.id}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post(`/chat/channels/${channel.id}/messages`, { content: msg });
      }
      // Replace optimistic message
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
      if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    } catch (err) {
      // Remove on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // URL parser inside floating window bubbles
  const renderMessageText = (text, isMe) => {
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
            style={{ 
              fontWeight: '700', 
              textDecoration: 'underline',
              color: isMe ? '#ffffff' : '#0071e3' 
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Attachment renderer inside floating window bubbles
  const renderMessageAttachment = (fileUrl, content, isMe) => {
    if (!fileUrl) return null;
    const isBlob = fileUrl.startsWith('blob:');
    const isImage = isBlob || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileUrl.match(/\.pdf$/i);
    const isVideo = fileUrl.match(/\.(mp4|webm|ogg)$/i);
    const fullUrl = isBlob ? fileUrl : `${STORAGE}/storage/${fileUrl}`;
    const filename = isBlob ? 'Fichier joint' : (fileUrl.split('/').pop() || 'Document');

    if (isImage) {
      return (
        <div style={{ marginTop: 6, borderRadius: 6, overflow: 'hidden', maxWidth: 180 }}>
          <img src={fullUrl} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
        </div>
      );
    } else if (isVideo) {
      return (
        <div style={{ marginTop: 6, borderRadius: 6, overflow: 'hidden', maxWidth: 180 }}>
          <video src={fullUrl} controls style={{ width: '100%', display: 'block', maxHeight: 120, objectFit: 'cover' }} />
        </div>
      );
    } else if (isPdf) {
      return (
        <div style={{
          marginTop: 6,
          padding: '6px 8px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.06)',
          background: isMe ? 'rgba(255,255,255,0.1)' : '#f5f5f7',
          color: isMe ? '#ffffff' : '#1d1d1f',
          fontSize: 9,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span className="material-symbols-outlined text-[16px] text-red-500" style={{ flexShrink: 0 }}>picture_as_pdf</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{filename}</span>
          </div>
          <a href={fullUrl} target="_blank" rel="noreferrer" style={{
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 'bold',
            fontSize: 8,
            textDecoration: 'none',
            background: isMe ? '#ffffff' : '#0071e3',
            color: isMe ? '#0071e3' : '#ffffff',
            border: 'none',
            flexShrink: 0
          }}>Ouvrir</a>
        </div>
      );
    } else {
      return (
        <div style={{
          marginTop: 6,
          padding: '6px 8px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          border: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.06)',
          background: isMe ? 'rgba(255,255,255,0.1)' : '#f5f5f7',
          color: isMe ? '#ffffff' : '#1d1d1f',
          fontSize: 9,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span className="material-symbols-outlined text-[16px] text-blue-500" style={{ flexShrink: 0 }}>description</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{filename}</span>
          </div>
          <a href={fullUrl} target="_blank" rel="noreferrer" style={{
            padding: '2px 8px',
            borderRadius: 10,
            fontWeight: 'bold',
            fontSize: 8,
            textDecoration: 'none',
            background: isMe ? '#ffffff' : '#0071e3',
            color: isMe ? '#0071e3' : '#ffffff',
            border: 'none',
            flexShrink: 0
          }}>Ouvrir</a>
        </div>
      );
    }
  };

  return (
    <div 
      style={{
        width: 320,
        height: minimized ? 46 : 400,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.2s ease-in-out',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Header */}
      <div 
        onClick={() => setMinimized(!minimized)}
        style={{
          height: 46,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          cursor: 'pointer',
          background: '#ffffff',
          borderRadius: '12px 12px 0 0',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ position: 'relative', width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', background: '#e8e8ed', flexShrink: 0, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {otherUserAvatar ? (
              <img src={otherUserAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#86868b' }}>{otherUserInitials}</span>
            )}
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 7, height: 7, background: '#34c759', borderRadius: '50%', border: '1.5px solid white' }} />
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <h4 style={{ fontSize: 11.5, fontWeight: 700, color: '#1d1d1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {channel.name}
            </h4>
            <p style={{ fontSize: 9, color: '#86868b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {otherUser?.profile?.headline || 'Contact'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={(e) => e.stopPropagation()}>
          <span 
            className="material-symbols-outlined text-gray-500 hover:text-black cursor-pointer text-[18px] select-none"
            onClick={() => setMinimized(!minimized)}
          >
            {minimized ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
          <span 
            className="material-symbols-outlined text-gray-500 hover:text-black cursor-pointer text-[16px] select-none font-bold"
            onClick={onClose}
          >
            close
          </span>
        </div>
      </div>

      {/* Messages list */}
      {!minimized && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: '#f5f5f7' }}>
          <div 
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}
            className="scrollbar-thin"
          >
            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-5 h-5 border-2 border-gray-200 border-t-[#0071e3] rounded-full animate-spin"></div>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', items: 'center', justifyContent: 'center', opacity: 0.4, padding: '24px 0' }}>
                <span className="material-symbols-outlined text-[32px] text-gray-400">forum</span>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '4px 0 0 0', color: '#6e6e73' }}>Aucun message</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender?.id === currentUserId;
                return (
                  <div 
                    key={m.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    <div 
                      style={{
                        padding: '8px 12px',
                        fontSize: 11,
                        fontWeight: 550,
                        lineHeight: '1.4',
                        background: isMe ? '#0071e3' : '#ffffff',
                        color: isMe ? '#ffffff' : '#1d1d1f',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: isMe ? 'none' : '1px solid rgba(0,0,0,0.05)',
                        textAlign: 'left',
                        wordBreak: 'break-word',
                      }}
                    >
                      {/* Message text with clickable links */}
                      {m.content && m.content.trim() !== '' && renderMessageText(m.content, isMe)}

                      {/* Render attachments */}
                      {renderMessageAttachment(m.file_url, m.content, isMe)}
                    </div>
                    <span style={{ fontSize: 8, color: '#86868b', marginTop: 2, fontWeight: 600 }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Suggestions & Input */}
          <div style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            
            {/* Quick response buttons */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, marginBottom: 2 }} className="no-scrollbar">
              {['Bonjour ! 👋', 'Merci !', 'D\'accord 👍', 'Super !'].map((pill) => (
                <button
                  key={pill}
                  onClick={() => handleSend(pill)}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#f5f5f7',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    color: '#0071e3',
                    transition: 'all 0.15s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e8f0fe'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f5f7'; }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* File Attachment preview */}
            {attachedFile && (
              <div style={{ 
                background: '#e8f0fe', 
                border: '1px solid rgba(0,113,227,0.1)', 
                borderRadius: 8, 
                padding: '4px 8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                fontSize: 9,
                color: '#0071e3',
                textAlign: 'left'
              }}>
                <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                  📎 {attachedFile.name}
                </span>
                <button 
                  onClick={() => setAttachedFile(null)}
                  style={{ background: 'transparent', border: 'none', color: '#ff3b30', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            {/* Write input, attachment paperclip & send button */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#86868b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4
                }}
                title="Joindre un fichier"
              >
                <span className="material-symbols-outlined text-[20px] text-gray-400 hover:text-[#0071e3]">attach_file</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                style={{ display: 'none' }}
                onChange={(e) => setAttachedFile(e.target.files[0])}
              />
              
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                style={{
                  flex: 1,
                  height: 30,
                  borderRadius: 15,
                  background: '#f5f5f7',
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#1d1d1f',
                }}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputText.trim() && !attachedFile}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#0071e3',
                  border: 'none',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: (inputText.trim() || attachedFile) ? 1 : 0.4,
                  transition: 'opacity 0.15s'
                }}
              >
                <span className="material-symbols-outlined text-[15px] font-bold">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const loc = useLocation();
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [msgDrawerExpanded, setMsgDrawerExpanded] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [siteUsers, setSiteUsers] = useState([]);
  const [activeChats, setActiveChats] = useState([]);

  const handleOpenChatWindow = (channel) => {
    setActiveChats(prev => {
      if (prev.some(c => c.id === channel.id)) return prev;
      if (prev.length >= 3) {
        return [...prev.slice(1), channel];
      }
      return [...prev, channel];
    });
  };

  const handleCloseChatWindow = (channelId) => {
    setActiveChats(prev => prev.filter(c => c.id !== channelId));
  };

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/network')
      .then(r => setSiteUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, [user]);
  const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const h = e => { 
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); 
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); 
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  
  useEffect(() => { setMobileOpen(false); setProfileOpen(false); setNotifOpen(false); }, [loc.pathname]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [mobileOpen]);
  
  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(r => setUnread(r.data.filter(n=>!n.is_read).length)).catch(()=>{});
  }, [user, loc]);

  useEffect(() => {
    if (notifOpen && user) {
      api.get('/notifications')
        .then(r => {
          setNotifications(r.data);
          setUnread(r.data.filter(n => !n.is_read).length);
        })
        .catch(() => {});
    }
  }, [notifOpen, user]);

  useEffect(() => {
    if (!user) return;
    const fetchChannels = () => {
      api.get('/chat/channels')
        .then(r => {
          setConversations(r.data?.private || []);
        })
        .catch(() => {});
    };
    fetchChannels();
    const interval = setInterval(fetchChannels, 5000);
    return () => clearInterval(interval);
  }, [user, loc]);

  const handleAcceptRequest = async (userId, notificationId) => {
    try {
      await api.post(`/network/accept/${userId}`);
      await markAsRead(notificationId);
      addToast("Connexion acceptée !", "success");
      refreshNotifications();
    } catch (error) {
      addToast("Erreur lors de l'acceptation", "error");
    }
  };

  const handleRefuseRequest = async (userId, notificationId) => {
    try {
      await api.delete(`/network/remove/${userId}`);
      await markAsRead(notificationId);
      addToast("Demande refusée", "info");
      refreshNotifications();
    } catch (error) {
      addToast("Erreur lors du refus", "error");
    }
  };

  const handleAcceptProjectJoin = async (projectId, userId, notificationId) => {
    try {
      await api.post(`/projects/${projectId}/members/${userId}/approve`);
      await markAsRead(notificationId);
      addToast("Demande d'adhésion acceptée !", "success");
      refreshNotifications();
    } catch (error) {
      addToast("Erreur lors de l'approbation", "error");
    }
  };

  const handleRefuseProjectJoin = async (projectId, userId, notificationId) => {
    try {
      await api.post(`/projects/${projectId}/members/${userId}/reject`);
      await markAsRead(notificationId);
      addToast("Demande d'adhésion refusée", "info");
      refreshNotifications();
    } catch (error) {
      addToast("Erreur lors du rejet", "error");
    }
  };

  const handleAcceptProjectInvitation = async (projectId, notificationId) => {
    try {
      await api.post(`/projects/${projectId}/invite/accept`);
      await markAsRead(notificationId);
      addToast("Invitation acceptée !", "success");
      refreshNotifications();
    } catch (error) {
      addToast("Erreur lors de l'acceptation", "error");
    }
  };

  const handleDeclineProjectInvitation = async (projectId, notificationId) => {
    try {
      await api.post(`/projects/${projectId}/invite/decline`);
      await markAsRead(notificationId);
      addToast("Invitation refusée.", "info");
      refreshNotifications();
    } catch (error) {
      addToast("Erreur lors du refus", "error");
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnread(0);
      addToast("Toutes les notifications lues", "success");
    } catch (error) {
      console.error(error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnread(0);
      addToast("Notifications supprimées", "info");
    } catch (error) {
      console.error(error);
    }
  };

  const refreshNotifications = () => {
    api.get('/notifications')
      .then(r => {
        setNotifications(r.data);
        setUnread(r.data.filter(n => !n.is_read).length);
      })
      .catch(() => {});
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
      case 'DIRECT_MESSAGE_RECEIVED': 
        return { icon: 'chat', bg: 'bg-[#0071e3]/10', text: 'text-[#0071e3]' };
      case 'PROJECT_NEW_MESSAGE': 
        return { icon: 'forum', bg: 'bg-[#af52de]/10', text: 'text-[#af52de]' };
      default: 
        return { icon: 'notifications', bg: 'bg-[#86868b]/10', text: 'text-[#86868b]' };
    }
  };

  const navItems = [
    { icon: Home,          label: 'Accueil',  path: '/feed' },
    { icon: Users,         label: 'Réseau',   path: '/network' },
    { icon: FolderGit2,    label: 'Projets',  path: '/projects' },
    { icon: BookOpen,      label: 'Articles', path: '/articles' },
    { icon: MessageSquare, label: 'Messages', path: '/chat' },
    { icon: Bell,          label: 'Notifs',   path: '/notifications', count: unread },
    ...(user?.role==='ADMIN' ? [{ icon:ShieldAlert, label:'Admin', path:'/admin' }] : []),
  ];

  const avatarSrc = user?.profile?.photo_url ? `${STORAGE}/storage/${user.profile.photo_url}` : null;
  const initials = user ? `${user.first_name?.[0]||''}${user.last_name?.[0]||''}` : '?';

  return (
    <>
      <nav className="ap-navbar sticky top-0 z-50" style={{ height:52 }}>
        <div style={{ maxWidth:1128, margin:'0 auto', padding:'0 16px', height:'100%', display:'flex', alignItems:'center', gap:8 }}>

          {/* Logo */}
          <Link to="/feed" style={{ textDecoration:'none', flexShrink:0 }}><Logo /></Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex relative animate-fadeIn" style={{ marginLeft: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(0,0,0,0.6)', pointerEvents: 'none', zIndex: 10 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() !== '') {
                    api.get(`/network/search?q=${e.target.value}`)
                      .then(res => setSearchResults(res.data.slice(0, 5)))
                      .catch(() => {});
                  } else {
                    setSearchResults([]);
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setSearchFocused(false), 250);
                }}
                style={{
                  width: searchFocused ? 320 : 220,
                  height: 34,
                  paddingLeft: 34,
                  paddingRight: 12,
                  fontSize: 13,
                  background: searchFocused ? '#ffffff' : '#edf3f8',
                  border: 'none',
                  borderRadius: 4,
                  outline: 'none',
                  color: '#1d1d1f',
                  boxShadow: searchFocused ? '0 0 0 1px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.25s ease-in-out',
                }}
                placeholder="Recherche"
              />
            </div>

            {/* LinkedIn-style Search Dropdown */}
            {searchFocused && (
              <div 
                className="absolute top-[calc(100%+8px)] left-0 w-[380px] bg-white rounded-[8px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-black/5 overflow-hidden z-[9999] p-4 text-left animate-fadeIn"
              >
                {searchQuery.trim() === '' ? (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Membres sur la plateforme
                    </h5>
                    
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {siteUsers.length > 0 ? (
                        siteUsers.slice(0, 6).map((r) => {
                          const userAvatar = r.profile?.photo_url 
                            ? `${STORAGE}/storage/${r.profile.photo_url}` 
                            : null;
                          const userInitials = `${r.first_name?.[0]||''}${r.last_name?.[0]||''}`;
                          
                          return (
                            <Link 
                              key={r.id} 
                              to={`/profile/${r.id}`}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.03] text-decoration-none text-[#1d1d1f] transition-all group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-[#e8e8ed] border border-black/5 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500">
                                  {userAvatar ? (
                                    <img src={userAvatar} className="object-cover h-full w-full" alt="" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:10px;font-weight:700;color:#86868b">${userInitials}</span>`; }} />
                                  ) : (
                                    userInitials
                                  )}
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold leading-none">{r.first_name} {r.last_name}</p>
                                    <span className="apple-badge apple-badge-blue text-[8px] px-1.5 py-0.5 flex-shrink-0 leading-none">
                                      {r.role === 'STUDENT' ? 'Étudiant' : r.role === 'TEACHER' ? 'Enseignant' : 'Chercheur'}
                                    </span>
                                  </div>
                                  <p className="text-[9.5px] text-gray-400 font-semibold truncate leading-none mt-1.5">
                                    {r.profile?.headline || 'Membre Scholar'}
                                  </p>
                                </div>
                              </div>
                              <span className="material-symbols-outlined text-[14px] text-gray-300 group-hover:text-[#0071e3] transition-colors shrink-0">
                                arrow_forward_ios
                              </span>
                            </Link>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-400 italic py-6 text-center">Chargement des membres...</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Résultats de la recherche</h5>
                    {searchResults.length > 0 ? (
                      searchResults.map((r) => (
                        <Link 
                          key={r.id} 
                          to={`/profile/${r.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03] text-decoration-none text-[#1d1d1f] transition-all"
                        >
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 border border-black/5 flex items-center justify-center flex-shrink-0">
                            {r.profile?.photo_url ? (
                              <img src={`${STORAGE}/storage/${r.profile.photo_url}`} className="object-cover h-full w-full" alt="" />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-500">{r.first_name[0]}{r.last_name[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-tight">{r.first_name} {r.last_name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold truncate leading-none mt-0.5">
                              {r.role === 'STUDENT' ? 'Étudiant' : r.role === 'TEACHER' ? 'Enseignant' : 'Chercheur'} · {r.profile?.institution || 'IGA'}
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic py-2 text-center">Aucun membre trouvé.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }} />

          {/* Nav items — DESKTOP (structure identique LinkedIn) */}
          <div className="hidden lg:flex" style={{ height:'100%', alignItems:'stretch', gap:0 }}>
            {navItems.map(item => {
              const active = loc.pathname === item.path;
              const isBell = item.icon === Bell;

              if (isBell) {
                return (
                  <div key={item.path} ref={notifRef} className="relative flex items-center">
                    <button 
                      onClick={() => setNotifOpen(p => !p)} 
                      style={{
                        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
                        height:'100%', padding:'0 12px', background: 'transparent', border: 'none', cursor: 'pointer',
                        borderBottom:`2px solid ${notifOpen ? '#1d1d1f' : 'transparent'}`,
                        color: notifOpen ? '#1d1d1f' : '#86868b',
                        transition:'all .2s ease', minWidth:60,
                      }}
                    >
                      <div style={{ position:'relative' }}>
                        <item.icon style={{ width:22, height:22, strokeWidth: notifOpen ? 2.2 : 1.7 }} />
                        {(item.count||0) > 0 && (
                          <span style={{ position:'absolute', top:-5, right:-6, background:'#ff3b30', color:'#fff', fontSize:9, fontWeight:700, minWidth:16, height:16, borderRadius:9999, padding:'0 3px', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>
                            {item.count > 9 ? '9+' : item.count}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize:10, fontWeight:600 }}>{item.label}</span>
                    </button>

                    {notifOpen && (
                      <div 
                        className="anim-spring ap-glass absolute top-[calc(100%+4px)] right-0 w-[380px] bg-white rounded-[16px] shadow-apple-lg border border-black/5 overflow-hidden flex flex-col z-[1000] text-left"
                      >
                        {/* Dropdown Header */}
                        <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between bg-white sticky top-0 z-10">
                          <div>
                            <h4 className="font-bold text-[14px] text-[#1d1d1f] flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[#0071e3] text-[18px]">notifications</span>
                              Notifications
                            </h4>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={markAllRead}
                              className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#0071e3]/10 hover:text-[#0071e3] flex items-center justify-center text-[#6e6e73] transition-colors border-none cursor-pointer"
                              title="Tout marquer comme lu"
                            >
                              <span className="material-symbols-outlined text-[15px]">done_all</span>
                            </button>
                            <button 
                              onClick={clearAllNotifications}
                              className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] flex items-center justify-center text-[#6e6e73] transition-colors border-none cursor-pointer"
                              title="Tout effacer"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Notifications scrollable list */}
                        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                          {notifications.length > 0 ? (
                            notifications.map((n) => {
                              const iconInfo = getIconDetails(n.type);
                              return (
                                <div 
                                  key={n.id}
                                  onClick={() => !n.is_read && markAsRead(n.id)}
                                  className={`group relative p-3 flex gap-3 rounded-[12px] transition-all duration-200 cursor-pointer ${
                                    n.is_read 
                                      ? 'hover:bg-black/[0.02] bg-white' 
                                      : 'border-l-[3px] border-l-[#0071e3] bg-[#0071e3]/[0.02] hover:bg-[#0071e3]/[0.04]'
                                  }`}
                                >
                                  {/* Icon badge */}
                                  <div className={`w-8 h-8 rounded-full ${iconInfo.bg} ${iconInfo.text} flex items-center justify-center flex-shrink-0`}>
                                    <span className="material-symbols-outlined text-[16px]">
                                      {iconInfo.icon}
                                    </span>
                                  </div>

                                  {/* Info details */}
                                  <div className="flex-grow min-w-0 pr-2 text-left">
                                    <p className={`text-[12.5px] leading-relaxed mb-0.5 ${n.is_read ? 'text-[#48484a]' : 'text-[#1d1d1f] font-semibold'}`}>
                                      {n.message}
                                    </p>
                                    <div className="flex items-center gap-1 text-[10px] text-[#86868b] font-medium">
                                      <span className="material-symbols-outlined text-[12px]">schedule</span> 
                                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>

                                    {/* Action button inside dropdown list */}
                                    {n.type === 'CONNECTION_REQUEST' && (
                                      <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => handleAcceptRequest(n.reference_id, n.id)}
                                          className="h-[24px] text-[10.5px] font-bold px-3 bg-[#34c759] hover:bg-[#30b350] text-white rounded-full transition-all press-effect border-none cursor-pointer"
                                        >
                                          Accepter
                                        </button>
                                        <button 
                                          onClick={() => handleRefuseRequest(n.reference_id, n.id)}
                                          className="h-[24px] text-[10.5px] font-bold px-3 bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#86868b] rounded-full transition-all press-effect border-none cursor-pointer"
                                        >
                                          Refuser
                                        </button>
                                      </div>
                                    )}

                                    {n.type === 'PROJECT_JOIN_REQUEST' && (
                                      <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => handleAcceptProjectJoin(n.reference_id, n.data?.requester_id, n.id)}
                                          className="h-[24px] text-[10.5px] font-bold px-3 bg-[#34c759] hover:bg-[#30b350] text-white rounded-full transition-all press-effect border-none cursor-pointer"
                                        >
                                          Accepter
                                        </button>
                                        <button 
                                          onClick={() => handleRefuseProjectJoin(n.reference_id, n.data?.requester_id, n.id)}
                                          className="h-[24px] text-[10.5px] font-bold px-3 bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#86868b] rounded-full transition-all press-effect border-none cursor-pointer"
                                        >
                                          Refuser
                                        </button>
                                      </div>
                                    )}

                                    {n.type === 'PROJECT_INVITATION' && (
                                      <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                          onClick={() => handleAcceptProjectInvitation(n.reference_id, n.id)}
                                          className="h-[24px] text-[10.5px] font-bold px-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-all press-effect border-none cursor-pointer"
                                        >
                                          Rejoindre
                                        </button>
                                        <button 
                                          onClick={() => handleDeclineProjectInvitation(n.reference_id, n.id)}
                                          className="h-[24px] text-[10.5px] font-bold px-3 bg-[#f5f5f7] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#86868b] rounded-full transition-all press-effect border-none cursor-pointer"
                                        >
                                          Décliner
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Unread dot */}
                                  {!n.is_read && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3] flex-shrink-0 animate-pulse"></span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="py-8 text-center">
                              <span className="material-symbols-outlined text-[24px] text-[#86868b] opacity-60">notifications_off</span>
                              <p className="text-[12px] text-[#86868b] mt-1 font-semibold">Aucune notification</p>
                              <p className="text-[10px] text-[#86868b]/70 mt-0.5">Tout est à jour !</p>
                            </div>
                          )}
                        </div>

                        {/* Dropdown Footer */}
                        <div className="p-2 border-t border-black/5 bg-[#f5f5f7]/60 text-center">
                          <Link 
                            to="/notifications" 
                            onClick={() => setNotifOpen(false)}
                            className="text-[11px] font-bold text-[#0071e3] hover:underline"
                          >
                            Ouvrir toutes les notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link key={item.path} to={item.path} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
                  height:'100%', padding:'0 12px', textDecoration:'none',
                  borderBottom:`2px solid ${active ? '#1d1d1f' : 'transparent'}`,
                  color: active ? '#1d1d1f' : '#86868b',
                  transition:'all .2s ease', minWidth:60,
                }}>
                  <div style={{ position:'relative' }}>
                    <item.icon style={{ width:22, height:22, strokeWidth: active?2.2:1.7 }} />
                    {(item.count||0) > 0 && (
                      <span style={{ position:'absolute', top:-5, right:-6, background:'#ff3b30', color:'#fff', fontSize:9, fontWeight:700, minWidth:16, height:16, borderRadius:9999, padding:'0 3px', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>
                        {item.count > 9 ? '9+' : item.count}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize:10, fontWeight:600 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Séparateur */}
          <div className="hidden lg:block" style={{ width:.5, height:28, background:'rgba(0,0,0,.1)', margin:'0 4px' }} />

          {/* Dropdown "Me" — identique LinkedIn */}
          <div ref={profileRef} style={{ position:'relative' }} className="hidden sm:block">
            <button onClick={() => setProfileOpen(p=>!p)} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:52, padding:'0 12px', background:'transparent', border:'none', cursor:'pointer', borderBottom:`2px solid ${profileOpen?'#1d1d1f':'transparent'}`, transition:'all .2s ease' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', background:'#e8e8ed', border: '1.5px solid white', boxShadow:'0 0 0 1px rgba(0,0,0,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {avatarSrc ? <img src={avatarSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:10px;font-weight:700;color:#86868b">${initials}</span>`; }} /> : <span style={{ fontSize:10, fontWeight:700, color:'#86868b' }}>{initials}</span>}
              </div>
            </button>

            {profileOpen && (
              <div className="anim-spring ap-glass" style={{ position:'absolute', top:'calc(100% + 4px)', right:0, minWidth:210, borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,.12)', overflow:'hidden', zIndex:1000 }}>
                <div style={{ padding:'14px 16px 10px', borderBottom:'.5px solid rgba(0,0,0,.08)' }}>
                  <p style={{ fontSize:14, fontWeight:600, color:'#1d1d1f' }}>{user?.first_name} {user?.last_name}</p>
                  <p style={{ fontSize:11, color:'#86868b', marginTop:1 }}>{user?.email}</p>
                </div>
                {[{icon:User, label:'Mon profil', path:'/profile'}, {icon:Settings, label:'Paramètres', path:'/profile'}].map(i=>(
                  <Link key={i.label} to={i.path} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', textDecoration:'none', color:'#1d1d1f', fontSize:13, fontWeight:500, transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.04)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <i.icon style={{ width:15, height:15, color:'#6e6e73' }} />{i.label}
                  </Link>
                ))}
                <div style={{ borderTop:'.5px solid rgba(0,0,0,.08)', margin:'3px 0' }} />
                <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', width:'100%', background:'transparent', border:'none', color:'#ff3b30', fontSize:13, fontWeight:500, cursor:'pointer', transition:'background .15s', textAlign:'left' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#ffeeed'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <LogOut style={{ width:15, height:15 }} />Déconnexion
                </button>
              </div>
            )}
          </div>

          {/* Empty spacer */}
          <div className="sm:hidden w-1 h-1" />

          {/* Hamburger mobile */}
          <button className="lg:hidden" onClick={()=>setMobileOpen(p=>!p)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', background:'transparent', border:'none', cursor:'pointer', color:'#1d1d1f' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f5f5f7'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            {mobileOpen ? <X style={{ width:20, height:20 }} /> : <Menu style={{ width:20, height:20 }} />}
          </button>
        </div>
      </nav>

      {/* Bottom sheet mobile */}
      {mobileOpen && (
        <>
          <div className="anim-fadein" onClick={()=>setMobileOpen(false)} style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,.28)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)' }} />
          <div className="anim-in" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, background:'rgba(255,255,255,.96)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', borderRadius:'22px 22px 0 0', padding:'10px 18px 28px', boxShadow:'0 -4px 32px rgba(0,0,0,.12)' }}>
            <div style={{ width:34, height:4, background:'#c7c7cc', borderRadius:2, margin:'0 auto 16px' }} />
            {/* User info */}
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f5f5f7', borderRadius:12, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', overflow:'hidden', background:'#e8e8ed', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {avatarSrc ? <img src={avatarSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-size:13px;font-weight:700;color:#86868b">${initials}</span>`; }} /> : <span style={{ fontSize:13, fontWeight:700, color:'#86868b' }}>{initials}</span>}
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:'#1d1d1f' }}>{user?.first_name} {user?.last_name}</p>
                <p style={{ fontSize:11, color:'#86868b' }}>{user?.role}</p>
              </div>
            </div>
            {navItems.map(item => {
              const active = loc.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={()=>setMobileOpen(false)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:10, textDecoration:'none', background: active?'#e8f0fe':'transparent', color: active?'#0071e3':'#1d1d1f', fontSize:14, fontWeight: active?600:500, transition:'background .15s', marginBottom:2 }}>
                  <item.icon style={{ width:19, height:19, strokeWidth: active?2.2:1.7, flexShrink:0 }} />{item.label}
                  {(item.count||0)>0 && <span style={{ marginLeft:'auto', background:'#ff3b30', color:'white', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:9999 }}>{item.count}</span>}
                </Link>
              );
            })}
          </div>
        </>
      )}
      {/* Collapsible Messaging Drawer (LinkedIn style) */}
      {user && (
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            right: 20,
            width: 280,
            height: msgDrawerExpanded ? 400 : 46,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px 12px 0 0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            transition: 'height 0.25s ease-in-out',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {/* Header */}
          <div 
            onClick={() => setMsgDrawerExpanded(!msgDrawerExpanded)}
            style={{
              height: 46,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              cursor: 'pointer',
              background: '#ffffff',
              borderRadius: '12px 12px 0 0',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', background: '#e8e8ed', border: '1.5px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, fontWeight: 700, color: '#86868b' }}>{initials}</span>}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>Messagerie</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={(e) => e.stopPropagation()}>
              <span 
                className="material-symbols-outlined text-gray-500 hover:text-black cursor-pointer text-[18px] select-none"
                onClick={() => setMsgDrawerExpanded(!msgDrawerExpanded)}
              >
                {msgDrawerExpanded ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}
              </span>
              <span 
                className="material-symbols-outlined text-gray-500 hover:text-black cursor-pointer text-[16px] select-none"
                onClick={() => navigate('/chat')}
              >
                edit_note
              </span>
            </div>
          </div>

          {/* Body */}
          {msgDrawerExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Search Bar */}
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#ffffff', position: 'relative' }}>
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">search</span>
                <input 
                  type="text" 
                  placeholder="Rechercher des messages"
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: 28,
                    paddingLeft: 28,
                    paddingRight: 8,
                    fontSize: 11,
                    background: '#edf3f8',
                    border: 'none',
                    borderRadius: 6,
                    outline: 'none',
                    color: '#1d1d1f',
                  }}
                />
              </div>

              {/* Subtabs Principal / Autre styled like iOS Segmented Control */}
              <div style={{ 
                display: 'flex', 
                background: '#f5f5f7', 
                borderRadius: 8, 
                padding: 2, 
                margin: '8px 12px 6px 12px',
                fontSize: 10.5,
                fontWeight: 700,
                color: '#6e6e73' 
              }}>
                <div style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: '5px 0', 
                  background: '#ffffff',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  color: '#1d1d1f', 
                  cursor: 'pointer' 
                }}>Principal</div>
                <div style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: '5px 0', 
                  cursor: 'pointer' 
                }}>Autre</div>
              </div>

              {/* Conversation list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }} className="scrollbar-thin">
                {conversations.filter(c => {
                  const targetName = c.name?.toLowerCase() || '';
                  return targetName.includes(chatSearch.toLowerCase());
                }).length > 0 ? (
                  conversations
                    .filter(c => {
                      const targetName = c.name?.toLowerCase() || '';
                      return targetName.includes(chatSearch.toLowerCase());
                    })
                    .map((c) => {
                      const otherUserAvatar = c.other_user?.profile?.photo_url 
                        ? `${STORAGE}/storage/${c.other_user.profile.photo_url}` 
                        : null;
                      const otherUserInitials = c.other_user 
                        ? `${c.other_user.first_name?.[0]||''}${c.other_user.last_name?.[0]||''}` 
                        : '?';

                      return (
                        <div 
                          key={c.id}
                          onClick={() => {
                            handleOpenChatWindow(c);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Avatar with active green dot */}
                          <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#e8e8ed', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {otherUserAvatar ? (
                                <img src={otherUserAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#86868b' }}>{otherUserInitials}</span>
                              )}
                            </div>
                            <span 
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 8,
                                height: 8,
                                background: '#34c759',
                                borderRadius: '50%',
                                border: '1.5px solid white',
                              }}
                            />
                          </div>

                          {/* Preview Details */}
                          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                              <h4 style={{ fontSize: 11.5, fontWeight: 700, color: '#1d1d1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.name}
                              </h4>
                              <span style={{ fontSize: 8.5, color: '#86868b', fontWeight: 700, textTransform: 'uppercase' }}>
                                {formatChannelTime(c.updated_at)}
                              </span>
                            </div>
                            <p style={{ fontSize: 10, color: '#86868b', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.last_message?.content || "Démarrer la discussion..."}
                            </p>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: '#86868b', fontSize: 11, fontWeight: 600 }}>
                    Aucune discussion
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Windows Container stacked side-by-side to the left of the drawer */}
      {user && activeChats.map((c, idx) => (
        <div 
          key={c.id}
          style={{
            position: 'fixed',
            bottom: 0,
            right: 20 + 280 + 16 + idx * (320 + 16),
            zIndex: 9998,
            transition: 'right 0.25s ease-in-out',
          }}
        >
          <FloatingChatWindow 
            channel={c}
            onClose={() => handleCloseChatWindow(c.id)}
            currentUserId={user.id}
            STORAGE={STORAGE}
          />
        </div>
      ))}
    </>
  );
};
export default Navbar;
