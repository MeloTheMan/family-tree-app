'use client';

import { useAuth } from '@/hooks/useAuth';
import LoginForm from './components/auth/LoginForm';
import FamilyTreeApp from './components/FamilyTreeApp';
import UserTreeView from './components/UserTreeView';
import { TreeLoadingSkeleton } from './components/LoadingSkeleton';

export default function Home() {
  const { session, loading, error, login, logout } = useAuth();

  if (loading) {
    return <TreeLoadingSkeleton />;
  }

  if (!session) {
    return <LoginForm onLogin={login} error={error} loading={loading} />;
  }

  if (session.userType === 'admin') {
    return <FamilyTreeApp onLogout={logout} />;
  }

  return <UserTreeView onLogout={logout} />;
}
