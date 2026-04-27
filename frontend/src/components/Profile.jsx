import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStory } from '../context/StoryContext';
import StoryRing from './StoryRing';
import EditProfileModal from './EditProfileModal';
import axios from 'axios';
import { Settings, Grid, MessageSquare, UserPlus, UserCheck, Globe, MapPin, ArrowLeft, Play, BarChart3, AlignLeft, Heart } from 'lucide-react';
import PostCard from './PostCard';
import './Profile.css';
import './Feed.css';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, setUser } = useAuth();
    const { hasActiveStory, viewUserStories, areAllStoriesViewed } = useStory();
    const [activeTab, setActiveTab] = useState('posts');
    const [targetUser, setTargetUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollower, setIsFollower] = useState(false); // They follow me
    const [profileLoading, setProfileLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userPosts, setUserPosts] = useState([]);
    const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

    const normalizeId = useCallback((uid) => {
        if (!uid) return null;
        return typeof uid === 'object' ? uid._id?.toString() || uid.toString() : uid.toString();
    }, []);

    const isOwnProfile = !id || (currentUser && normalizeId(id) === normalizeId(currentUser));
    const displayUser = isOwnProfile ? currentUser : targetUser;

    useEffect(() => {
        const fetchProfileData = async () => {
            const profileId = id || currentUser?._id;
            if (!profileId) {
                return;
            }

            if (!isOwnProfile) {
                setTargetUser(null);
            }
            setProfileLoading(true);
            try {
                const userRes = await axios.get(`/api/users/${profileId}`);
                if (userRes.data.success) {
                    const fetchedUser = userRes.data.user;
                    setTargetUser(fetchedUser);
                    
                    // Sync currentUser with latest data if it's our own profile
                    if (isOwnProfile) {
                        setUser(prev => ({ ...prev, ...fetchedUser }));
                    }

                    setStats({
                        posts: fetchedUser.postsCount || 0,
                        followers: fetchedUser.followers?.length || 0,
                        following: fetchedUser.following?.length || 0
                    });

                    const amIFollowing = fetchedUser.followers?.some(fid => normalizeId(fid) === normalizeId(currentUser));
                    setIsFollowing(amIFollowing);

                    const isTheyFollowingMe = fetchedUser.following?.some(fid => normalizeId(fid) === normalizeId(currentUser));
                    setIsFollower(isTheyFollowingMe);
                }

                const postsRes = await axios.get(`/api/posts/user/${profileId}`);
                if (postsRes.data.success) {
                    setUserPosts(postsRes.data.posts);
                    setStats(prev => ({ ...prev, posts: postsRes.data.posts.length }));
                }
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfileData();
    }, [id, currentUser?._id, normalizeId]);

    const handleFollow = async () => {
        if (!targetUser) return;
        
        const targetId = normalizeId(targetUser);
        
        // OPTIMISTIC UPDATE
        const willBeFollowing = !isFollowing;
        setIsFollowing(willBeFollowing);
        
        setStats(prev => ({
            ...prev,
            followers: willBeFollowing ? prev.followers + 1 : prev.followers - 1
        }));

        try {
            const res = await axios.put(`/api/users/${targetId}/follow`);
            if (res.data.success) {
                // Sync with server's authoritative following list
                if (setUser) {
                    setUser(prev => ({ ...prev, following: res.data.following }));
                }
            }
        } catch (error) {
            console.error("Follow failed", error);
            setIsFollowing(!willBeFollowing);
            setStats(prev => ({
                ...prev,
                followers: !willBeFollowing ? prev.followers + 1 : prev.followers - 1
            }));
        }
    };

    const handleLike = async (postId) => {
        try {
            const res = await axios.put(`/api/posts/${postId}/like`);
            if (res.data.success) {
                setUserPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleVote = async (postId, optionIndex) => {
        try {
            const res = await axios.put(`/api/posts/${postId}/vote`, { optionIndex });
            if (res.data.success) {
                setUserPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
            }
        } catch (error) {
            console.error("Vote failed", error);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await axios.delete(`/api/posts/${postId}`);
            setUserPosts(prev => prev.filter(p => p._id !== postId));
            setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
        } catch (error) {
            console.error("Could not delete post", error);
        }
    };

    const handleCommentSubmit = async (postId, commentText) => {
        try {
            const res = await axios.post(`/api/posts/${postId}/comment`, { content: commentText });
            if (res.data.success) {
                setUserPosts(prev => prev.map(p => p._id === postId ? res.data.post : p));
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    const handlePostClick = (post) => {
        setViewMode('feed');
        setTimeout(() => {
            const element = document.getElementById(`post-${post._id}`);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    if (profileLoading && !displayUser) {
        return (
            <div className="profile-container">
                <div className="profile-skeleton">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-info">
                        <div className="skeleton-line title"></div>
                        <div className="skeleton-stats">
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                        </div>
                        <div className="skeleton-line bio"></div>
                        <div className="skeleton-line bio-short"></div>
                    </div>
                </div>
            </div>
        );
    }
    if (!displayUser) return <div className="profile-not-found"><h2>User not found</h2><button onClick={() => navigate('/dashboard')}>Go Home</button></div>;



    return (
        <div className="profile-container">
            <div className="profile-nav-top">
                <button className="nav-back-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} /></button>
                {isOwnProfile && <Settings className="settings-icon-btn" size={24} onClick={() => navigate('/settings')} />}
            </div>
            <div className="profile-header">
                <div className="profile-header-content">
                    <div className="profile-avatar-section">
                        <StoryRing
                            hasStory={hasActiveStory(normalizeId(targetUser))}
                            isViewed={areAllStoriesViewed(normalizeId(targetUser))}
                            size={200}
                            onClick={() => hasActiveStory(normalizeId(targetUser)) && viewUserStories(normalizeId(targetUser))}
                        >
                            <div className="profile-avatar-xl">
                                {displayUser?.profilePicture ? (
                                    <img src={displayUser.profilePicture} alt={displayUser.name} className="avatar-img" />
                                ) : (
                                    displayUser?.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                        </StoryRing>
                    </div>

                    <div className="profile-info-section">
                        <div className="profile-username-row">
                            <h1 className="profile-username">{displayUser?.username || displayUser?.name?.toLowerCase().replace(/\s/g, '')}</h1>
                            {isOwnProfile ? (
                                <button className="edit-profile-btn" onClick={() => setIsEditModalOpen(true)}>Edit Profile</button>
                            ) : (
                                <div className="profile-actions-row">
                                    <button className={`follow-btn-main ${isFollowing ? 'following' : ''}`} onClick={handleFollow}>
                                        {isFollowing ? <><UserCheck size={18} /> Following</> : isFollower ? <><UserPlus size={18} /> Follow Back</> : <><UserPlus size={18} /> Follow</>}
                                    </button>
                                    <button className="message-btn-main" onClick={() => navigate('/chat', { state: { targetUser } })}>
                                        <MessageSquare size={18} /> Message
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item"><span className="stat-value">{stats.posts}</span><span className="stat-label">posts</span></div>
                            <div className="stat-item"><span className="stat-value">{stats.followers}</span><span className="stat-label">followers</span></div>
                            <div className="stat-item"><span className="stat-value">{stats.following}</span><span className="stat-label">following</span></div>
                        </div>

                        <div className="profile-bio">
                            <div className="profile-full-name">{displayUser?.name}</div>
                            <div className="profile-college">🎓 {displayUser?.college}</div>
                            <div className="profile-description">{displayUser?.bio || 'No bio yet.'}</div>
                            
                            {(displayUser?.location || displayUser?.website) && (
                                <div className="profile-bio-extras">
                                    {displayUser?.location && (
                                        <div className="bio-extra-item">
                                            <MapPin size={14} /> {displayUser.location}
                                        </div>
                                    )}
                                    {displayUser?.website && (
                                        <div className="bio-extra-item">
                                            <Globe size={14} /> 
                                            <a href={displayUser.website.startsWith('http') ? displayUser.website : `https://${displayUser.website}`} target="_blank" rel="noopener noreferrer">
                                                {displayUser.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-tabs-instagram">
                <button className={`profile-tab-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}><Grid size={22} /></button>
                <button className={`profile-tab-item ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}><Play size={22} /></button>
                <button className={`profile-tab-item ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}><MessageSquare size={22} /></button>
                <button className={`profile-tab-item ${activeTab === 'poll' ? 'active' : ''}`} onClick={() => setActiveTab('poll')}><BarChart3 size={22} /></button>
            </div>
            <div className="profile-content">
                {(() => {
                    const filteredPosts = userPosts.filter(p => {
                        if (activeTab === 'posts') return p.mediaType === 'image';
                        if (activeTab === 'video') return p.mediaType === 'video';
                        if (activeTab === 'text') return (!p.poll || !p.poll.options || p.poll.options.length === 0) && p.mediaType !== 'image' && p.mediaType !== 'video';
                        if (activeTab === 'poll') return p.poll && p.poll.options && p.poll.options.length > 0;
                        return true;
                    });

                    if (filteredPosts.length === 0) {
                        const tabNames = { posts: 'photos', video: 'videos', text: 'text posts', poll: 'polls' };
                        return (
                            <div className="empty-tab">
                                <div className="empty-icon">
                                    {activeTab === 'posts' && <Grid size={48} />}
                                    {activeTab === 'video' && <Play size={48} />}
                                    {activeTab === 'text' && <MessageSquare size={48} />}
                                    {activeTab === 'poll' && <BarChart3 size={48} />}
                                </div>
                                <h3>No {tabNames[activeTab]} yet</h3>
                                <p>When {isOwnProfile ? 'you post' : (displayUser?.name || 'this user') + ' posts'} {tabNames[activeTab]}, they will appear here.</p>
                            </div>
                        );
                    }

                    return (
                        <div className="profile-feed-view">
                            <div className="profile-feed-list">
                                {filteredPosts.map(post => (
                                    <div key={post._id} id={`post-${post._id}`}>
                                        <PostCard 
                                            post={post} 
                                            currentUser={currentUser} 
                                            onLike={handleLike} 
                                            onVote={handleVote} 
                                            onDelete={handleDeletePost} 
                                            onReport={() => alert('Reported')}
                                            onShare={() => alert('Shared')}
                                            onComment={handleCommentSubmit}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
        </div>
    );
};

export default Profile;
