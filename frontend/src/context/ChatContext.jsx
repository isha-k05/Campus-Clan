import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

// Helper to handle both object and string IDs
const normalizeId = (id) => {
    if (!id) return null;
    return typeof id === 'object' ? id._id.toString() : id.toString();
};

export const ChatProvider = ({ children }) => {
    const { user, setUser } = useAuth();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState({});
    const [groupConversations, setGroupConversations] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [aiMessages, setAiMessages] = useState([
        {
            _id: 'welcome',
            sender: 'my_ai_bot',
            content: 'Hello! I am My AI, your personal assistant. How can I help you today?',
            createdAt: new Date()
        }
    ]);

    // Load users and groups from backend
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [usersRes, groupsRes] = await Promise.all([
                    axios.get('/api/users'),
                    axios.get('/api/groups/my')
                ]);
                
                if (usersRes.data.success) setUsers(usersRes.data.users);
                if (groupsRes.data.success) setMyGroups(groupsRes.data.groups);
            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        fetchData();
    }, [user]);

    const refreshGroups = async () => {
        if (!user) return;
        try {
            const res = await axios.get('/api/groups/my');
            if (res.data.success) setMyGroups(res.data.groups);
        } catch (err) {
            console.error("Failed to refresh groups", err);
        }
    };

    // Socket Initialization
    useEffect(() => {
        if (!user) return;
        
        const newSocket = io();
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join_personal', user._id);
            newSocket.emit('join_notifications', user._id);
            
            // Join all group rooms
            myGroups.forEach(g => {
                if (g.members?.some(m => (m._id || m) === user._id)) {
                    newSocket.emit('join_group', g._id);
                }
            });
        });

        newSocket.on('receive_private_message', (message) => {
            const senderId = normalizeId(message.sender);
            const receiverId = normalizeId(message.receiver);
            const partnerId = senderId === normalizeId(user) ? receiverId : senderId;
            
            setConversations(prev => ({
                ...prev,
                [partnerId]: [...(prev[partnerId] || []), message]
            }));
        });

        newSocket.on('receive_group_message', (message) => {
            const groupId = normalizeId(message.group);
            setGroupConversations(prev => ({
                ...prev,
                [groupId]: [...(prev[groupId] || []), message]
            }));
        });

        newSocket.on('new_notification', (notif) => {
            window.dispatchEvent(new CustomEvent('new_notif_received', { detail: notif }));
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('user_updated', (updatedUserData) => {
            setUser(prev => ({ ...prev, ...updatedUserData }));
        });

        newSocket.on('group_update', (data) => {
            console.log('Group update received:', data);
            refreshGroups();
            // Also notify any components that need immediate update
            window.dispatchEvent(new CustomEvent('group_updated', { detail: data }));
        });

        newSocket.on('error', (err) => {
            alert(err.message);
        });

        return () => newSocket.disconnect();
    }, [user?._id, myGroups.length]);

    // Fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user || !activeChat) return;
            const chatId = normalizeId(activeChat);
            const isGroup = !!activeChat.members; // Groups have a members array

            try {
                if (isGroup) {
                    const res = await axios.get(`/api/groups/${chatId}/messages`);
                    if (res.data.success) {
                        setGroupConversations(prev => ({ ...prev, [chatId]: res.data.messages }));
                    }
                } else {
                    const res = await axios.get(`/api/messages/${chatId}`);
                    if (res.data.success) {
                        setConversations(prev => ({ ...prev, [chatId]: res.data.messages }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, [user, activeChat]);

    const sendMessage = async (recipientId, messageText, isGroup = false) => {
        if (!socket || !user || !messageText.trim()) return;

        if (isGroup) {
            socket.emit('send_group_message', {
                senderId: user._id,
                groupId: recipientId,
                content: messageText
            });
        } else {
            const isAcceptedByMe = user.acceptedChats?.some(id => normalizeId(id) === recipientId);
            if (!isAcceptedByMe) await acceptChat(recipientId);

            socket.emit('send_private_message', {
                senderId: user._id,
                receiverId: recipientId,
                content: messageText
            });

            // Initial request notification
            const history = conversations[recipientId] || [];
            if (history.filter(m => normalizeId(m.sender) === normalizeId(user)).length === 0) {
                await axios.post('/api/notifications', { recipient: recipientId, type: 'message_request' });
            }
        }
    };

    const getMessages = useCallback((chatId, isGroup = false) => {
        if (chatId === 'my_ai_bot') return aiMessages;
        return isGroup ? (groupConversations[chatId] || []) : (conversations[chatId] || []);
    }, [conversations, groupConversations, aiMessages]);

    const sendAiMessage = async (messageText) => {
        if (!messageText.trim()) return;

        const userMsg = {
            _id: Date.now().toString(),
            sender: user._id,
            receiver: 'my_ai_bot',
            content: messageText,
            createdAt: new Date()
        };

        setAiMessages(prev => [...prev, userMsg]);

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
            if (!apiKey) throw new Error('Groq API Key not found');

            const groqMessages = [
                { role: 'system', content: 'You are a helpful and friendly AI assistant named "My AI" inside a college campus social networking app. Keep your answers concise, engaging, and friendly.' },
                ...aiMessages.map(m => ({
                    role: m.sender === 'my_ai_bot' ? 'assistant' : 'user',
                    content: m.content
                })),
                { role: 'user', content: messageText }
            ];

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    messages: groqMessages,
                    model: 'llama-3.1-8b-instant'
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Groq API Error:', data);
                throw new Error(data.error?.message || 'API request failed');
            }
            
            if (data.choices && data.choices.length > 0) {
                const aiReply = {
                    _id: (Date.now() + 1).toString(),
                    sender: 'my_ai_bot',
                    receiver: user._id,
                    content: data.choices[0].message.content,
                    createdAt: new Date()
                };
                setAiMessages(prev => [...prev, aiReply]);
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);
            const errorMsg = {
                _id: (Date.now() + 1).toString(),
                sender: 'my_ai_bot',
                receiver: user._id,
                content: 'Sorry, I am having trouble connecting to my brain right now.',
                createdAt: new Date()
            };
            setAiMessages(prev => [...prev, errorMsg]);
        }
    };

    const acceptChat = async (partnerId) => {
        try {
            const res = await axios.put(`/api/users/accept-chat/${partnerId}`);
            if (res.data.success) {
                const updatedUser = { ...user };
                if (!updatedUser.acceptedChats) updatedUser.acceptedChats = [];
                if (!updatedUser.declinedChats) updatedUser.declinedChats = [];
                
                // Add to accepted
                if (!updatedUser.acceptedChats.some(id => normalizeId(id) === partnerId)) {
                    updatedUser.acceptedChats.push(partnerId);
                }
                // Remove from declined
                updatedUser.declinedChats = updatedUser.declinedChats.filter(id => normalizeId(id) !== partnerId);
                
                setUser(updatedUser);
                socket.emit('accept_chat', { senderId: partnerId, receiverId: user._id });
                return true;
            }
        } catch (err) {}
        return false;
    };

    const declineChat = async (partnerId) => {
        try {
            const res = await axios.delete(`/api/users/decline-chat/${partnerId}`);
            if (res.data.success) {
                const updatedUser = { ...user };
                if (!updatedUser.acceptedChats) updatedUser.acceptedChats = [];
                if (!updatedUser.declinedChats) updatedUser.declinedChats = [];
                
                // Add to declined
                if (!updatedUser.declinedChats.some(id => normalizeId(id) === partnerId)) {
                    updatedUser.declinedChats.push(partnerId);
                }
                // Remove from accepted
                updatedUser.acceptedChats = updatedUser.acceptedChats.filter(id => normalizeId(id) !== partnerId);
                
                setUser(updatedUser);
                socket.emit('decline_chat', { senderId: partnerId, receiverId: user._id });
                setConversations(prev => { const n = { ...prev }; delete n[partnerId]; return n; });
                return true;
            }
        } catch (err) {}
        return false;
    };

    const acceptGroupInvite = async (groupId) => {
        try {
            const res = await axios.post(`/api/groups/${groupId}/accept`);
            if (res.data.success) {
                const groupsRes = await axios.get('/api/groups/my');
                if (groupsRes.data.success) setMyGroups(groupsRes.data.groups);
                socket.emit('join_group', groupId);
                return true;
            }
        } catch (err) {}
        return false;
    };

    const declineGroupInvite = async (groupId) => {
        try {
            const res = await axios.post(`/api/groups/${groupId}/decline`);
            if (res.data.success) {
                const groupsRes = await axios.get('/api/groups/my');
                if (groupsRes.data.success) setMyGroups(groupsRes.data.groups);
                return true;
            }
        } catch (err) {}
        return false;
    };

    const value = {
        socket,
        users,
        myGroups,
        activeChat,
        setActiveChat,
        sendMessage,
        getMessages,
        acceptChat,
        declineChat,
        acceptGroupInvite,
        declineGroupInvite,
        unreadCount,
        setUnreadCount,
        refreshGroups,
        sendAiMessage,
        aiMessages
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
