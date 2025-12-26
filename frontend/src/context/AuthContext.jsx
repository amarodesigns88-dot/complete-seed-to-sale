import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [locationId, setLocationId] = useState(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedUserId = localStorage.getItem('userId');
    const storedLocation = localStorage.getItem('locationId');

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
    if (storedLocation) {
      setLocationId(storedLocation);
    }
  }, []);

  const login = (token, userData, userIdValue, location) => {
    setToken(token);
    setUser(userData);
    setUserId(userIdValue);
    setLocationId(location);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userId', userIdValue);
    if (location) {
      localStorage.setItem('locationId', location);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserId(null);
    setLocationId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('locationId');
  };

  const updateLocation = (newLocationId) => {
    setLocationId(newLocationId);
    localStorage.setItem('locationId', newLocationId);
  };

  return (
    <AuthContext.Provider value={{ user, userId, token, locationId, login, logout, updateLocation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
