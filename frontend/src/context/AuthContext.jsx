import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [locationId, setLocationId] = useState(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
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
    if (storedLocation) {
      setLocationId(storedLocation);
    }
  }, []);

  const login = (token, userData, location) => {
    setToken(token);
    setUser(userData);
    setLocationId(location);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (location) {
      localStorage.setItem('locationId', location);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setLocationId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('locationId');
  };

  const updateLocation = (newLocationId) => {
    setLocationId(newLocationId);
    localStorage.setItem('locationId', newLocationId);
  };

  return (
    <AuthContext.Provider value={{ user, token, locationId, login, logout, updateLocation }}>
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
