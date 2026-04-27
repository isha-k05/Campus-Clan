import { useState, useEffect } from 'react';
import './StoryViewer.css';

const StoryViewer = ({ stories, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [progress, setProgress] = useState(0);

    const currentStory = stories[currentIndex];
    const duration = currentStory?.mediaType === 'video' ? 15000 : 5000; // 15s for video, 5s for image

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + (100 / (duration / 100));
            });
        }, 100);

        return () => clearInterval(interval);
    }, [currentIndex, duration]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
        }
    };

    const handleTap = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        if (x < width / 2) {
            handlePrevious();
        } else {
            handleNext();
        }
    };

    if (!currentStory) return null;

    return (
        <div className="story-viewer-overlay">
            <div className="story-viewer-container" onClick={handleTap}>
                {/* Progress Bars */}
                <div className="story-progress-bars">
                    {stories.map((_, index) => (
                        <div key={index} className="progress-bar-container">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: index === currentIndex
                                        ? `${progress}%`
                                        : index < currentIndex
                                            ? '100%'
                                            : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Close Button */}
                <button className="story-close-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                    ✕
                </button>

                {/* Story Content */}
                <div className="story-content">
                    {currentStory.mediaType === 'video' ? (
                        <video
                            src={currentStory.mediaUrl}
                            autoPlay
                            muted
                            className="story-media"
                        />
                    ) : (
                        <img
                            src={currentStory.mediaUrl}
                            alt="Story"
                            className="story-media"
                        />
                    )}
                </div>

                {/* Navigation Hints */}
                <div className="story-nav-hint left">
                    {currentIndex > 0 && <span>←</span>}
                </div>
                <div className="story-nav-hint right">
                    {currentIndex < stories.length - 1 && <span>→</span>}
                </div>
            </div>
        </div>
    );
};

export default StoryViewer;
