import React, { useState } from 'react';
import { X, Send, User } from 'lucide-react';

const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ShareModal = ({ isOpen, onClose, post, onConfirm }) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      await onConfirm(commentText);
      setCommentText('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Extract author info
  const author = post.author || {};
  const authorName = `${author.first_name || ''} ${author.last_name || ''}`;
  const authorHeadline = author.profile?.biography?.split('\n')[0] || author.role || 'Membre';
  const authorAvatar = author.profile?.photo_url ? `${STORAGE}/storage/${author.profile.photo_url}` : null;
  const authorInitials = `${author.first_name?.[0] || ''}${author.last_name?.[0] || ''}`;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="bg-white border border-black/5 rounded-[22px] w-full max-w-xl overflow-hidden shadow-apple-lg animate-fadeInUp"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-white">
          <h3 className="text-[15px] font-bold tracking-tight text-[#1d1d1f]">Partager avec vos pensées</h3>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-[#f5f5f7] hover:bg-[#ebebeb] flex items-center justify-center text-gray-500 transition-colors border-none cursor-pointer"
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-left max-h-[70vh] overflow-y-auto scrollbar-thin">
          
          {/* User's commentary text area */}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="De quoi voulez-vous parler ?"
            className="w-full min-h-[100px] border-none outline-none resize-none text-[15px] font-medium text-black placeholder:text-[#86868b] bg-transparent"
            autoFocus
          />

          {/* Embedded original post preview */}
          <div className="border border-black/10 rounded-[14px] p-4 bg-[#f8f9fa] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#e8e8ed] border border-black/5 flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold text-gray-500">
                {authorAvatar ? (
                  <img src={authorAvatar} className="w-full h-full object-cover" alt="" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                ) : (
                  authorInitials || <User size={16} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[12.5px] text-[#1d1d1f] truncate leading-none mb-0.5">{authorName}</p>
                <p className="text-[10px] text-[#86868b] font-semibold truncate uppercase tracking-wide">{authorHeadline}</p>
              </div>
            </div>

            {/* Title / Content excerpt */}
            <div className="space-y-1">
              {post.title && (
                <h4 className="font-bold text-[13px] text-[#1d1d1f] leading-snug">{post.title}</h4>
              )}
              {post.article_title && (
                <h4 className="font-bold text-[13px] text-[#1d1d1f] leading-snug">{post.article_title}</h4>
              )}
              <p className="text-[12px] text-[#48484a] leading-relaxed line-clamp-3">
                {post.content}
              </p>
            </div>

            {/* Media hint or first image if available */}
            {post.media_type && (
              <div className="text-[10px] font-bold text-[#0071e3] flex items-center gap-1.5 bg-[#0071e3]/5 px-2.5 py-1.5 rounded-lg w-fit">
                <span>📎 Contenu Média ({post.media_type})</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/5 bg-[#f5f5f7]/40 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-[36px] px-4 rounded-full font-bold text-xs text-[#86868b] hover:bg-black/[0.04] transition-all bg-transparent border-none cursor-pointer"
          >
            Annuler
          </button>
          
          <button
            onClick={handlePublish}
            disabled={submitting || !commentText.trim()}
            className="h-[36px] px-5 rounded-full font-bold text-xs bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center gap-1.5 transition-all disabled:opacity-45 border-none cursor-pointer"
          >
            <span>{submitting ? 'Partage...' : 'Publier'}</span>
            <Send size={12} className="text-white fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
