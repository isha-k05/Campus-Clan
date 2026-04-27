import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [loading, setLoading] = useState(false);

    // Setup axios interceptor for token and sync with localStorage
    useEffect(() => {
        if (user && user.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
            localStorage.setItem('user', JSON.stringify(user));
        } else if (!user) {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('user');
        }
    }, [user]);

    const checkEmail = async (email, college) => {
        try {
            const response = await axios.post('/api/auth/check-email', { email, college });
            return response.data;
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Error checking email' 
            };
        }
    };

    const sendOTP = async (email) => {
        try {
            const response = await axios.post('/api/auth/send-otp', { email });
            return response.data;
        } catch (error) {
            return { success: false, message: 'Error sending OTP' };
        }
    };

    const verifyOTP = async (email, otp) => {
        try {
            const response = await axios.post('/api/auth/verify-otp', { email, otp });
            return response.data;
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Error verifying OTP' };
        }
    };

    const checkUsername = async (username) => {
        try {
            const response = await axios.post('/api/auth/check-username', { username });
            return response.data;
        } catch (error) {
            return { success: false, message: 'Error checking username' };
        }
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/register', {
                name: userData.name,
                email: userData.email,
                username: userData.username,
                password: userData.password,
                college: userData.college,
                otp: userData.otp
            });
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setLoading(false);
            return { success: true, message: 'Registration successful!' };
        } catch (error) {
            setLoading(false);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setLoading(false);
            return { success: true, message: 'Login successful!' };
        } catch (error) {
            setLoading(false);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed',
                isDeactivated: error.response?.data?.isDeactivated
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await axios.put('/api/users/profile', profileData);
            if (response.data.success) {
                const updatedUser = { ...user, ...response.data.user };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Error updating profile' 
            };
        }
    };

    const value = {
        user,
        setUser,
        loading,
        checkEmail,
        sendOTP,
        verifyOTP,
        checkUsername,
        register,
        login,
        logout,
        updateProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
