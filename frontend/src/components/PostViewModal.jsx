import { createPortal } from 'react-dom';
import './PostViewModal.css';

const PostViewModal = ({ isOpen, post, onClose }) => {
    if (!isOpen || !post) return null;

    return createPortal(
        <div className="post-view-overlay" onClick={onClose}>
            <div className="post-view-modal" onClick={(e) => e.stopPropagation()}>
                <button className="post-view-close" onClick={onClose}>✕</button>

                <div className="post-view-content">
                    <div className="post-view-media">
                        {post.mediaType === 'image' ? (
                            <img src={post.media} alt="Post" />
                        ) : (
                            <video src={post.media} controls />
                        )}
                    </div>

                    {post.caption && (
                        <div className="post-view-caption">
                            <p>{post.caption}</p>
                        </div>
                    )}

                    <div className="post-view-stats">
                        <span>❤️ {post.likes || 0}</span>
                        <span>💬 {post.comments || 0}</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PostViewModal;
