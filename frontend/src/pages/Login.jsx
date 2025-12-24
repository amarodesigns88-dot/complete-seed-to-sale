import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ubi, setUbi] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: credentials, 2: interface selection
  const [userId, setUserId] = useState('');
  const [allowedInterfaces, setAllowedInterfaces] = useState([]);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await authService.login(email, password, ubi || null);
      setUserId(response.data.userId);
      setAllowedInterfaces(response.data.allowedInterfaces);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleInterfaceSelect = async (interfaceType) => {
    setError('');
    
    try {
      const response = await authService.selectInterface(userId, interfaceType, ubi || null);
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify({ email, interfaceType }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Interface selection failed.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Seed to Sale</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>UBI (Optional)</label>
              <input
                type="text"
                value={ubi}
                onChange={(e) => setUbi(e.target.value)}
                placeholder="Business identifier"
              />
            </div>
            
            <button type="submit" className="button" style={{ width: '100%' }}>
              Login
            </button>
          </form>
        ) : (
          <div>
            <p style={{ marginBottom: '20px', textAlign: 'center' }}>
              Select your interface:
            </p>
            {allowedInterfaces.map((iface) => (
              <button
                key={iface}
                onClick={() => handleInterfaceSelect(iface)}
                className="button"
                style={{ width: '100%', marginBottom: '10px' }}
              >
                {iface.charAt(0).toUpperCase() + iface.slice(1)} Interface
              </button>
            ))}
            <button
              onClick={() => setStep(1)}
              className="button"
              style={{ width: '100%', marginTop: '20px', backgroundColor: '#95a5a6' }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
