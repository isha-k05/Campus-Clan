import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStory } from '../context/StoryContext';
import { 
    Home, 
    Search, 
    Bell, 
    MessageCircle, 
    Users, 
    Calendar, 
    Trophy, 
    Settings, 
    LogOut,
    Moon,
    Sun,
    Palette
} from 'lucide-react';
import Logo from './Logo';
import FloatingActionButton from './FloatingActionButton';
import StoryRing from './StoryRing';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { hasActiveStory, viewUserStories, areAllStoriesViewed } = useStory();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const menuItems = [
        { icon: <Home size={22} />, label: 'Homepage', path: '/dashboard' },
        { icon: <Search size={22} />, label: 'Search', path: '/connect' },
        { icon: <Bell size={22} />, label: 'Notifications', path: '/notifications' },
        { icon: <MessageCircle size={22} />, label: 'Chats', path: '/chat' },
        { icon: <Users size={22} />, label: 'Study Groups', path: '/groups' },
        { icon: <Calendar size={22} />, label: 'Events', path: '/events' },
        { icon: <Trophy size={22} />, label: 'Achievements', path: '/achievements' },
        { icon: <Settings size={22} />, label: 'Settings', path: '/settings' },
    ];

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        if (hasActiveStory('current-user')) {
            viewUserStories('current-user');
        } else {
            navigate('/profile');
        }
    };

    return (
        <div className="main-layout" data-theme={theme}>
            <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <Logo size={32} showText={true} className="sidebar-logo" />
                    <button 
                        className="theme-toggle-btn" 
                        onClick={toggleTheme} 
                        title={`Current Theme: ${theme.toUpperCase()}. Click to switch.`}
                    >
                        <Palette size={20} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile" onClick={() => navigate('/profile')}>
                        <StoryRing
                            hasStory={hasActiveStory('current-user')}
                            isViewed={areAllStoriesViewed('current-user')}
                            size={45}
                        >
                            <div className="user-avatar" onClick={handleAvatarClick}>
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="avatar-img" />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                        </StoryRing>
                        <div className="user-info">
                            <div className="user-name">{user?.name || 'User'}</div>
                            <div className="user-college">{user?.college || 'College'}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
                    </button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>

            {location.pathname !== '/chat' && location.pathname !== '/achievements' && <FloatingActionButton />}
        </div>
    );
};

export default MainLayout;
