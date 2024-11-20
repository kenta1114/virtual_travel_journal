import React, { useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { JournalPage } from './components/journal/JournalPage';
import { User } from './types';

function App() {
  const loadSavedUser = () => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(loadSavedUser);

  const handleAuthSuccess = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return <JournalPage user={user} onLogout={handleLogout} />;
}

export default App;