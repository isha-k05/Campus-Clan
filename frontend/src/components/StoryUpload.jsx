import { useState } from 'react';
import './StoryUpload.css';

const StoryUpload = ({ onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setShowPreview(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePost = () => {
        if (selectedFile && preview) {
            const story = {
                id: Date.now().toString(),
                mediaUrl: preview,
                mediaType: selectedFile.type.startsWith('video') ? 'video' : 'image',
                timestamp: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            onUpload(story);

            // Reset
            setSelectedFile(null);
            setPreview(null);
            setShowPreview(false);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreview(null);
        setShowPreview(false);
    };

    return (
        <>
            <div className="story-upload-btn">
                <input
                    type="file"
                    id="story-file-input"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <label htmlFor="story-file-input" className="story-btn-label">
                    <div className="story-btn-icon">📷</div>
                    <span className="story-btn-text">Add Story</span>
                </label>
            </div>

            {showPreview && (
                <div className="story-preview-modal">
                    <div className="story-preview-content">
                        <div className="story-preview-header">
                            <h3>Preview Story</h3>
                            <button className="close-preview-btn" onClick={handleCancel}>✕</button>
                        </div>

                        <div className="story-preview-media">
                            {selectedFile?.type.startsWith('video') ? (
                                <video src={preview} controls autoPlay muted />
                            ) : (
                                <img src={preview} alt="Story preview" />
                            )}
                        </div>

                        <div className="story-preview-actions">
                            <button className="cancel-story-btn" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="post-story-btn" onClick={handlePost}>
                                Post Story
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StoryUpload;
