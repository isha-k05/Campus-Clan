import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Search, MessageSquare, ChevronRight, Loader } from 'lucide-react';
import './Connect.css';

// Normalise any id shape → plain string
const toStr = (id) => {
    if (!id) return '';
    if (typeof id === 'object' && id._id) return id._id.toString();
    return id.toString();
};

const Connect = () => {
    const { user: currentUser, setUser } = useAuth();
    const navigate = useNavigate();

    // Full list of other users (fetched from server — includes their followers arrays)
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // ──────────────────────────────────────────────────────────────────────────
    // followingSet  →  plain-string IDs that the current user is following.
    //                  Single source of truth for all button states in this page.
    // ──────────────────────────────────────────────────────────────────────────
    const [followingSet, setFollowingSet] = useState(new Set());

    // Per-button loading state (only the clicked button shows spinner)
    const [loadingSet, setLoadingSet] = useState(new Set());

    // Flag so we only initialise followingSet once from context
    const ready = useRef(false);

    // ── Fetch all users + initialise followingSet ─────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const res = await axios.get('/api/users');
                if (res.data.success) {
                    setUsers(res.data.users);
                }
            } catch (err) {
                console.error('Failed to fetch users', err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Initialise followingSet from currentUser.following (once)
    useEffect(() => {
        if (!ready.current && currentUser?.following) {
            const ids = currentUser.following.map(toStr).filter(Boolean);
            setFollowingSet(new Set(ids));
            ready.current = true;
        }
    }, [currentUser]);

    // ── Follow / Unfollow ─────────────────────────────────────────────────────
    const handleFollow = async (targetId) => {
        const targetIdStr = toStr(targetId);
        if (loadingSet.has(targetIdStr)) return; // block double-click

        // Show spinner only on this button
        setLoadingSet(prev => new Set([...prev, targetIdStr]));

        try {
            const res = await axios.put(`/api/users/${targetIdStr}/follow`);
            if (!res.data.success) throw new Error('Follow API failed');

            // Server tells us the definitive new following list (plain strings)
            const newFollowing = (res.data.following || []).map(toStr).filter(Boolean);
            const newSet = new Set(newFollowing);

            // Update local set → all buttons re-evaluate independently
            setFollowingSet(newSet);

            // Keep AuthContext in sync for Profile page / other components
            if (setUser) {
                setUser(prev => ({ ...prev, following: newFollowing }));
            }

            // Update the follower count on the target user card so it stays accurate
            const nowFollowing = newSet.has(targetIdStr);
            setUsers(prev => prev.map(u => {
                if (toStr(u._id) !== targetIdStr) return u;
                const myId = toStr(currentUser?._id);
                const currentFollowers = (u.followers || []).map(toStr);
                const alreadyIn = currentFollowers.includes(myId);

                let updatedFollowers;
                if (nowFollowing && !alreadyIn) {
                    updatedFollowers = [...currentFollowers, myId];
                } else if (!nowFollowing && alreadyIn) {
                    updatedFollowers = currentFollowers.filter(id => id !== myId);
                } else {
                    updatedFollowers = currentFollowers;
                }
                return { ...u, followers: updatedFollowers };
            }));

        } catch (error) {
            console.error('Follow action failed:', error);
            // No optimistic update was applied so nothing to revert — just remove spinner
        } finally {
            setLoadingSet(prev => {
                const next = new Set(prev);
                next.delete(targetIdStr);
                return next;
            });
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.college.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const myId = toStr(currentUser?._id);

    return (
        <div className="discover-page">
            <div className="discover-header">
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        placeholder="Search students or colleges..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="discover-content">
                <h2 className="section-title">Suggested for you</h2>

                {loading ? (
                    <div className="discover-loading">Finding students...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="discover-empty">
                        No students found matching "{searchTerm}"
                    </div>
                ) : (
                    <div className="users-list">
                        {filteredUsers.map(user => {
                            const userIdStr = toStr(user._id);

                            // Does current user follow this person?
                            const isFollowing = followingSet.has(userIdStr);

                            // Does this person follow the current user?
                            // (check their following array from the server response)
                            const isFollower = (user.following || [])
                                .map(toStr)
                                .includes(myId);

                            const isLoading = loadingSet.has(userIdStr);

                            // Button label logic (same as Instagram / Profile page)
                            let btnLabel;
                            if (isLoading) {
                                btnLabel = <Loader size={14} className="spin-icon" />;
                            } else if (isFollowing) {
                                btnLabel = 'Following';
                            } else if (isFollower) {
                                btnLabel = 'Follow Back';
                            } else {
                                btnLabel = 'Follow';
                            }

                            return (
                                <div
                                    key={user._id}
                                    className="user-row"
                                    onClick={() => navigate(`/profile/${user._id}`)}
                                >
                                    <div className="user-info-main">
                                        <div className="user-avatar-small">
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.name} className="avatar-img" />
                                            ) : (
                                                user.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="user-text-details">
                                            <span className="user-full-name">{user.name}</span>
                                            <span className="user-college-name">{user.college}</span>
                                        </div>
                                    </div>

                                    <div className="user-row-actions" onClick={e => e.stopPropagation()}>
                                        <button
                                            className={`row-follow-btn ${isFollowing ? 'following' : ''} ${isLoading ? 'btn-loading' : ''}`}
                                            onClick={() => handleFollow(user._id)}
                                            disabled={isLoading}
                                        >
                                            {btnLabel}
                                        </button>

                                        {/*
                                          Always rendered (visibility:hidden when not following)
                                          so the row width never shifts on follow/unfollow
                                        */}
                                        <button
                                            className="row-msg-btn"
                                            style={{ visibility: isFollowing ? 'visible' : 'hidden' }}
                                            onClick={() => navigate('/chat', { state: { targetUser: user } })}
                                            tabIndex={isFollowing ? 0 : -1}
                                            aria-hidden={!isFollowing}
                                        >
                                            <MessageSquare size={16} />
                                        </button>

                                        <ChevronRight
                                            className="row-arrow"
                                            size={20}
                                            onClick={() => navigate(`/profile/${user._id}`)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Connect;
