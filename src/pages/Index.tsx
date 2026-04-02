import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { AuthScreen } from '@/components/AuthScreen';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const { completedModules, toggleModule, progressPercentage, isLoaded } = useProgress();

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={login} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={logout}
      completedModules={completedModules}
      progressPercentage={progressPercentage}
      onToggleModule={toggleModule}
    />
  );
};

export default Index;
