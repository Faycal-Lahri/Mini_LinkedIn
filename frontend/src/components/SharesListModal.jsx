import React from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

const SharesListModal = ({ isOpen, onClose, shares = [] }) => {
  if (!isOpen) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md anim-fadein" onClick={onClose}>
      <div 
        className="bg-white border border-black/5 rounded-[22px] shadow-apple-lg w-full max-w-[440px] overflow-hidden anim-spring relative flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/5 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-bold text-[16px] text-[#1d1d1f] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0071e3] text-[22px]">share</span>
            Partagé par ({shares.length})
          </h3>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-[#6e6e73] transition-colors"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* User list */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4 pr-3 scrollbar-thin">
          {shares.length > 0 ? (
            shares.map(share => {
              const u = share.author;
              if (!u) return null;

              return (
                <div key={share.id} className="flex justify-between items-center gap-4 py-1.5 border-b border-black/5 last:border-none">
                  <Link 
                    to={`/profile?user_id=${u.id}`} 
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-grow hover:opacity-90 transition-opacity text-left"
                    style={{ textDecoration: 'none' }}
                  >
                    {/* User Avatar */}
                    <div className="h-11 w-11 rounded-full bg-[#f5f5f7] overflow-hidden flex-shrink-0 border border-black/5">
                      {u.profile?.photo_url ? (
                        <img 
                          src={`${API_URL}/storage/${u.profile.photo_url}`} 
                          className="w-full h-full object-cover" 
                          alt=""
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} 
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f5f5f7] flex items-center justify-center text-sm font-bold text-[#86868b]">
                          {u.first_name[0]}{u.last_name[0]}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-[13px] text-[#1d1d1f] truncate leading-tight hover:underline">
                        {u.first_name} {u.last_name}
                      </h4>
                      <p className="text-[11px] text-[#6e6e73] truncate mt-0.5 max-w-[240px]">
                        {u.profile?.biography?.split('\n')[0] || 'Membre du réseau académique'}
                      </p>
                      {share.content && (
                        <p className="text-[10px] text-[#86868b] italic truncate mt-1 max-w-[240px]">
                          💬 "{share.content}"
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Connect Action Button */}
                  <Link 
                    to={`/profile?user_id=${u.id}`}
                    onClick={onClose}
                    className="px-3 py-1 rounded-full border border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/5 font-bold text-[10px] uppercase tracking-wider flex-shrink-0 transition-colors cursor-pointer select-none"
                    style={{ textDecoration: 'none' }}
                  >
                    Profil
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[36px] text-gray-300">share</span>
              <p className="text-xs text-gray-400 italic mt-2">Aucun partage enregistré pour cette publication.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharesListModal;
