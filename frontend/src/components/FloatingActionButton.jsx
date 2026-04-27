import { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { Plus, PenLine, BookOpen, Video, Lock } from 'lucide-react';
import CreatePostModal from './CreatePostModal';
import LiveCameraModal from './LiveCameraModal';
import PrivateSafeModal from './PrivateSafeModal';
import './FloatingActionButton.css';

const FloatingActionButton = () => {
    const { addStory } = useStory();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const [isPrivateSafeOpen, setIsPrivateSafeOpen] = useState(false);

    const menuItems = [
        { id: 'post', label: 'Post', icon: <PenLine size={20} />, color: '#667eea' },
        { id: 'story', label: 'Story', icon: <BookOpen size={20} />, color: '#f093fb' },
        { id: 'live', label: 'Live', icon: <Video size={20} />, color: '#ff6b6b' },
        { id: 'private', label: 'Private Safe', icon: <Lock size={20} />, color: '#48bb78' }
    ];

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleStoryFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const story = {
                    id: Date.now().toString(),
                    userId: 'current-user',
                    username: 'Your Story',
                    mediaUrl: reader.result,
                    mediaType: file.type.startsWith('video') ? 'video' : 'image',
                    timestamp: Date.now(),
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };
                addStory(story);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMenuClick = (item) => {
        if (item.id === 'post') {
            setIsCreatePostOpen(true);
        } else if (item.id === 'story') {
            // Trigger file input for story
            document.getElementById('fab-story-input').click();
        } else if (item.id === 'live') {
            setIsLiveModalOpen(true);
        } else if (item.id === 'private') {
            setIsPrivateSafeOpen(true);
        } else {
            console.log(`Clicked: ${item.label}`);
            // TODO: Implement navigation/action for other options
        }
        setIsOpen(false);
    };

    return (
        <div className="fab-container">
            {/* Hidden File Input for Story Upload */}
            <input
                type="file"
                id="fab-story-input"
                accept="image/*,video/*"
                onChange={handleStoryFileSelect}
                style={{ display: 'none' }}
            />

            {/* Menu Items */}
            {isOpen && (
                <div className="fab-menu">
                    {menuItems.map((item) => (
                        <div
                            key={item.id}
                            className="fab-menu-item"
                            style={{
                                backgroundColor: item.color
                            }}
                            onClick={() => handleMenuClick(item)}
                        >
                            <span className="fab-menu-icon">{item.icon}</span>
                            <span className="fab-menu-label">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                className={`fab-button ${isOpen ? 'fab-open' : ''}`}
                onClick={handleToggle}
                aria-label="Create new content"
            >
                <Plus size={28} />
            </button>

            <CreatePostModal
                isOpen={isCreatePostOpen}
                onClose={() => setIsCreatePostOpen(false)}
            />

            <LiveCameraModal
                isOpen={isLiveModalOpen}
                onClose={() => setIsLiveModalOpen(false)}
            />

            <PrivateSafeModal
                isOpen={isPrivateSafeOpen}
                onClose={() => setIsPrivateSafeOpen(false)}
            />
        </div>
    );
};

export default FloatingActionButton;
