import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import PatientsPage from './components/PatientsPage';
import { hasToken, logout } from './api/auth';
import { setOnAuthFailure } from './api/client';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasToken);
  const [sessionNotice, setSessionNotice] = useState(null);

  useEffect(() => {
    setOnAuthFailure((reason) => {
      logout();
      setIsLoggedIn(false);
      setSessionNotice(reason || 'Session expired. Please log in again.');
    });
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setSessionNotice(null);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setSessionNotice(null);
  };

  return (
    <div className="app-root">
      {isLoggedIn ? (
        <PatientsPage onLogout={handleLogout} />
      ) : (
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          noticeMessage={sessionNotice}
        />
      )}
    </div>
  );
}
