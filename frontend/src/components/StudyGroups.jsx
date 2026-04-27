import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { ArrowLeft, Plus, BookOpen, Users, Edit2, UserPlus, Image as ImageIcon, Check, Search, X, UserMinus } from 'lucide-react';
import './StudyGroups.css';
import ConfirmModal from './ConfirmModal';

const StudyGroups = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { users: allUsers, setActiveChat } = useChat();
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groups, setGroups] = useState([]);
    const [showInviteDropdown, setShowInviteDropdown] = useState(null);
    const [inviteSearch, setInviteSearch] = useState('');
    const [joiningGroups, setJoiningGroups] = useState([]);
    const [showCancelConfirm, setShowCancelConfirm] = useState(null); // stores groupId to cancel
    const [invitingUsers, setInvitingUsers] = useState([]); // stores 'groupId-userId'
    const [showMembersList, setShowMembersList] = useState(null); // groupId
    const [kickData, setKickData] = useState(null); // { groupId, userId, userName }
    const [kickReason, setKickReason] = useState('');

    const [groupData, setGroupData] = useState({
        name: '',
        description: '',
        groupPicture: ''
    });

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchGroups();

        // Listen for real-time socket updates
        const handleSocketUpdate = () => fetchGroups();
        window.addEventListener('group_updated', handleSocketUpdate);
        return () => window.removeEventListener('group_updated', handleSocketUpdate);
    }, []);

    useEffect(() => {
        if (location.state?.highlightGroupId && groups.length > 0) {
            // Use a small delay to ensure the DOM is ready after the groups are fetched
            setTimeout(() => {
                const element = document.getElementById(`group-${location.state.highlightGroupId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-pulse');
                    // Remove the class after animation finishes
                    setTimeout(() => element.classList.remove('highlight-pulse'), 3000);
                }
            }, 100);
        }
    }, [location.state, groups]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showInviteDropdown && !event.target.closest('.invite-wrapper')) {
                setShowInviteDropdown(null);
                setInviteSearch('');
            }
            if (showMembersList && !event.target.closest('.members-count-wrapper')) {
                setShowMembersList(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showInviteDropdown, showMembersList]);

    const fetchGroups = async () => {
        try {
            const res = await axios.get('/api/groups');
            if (res.data.success) {
                setGroups(res.data.groups);
            }
        } catch (err) {
            console.error('Failed to fetch groups', err);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupData(prev => ({ ...prev, groupPicture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateOrUpdateGroup = async (e) => {
        e.preventDefault();
        if (!groupData.name) return;

        try {
            let res;
            if (editMode && selectedGroup) {
                res = await axios.put(`/api/groups/${selectedGroup._id}`, groupData);
            } else {
                res = await axios.post('/api/groups', groupData);
            }

            if (res.data.success) {
                setShowModal(false);
                setEditMode(false);
                setSelectedGroup(null);
                setGroupData({ name: '', description: '', groupPicture: '' });
                fetchGroups();
            }
        } catch (error) {
            console.error('Failed to save group', error);
        }
    };

    const handleEditClick = (group) => {
        setSelectedGroup(group);
        setGroupData({
            name: group.name,
            description: group.description,
            groupPicture: group.groupPicture || ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleInvite = async (groupId, userId) => {
        try {
            const res = await axios.post(`/api/groups/${groupId}/invite`, { userId });
            if (res.data.success) {
                // Show success feedback (maybe a small toast or just close dropdown)
                setShowInviteDropdown(null);
            }
        } catch (err) {
            console.error('Failed to send invite', err);
        }
    };

    const handleViewGroup = (group) => {
        // We'll pass group info via state or use a special activeChat type in the future
        // For now, let's navigate to chat and handle the group selection there
        navigate('/chat', { state: { targetGroup: group } });
    };

    const handleJoin = async (groupId) => {
        setJoiningGroups(prev => [...prev, groupId]);
        try {
            const res = await axios.post(`/api/groups/${groupId}/request-join`);
            if (res.data.success) {
                fetchGroups();
            }
        } catch (error) {
            console.error('Failed to request join', error);
            // Show the exact error message from the backend to help us debug
            const errMsg = error.response?.data?.message || error.message;
            alert(`Backend Error: ${errMsg}`);
            fetchGroups();
        } finally {
            setJoiningGroups(prev => prev.filter(id => id !== groupId));
        }
    };

    const handleCancelJoin = async (groupId) => {
        try {
            const res = await axios.post(`/api/groups/${groupId}/cancel-join`);
            if (res.data.success) {
                setShowCancelConfirm(null);
                fetchGroups();
            }
        } catch (error) {
            console.error('Failed to cancel join', error);
        }
    };

    const handleKick = async () => {
        if (!kickData) return;
        try {
            const res = await axios.post(`/api/groups/${kickData.groupId}/kick`, { 
                userId: kickData.userId,
                reason: kickReason
            });
            if (res.data.success) {
                setKickData(null);
                setKickReason('');
                fetchGroups();
            }
        } catch (error) {
            console.error('Failed to kick member', error);
            alert(error.response?.data?.message || 'Failed to kick member');
        }
    };

    // Filter people the admin is following
    const followings = allUsers.filter(u => user?.following?.includes(u._id));
    const filteredFollowings = followings.filter(u => 
        u.name.toLowerCase().includes(inviteSearch.toLowerCase())
    );

    return (
        <div className="groups-container">
            <div className="groups-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}><ArrowLeft size={18} style={{ marginRight: '6px' }} /> Back</button>
                <h1 className='raja'>Study Groups</h1>
                <button className="create-group-btn" onClick={() => {
                    setEditMode(false);
                    setGroupData({ name: '', description: '', groupPicture: '' });
                    setShowModal(true);
                }}><Plus size={18} style={{ marginRight: '6px' }} /> Create Group</button>
            </div>

            <div className="groups-grid">
                {groups.map(group => {
                    const currentUserId = user?._id?.toString();
                    const groupAdminId = (group.admin?._id || group.admin || group.creator?._id || group.creator)?.toString();
                    const isAdmin = groupAdminId === currentUserId;
                    const isMember = group.members?.some(m => (m._id?.toString() || m?.toString()) === currentUserId);
                    const isPendingInvite = group.pendingMembers?.some(m => (m._id?.toString() || m?.toString()) === currentUserId);
                    const isRequested = group.joinRequests?.some(m => (m._id?.toString() || m?.toString()) === currentUserId);

                    return (
                        <div key={group._id} id={`group-${group._id}`} className="group-card">
                            <div className="group-card-header">
                                {isAdmin && (
                                    <button className="edit-group-icon-btn" onClick={() => handleEditClick(group)}>
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            
                            <div className="group-avatar-main">
                                {group.groupPicture ? (
                                    <img src={group.groupPicture} alt="" className="group-img-large" />
                                ) : (
                                    <div className="group-placeholder-large"><BookOpen size={40} /></div>
                                )}
                            </div>

                            <div className="group-content">
                                <h3>{group.name}</h3>
                                <p className="group-desc">{group.description}</p>
                                <div className="group-details">
                                    <div className="members-count-wrapper">
                                        <span className="members-count-btn" onClick={() => setShowMembersList(showMembersList === group._id ? null : group._id)}>
                                            <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {group.members?.length || 0} Members
                                        </span>
                                        
                                        {showMembersList === group._id && (
                                            <div className="members-dropdown">
                                                <div className="members-dropdown-header">
                                                    <h4>Group Members</h4>
                                                    <button onClick={() => setShowMembersList(null)}><X size={14} /></button>
                                                </div>
                                                <div className="members-list">
                                                    {group.members?.map(member => {
                                                        const isAdminMember = (group.admin?._id || group.admin) === member._id;
                                                        const isSelf = member._id === user?._id;
                                                        return (
                                                            <div key={member._id} className="member-item">
                                                                <div className="member-info">
                                                                    <div className="member-avatar">
                                                                        {member.profilePicture ? <img src={member.profilePicture} alt="" /> : member.name[0]}
                                                                    </div>
                                                                    <span className={isAdminMember ? 'admin-name' : ''}>
                                                                        {member.name} {isSelf && "(You)"}
                                                                    </span>
                                                                </div>
                                                                {isAdmin && !isAdminMember && (
                                                                    <button 
                                                                        className="kick-btn" 
                                                                        title="Kick member"
                                                                        onClick={() => setKickData({ groupId: group._id, userId: member._id, userName: member.name })}
                                                                    >
                                                                        <UserMinus size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="group-card-actions">
                                {isAdmin ? (
                                    <div className="admin-actions-row">
                                        <button className="view-group-btn" onClick={() => handleViewGroup(group)}>View Group</button>
                                        <div className="invite-wrapper">
                                            <button 
                                                className="invite-friends-btn" 
                                                onClick={() => setShowInviteDropdown(showInviteDropdown === group._id ? null : group._id)}
                                            >
                                                <UserPlus size={18} /> Invite
                                            </button>
                                            
                                            {showInviteDropdown === group._id && (
                                                <div className="invite-dropdown">
                                                    <div className="invite-search">
                                                        <Search size={14} />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Search friends..." 
                                                            value={inviteSearch}
                                                            onChange={(e) => setInviteSearch(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    <div className="invite-list">
                                                        {filteredFollowings.length > 0 ? (
                                                            filteredFollowings.map(f => {
                                                                const isAlreadyMember = group.members?.some(m => (m._id || m) === f._id);
                                                                const isAlreadyInvited = group.pendingMembers?.includes(f._id);

                                                                return (
                                                                    <div key={f._id} className="invite-item">
                                                                        <div className="invite-user-info">
                                                                            <div className="invite-avatar">
                                                                                {f.profilePicture ? <img src={f.profilePicture} alt="" /> : f.name[0]}
                                                                            </div>
                                                                            <span>{f.name}</span>
                                                                        </div>
                                                                        <div className="invite-action">
                                                                        {isAlreadyMember ? (
                                                                            <span className="invited-badge joined">Joined</span>
                                                                        ) : invitingUsers.includes(`${group._id}-${f._id}`) ? (
                                                                            <div className="spinner-small mini"></div>
                                                                        ) : isAlreadyInvited ? (
                                                                            <span 
                                                                                className="invited-badge invited" 
                                                                                onClick={() => handleCancelInvite(group._id, f._id)}
                                                                                title="Click to cancel invite"
                                                                            >
                                                                                Invited
                                                                            </span>
                                                                        ) : (
                                                                            <button className="invite-action-btn" onClick={() => handleInvite(group._id, f._id)}>
                                                                                <Plus size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                            })
                                                        ) : (
                                                            <div className="no-friends">No friends found</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : isMember ? (
                                    <button className="view-group-btn full-width" onClick={() => handleViewGroup(group)}>
                                        View Group
                                    </button>
                                ) : joiningGroups.includes(group._id) ? (
                                    <button className="join-btn loading" disabled>
                                        <div className="spinner-small"></div>
                                    </button>
                                ) : isPendingInvite ? (
                                    <button className="join-btn pending" disabled>Pending Invite</button>
                                ) : isRequested ? (
                                    <button className="join-btn requested" onClick={() => setShowCancelConfirm(group._id)}>Requested</button>
                                ) : (
                                    <button className="join-btn" onClick={() => handleJoin(group._id)}>Join Group</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{editMode ? 'Edit Group' : 'Create New Group'}</h2>
                        <form onSubmit={handleCreateOrUpdateGroup}>
                            <div className="group-picture-upload">
                                <div className="picture-preview" onClick={() => fileInputRef.current?.click()}>
                                    {groupData.groupPicture ? (
                                        <img src={groupData.groupPicture} alt="Preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <ImageIcon size={32} />
                                            <span>Upload Picture</span>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    accept="image/*" 
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Group Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Calculus Study"
                                    value={groupData.name}
                                    onChange={e => setGroupData({ ...groupData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="What will you study?"
                                    value={groupData.description}
                                    onChange={e => setGroupData({ ...groupData, description: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="submit-btn">{editMode ? 'Update Group' : 'Create Group'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={!!showCancelConfirm}
                title="Cancel Join Request"
                message="Are you sure you want to cancel your request to join this group?"
                confirmText="Yes, Cancel"
                cancelText="No, Keep it"
                onConfirm={() => handleCancelJoin(showCancelConfirm)}
                onCancel={() => setShowCancelConfirm(null)}
                type="danger"
            />

            {kickData && (
                <div className="modal-overlay" onClick={() => setKickData(null)}>
                    <div className="modal-content kick-modal" onClick={e => e.stopPropagation()}>
                        <div className="kick-modal-header">
                            <UserMinus size={32} color="#ef4444" />
                            <h2>Remove Member?</h2>
                        </div>
                        <p>Do you want to kick <strong>{kickData.userName}</strong> out of this group?</p>
                        
                        <div className="form-group">
                            <label>Reason for removal</label>
                            <input 
                                type="text" 
                                placeholder="Enter a reason (optional)"
                                value={kickReason}
                                onChange={e => setKickReason(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setKickData(null)}>Cancel</button>
                            <button className="submit-btn kick-confirm-btn" onClick={handleKick}>Yes, Kick Out</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyGroups;
