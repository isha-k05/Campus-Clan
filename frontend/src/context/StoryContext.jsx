import { createContext, useContext, useState, useEffect } from 'react';
import StoryViewer from '../components/StoryViewer';

const StoryContext = createContext();

export const useStory = () => {
    return useContext(StoryContext);
};

export const StoryProvider = ({ children }) => {
    const [stories, setStories] = useState([]);
    const [viewingStories, setViewingStories] = useState(null);
    const [viewerIndex, setViewerIndex] = useState(0);

    // Load stories from local storage on mount (optional, for persistence)
    // For now, we'll start empty or with mock data if needed

    const addStory = (story) => {
        setStories(prevStories => [story, ...prevStories]);
    };

    const viewUserStories = (userId) => {
        // Find all stories for this user
        const userStories = stories.filter(s => s.userId === userId);
        if (userStories.length > 0) {
            setViewingStories(userStories);
            setViewerIndex(0);
        }
    };

    const closeViewer = () => {
        setViewingStories(null);
        setViewerIndex(0);
    };

    // Group stories by user for easy consumption
    const groupedStories = stories.reduce((acc, story) => {
        const userId = story.userId || 'unknown';
        if (!acc[userId]) {
            acc[userId] = {
                user: {
                    id: userId,
                    username: story.username || 'User',
                    avatar: story.userAvatar
                },
                stories: []
            };
        }
        acc[userId].stories.push(story);
        return acc;
    }, {});

    const userStoriesList = Object.values(groupedStories);

    // Check if a specific user has active stories
    const hasActiveStory = (userId) => {
        return stories.some(s => s.userId === userId && s.expiresAt > Date.now());
    };

    // Check if all stories for a user are viewed (mock implementation for now)
    const areAllStoriesViewed = (userId) => {
        // In a real app, we'd track viewed IDs
        return false;
    };

    const value = {
        stories,
        userStoriesList,
        addStory,
        viewUserStories,
        hasActiveStory,
        areAllStoriesViewed
    };

    return (
        <StoryContext.Provider value={value}>
            {children}
            {viewingStories && (
                <StoryViewer
                    stories={viewingStories}
                    initialIndex={viewerIndex}
                    onClose={closeViewer}
                />
            )}
        </StoryContext.Provider>
    );
};
