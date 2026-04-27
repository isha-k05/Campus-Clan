import { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Trash2, Flag, Globe, Home, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

const VideoPlayer = ({ src }) => {
    const videoRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPaused(false);
        } else {
            videoRef.current.pause();
            setIsPaused(true);
        }
    };

    return (
        <video
            ref={videoRef}
            src={src}
            className="post-video"
            autoPlay
            muted
            loop
            onClick={togglePlay}
        />
    );
};

const PostCard = ({ post, currentUser, onDelete, onVote, onLike, onReport, onShare, onComment }) => {
    const isLiked = post.likes?.includes(currentUser?._id);
    const totalVotes = post.poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !onComment || isSubmittingComment) return;
        setIsSubmittingComment(true);
        try {
            await onComment(post._id, commentText);
            setCommentText('');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <div className="post-card">
            <div className="post-header">
                <div className="post-author">
                    <div className="post-avatar">
                        {post.author?.profilePicture ? (
                            <img src={post.author.profilePicture} alt={post.author.name} className="avatar-img" />
                        ) : (
                            post.author?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="post-info">
                        <div className="author-name">{post.author?.name}</div>
                        <div className="post-meta">
                            {post.author?.college} • {new Date(post.createdAt).toLocaleString()}
                            <span className="vis-badge"> • {post.visibility}</span>
                        </div>
                    </div>
                </div>
                {currentUser?._id === post.author?._id && (
                    <button className="post-options" onClick={() => onDelete(post._id)}><Trash2 size={18} /></button>
                )}
            </div>

            <div className="post-content">
                {post.content && <p className="post-text">{post.content}</p>}
                {post.mediaType === 'image' && post.mediaUrl && <img src={post.mediaUrl} alt="Post content" className="post-image" />}
                {post.mediaType === 'video' && post.mediaUrl && <VideoPlayer src={post.mediaUrl} />}
                {post.poll && post.poll.options.length > 0 && (
                    <div className="post-poll">
                        {post.poll.options.map((opt, idx) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                            return (
                                <div key={idx} className={`poll-option ${opt.votes.includes(currentUser?._id) ? 'voted' : ''}`} onClick={() => onVote(post._id, idx)}>
                                    <div className="poll-bg" style={{ width: `${percent}%` }}></div>
                                    <span className="opt-text">{opt.text}</span>
                                    <span className="opt-percent">{percent}%</span>
                                </div>
                            );
                        })}
                        <div className="poll-footer">{totalVotes} votes</div>
                    </div>
                )}
            </div>

            <div className="post-actions">
                <div className="action-item">
                    <button className="action-btn" onClick={() => onLike(post._id)}>
                        <Heart size={20} fill={isLiked ? "#ef4444" : "none"} color={isLiked ? "#ef4444" : "currentColor"} />
                    </button>
                    <span className="action-count">{post.likes?.length || 0}</span>
                </div>
                <div className="action-item">
                    <button className="action-btn" onClick={() => {
                        const willShow = !showComments;
                        setShowComments(willShow);
                        if (willShow) {
                            setTimeout(() => {
                                const inputWrapper = document.getElementById(`comment-input-${post._id}`);
                                if (inputWrapper) {
                                    inputWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }, 100);
                        }
                    }}>
                        <MessageCircle size={20} />
                    </button>
                    <span className="action-count">{post.comments?.length || 0}</span>
                </div>
                <div className="action-item">
                    <button className="action-btn" onClick={() => onShare(post)}><Send size={20} /></button>
                    <span className="action-text">Share</span>
                </div>
                <div className="action-item report-action">
                    <button className="action-btn report-btn" onClick={() => onReport(post._id)}><Flag size={18} /></button>
                </div>
            </div>

            {showComments && (
                <div className="post-comments-section">
                    <div className="comments-list">
                        {post.comments?.map((comment, i) => (
                            <div key={i} className="comment-item">
                                <div className="comment-avatar">
                                    {comment.user?.profilePicture ? (
                                        <img src={comment.user.profilePicture} alt={comment.user.name} />
                                    ) : (
                                        comment.user?.name?.charAt(0) || 'U'
                                    )}
                                </div>
                                <div className="comment-bubble">
                                    <span className="comment-author">{comment.user?.name}</span>
                                    <p className="comment-text">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                        {(!post.comments || post.comments.length === 0) && (
                            <p className="no-comments">No comments yet. Be the first to say something!</p>
                        )}
                    </div>
                    {onComment && (
                        <div className="comment-input-wrapper" id={`comment-input-${post._id}`}>
                            <div className="comment-avatar">
                                {currentUser?.profilePicture ? (
                                    <img src={currentUser.profilePicture} alt="You" />
                                ) : (
                                    currentUser?.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <input 
                                type="text" 
                                className="comment-input"
                                placeholder="Write a comment..." 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCommentSubmit();
                                    }
                                }}
                                autoFocus
                            />
                            <button 
                                className="comment-send-btn" 
                                onClick={handleCommentSubmit}
                                disabled={!commentText.trim() || isSubmittingComment}
                            >
                                {isSubmittingComment ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCard;
