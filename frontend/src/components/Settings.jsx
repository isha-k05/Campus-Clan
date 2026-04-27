import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { 
    User, 
    Shield, 
    Lock, 
    Bell, 
    UserX, 
    Palette, 
    Crown, 
    HelpCircle, 
    Mail, 
    ChevronRight,
    Key,
    Save,
    CheckCircle,
    X,
    Eye,
    EyeOff,
    Download,
    Trash2,
    LogOut,
    Check,
    BookOpen,
    MessageSquare,
    FileText
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
    const { user, logout, updatePassword, sendOTP, verifyOTP, updateProfile, setUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('account');

    // States for account changes
    const [accountData, setAccountData] = useState({
        username: user?.username || '',
        college: user?.college || '',
        email: user?.email || ''
    });

    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailOtp, setEmailOtp] = useState('');
    const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [helpModal, setHelpModal] = useState(null); // 'contact' | 'faq'
    const [pendingChanges, setPendingChanges] = useState(null);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [blockedUsers, setBlockedUsers] = useState([
        { id: 1, name: 'Blocked User 1', email: 'blocked1@example.com' },
        { id: 2, name: 'Blocked User 2', email: 'blocked2@example.com' }
    ]);

    const colleges = [
        "Sharda University, Greater Noida",
        "Amity University, Noida",
        "Galgotias University, Greater Noida",
        "IIT Delhi",
        "BITS Pilani",
        "Delhi University",
        "LPU, Punjab",
        "VIT Vellore",
        "Other"
    ];

    const handleUnblock = (userId) => {
        setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
    };

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    // Account Change Handlers
    const handleAccountSave = (e) => {
        e.preventDefault();
        const hasChanges = accountData.username !== user.username || accountData.college !== user.college;
        
        if (!hasChanges) return;

        setPendingChanges({
            username: accountData.username,
            college: accountData.college
        });
        setShowPasswordModal(true);
    };

    const confirmAccountChanges = async () => {
        if (!confirmPassword) {
            showToast('Please enter your password to confirm', 'error');
            return;
        }

        if (isDeactivating) {
            try {
                const response = await fetch('/api/auth/deactivate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({ password: confirmPassword })
                });
                const data = await response.json();
                if (data.success) {
                    showToast('Account deactivated successfully', 'success');
                    logout();
                } else {
                    showToast(data.message || 'Deactivation failed', 'error');
                }
            } catch (err) {
                showToast('An error occurred during deactivation', 'error');
            }
            return;
        }

        const result = await updateProfile({
            ...pendingChanges,
            password: confirmPassword
        });

        if (result.success) {
            setShowPasswordModal(false);
            setConfirmPassword('');
            setPendingChanges(null);
            showToast('Profile updated successfully', 'success');
        } else {
            showToast(result.message || 'Update failed. Check your password.', 'error');
        }
    };

    const handleDeactivateStart = () => {
        setIsDeactivating(true);
        setShowPasswordModal(true);
    };

    // Email Verification Logic
    const handleStartEmailChange = () => {
        setIsEditingEmail(true);
        setShowEmailOtpInput(false);
    };

    const handleSendOTP = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        setIsVerifyingEmail(true);
        const result = await sendOTP(newEmail);
        setIsVerifyingEmail(false);
        if (result.success) {
            setShowEmailOtpInput(true);
            showToast('OTP sent to ' + newEmail, 'success');
        } else {
            showToast(result.message, 'error');
        }
    };

    const handleVerifyEmail = async () => {
        if (!emailOtp) {
            showToast('Please enter the OTP', 'error');
            return;
        }
        setIsVerifyingEmail(true);
        
        // Custom verification and update
        // Using our new backend route logic
        try {
            const response = await fetch('/api/auth/update-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ email: newEmail, otp: emailOtp })
            });
            const data = await response.json();
            
            if (data.success) {
                // Update local user state
                const updatedUser = { ...user, email: data.email };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                showToast('Email updated! Please re-login for security.', 'success');
                logout();
            } else {
                showToast(data.message, 'error');
            }
        } catch (err) {
            showToast('Verification failed', 'error');
        } finally {
            setIsVerifyingEmail(false);
        }
    };

    const handleUpdatePassword = () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            showToast('Please fill in all password fields', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        const result = updatePassword(passwordData.currentPassword, passwordData.newPassword);
        if (result.success) {
            showToast(result.message, 'success');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            <div className="settings-content">
                <div className="settings-sidebar">
                    <button className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                        <User size={20} /> Account
                    </button>
                    <button className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <Shield size={20} /> Security
                    </button>
                    <button className={`settings-tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
                        <Lock size={20} /> Privacy
                    </button>
                    <button className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <Bell size={20} /> Notifications
                    </button>
                    <button className={`settings-tab ${activeTab === 'blocklist' ? 'active' : ''}`} onClick={() => setActiveTab('blocklist')}>
                        <UserX size={20} /> Blocked Accounts
                    </button>
                    <button className={`settings-tab ${activeTab === 'theme' ? 'active' : ''}`} onClick={() => setActiveTab('theme')}>
                        <Palette size={20} /> Theme
                    </button>
                    <button className={`settings-tab ${activeTab === 'membership' ? 'active' : ''}`} onClick={() => setActiveTab('membership')}>
                        <Crown size={20} /> Membership
                    </button>
                    <button className={`settings-tab ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
                        <HelpCircle size={20} /> Help & Support
                    </button>
                    <button className="settings-tab logout-tab" onClick={logout}>
                        <LogOut size={20} /> Logout
                    </button>
                </div>

                <div className="settings-main">
                    {activeTab === 'account' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <User className="section-icon" />
                                <div>
                                    <h2>Account Settings</h2>
                                    <p>Manage your identity and college details</p>
                                </div>
                            </div>

                            <div className="account-form">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    {!isEditingEmail ? (
                                        <div className="read-only-field">
                                            <span>{user?.email}</span>
                                            <button className="edit-inline-btn" onClick={handleStartEmailChange}>Change</button>
                                        </div>
                                    ) : (
                                        <div className="email-edit-flow">
                                            {!showEmailOtpInput ? (
                                                <div className="input-with-btn">
                                                    <input 
                                                        type="email" 
                                                        placeholder="New Email Address" 
                                                        value={newEmail}
                                                        onChange={(e) => setNewEmail(e.target.value)}
                                                    />
                                                    <button className="inline-action-btn" onClick={handleSendOTP} disabled={isVerifyingEmail}>
                                                        {isVerifyingEmail ? '...' : 'Send OTP'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="input-with-btn">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Enter 6-digit OTP" 
                                                        value={emailOtp}
                                                        onChange={(e) => setEmailOtp(e.target.value)}
                                                        maxLength={6}
                                                    />
                                                    <button className="inline-action-btn verify" onClick={handleVerifyEmail} disabled={isVerifyingEmail}>
                                                        {isVerifyingEmail ? '...' : 'Verify & Save'}
                                                    </button>
                                                </div>
                                            )}
                                            <button className="cancel-link" onClick={() => setIsEditingEmail(false)}>Cancel</button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Username</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={accountData.username}
                                            onChange={(e) => setAccountData({...accountData, username: e.target.value})}
                                            placeholder="Enter username"
                                        />
                                    </div>
                                    <small>Changing your username will update your public profile link.</small>
                                </div>

                                <div className="form-group">
                                    <label>College / University</label>
                                    <select 
                                        value={accountData.college}
                                        onChange={(e) => setAccountData({...accountData, college: e.target.value})}
                                    >
                                        <option value="">Select College</option>
                                        {colleges.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <button 
                                    className="primary-save-btn" 
                                    onClick={handleAccountSave}
                                    disabled={accountData.username === user?.username && accountData.college === user?.college}
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>

                            <div className="account-footer-actions">
                                <h3>Data & Deactivation</h3>
                                <div className="footer-btns">
                                    <button className="ghost-btn">
                                        <Download size={18} /> Export Data
                                    </button>
                                    <button className="ghost-btn danger" onClick={handleDeactivateStart}>
                                        <Trash2 size={18} /> Deactivate Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Shield className="section-icon" />
                                <div>
                                    <h2>Security</h2>
                                    <p>Update your password and secure your sessions</p>
                                </div>
                            </div>

                            <div className="password-section">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Minimum 6 chars"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Repeat new password"
                                        />
                                    </div>
                                </div>
                                <button className="primary-save-btn" onClick={handleUpdatePassword}>
                                    <Key size={18} /> Update Password
                                </button>
                            </div>

                            <div className="security-cards">
                                <div className="security-card-item">
                                    <div className="card-info">
                                        <h4>Two-Factor Authentication</h4>
                                        <p>Secure your account with an extra verification layer.</p>
                                    </div>
                                    <button className="secondary-action-btn">Enable 2FA</button>
                                </div>
                                <div className="security-card-item">
                                    <div className="card-info">
                                        <h4>Logged in Devices</h4>
                                        <p>You are currently active on 2 devices.</p>
                                    </div>
                                    <button className="secondary-action-btn">View Sessions</button>
                                </div>
                            </div>

                            <div className="danger-zone-v2">
                                <h3>Permanently Delete Account</h3>
                                <p>This will erase all your posts, messages, and connections. This action cannot be undone.</p>
                                <button className="delete-main-btn">Delete My Account</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Lock className="section-icon" />
                                <div>
                                    <h2>Privacy</h2>
                                    <p>Control how your data and activity is shared</p>
                                </div>
                            </div>

                            <div className="toggle-list">
                                <div className="toggle-group-label">Profile</div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Private Account</h4>
                                        <p>Only approved followers can see your posts and profile.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Show Activity Status</h4>
                                        <p>Let followers see when you were last active.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Suggest My Account</h4>
                                        <p>Show your profile in the Connect page suggestions.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="toggle-group-label">Messaging</div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Read Receipts</h4>
                                        <p>Show when you've read a message.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Message Requests</h4>
                                        <p>Only receive DMs from people you follow.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="toggle-group-label">Posts &amp; Stories</div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Allow Tagging</h4>
                                        <p>Let others tag you in their posts and stories.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Story Resharing</h4>
                                        <p>Allow others to share your stories to theirs.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Bell className="section-icon" />
                                <div>
                                    <h2>Notifications</h2>
                                    <p>Choose what you want to be notified about</p>
                                </div>
                            </div>

                            <div className="toggle-list">
                                <div className="toggle-group-label">General</div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Push Notifications</h4>
                                        <p>Receive alerts directly on your device.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Email Summaries</h4>
                                        <p>Weekly digests and important updates via email.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="toggle-group-label">Activity</div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Likes &amp; Reactions</h4>
                                        <p>Get notified when someone likes your post.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Comments</h4>
                                        <p>Alerts when someone comments on your post.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>New Followers</h4>
                                        <p>Know when someone follows you.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="toggle-group-label">Messages &amp; Groups</div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Direct Messages</h4>
                                        <p>Notify when you receive a new message.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Group Invites</h4>
                                        <p>When you're invited to a study group.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info">
                                        <h4>Events Near You</h4>
                                        <p>Campus events matching your interests.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'theme' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Palette className="section-icon" />
                                <div>
                                    <h2>Visual Theme</h2>
                                    <p>Select a look that matches your style</p>
                                </div>
                            </div>

                            <div className="theme-grid-v2">
                                {[
                                    { id: 't1', label: 'Neon Dusk', sub: 'Dark & electric', colors: ['#0A0A0A', '#111111', '#00E5CC'] },
                                    { id: 't2', label: 'Warm Canvas', sub: 'Light & cozy', colors: ['#FAF7F2', '#FFFFFF', '#E8621A'] },
                                    { id: 't3', label: 'Pure Campus', sub: 'Clean & minimal', colors: ['#FFFFFF', '#FFFFFF', '#3B82F6'] },
                                    { id: 't4', label: 'Midnight Forest', sub: 'Dark & natural', colors: ['#0D1A12', '#111F16', '#4ADE80'] },
                                    { id: 't5', label: 'Sunset Story', sub: 'Warm & vibrant', colors: ['#FFF8F0', '#FFFFFF', '#FF4757'] },
                                ].map(t => (
                                    <div
                                        key={t.id}
                                        className={`theme-tile ${theme === t.id ? 'active' : ''}`}
                                        onClick={() => handleThemeChange(t.id)}
                                    >
                                        <div className="tile-preview" style={{
                                            background: `linear-gradient(135deg, ${t.colors[0]} 40%, ${t.colors[1]} 40%)`,
                                            borderBottom: `3px solid ${t.colors[2]}`
                                        }}></div>
                                        <div className="tile-meta">
                                            <span className="tile-name">{t.label}</span>
                                            <span className="tile-sub">{t.sub}</span>
                                        </div>
                                        {theme === t.id && <CheckCircle size={16} className="active-check" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'blocklist' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <UserX className="section-icon" />
                                <div>
                                    <h2>Blocked Accounts</h2>
                                    <p>Manage accounts you've restricted from interacting with you</p>
                                </div>
                            </div>

                            {blockedUsers.length === 0 ? (
                                <div className="empty-state-v2">
                                    <div className="empty-icon-wrapper">
                                        <UserX size={40} />
                                    </div>
                                    <h3>No blocked accounts</h3>
                                    <p>When you block someone, they won't be able to find your profile or see your posts.</p>
                                </div>
                            ) : (
                                <div className="blocked-list-v2">
                                    {blockedUsers.map(blockedUser => (
                                        <div key={blockedUser.id} className="blocked-user-item-v2">
                                            <div className="blocked-avatar">
                                                {blockedUser.name.charAt(0)}
                                            </div>
                                            <div className="blocked-info">
                                                <span className="blocked-name">{blockedUser.name}</span>
                                                <span className="blocked-email">{blockedUser.email}</span>
                                            </div>
                                            <button
                                                className="unblock-btn-v2"
                                                onClick={() => handleUnblock(blockedUser.id)}
                                            >
                                                Unblock
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'membership' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <Crown className="section-icon" />
                                <div>
                                    <h2>Membership</h2>
                                    <p>Upgrade your campus experience with premium features</p>
                                </div>
                            </div>

                            <div className="membership-grid">
                                <div className="membership-card-v2">
                                    <div className="plan-badge">Current Plan</div>
                                    <h3>Free</h3>
                                    <div className="plan-price">$0<span>/month</span></div>
                                    <ul className="plan-features">
                                        <li><Check size={16} /> Basic features</li>
                                        <li><Check size={16} /> Connect with students</li>
                                        <li><Check size={16} /> Join study groups</li>
                                        <li><Check size={16} /> View events</li>
                                    </ul>
                                </div>

                                <div className="membership-card-v2 premium">
                                    <div className="plan-badge premium">Most Popular</div>
                                    <h3>Premium</h3>
                                    <div className="plan-price">$9.99<span>/month</span></div>
                                    <ul className="plan-features">
                                        <li><Check size={16} /> All Free features</li>
                                        <li><Check size={16} /> Priority support</li>
                                        <li><Check size={16} /> Advanced analytics</li>
                                        <li><Check size={16} /> Custom profile themes</li>
                                        <li><Check size={16} /> Ad-free experience</li>
                                    </ul>
                                    <button className="upgrade-btn-v2">Upgrade Now</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'help' && (
                        <div className="settings-section">
                            <div className="section-header">
                                <HelpCircle className="section-icon" />
                                <div>
                                    <h2>Help &amp; Support</h2>
                                    <p>Get assistance and learn more about the platform</p>
                                </div>
                            </div>

                            <div className="help-accordion">

                                {/* Help Center */}
                                <div className={`help-accordion-item ${helpModal === 'faq' ? 'open' : ''}`}>
                                    <button className="help-accordion-trigger" onClick={() => setHelpModal(helpModal === 'faq' ? null : 'faq')}>
                                        <div className="help-card-icon" style={{background:'rgba(59,130,246,0.1)', color:'#3B82F6'}}>
                                            <BookOpen size={20} />
                                        </div>
                                        <div className="help-card-text">
                                            <h4>Help Center</h4>
                                            <p>Browse articles and tutorials</p>
                                        </div>
                                        <ChevronRight size={18} className={`help-chevron ${helpModal === 'faq' ? 'rotated' : ''}`} />
                                    </button>
                                    <div className="help-accordion-body">
                                        <div className="accordion-content-wrapper">
                                            {[
                                                { q: 'How do I change my username?', a: 'Go to Settings → Account and update your username. You\'ll need to confirm with your password.' },
                                                { q: 'How do I deactivate my account?', a: 'Go to Settings → Account → Deactivate Account. Your account will be hidden but can be recovered.' },
                                                { q: 'Can I change my college?', a: 'Yes! Go to Settings → Account, select a new college and save with your password.' },
                                                { q: 'How do I reset my password?', a: 'Go to Settings → Security → Change Password and follow the steps.' },
                                                { q: 'How do I block someone?', a: 'Visit their profile and tap the three dots menu → Block. You can manage blocked users in Settings → Blocked Accounts.' },
                                            ].map((item, i) => (
                                                <div key={i} className="faq-item">
                                                    <span className="faq-q">{item.q}</span>
                                                    <p className="faq-a">{item.a}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Support */}
                                <div className={`help-accordion-item ${helpModal === 'contact' ? 'open' : ''}`}>
                                    <button className="help-accordion-trigger" onClick={() => setHelpModal(helpModal === 'contact' ? null : 'contact')}>
                                        <div className="help-card-icon" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}>
                                            <MessageSquare size={20} />
                                        </div>
                                        <div className="help-card-text">
                                            <h4>Contact Support</h4>
                                            <p>Chat with our team — usually replies in 5 min</p>
                                        </div>
                                        <ChevronRight size={18} className={`help-chevron ${helpModal === 'contact' ? 'rotated' : ''}`} />
                                    </button>
                                    <div className="help-accordion-body">
                                        <div className="accordion-content-wrapper">
                                            <div className="form-group">
                                                <label>Subject</label>
                                                <input type="text" placeholder="e.g. Issue with my profile" />
                                            </div>
                                            <div className="form-group">
                                                <label>Message</label>
                                                <textarea className="help-textarea" placeholder="Describe your issue..." rows={4} />
                                            </div>
                                            <button className="primary-save-btn" onClick={() => { showToast("Message sent! We'll reply soon.", 'success'); setHelpModal(null); }}>
                                                <MessageSquare size={16} /> Send Message
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Terms of Service */}
                                <div className={`help-accordion-item ${helpModal === 'terms' ? 'open' : ''}`}>
                                    <button className="help-accordion-trigger" onClick={() => setHelpModal(helpModal === 'terms' ? null : 'terms')}>
                                        <div className="help-card-icon" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}>
                                            <FileText size={20} />
                                        </div>
                                        <div className="help-card-text">
                                            <h4>Terms of Service</h4>
                                            <p>Read our terms and conditions</p>
                                        </div>
                                        <ChevronRight size={18} className={`help-chevron ${helpModal === 'terms' ? 'rotated' : ''}`} />
                                    </button>
                                    <div className="help-accordion-body">
                                        <div className="accordion-content-wrapper">
                                            <div style={{paddingTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6'}}>
                                                <p style={{marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)'}}>1. Acceptance of Terms</p>
                                                <p style={{marginBottom: '1.5rem'}}>By accessing and using Campus Clan, you accept and agree to be bound by the terms and provision of this agreement.</p>
                                                
                                                <p style={{marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)'}}>2. User Conduct</p>
                                                <p style={{marginBottom: '1.5rem'}}>You agree to use the platform for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the platform.</p>

                                                <p style={{marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)'}}>3. Content Ownership</p>
                                                <p style={{marginBottom: '0'}}>You retain all rights to the content you post on Campus Clan. By posting content, you grant us a non-exclusive license to use, modify, and display the content on the platform.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Privacy Policy */}
                                <div className={`help-accordion-item ${helpModal === 'privacy' ? 'open' : ''}`}>
                                    <button className="help-accordion-trigger" onClick={() => setHelpModal(helpModal === 'privacy' ? null : 'privacy')}>
                                        <div className="help-card-icon" style={{background:'rgba(139,92,246,0.1)', color:'#8b5cf6'}}>
                                            <Shield size={20} />
                                        </div>
                                        <div className="help-card-text">
                                            <h4>Privacy Policy</h4>
                                            <p>Learn how we protect your data</p>
                                        </div>
                                        <ChevronRight size={18} className={`help-chevron ${helpModal === 'privacy' ? 'rotated' : ''}`} />
                                    </button>
                                    <div className="help-accordion-body">
                                        <div className="accordion-content-wrapper">
                                            <div style={{paddingTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6'}}>
                                                <p style={{marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)'}}>Data We Collect</p>
                                                <p style={{marginBottom: '1.5rem'}}>We collect information you provide directly to us, such as when you create or modify your account, use our services, or communicate with us.</p>
                                                
                                                <p style={{marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)'}}>How We Use Your Data</p>
                                                <p style={{marginBottom: '1.5rem'}}>We use the information we collect to provide, maintain, and improve our services, as well as to personalize your experience on Campus Clan.</p>

                                                <p style={{marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)'}}>Information Sharing</p>
                                                <p style={{marginBottom: '0'}}>We do not share your personal information with third parties except as described in this privacy policy or with your consent.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="about-footer-v2">
                                <div className="version-badge">v1.2.4</div>
                                <p>&copy; 2026 Campus Clan. All rights reserved.</p>
                                <p style={{fontSize:'0.8rem', marginTop:'4px'}}>Made with care for students everywhere.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Confirmation Modal */}
            {showPasswordModal && (
                <div className="settings-modal-overlay">
                    <div className="settings-modal">
                        <div className="modal-header">
                            <h3>Confirm Changes</h3>
                            <button className="close-modal" onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p>
                                {isDeactivating 
                                    ? "Are you sure you want to deactivate your account? You will be logged out and your profile will be hidden." 
                                    : `For your security, please enter your password to change your ${pendingChanges?.username !== user.username ? 'username' : 'college'}.`
                                }
                            </p>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="password-input-group">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Enter password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel-btn" onClick={() => { setShowPasswordModal(false); setIsDeactivating(false); }}>Cancel</button>
                            <button className="modal-confirm-btn" onClick={confirmAccountChanges}>
                                {isDeactivating ? "Deactivate Now" : "Confirm & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Settings;
