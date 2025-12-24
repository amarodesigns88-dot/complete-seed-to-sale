import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Plants from './pages/Plants';
import Sales from './pages/Sales';
import './styles/App.css';

function App() {
  const token = localStorage.getItem('token');

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
          
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div>
                  <Header />
                  <div className="container">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/plants" element={<Plants />} />
                      <Route path="/sales" element={<Sales />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </div>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
