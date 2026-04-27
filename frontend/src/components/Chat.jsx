import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Send, XCircle, CheckCircle, Users, Bot } from 'lucide-react';
import './Chat.css';

const Chat = () => {
    const location = useLocation();
    const { user: currentUser } = useAuth();
    const { 
        users, 
        myGroups, 
        activeChat, 
        setActiveChat, 
        sendMessage, 
        acceptChat, 
        declineChat, 
        getMessages,
        acceptGroupInvite,
        declineGroupInvite,
        sendAiMessage
    } = useChat();
    
    const [messageText, setMessageText] = useState('');
    const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'groups'
    const [declinedBy, setDeclinedBy] = useState(null); 
    const [iDeclined, setIDeclined] = useState(false); 
    
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const normalizeId = (uid) => {
        if (!uid) return null;
        return typeof uid === 'object' ? uid._id?.toString() || uid.toString() : uid.toString();
    };

    const isGroup = activeChat && !!activeChat.members;
    const activeMessages = activeChat ? getMessages(normalizeId(activeChat), isGroup) : [];

    useEffect(() => {
        if (location.state?.targetUser) {
            setActiveTab('direct');
            setActiveChat(location.state.targetUser);
        } else if (location.state?.targetGroup) {
            setActiveTab('groups');
            setActiveChat(location.state.targetGroup);
        }
    }, [location.state, setActiveChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeMessages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const chatId = normalizeId(activeChat);
        if (!messageText.trim() || !chatId) return;

        if (chatId === 'my_ai_bot') {
            sendAiMessage(messageText);
        } else {
            sendMessage(chatId, messageText, isGroup);
        }
        setMessageText('');
    };

    const handleAcceptGroup = async () => {
        await acceptGroupInvite(normalizeId(activeChat));
    };

    const handleDeclineGroup = async () => {
        await declineGroupInvite(normalizeId(activeChat));
        setActiveChat(null);
    };

    const handleAcceptDirect = async () => {
        await acceptChat(normalizeId(activeChat));
    };

    const handleDeclineDirect = async () => {
        await declineChat(normalizeId(activeChat));
        setActiveChat(null);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
        }
    };

    const isPendingMember = isGroup && activeChat.pendingMembers?.includes(currentUser._id);
    const isDirectRequest = !isGroup && 
        activeChat?._id !== 'my_ai_bot' &&
        activeMessages.length > 0 &&
        normalizeId(activeMessages[0].sender) !== normalizeId(currentUser) && 
        !currentUser.acceptedChats?.some(id => normalizeId(id) === normalizeId(activeChat));

    return (
        <div className="chat-container">
            {/* ... sidebar remains same ... */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h2><MessageSquare size={22} /> Messages</h2>
                    <button className="back-button" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
                </div>
                
                <div className="chat-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('direct'); setActiveChat(null); }}
                    >
                        Direct
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('groups'); setActiveChat(null); }}
                    >
                        Groups
                    </button>
                </div>

                <div className="user-list">
                    {activeTab === 'direct' ? (
                        <>
                            <div className={`user-item ${activeChat?._id === 'my_ai_bot' ? 'active' : ''}`} onClick={() => setActiveChat({ _id: 'my_ai_bot', name: 'My AI', college: 'AI Assistant', isAi: true })}>
                                <div className="user-avatar" style={{ backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bot size={20} />
                                </div>
                                <div className="user-info">
                                    <div className="user-name">My AI</div>
                                    <div className="user-last-msg">AI Assistant</div>
                                </div>
                            </div>
                            {users.filter(u => normalizeId(u) !== normalizeId(currentUser)).map((u) => {
                            const uId = normalizeId(u);
                            const lastMsgs = getMessages(uId);
                            const hasMessages = lastMsgs.length > 0;
                            const isAcceptedByMe = currentUser.acceptedChats?.some(id => normalizeId(id) === uId);
                            const isAcceptedByThem = u.acceptedChats?.some(id => normalizeId(id) === normalizeId(currentUser));
                            const isFollowing = currentUser.following?.some(id => normalizeId(id) === uId);
                            const isFollower = currentUser.followers?.some(id => normalizeId(id) === uId);
                            const isMutual = isFollowing && isFollower;
                            const isChatActive = activeChat && !isGroup && normalizeId(activeChat) === uId;

                            if (!hasMessages && !isChatActive && !isAcceptedByMe && !isAcceptedByThem && !isMutual) return null;

                            return (
                                <div key={u._id} className={`user-item ${isChatActive ? 'active' : ''}`} onClick={() => setActiveChat(u)}>
                                    <div className="user-avatar">
                                        {u.profilePicture ? <img src={u.profilePicture} alt="" className="avatar-img" /> : u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name">{u.name}</div>
                                        <div className="user-last-msg">{lastMsgs[lastMsgs.length-1]?.content || 'Connected'}</div>
                                    </div>
                                </div>
                            );
                        })}
                        </>
                    ) : (
                        myGroups.map((g) => {
                            const gId = normalizeId(g);
                            const isChatActive = activeChat && isGroup && normalizeId(activeChat) === gId;
                            const isPending = g.pendingMembers?.includes(currentUser._id);

                            return (
                                <div key={g._id} className={`user-item ${isChatActive ? 'active' : ''}`} onClick={() => setActiveChat(g)}>
                                    <div className="user-avatar group">
                                        {g.groupPicture ? <img src={g.groupPicture} alt="" className="avatar-img" /> : <Users size={20} />}
                                        {isPending && <div className="pending-badge" />}
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name">{g.name}</div>
                                        <div className="user-last-msg">{isPending ? 'Pending Invitation' : `${g.members?.length || 0} members`}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="chat-main">
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="chat-avatar">
                                    {isGroup ? (
                                        activeChat.groupPicture ? <img src={activeChat.groupPicture} alt="" className="avatar-img" /> : <Users size={24} />
                                    ) : activeChat.isAi ? (
                                        <div style={{ width: '100%', height: '100%', backgroundColor: '#4f46e5', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Bot size={24} />
                                        </div>
                                    ) : (
                                        activeChat.profilePicture ? <img src={activeChat.profilePicture} alt="" className="avatar-img" /> : activeChat.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="chat-header-text">
                                    <div 
                                        className="chat-user-name" 
                                        onClick={() => isGroup && navigate('/groups', { state: { highlightGroupId: activeChat._id } })}
                                        style={{ cursor: isGroup ? 'pointer' : 'default' }}
                                    >
                                        {activeChat.name}
                                    </div>
                                    <div className="chat-user-status">
                                        {isGroup ? `${activeChat.members?.length || 0} members` : activeChat.college}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {activeMessages.map((msg, idx) => {
                                const msgDate = new Date(msg.createdAt || new Date()).toDateString();
                                const prevMsgDate = idx > 0 ? new Date(activeMessages[idx-1].createdAt || new Date()).toDateString() : null;
                                const showDateSeparator = msgDate !== prevMsgDate;

                                return (
                                    <div key={msg._id || idx}>
                                        {showDateSeparator && (
                                            <div className="message-date">
                                                <span>{formatDateSeparator(msg.createdAt || new Date())}</span>
                                            </div>
                                        )}
                                        <div className={`message ${normalizeId(msg.sender) === normalizeId(currentUser) ? 'sent' : 'received'}`}>
                                            {isGroup && normalizeId(msg.sender) !== normalizeId(currentUser) && (
                                                <span 
                                                    className="sender-name" 
                                                    onClick={() => navigate(`/profile/${normalizeId(msg.sender)}`)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {msg.sender?.name}
                                                </span>
                                            )}
                                            <div className="message-bubble">
                                                <div className="message-text">{msg.content}</div>
                                                <div className="message-time">{formatTime(msg.createdAt || new Date())}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {isPendingMember ? (
                            <div className="chat-request-footer">
                                <p>You have been invited to join this group.</p>
                                <div className="request-actions">
                                    <button className="accept-btn" onClick={handleAcceptGroup}>Accept</button>
                                    <button className="decline-btn" onClick={handleDeclineGroup}>Decline</button>
                                </div>
                            </div>
                        ) : isDirectRequest ? (
                            <div className="chat-request-footer">
                                <p>{activeChat.name} wants to chat with you.</p>
                                <div className="request-actions">
                                    <button className="accept-btn" onClick={handleAcceptDirect}>Accept</button>
                                    <button className="decline-btn" onClick={handleDeclineDirect}>Decline</button>
                                </div>
                            </div>
                        ) : (
                            <form className="chat-input-container" onSubmit={handleSendMessage}>
                                <input type="text" className="chat-input" placeholder="Message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
                                <button type="submit" className="send-button"><Send size={20} /></button>
                            </form>
                        )}
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <MessageSquare size={64} color="#cbd5e1" />
                        <h2>Your Messages</h2>
                        <p>Select a friend or a group to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
