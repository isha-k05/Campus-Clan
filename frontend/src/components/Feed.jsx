import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import {
    Image as ImageIcon,
    Video as VideoIcon,
    BarChart2,
    Globe,
    Home,
    Sparkles,
    X,
    Trash2,
    Heart,
    MessageCircle,
    Send,
    Flag,
    Loader2
} from 'lucide-react';
import StoryRing from './StoryRing';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';
import './Feed.css';

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

    const handleDoubleClick = () => {
        if (videoRef.current.requestFullscreen) {
            videoRef.current.requestFullscreen();
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
            onDoubleClick={handleDoubleClick}
        />
    );
};

const Feed = () => {
    const { userStoriesList, viewUserStories } = useStory();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);

    // Composer State
    const [postText, setPostText] = useState('');
    const [mediaType, setMediaType] = useState('none');
    const [preview, setPreview] = useState(null);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [showVisibility, setShowVisibility] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // stores postId to delete
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    // Comments State
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const [activeTab, setActiveTab] = useState('Local');
    const fileInputRef = useRef(null);
    const loaderRef = useRef(null);

    useEffect(() => {
        setPage(1);
        setPosts([]);
        setHasMore(true);
        fetchPosts(1, true);
    }, [activeTab]); // Refetch when tab changes

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading) {
                setPage(prev => {
                    const next = prev + 1;
                    fetchPosts(next);
                    return next;
                });
            }
        }, { threshold: 1.0 });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    const fetchPosts = async (pageNum = 1, isInitial = false) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/posts?page=${pageNum}&limit=10`);
            if (res.data.success) {
                if (isInitial) {
                    setPosts(res.data.posts);
                } else {
                    setPosts(prev => [...prev, ...res.data.posts]);
                }
                setHasMore(res.data.hasMore);
            }
        } catch (err) {
            console.error('Failed to load posts', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const type = file.type.startsWith('image/') ? 'image' : 'video';

        // Show loading state or immediate preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setMediaType(type);
        };
        reader.readAsDataURL(file);
    };

    const addPollOption = () => {
        if (pollOptions.length < 6) setPollOptions([...pollOptions, '']);
    };

    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handlePostClick = () => {
        if (!postText.trim() && mediaType === 'none' && pollOptions.every(o => !o.trim())) return;
        setShowVisibility(true);
    };

    const finalizePost = async (visibility) => {
        setIsPosting(true);
        try {
            const postData = {
                content: postText || ' ',
                visibility,
                mediaType: mediaType === 'poll' ? 'none' : mediaType,
                mediaUrl: (mediaType === 'image' || mediaType === 'video') ? preview : '',
            };

            if (mediaType === 'poll') {
                postData.poll = {
                    options: pollOptions.filter(opt => opt.trim() !== '').map(opt => ({ text: opt, votes: [] }))
                };
            }

            const res = await axios.post('/api/posts', postData);
            if (res.data.success) {
                setPosts(prev => [res.data.post, ...prev]);
                resetComposer();
            }
        } catch (error) {
            alert('Failed to post. Picture might be too large or server is busy.');
        } finally {
            setIsPosting(false);
        }
    };

    const resetComposer = () => {
        setPostText('');
        setMediaType('none');
        setPreview(null);
        setPollOptions(['', '']);
        setShowVisibility(false);
    };

    const handleVote = async (postId, optionIndex) => {
        try {
            const res = await axios.put(`/api/posts/${postId}/vote`, { optionIndex });
            if (res.data.success) {
                setPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
            }
        } catch (error) {
            setAlertConfig({
                isOpen: true,
                title: "Wait a minute!",
                message: error.response?.data?.message || 'Failed to vote',
                type: 'success' // Using green as requested
            });
        }
    };

    const toggleLike = async (postId) => {
        try {
            const res = await axios.put(`/api/posts/${postId}/like`);
            if (res.data.success) {
                setPosts(prev => prev.map(p => {
                    if (p._id === postId) {
                        return { ...p, likes: res.data.likes };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const initiateDelete = (postId) => {
        setShowDeleteConfirm(postId);
    };

    const confirmDelete = async () => {
        if (!showDeleteConfirm) return;
        try {
            await axios.delete(`/api/posts/${showDeleteConfirm}`);
            setPosts(prev => prev.filter(p => p._id !== showDeleteConfirm));
        } catch (error) {
            console.error(error);
        } finally {
            setShowDeleteConfirm(null);
        }
    };

    const handleCommentSubmit = async (postId) => {
        if (!commentText.trim() || isSubmittingComment) return;
        setIsSubmittingComment(true);
        try {
            const res = await axios.post(`/api/posts/${postId}/comment`, { content: commentText });
            if (res.data.success) {
                setPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
                setCommentText('');
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleReport = (postId) => alert("Post reported.");
    const shareToChat = (post) => alert(`Post shared!`);

    const filteredPosts = posts.filter(p => {
        if (activeTab === 'Global') {
            // Global shows everything marked 'global'
            return p.visibility === 'global';
        } else {
            // Local shows posts from SAME college
            const isSameCollege = p.author?.college === user?.college;

            // Show if it's Global (and from same college), Local, or Private (only if author is current user)
            if (p.visibility === 'global') return isSameCollege;
            if (p.visibility === 'local') return isSameCollege;
            if (p.visibility === 'private') return p.author?._id === user?._id;

            return false;
        }
    });

    return (
        <div className="feed-container">
            <div className="feed-main">
                <div className="feed-tabs">
                    <button className={`feed-tab ${activeTab === 'Global' ? 'active' : ''}`} onClick={() => setActiveTab('Global')}>Global</button>
                    <button className={`feed-tab ${activeTab === 'Local' ? 'active' : ''}`} onClick={() => setActiveTab('Local')}>Local</button>
                </div>

                {/* Stories Row */}
                {userStoriesList.length > 0 && (
                    <div className="stories-row">
                        {userStoriesList.map((group) => (
                            <div key={group.user.id} className="story-item" onClick={() => viewUserStories(group.user.id)}>
                                <StoryRing hasStory={true} isViewed={false}>
                                    <div className="story-avatar">
                                        {group.stories[0].mediaType === 'image' ? (
                                            <img src={group.stories[0].mediaUrl} alt="Story" />
                                        ) : (
                                            <video src={group.stories[0].mediaUrl} />
                                        )}
                                    </div>
                                </StoryRing>
                                <span className="story-label">{group.user.username}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inline Post Composer */}
                <div className="create-post-trigger-wrapper">
                    <div className="create-post-trigger">
                        <div className="post-avatar">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} className="avatar-img" />
                            ) : (
                                user?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <textarea
                            className="trigger-input"
                            placeholder="What's on your mind?"
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                        />
                    </div>

                    <div className="inline-previews">
                        {mediaType === 'image' && preview && (
                            <div className="preview-item">
                                <img src={preview} alt="Preview" />
                                <button className="remove-preview" onClick={() => { setMediaType('none'); setPreview(null); }}><X size={16} /></button>
                            </div>
                        )}
                        {mediaType === 'video' && preview && (
                            <div className="preview-item">
                                <video src={preview} controls />
                                <button className="remove-preview" onClick={() => { setMediaType('none'); setPreview(null); }}><X size={16} /></button>
                            </div>
                        )}
                        {mediaType === 'poll' && (
                            <div className="poll-builder-inline">
                                <button className="remove-preview" onClick={() => setMediaType('none')}><X size={16} /></button>
                                {pollOptions.map((opt, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        className="poll-option-input-inline"
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => updatePollOption(idx, e.target.value)}
                                    />
                                ))}
                                {pollOptions.length < 6 && (
                                    <button className="add-option-btn-inline" onClick={addPollOption}>+ Add Option</button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="trigger-actions">
                        {!showVisibility ? (
                            <>
                                <div className="trigger-media-btns">
                                    <button className="media-btn" onClick={() => fileInputRef.current.click()}><ImageIcon size={18} /> Image</button>
                                    <button className="media-btn" onClick={() => fileInputRef.current.click()}><VideoIcon size={18} /> Video</button>
                                    <button className="media-btn" onClick={() => setMediaType('poll')}><BarChart2 size={18} /> Poll</button>
                                </div>
                                <button className="trigger-post-btn-large" onClick={handlePostClick} disabled={isPosting || (!postText.trim() && mediaType === 'none' && mediaType !== 'poll')}>
                                    {isPosting ? '...' : 'Post'}
                                </button>
                            </>
                        ) : (
                            <div className="visibility-inline">
                                <span>Post to:</span>
                                <button onClick={() => finalizePost('global')} title="Visible to everyone"><Globe size={16} /> Global</button>
                                <button onClick={() => finalizePost('local')} title="Visible only to your college"><Home size={16} /> Local</button>
                                <button onClick={() => finalizePost('private')} title="Visible only to you"><Sparkles size={16} /> Private</button>
                                <button className="cancel-vis" onClick={() => setShowVisibility(false)}>Cancel</button>
                            </div>
                        )}
                    </div>

                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleFileSelect} />
                </div>

                <div className="posts-list">
                    {filteredPosts.map(post => {
                        const isLiked = post.likes?.includes(user?._id);
                        const totalVotes = post.poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;

                        return (
                            <div key={post._id} className="post-card">
                                <div className="post-header">
                                    <div className="post-author">
                                        <div
                                            className="post-avatar clickable-avatar"
                                            onClick={() => navigate(`/profile/${post.author?.username || post.author?._id}`)}
                                            title={`View ${post.author?.name}'s profile`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {post.author?.profilePicture ? (
                                                <img src={post.author.profilePicture} alt={post.author.name} className="avatar-img" />
                                            ) : (
                                                post.author?.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="post-info">
                                            <div
                                                className="author-name clickable-name"
                                                onClick={() => navigate(`/profile/${post.author?.username || post.author?._id}`)}
                                                title={`View ${post.author?.name}'s profile`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {post.author?.name}
                                            </div>
                                            <div className="post-meta">
                                                {post.author?.college} • {new Date(post.createdAt).toLocaleString()}
                                                <span className="vis-badge"> • {post.visibility}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {user?._id === post.author?._id && (
                                        <button className="post-options" onClick={() => initiateDelete(post._id)}><Trash2 size={18} /></button>
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
                                                    <div key={idx} className={`poll-option ${opt.votes.includes(user?._id) ? 'voted' : ''}`} onClick={() => handleVote(post._id, idx)}>
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
                                        <button className="action-btn" onClick={() => toggleLike(post._id)}>
                                            <Heart size={20} fill={isLiked ? "#ef4444" : "none"} color={isLiked ? "#ef4444" : "currentColor"} />
                                        </button>
                                        <span className="action-count">{post.likes?.length || 0}</span>
                                    </div>
                                    <div className="action-item">
                                        <button className="action-btn" onClick={() => {
                                            const isOpening = activeCommentPostId !== post._id;
                                            setActiveCommentPostId(isOpening ? post._id : null);
                                            setCommentText('');
                                            if (isOpening) {
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
                                        <button className="action-btn" onClick={() => shareToChat(post)}><Send size={20} /></button>
                                        <span className="action-text">Share</span>
                                    </div>
                                    <div className="action-item report-action">
                                        <button className="action-btn report-btn" onClick={() => handleReport(post._id)}><Flag size={18} /></button>
                                    </div>
                                </div>

                                {activeCommentPostId === post._id && (
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
                                        <div className="comment-input-wrapper" id={`comment-input-${post._id}`}>
                                            <div className="comment-avatar">
                                                {user?.profilePicture ? (
                                                    <img src={user.profilePicture} alt="You" />
                                                ) : (
                                                    user?.name?.charAt(0) || 'U'
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
                                                        handleCommentSubmit(post._id);
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <button 
                                                className="comment-send-btn" 
                                                onClick={() => handleCommentSubmit(post._id)}
                                                disabled={!commentText.trim() || isSubmittingComment}
                                            >
                                                {isSubmittingComment ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Loader / Sentinel for Infinite Scroll */}
                <div ref={loaderRef} className="feed-loader">
                    {isLoading && (
                        <div className="skeleton-container">
                            {[1, 2].map(i => (
                                <div key={i} className="post-card skeleton">
                                    <div className="skeleton-header">
                                        <div className="skeleton-circle"></div>
                                        <div className="skeleton-lines">
                                            <div className="skeleton-line"></div>
                                            <div className="skeleton-line short"></div>
                                        </div>
                                    </div>
                                    <div className="skeleton-content"></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!hasMore && posts.length > 0 && <p className="end-msg">You've reached the end! </p>}
                </div>

                <ConfirmModal
                    isOpen={!!showDeleteConfirm}
                    title="Delete Post"
                    message="Are you sure you want to delete this post? This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteConfirm(null)}
                    confirmText="Delete"
                    type="danger"
                />
                <ConfirmModal
                    isOpen={alertConfig.isOpen}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                    confirmText="Got it"
                    type={alertConfig.type}
                />
            </div>
        </div>
    );
};

export default Feed;
