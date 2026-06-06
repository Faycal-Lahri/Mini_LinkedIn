import React, { useState } from 'react';
import { Send, ThumbsUp, CornerDownRight } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const CommentSection = ({ postId, initialComments, onCommentAdded }) => {
    const { user } = useAuthStore();
    const [comments, setComments] = useState(initialComments || []);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // Interactive states for comment actions
    const [commentLikes, setCommentLikes] = useState({}); // { [commentId]: { count: number, liked: boolean } }
    const [replyingTo, setReplyingTo] = useState(null); // commentId
    const [replyText, setReplyText] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const response = await api.post(`/posts/${postId}/comment`, {
                content: newComment
            });
            const addedComment = response.data;
            setComments([...comments, addedComment]);
            setNewComment('');
            if (onCommentAdded) onCommentAdded();
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleToggleCommentLike = (commentId) => {
        setCommentLikes(prev => {
            const curr = prev[commentId] || { count: 0, liked: false };
            return {
                ...prev,
                [commentId]: {
                    count: curr.liked ? curr.count - 1 : curr.count + 1,
                    liked: !curr.liked
                }
            };
        });
    };

    const handleSendReply = (commentId) => {
        if (!replyText.trim()) return;
        // Simple visual simulation of reply since backend only supports single-level comments
        const replyNode = {
            id: Date.now(),
            content: replyText,
            created_at: new Date().toISOString(),
            is_reply: true,
            author: user
        };
        setComments(prev => {
            // Find index of the parent comment
            const idx = prev.findIndex(c => c.id === commentId);
            if (idx === -1) return prev;
            const updated = [...prev];
            // Insert reply right after parent comment
            updated.splice(idx + 1, 0, replyNode);
            return updated;
        });
        setReplyText('');
        setReplyingTo(null);
        if (onCommentAdded) onCommentAdded();
    };

    const STORAGE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    return (
        <div className="bg-[#f8f9fa] border-t border-black/[0.04] px-4 py-4 space-y-4 rounded-b-[24px] animate-fadeIn">
            
            {/* 1. Comment Input at the Top (LinkedIn style) */}
            <form onSubmit={handleSubmit} className="flex items-start gap-3">
                {/* Logged in User Avatar */}
                <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border border-black/5 shadow-apple-xs">
                    {user?.profile?.photo_url ? (
                        <img 
                            src={`${STORAGE}/storage/${user.profile.photo_url}`} 
                            className="h-full w-full object-cover" 
                            alt="" 
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} 
                        />
                    ) : (
                        <span className="text-xs font-bold text-gray-500">
                            {user?.first_name?.[0] || '?'}{user?.last_name?.[0] || ''}
                        </span>
                    )}
                </div>

                {/* Pill-shaped comment input */}
                <div className="flex-grow relative flex items-center bg-white border border-[#dad8d6] hover:border-black/30 focus-within:border-[#0071e3] focus-within:ring-[3.5px] focus-within:ring-[#0071e3]/12 rounded-full px-4 py-2 transition-all shadow-apple-xs">
                    <input 
                        type="text" 
                        placeholder="Ajouter un commentaire..." 
                        className="w-full bg-transparent border-none text-[13.5px] font-medium outline-none focus:outline-none focus:ring-0 text-black/90 placeholder:text-gray-400 py-0.5 pr-8"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button 
                        type="submit" 
                        disabled={submitting || !newComment.trim()}
                        className="absolute right-2 p-1.5 text-[#0071e3] hover:bg-[#0071e3]/5 rounded-full transition-all disabled:opacity-30 border-none bg-transparent cursor-pointer flex items-center justify-center"
                    >
                        <Send className="h-4.5 w-4.5" />
                    </button>
                </div>
            </form>

            {/* 2. List of comments */}
            {comments.length > 0 && (
                <div className="space-y-4 pt-1">
                    {comments.map((comment) => {
                        const author = comment.author;
                        const authorName = author ? `${author.first_name} ${author.last_name}` : 'Membre Scholar';
                        const authorPhoto = author?.profile?.photo_url;
                        const authorHeadline = author?.profile?.biography?.split('\n')[0] || author?.role || 'Membre académique';
                        
                        const roleLabel = author?.role === 'STUDENT' ? 'Étudiant' : author?.role === 'TEACHER' ? 'Enseignant' : author?.role === 'RESEARCHER' ? 'Chercheur' : 'Membre';
                        const roleColor = author?.role === 'TEACHER' ? 'bg-[#af52de]/10 text-[#af52de]' : author?.role === 'RESEARCHER' ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-[#34c759]/10 text-[#34c759]';
                        
                        const likesState = commentLikes[comment.id] || { count: 0, liked: false };

                        if (comment.is_reply) {
                            // Sub-replies rendering style
                            return (
                                <div key={comment.id} className="flex items-start gap-2.5 ml-9 border-l-2 border-black/5 pl-3 group animate-fadeIn">
                                    <div className="h-7.5 w-7.5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border border-black/5">
                                        {authorPhoto ? (
                                            <img 
                                                src={`${STORAGE}/storage/${authorPhoto}`} 
                                                className="h-full w-full object-cover" 
                                                alt="" 
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} 
                                            />
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-500">
                                                {author?.first_name?.[0] || '?'}{author?.last_name?.[0] || ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="bg-black/[0.025] px-3 py-2 rounded-[12px] block w-full text-left">
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12.5px] font-bold text-black/90">
                                                            {authorName}
                                                        </span>
                                                        <span className={`text-[8.5px] px-1 py-0.2 rounded font-extrabold uppercase tracking-wider ${roleColor}`}>
                                                            {roleLabel}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-black/45 font-medium">
                                                        {new Date(comment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                                <p className="text-[12.5px] text-black/90 leading-relaxed mt-1 whitespace-pre-wrap font-normal">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={comment.id} className="flex items-start gap-3 group animate-fadeIn">
                                {/* Commenter Avatar */}
                                <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border border-black/5 shadow-apple-xs">
                                    {authorPhoto ? (
                                        <img 
                                            src={`${STORAGE}/storage/${authorPhoto}`} 
                                            className="h-full w-full object-cover" 
                                            alt="" 
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'; }} 
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-gray-500">
                                            {author?.first_name?.[0] || '?'}{author?.last_name?.[0] || ''}
                                        </span>
                                    )}
                                </div>

                                {/* Comment Content Bubble & Actions */}
                                <div className="flex-grow min-w-0">
                                    <div className="bg-[#f2f4f7] hover:bg-[#ebedf0] transition-colors px-3.5 py-2.5 rounded-[16px] block w-full text-left relative shadow-apple-xs">
                                        <div className="flex flex-col">
                                            {/* Author name & Professional headline */}
                                            <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[13px] font-bold text-black/90 hover:text-[#0071e3] hover:underline cursor-pointer">
                                                        {authorName}
                                                    </span>
                                                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-extrabold uppercase tracking-wider ${roleColor}`}>
                                                        {roleLabel}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-black/45 font-medium">
                                                    {new Date(comment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-[10.5px] text-black/55 font-normal leading-[1.3] truncate w-full mt-0.5">
                                                {authorHeadline}
                                            </p>
                                            {/* Comment Content */}
                                            <p className="text-[13.5px] text-black/90 leading-relaxed mt-2 whitespace-pre-wrap font-normal">
                                                {comment.content}
                                            </p>
                                        </div>
                                        
                                        {/* Likes Pill Badge (floating bottom right if liked) */}
                                        {likesState.count > 0 && (
                                            <div className="absolute -bottom-2 right-3.5 bg-white border border-black/5 rounded-full shadow-apple-xs px-1.5 py-0.5 flex items-center gap-1 text-[10px] text-black/60 font-bold select-none">
                                                <ThumbsUp className="w-2.5 h-2.5 text-[#0071e3] fill-[#0071e3]" />
                                                <span>{likesState.count}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action row under bubble */}
                                    <div className="flex items-center gap-3 mt-1 ml-3 text-[11px] text-black/60 font-bold select-none">
                                        <button 
                                            onClick={() => handleToggleCommentLike(comment.id)}
                                            className={`hover:text-[#0071e3] transition-colors border-none bg-transparent cursor-pointer text-[11.5px] p-0 flex items-center gap-1 ${likesState.liked ? 'text-[#0071e3]' : ''}`}
                                        >
                                            <span>J'aime</span>
                                        </button>
                                        <span className="text-gray-300 font-normal">|</span>
                                        <button 
                                            onClick={() => {
                                                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                                setReplyText('');
                                            }}
                                            className={`hover:text-[#0071e3] transition-colors border-none bg-transparent cursor-pointer text-[11.5px] p-0 flex items-center gap-1 ${replyingTo === comment.id ? 'text-[#0071e3]' : ''}`}
                                        >
                                            <span>Répondre</span>
                                        </button>
                                    </div>

                                    {/* Sub-reply inline form */}
                                    {replyingTo === comment.id && (
                                        <div className="flex items-center gap-2 mt-2 ml-3 animate-fadeIn">
                                            <CornerDownRight className="w-4 h-4 text-gray-400 shrink-0" />
                                            <input 
                                                type="text" 
                                                placeholder={`Répondre à ${author.first_name}...`}
                                                className="flex-grow h-8 bg-white border border-[#dad8d6] focus:border-[#0071e3] rounded-full px-3 text-xs outline-none focus:ring-2 focus:ring-[#0071e3]/10 font-medium"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSendReply(comment.id);
                                                }}
                                            />
                                            <button 
                                                onClick={() => handleSendReply(comment.id)}
                                                disabled={!replyText.trim()}
                                                className="h-8 w-8 bg-[#0071e3] hover:bg-[#0077ed] text-white disabled:opacity-30 rounded-full flex items-center justify-center shrink-0 border-none cursor-pointer"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
};

export default CommentSection;
