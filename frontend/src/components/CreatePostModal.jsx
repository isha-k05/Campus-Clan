import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import './CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, initialMediaType = 'none', initialCaption = '' }) => {
    const [mediaType, setMediaType] = useState('none');
    const [preview, setPreview] = useState(null);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [isPosting, setIsPosting] = useState(false);
    const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMediaType(initialMediaType);
            if (initialMediaType === 'image' || initialMediaType === 'video') {
                setTimeout(() => {
                    fileInputRef.current?.click();
                }, 100);
            }
        }
    }, [isOpen, initialMediaType]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const type = file.type.startsWith('image/') ? 'image' : 'video';
        setMediaType(type);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const addPollOption = () => {
        if (pollOptions.length < 6) {
            setPollOptions([...pollOptions, '']);
        }
    };

    const updatePollOption = (index, value) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const handlePostAttempt = () => {
        // Since we are not showing the text area in the modal, we rely on initialCaption
        if (!initialCaption && mediaType === 'none' && pollOptions.every(opt => !opt.trim())) {
            alert('Please add some content to your post');
            return;
        }
        setShowVisibilityMenu(true);
    };

    const finalizePost = async (visibility) => {
        setIsPosting(true);
        try {
            const postData = {
                content: initialCaption || ' ',
                visibility,
                mediaType: mediaType === 'poll' ? 'none' : mediaType,
                mediaUrl: (mediaType === 'image' || mediaType === 'video') ? preview : '',
            };

            if (mediaType === 'poll') {
                postData.poll = {
                    options: pollOptions.filter(opt => opt.trim() !== '').map(opt => ({ text: opt, votes: [] }))
                };
            }

            const res = await axios.post('/api/posts', postData);

            if (res.data.success) {
                resetForm();
                if (onPostCreated) onPostCreated(res.data.post);
                onClose();
            }
        } catch (error) {
            console.error(error);
            alert('Failed to create post');
        } finally {
            setIsPosting(false);
            setShowVisibilityMenu(false);
        }
    };

    const resetForm = () => {
        setMediaType('none');
        setPreview(null);
        setPollOptions(['', '']);
        setShowVisibilityMenu(false);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="create-post-overlay" onClick={onClose}>
            <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
                <div className="create-post-header">
                    <button className="create-post-close" onClick={onClose}>✕</button>
                    <h2>{mediaType === 'poll' ? 'Create Poll' : 'Attach Media'}</h2>
                    <button
                        className="create-post-share"
                        onClick={handlePostAttempt}
                        disabled={isPosting}
                    >
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>

                <div className="create-post-body">
                    {/* Display the caption as read-only or just a preview if needed */}
                    <div className="caption-preview">
                        <p>{initialCaption || "Drafting post..."}</p>
                    </div>

                    <div className="media-preview-container">
                        {mediaType === 'image' && preview && (
                            <div className="preview-item">
                                <img src={preview} alt="Preview" />
                                <button className="remove-media" onClick={() => {setMediaType('none'); setPreview(null);}}>✕</button>
                            </div>
                        )}
                        {mediaType === 'video' && preview && (
                            <div className="preview-item">
                                <video src={preview} controls />
                                <button className="remove-media" onClick={() => {setMediaType('none'); setPreview(null);}}>✕</button>
                            </div>
                        )}
                        {mediaType === 'poll' && (
                            <div className="poll-builder">
                                <button className="remove-media poll-remove" onClick={() => setMediaType('none')}>✕</button>
                                {pollOptions.map((opt, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        className="poll-option-input"
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={(e) => updatePollOption(idx, e.target.value)}
                                    />
                                ))}
                                {pollOptions.length < 6 && (
                                    <button className="add-option-btn" onClick={addPollOption}>
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/*,video/*"
                    />
                </div>

                {showVisibilityMenu && (
                    <div className="visibility-overlay">
                        <div className="visibility-menu">
                            <h3>Post to...</h3>
                            <button onClick={() => finalizePost('global')}>🌎 Globally</button>
                            <button onClick={() => finalizePost('local')}>🏠 Locally (College Only)</button>
                            <button onClick={() => finalizePost('private')}>🔒 Privately (Friends Only)</button>
                            <button className="cancel-vis" onClick={() => setShowVisibilityMenu(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CreatePostModal;
