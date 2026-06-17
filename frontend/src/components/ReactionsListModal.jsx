import React, { useState } from 'react';
import { X, Users, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactionIcon from './ReactionIcon';

const REACTIONS_CONFIG = [
  { type: 'ALL',        emoji: '✨', label: 'Tous' },
  { type: 'LIKE',        emoji: '👍', label: 'J\'aime' },
  { type: 'LOVE',        emoji: '❤️', label: 'J\'adore' },
  { type: 'CLAP',        emoji: '👏', label: 'Bravo' },
  { type: 'INSIGHTFUL',  emoji: '💡', label: 'Instructif' },
  { type: 'DISLIKE',     emoji: '👎', label: 'Je n\'aime pas' },
];

const ReactionsListModal = ({ isOpen, onClose, likes = [] }) => {
  const [activeTab, setActiveTab] = useState('ALL');

  if (!isOpen) return null;

  // Filter likes by reaction type
  const filteredLikes = likes.filter(like => {
    if (activeTab === 'ALL') return true;
    return like.type === activeTab;
  });

  const getReactionCount = (type) => {
    if (type === 'ALL') return likes.length;
    return likes.filter(l => l.type === type).length;
  };

  const getReactionEmoji = (type) => {
    const config = REACTIONS_CONFIG.find(r => r.type === type);
    return config ? config.emoji : '👍';
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md anim-fadein" onClick={onClose}>
      <div 
        className="bg-white border border-black/5 rounded-[22px] shadow-apple-lg w-full max-w-[480px] overflow-hidden anim-spring relative flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/5 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold text-[15px] tracking-tight text-[#1d1d1f] flex items-center gap-2">
            <ThumbsUp className="w-[18px] h-[18px] text-[#0071e3]" />
            Réactions ({likes.length})
          </h3>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-[#6e6e73] transition-colors"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Emojis Tabs Row */}
        <div className="flex gap-1.5 overflow-x-auto px-4 py-3 border-b border-black/5 bg-[#f5f5f7]/50 sticky top-[57px] z-10 scrollbar-none">
          {REACTIONS_CONFIG.map(tab => {
            const count = getReactionCount(tab.type);
            if (tab.type !== 'ALL' && count === 0) return null; // Only show active reactions

            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border-none cursor-pointer ${
                  activeTab === tab.type 
                    ? 'bg-[#0071e3] text-white shadow-apple-sm' 
                    : 'bg-white text-[#5e5e5e] hover:bg-[#ebebeb] border border-black/5'
                }`}
              >
                {tab.type === 'ALL' ? (
                  <span className="text-xs">{tab.emoji}</span>
                ) : (
                  <ReactionIcon type={tab.type} className="w-4 h-4" />
                )}
                <span>{tab.label}</span>
                <span className={`text-[10px] ${activeTab === tab.type ? 'text-white/80' : 'text-gray-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* User list */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3.5 pr-2 scrollbar-thin">
          {filteredLikes.length > 0 ? (
            filteredLikes.map(like => {
              const u = like.user;
              if (!u) return null;

              return (
                <div key={like.id} className="flex justify-between items-center gap-4 py-2 border-b border-black/[0.04] last:border-none">
                  <Link 
                    to={`/profile?user_id=${u.id}`} 
                    onClick={onClose}
                    className="flex items-center gap-3.5 min-w-0 flex-grow hover:opacity-90 transition-opacity text-left"
                    style={{ textDecoration: 'none' }}
                  >
                    {/* User Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-[46px] w-[46px] rounded-full bg-[#f5f5f7] overflow-hidden border border-black/5 flex items-center justify-center">
                        {u.profile?.photo_url ? (
                          <img 
                            src={`${API_URL}/storage/${u.profile.photo_url}`} 
                            className="w-full h-full object-cover" 
                            alt=""
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} 
                          />
                        ) : (
                          <span className="text-sm font-bold text-[#86868b]">
                            {u.first_name[0]}{u.last_name[0]}
                          </span>
                        )}
                      </div>
                      {/* Sub-Reaction badge outside the overflow-hidden wrapper */}
                      <span className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full shadow-apple-xs w-5 h-5 flex items-center justify-center border border-black/5 ring-2 ring-white z-10">
                        <ReactionIcon type={like.type} className="w-[12px] h-[12px]" />
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-[13.5px] text-[#1d1d1f] truncate leading-tight hover:text-[#0071e3] transition-colors hover:underline">
                        {u.first_name} {u.last_name}
                      </h4>
                      <p className="text-[11px] text-[#86868b] truncate mt-0.5 max-w-[280px] font-medium">
                        {u.profile?.biography?.split('\n')[0] || 'Membre du réseau académique'}
                      </p>
                    </div>
                  </Link>

                  {/* Connect Action Button */}
                  <Link 
                    to={`/profile?user_id=${u.id}`}
                    onClick={onClose}
                    className="h-7 px-3.5 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] text-[#1d1d1f] font-bold text-[11px] transition-all flex items-center justify-center border-none cursor-pointer"
                    style={{ textDecoration: 'none' }}
                  >
                    Profil
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-gray-300">sentiment_neutral</span>
              <p className="text-xs text-gray-400 italic mt-2">Aucune réaction correspondante dans cette catégorie.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionsListModal;
