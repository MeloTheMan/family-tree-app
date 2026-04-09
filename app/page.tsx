'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginForm from './components/auth/LoginForm';
import FamilyTreeApp from './components/FamilyTreeApp';
import UserTreeView from './components/UserTreeView';
import { TreeLoadingSkeleton } from './components/LoadingSkeleton';

export default function Home() {
  const { session, loading, error, login, logout } = useAuth();

  console.log('Home - Session:', session);
  console.log('Home - Loading:', loading);

  if (loading) {
    return <TreeLoadingSkeleton />;
  }

  if (!session) {
    return <LoginForm onLogin={login} error={error} loading={loading} />;
  }

  console.log('Home - User Type:', session.userType);

  if (session.userType === 'admin') {
    console.log('Home - Rendering FamilyTreeApp');
    return <FamilyTreeApp onLogout={logout} />;
  }

  console.log('Home - Rendering UserTreeView');
  return <UserTreeView onLogout={logout} />;
}
