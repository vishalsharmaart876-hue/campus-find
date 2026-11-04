import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

// Storage helper functions for persistent vs session storage
const getStoredToken = () => {
  return (
    localStorage.getItem('campusfind_token') ||
    sessionStorage.getItem('campusfind_token') ||
    null
  );
};

const getStoredUser = () => {
  const userStr =
    localStorage.getItem('campusfind_user') ||
    sessionStorage.getItem('campusfind_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

const saveSession = (token, user, rememberMe = true) => {
  if (rememberMe) {
    // Persistent Login: stored across browser restarts and device reboots
    localStorage.setItem('campusfind_token', token);
    localStorage.setItem('campusfind_user', JSON.stringify(user));
    localStorage.setItem('campusfind_remember', 'true');
    sessionStorage.removeItem('campusfind_token');
    sessionStorage.removeItem('campusfind_user');
  } else {
    // Session-only Login: active only until browser window/tab is closed
    sessionStorage.setItem('campusfind_token', token);
    sessionStorage.setItem('campusfind_user', JSON.stringify(user));
    localStorage.setItem('campusfind_remember', 'false');
    localStorage.removeItem('campusfind_token');
    localStorage.removeItem('campusfind_user');
  }
};

const clearSession = () => {
  localStorage.removeItem('campusfind_token');
  localStorage.removeItem('campusfind_user');
  sessionStorage.removeItem('campusfind_token');
  sessionStorage.removeItem('campusfind_user');
};

export const AuthProvider = ({ children }) => {
  // Synchronous initialization from storage ensures immediate session persistence without flicker
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  // Re-hydrate & verify persistent session with MongoDB on mount
  useEffect(() => {
    const checkAuth = async () => {
      const activeToken = getStoredToken();
      if (activeToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            const isPersistent = localStorage.getItem('campusfind_token') !== null;
            if (isPersistent) {
              localStorage.setItem('campusfind_user', JSON.stringify(res.data.user));
            } else {
              sessionStorage.setItem('campusfind_user', JSON.stringify(res.data.user));
            }
          }
        } catch (err) {
          console.warn('Persistent session verification expired or invalid:', err.message);
          setUser(null);
          setToken(null);
          clearSession();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      saveSession(res.data.token, res.data.user, rememberMe);
    }
    return res.data;
  };

  const signup = async (userData, rememberMe = true) => {
    const res = await api.post('/auth/signup', userData);
    if (res.data.success) {
      setUser(res.data.user);
      setToken(res.data.token);
      saveSession(res.data.token, res.data.user, rememberMe);
    }
    return res.data;
  };

  const demoLogin = async (role = 'student', rememberMe = true) => {
    let email = 'aravind@campus.edu';
    let password = 'Student@123';

    if (role === 'admin') {
      email = 'admin@campus.edu';
      password = 'Admin@123';
    } else if (role === 'faculty') {
      email = 'prof.sharma@campus.edu';
      password = 'Faculty@123';
    } else if (role === 'student2') {
      email = 'priya@campus.edu';
      password = 'Student@123';
    }

    return await login(email, password, rememberMe);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      clearSession();
    }
  };


  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success) {
      const updatedUser = { ...user, ...res.data.user };
      setUser(updatedUser);
      if (localStorage.getItem('campusfind_token')) {
        localStorage.setItem('campusfind_user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('campusfind_user', JSON.stringify(updatedUser));
      }
    }
    return res.data;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword });
    if (res.data.success && res.data.token) {
      setToken(res.data.token);
      const isPersistent = localStorage.getItem('campusfind_token') !== null;
      if (isPersistent) {
        localStorage.setItem('campusfind_token', res.data.token);
      } else {
        sessionStorage.setItem('campusfind_token', res.data.token);
      }
    }
    return res.data;
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.user) {
        setUser(res.data.user);
        const isPersistent = localStorage.getItem('campusfind_token') !== null;
        if (isPersistent) {
          localStorage.setItem('campusfind_user', JSON.stringify(res.data.user));
        } else {
          sessionStorage.setItem('campusfind_user', JSON.stringify(res.data.user));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isFaculty: user?.role === 'faculty',
        isStudent: user?.role === 'student',
        login,
        signup,
        demoLogin,
        logout,
        updateProfile,
        changePassword,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

