import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import axios from 'axios';
import { ArrowLeft, Users, Calendar, BookOpen, GraduationCap, Bell, BellOff, Trash2, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket, setUnreadCount } = useChat();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load notifications from backend
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axios.get('/api/notifications');
                if (res.data.success) {
                    setNotifications(res.data.notifications);
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
        // Clear unread count when viewing notifications
        if (setUnreadCount) setUnreadCount(0);
    }, [setUnreadCount]);

    // Use socket from ChatContext
    useEffect(() => {
        if (!socket) return;

        const handleNewNotif = (notif) => {
            setNotifications(prev => [notif, ...prev]);
        };

        socket.on('new_notification', handleNewNotif);

        return () => {
            socket.off('new_notification', handleNewNotif);
        };
    }, [socket]);

    const formatNotifTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await axios.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const markAsRead = async (id, type, senderId, data) => {
        try {
            await axios.put(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            ));
            
            if (type === 'follow' && senderId) {
                navigate(`/profile/${senderId}`);
            } else if (type === 'message_request') {
                navigate('/chat');
            } else if (type === 'group_invite' && data?.groupId) {
                navigate('/chat', { state: { targetGroup: { _id: data.groupId, name: data.groupName, pendingMembers: [user?._id], admin: senderId } } });
            }
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const clearAll = async () => {
        try {
            const res = await axios.delete('/api/notifications');
            if (res.data.success) {
                setNotifications([]);
            }
        } catch (err) {
            console.error("Clear all failed", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'follow': return <Users size={24} color="#f97316" />;
            case 'message_request': return <Bell size={24} color="#3b82f6" />;
            case 'group_invite': return <BookOpen size={24} color="#10b981" />;
            case 'group_join_request': return <UserPlus size={24} color="#8b5cf6" />;
            case 'group_join_allowed': return <CheckCircle size={24} color="#10b981" />;
            case 'group_join_denied': return <XCircle size={24} color="#f43f5e" />;
            case 'event': return <Calendar size={24} color="#f59e0b" />;
            case 'group': return <BookOpen size={24} color="#10b981" />;
            case 'system': return <GraduationCap size={24} color="#8b5cf6" />;
            case 'group_kicked': return <Users size={24} color="#ef4444" />;
            default: return <Bell size={24} color="#6366f1" />;
        }
    };

    const handleJoinAction = async (e, id, groupId, userId, action) => {
        e.stopPropagation();
        try {
            const res = await axios.post(`/api/groups/${groupId}/${action}-join`, { userId });
            if (res.data.success) {
                setNotifications(prev => prev.filter(n => n._id !== id));
            }
        } catch (err) {
            console.error(`Failed to ${action} join request`, err);
        }
    };

    const handleInviteAction = async (e, id, groupId, action) => {
        e.stopPropagation();
        try {
            const res = await axios.post(`/api/groups/${groupId}/${action}`);
            if (res.data.success) {
                setNotifications(prev => prev.filter(n => n._id !== id));
            }
        } catch (err) {
            console.error(`Failed to ${action} group invite`, err);
        }
    };

    return (
        <div className="notifications-container">
            <div className="notifications-header">
                <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} style={{ marginRight: '6px' }} /> Back</button>
                <h1>Notifications</h1>
                {notifications.length > 0 && (
                    <button className="clear-btn" onClick={clearAll}>Clear All</button>
                )}
            </div>

            <div className="notifications-list">
                {loading ? (
                    <div className="notifications-loading">Loading alerts...</div>
                ) : notifications.length === 0 ? (
                    <div className="no-notifications">
                        <div className="empty-icon"><BellOff size={64} color="#cbd5e1" /></div>
                        <h3>No new notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
                            onClick={() => markAsRead(notification._id, notification.type, notification.sender?._id, notification.data)}
                        >
                            <div className="notification-icon">
                                {notification.type === 'group_invite' && notification.data?.groupPicture ? (
                                    <img src={notification.data.groupPicture} alt="" className="notif-avatar" />
                                ) : (
                                    getIcon(notification.type)
                                )}
                            </div>
                            <div className="notification-content">
                                <div className="notification-top">
                                    <h3>
                                        {notification.type === 'follow' ? 'New Follower' : 
                                         notification.type === 'group_invite' ? 'Group Invitation' : 
                                         notification.type === 'message_request' ? 'Message Request' : 
                                         notification.type === 'group_join_request' ? 'Join Request' : 
                                         notification.type === 'group_join_allowed' ? 'Request Approved' : 
                                         notification.type === 'group_join_denied' ? 'Request Denied' : 
                                         notification.type === 'group_invite_denied' ? 'Invitation Declined' : 
                                         notification.type === 'group_kicked' ? 'Group Removal' : 
                                         'Notification'}
                                    </h3>
                                    <span className="time">{formatNotifTime(notification.createdAt)}</span>
                                </div>
                                <p>
                                    {notification.type === 'follow' ? `${notification.sender?.name} started following you` : 
                                     notification.type === 'message_request' ? `${notification.sender?.name} sent you a message request` : 
                                     notification.type === 'group_invite' ? `${notification.sender?.name} asked you to join "${notification.data?.groupName}"` : 
                                     notification.type === 'group_join_request' ? `${notification.sender?.name} wants to join your group "${notification.data?.groupName}"` : 
                                     notification.type === 'group_join_allowed' ? `Admin allowed you to join "${notification.data?.groupName}". You can now chat with the group.` : 
                                     notification.type === 'group_join_denied' ? `Admin denied your request to join "${notification.data?.groupName}".` : 
                                     notification.type === 'group_invite_denied' ? `${notification.sender?.name} declined your invitation to join "${notification.data?.groupName}".` : 
                                     notification.type === 'group_kicked' ? `You have been kicked out of "${notification.data?.groupName}". Reason: ${notification.data?.reason}` : 
                                     'You have a new update'}
                                </p>
                                {notification.type === 'group_join_request' && !notification.isRead && (
                                    <div className="notif-request-actions">
                                        <button className="allow-btn" onClick={(e) => handleJoinAction(e, notification._id, notification.data?.groupId, notification.sender?._id, 'allow')}>Allow</button>
                                        <button className="deny-btn" onClick={(e) => handleJoinAction(e, notification._id, notification.data?.groupId, notification.sender?._id, 'deny')}>Deny</button>
                                    </div>
                                )}
                                {notification.type === 'group_invite' && !notification.isRead && (
                                    <div className="notif-request-actions">
                                        <button className="allow-btn" onClick={(e) => handleInviteAction(e, notification._id, notification.data?.groupId, 'accept')}>Accept</button>
                                        <button className="deny-btn" onClick={(e) => handleInviteAction(e, notification._id, notification.data?.groupId, 'decline')}>Decline</button>
                                    </div>
                                )}
                            </div>
                            <div className="notification-actions-end">
                                <button className="notif-delete-btn" onClick={(e) => handleDelete(e, notification._id)}>
                                    <Trash2 size={18} />
                                </button>
                                {!notification.isRead && <div className="unread-dot-small"></div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notifications;
