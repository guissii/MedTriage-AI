import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LoginPage } from '@/sections/LoginPage';
import { LandingPage } from '@/sections/LandingPage';
import { DoctorDashboard } from '@/sections/DoctorDashboard';
import { AdminDashboard } from '@/sections/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

function AppContent() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');

  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, user]);

  const handleLoginClick = () => {
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      
      {currentView === 'landing' && !isAuthenticated && (
        <LandingPage onLoginClick={handleLoginClick} />
      )}
      
      {currentView === 'login' && !isAuthenticated && (
        <LoginPage onBackClick={handleBackToLanding} />
      )}
      
      {isAuthenticated && user?.role === 'doctor' && (
        <DoctorDashboard />
      )}
      
      {isAuthenticated && user?.role === 'admin' && (
        <AdminDashboard />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
