import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './LiveCameraModal.css';

const LiveCameraModal = ({ isOpen, onClose }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [activeFilter, setActiveFilter] = useState('normal');
    const [isLive, setIsLive] = useState(false);

    // Engagement State
    const [views, setViews] = useState(0);
    const [comments, setComments] = useState([]);
    const [floatingFloatingEmojis, setFloatingEmojis] = useState([]);

    // Filters list
    const filters = [
        { id: 'normal', name: 'Normal', class: 'filter-normal' },
        { id: 'sepia', name: 'Warm', class: 'filter-sepia' },
        { id: 'bw', name: 'B&W', class: 'filter-bw' },
        { id: 'vintage', name: 'Vintage', class: 'filter-vintage' },
        { id: 'bright', name: 'Bright', class: 'filter-bright' },
        { id: 'cyber', name: 'Cyber', class: 'filter-cyber' },
    ];

    useEffect(() => {
        let currentStream = null;

        const startCamera = async () => {
            if (isOpen) {
                // Push history state to support "back" button/gesture
                window.history.pushState({ modal: 'live' }, '');

                try {
                    // Removed specific aspect ratio to allow full camera FOV (prevents zoomed look)
                    const mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'user' },
                        audio: true
                    });
                    setStream(mediaStream);
                    currentStream = mediaStream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    alert("Unable to access camera. Please check permissions.");
                    onClose();
                }
            }
        };

        if (isOpen) {
            startCamera();
        }

        const handlePopState = () => {
            if (isOpen) {
                onClose();
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, onClose]);

    // Engagement Loop
    useEffect(() => {
        let interactionInterval;

        if (isLive) {
            // Reset stats when starting fresh
            if (views === 0) setViews(12);

            interactionInterval = setInterval(() => {
                // Randomly add views
                if (Math.random() > 0.3) {
                    setViews(prev => prev + Math.floor(Math.random() * 3));
                }

                // Randomly add floating emojis (replacing likes)
                if (Math.random() > 0.2) {
                    const newEmojiCount = Math.floor(Math.random() * 3) + 1;
                    const emojis = ['❤️', '🔥', '👏', '😍', '🎉', '💯', '😂'];

                    // Add floating emojis
                    for (let i = 0; i < newEmojiCount; i++) {
                        const id = Date.now() + i + Math.random();
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                        setFloatingEmojis(prev => [...prev, {
                            id: id,
                            emoji: randomEmoji,
                            left: 50 + (Math.random() * 40), // Random horizontal position on right half
                            animationDuration: 2 + Math.random() * 2 // Random duration 2-4s
                        }]);

                        // Clean up emoji after animation duration
                        setTimeout(() => {
                            setFloatingEmojis(prev => prev.filter(e => e.id !== id));
                        }, 4000);
                    }
                }

                // Randomly add comments
                if (Math.random() > 0.6) {
                    const randomNames = ["Alex", "Sarah", "Mike", "Jessica", "David", "Emily", "Chris", "Emma"];
                    const randomMessages = [
                        "So cool! 🔥", "Love this! ❤️", "Hi from NYC!", "Wait is this live??",
                        "Amazing quality", "😍😍😍", "Hello!!", "Do a flip!",
                        "Can you shoutout my friend?", "Wow 😮"
                    ];
                    const newComment = {
                        id: Date.now(),
                        name: randomNames[Math.floor(Math.random() * randomNames.length)],
                        text: randomMessages[Math.floor(Math.random() * randomMessages.length)]
                    };

                    setComments(prev => [...prev.slice(-4), newComment]);
                }
            }, 800);
        } else {
            setViews(0);
            setComments([]);
            setFloatingEmojis([]);
        }

        return () => clearInterval(interactionInterval);
    }, [isLive]);


    // Ensure video plays when stream is ready
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
    }, [stream]);

    const handleClose = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsLive(false);
        // Go back in history if we manually close to sync state
        if (window.history.state && window.history.state.modal === 'live') {
            window.history.back();
        } else {
            onClose();
        }
    };

    const handleGoLive = () => {
        setIsLive(!isLive);
        if (!isLive) {
            console.log("Starting Live Stream...");
        } else {
            console.log("Ending Live Stream...");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="live-camera-modal-overlay">
            <div className="live-controls-top">
                <button className="live-close-btn" onClick={handleClose}>
                    ×
                </button>
                {isLive ? (
                    <div className="live-top-stats">
                        <span className="live-server-tag">LIVE</span>
                        <span className="live-view-count">👁️ {views}</span>
                    </div>
                ) : null}
            </div>

            <video
                ref={videoRef}
                className={`live-camera-feed ${filters.find(f => f.id === activeFilter)?.class || ''}`}
                autoPlay
                playsInline
                muted // Muted locally to prevent feedback
            />

            {/* Engagement Overlay */}
            {isLive && (
                <div className="live-engagement-overlay">
                    <div className="live-comments-section">
                        {comments.map(comment => (
                            <div key={comment.id} className="live-comment-item">
                                <span className="comment-user">{comment.name}: </span>
                                <span className="comment-text">{comment.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Emojis Container */}
            {isLive && (
                <div className="live-hearts-container">
                    {floatingFloatingEmojis.map(item => (
                        <div
                            key={item.id}
                            className="floating-heart"
                            style={{
                                left: `${item.left}%`,
                                animationDuration: `${item.animationDuration}s`
                            }}
                        >
                            {item.emoji}
                        </div>
                    ))}
                </div>
            )}

            <div className="live-controls-bottom">
                <div className="live-action-btn-container">
                    <button
                        className={`go-live-btn ${isLive ? 'is-live' : ''}`}
                        onClick={handleGoLive}
                    >
                        {isLive ? 'End Live' : 'Go Live'}
                    </button>
                </div>

                <div className="filters-scroll-container">
                    {filters.map(filter => (
                        <div
                            key={filter.id}
                            className={`filter-option ${activeFilter === filter.id ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            <div className={`filter-preview ${filter.class}`}></div>
                            <span className="filter-name">{filter.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LiveCameraModal;
