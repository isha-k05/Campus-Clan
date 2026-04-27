import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        college: user?.college || '',
        website: user?.website || '',
        location: user?.location || '',
        password: ''
    });
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(user?.profilePicture || null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const isUsernameChanged = formData.username !== user?.username;

    const showMessage = (msg, type = 'success') => {
        setToast({ show: true, message: msg, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'username' ? value.toLowerCase().replace(/\s/g, '') : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (isUsernameChanged && !formData.password) {
            showMessage('Password is required to change username', 'error');
            return;
        }

        const profileUpdates = {
            name: formData.name,
            username: formData.username,
            bio: formData.bio,
            college: formData.college,
            website: formData.website,
            location: formData.location,
            profilePicture: previewImage,
            password: isUsernameChanged ? formData.password : undefined
        };

        const result = await updateProfile(profileUpdates);

        if (result.success) {
            showMessage('Profile updated successfully!');
            setTimeout(onClose, 1200);
        } else {
            showMessage(result.message || 'Failed to update profile', 'error');
        }
    };

    const handleRemovePhoto = () => {
        setProfileImage(null);
        setPreviewImage(null);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" onClick={onClose}>✕</button>
                    <h2>Edit Profile</h2>
                    <button className="modal-save" onClick={handleSubmit}>Done</button>
                </div>

                <div className="modal-content">
                    <div className="profile-photo-section-centered">
                        <div className="profile-photo-wrapper">
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" className="profile-photo" />
                            ) : (
                                <div className="profile-photo-placeholder">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="profile-photo-actions-centered">
                            <h3>{user?.name || 'User'}</h3>
                            <label htmlFor="photo-upload" className="change-photo-btn">
                                Change profile photo
                            </label>
                            <input
                                type="file"
                                id="photo-upload"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                            {previewImage && (
                                <button className="remove-photo-btn" onClick={handleRemovePhoto}>
                                    Remove current photo
                                </button>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="edit-profile-form-centered">
                        <div className="form-field-centered">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Your name"
                                maxLength={30}
                            />
                            <span className="char-count">{formData.name.length}/30</span>
                        </div>

                        <div className="form-field-centered">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="username"
                                maxLength={30}
                            />
                        </div>

                        {isUsernameChanged && (
                            <div className="form-field-centered password-field-animate">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter password to confirm username change"
                                    required
                                />
                                <p className="field-hint">You need to verify your identity to change your username.</p>
                            </div>
                        )}

                        <div className="form-field-centered">
                            <label>Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself"
                                maxLength={150}
                                rows={3}
                            />
                            <span className="char-count">{formData.bio.length}/150</span>
                        </div>

                        <div className="form-field-centered">
                            <label>College</label>
                            <input
                                type="text"
                                name="college"
                                value={formData.college}
                                onChange={handleInputChange}
                                placeholder="Your college"
                            />
                        </div>

                        <div className="form-field-centered">
                            <label>Website</label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="form-field-centered">
                            <label>Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                placeholder="City, Country"
                            />
                        </div>
                    </form>

                    <div className="personal-info-note-centered">
                        <h4>Personal information</h4>
                        <p>Provide your personal information, even if the account is used for a business, a pet or something else. This won't be a part of your public profile.</p>
                    </div>
                </div>

                {toast.show && (
                    <div className={`insta-toast ${toast.type}`}>
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditProfileModal;
