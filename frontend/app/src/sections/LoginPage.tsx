import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useT } from '@/context/LangContext';

interface LoginPageProps {
  onBackClick: () => void;
  onRegisterClick: () => void;
}

export function LoginPage({ onBackClick, onRegisterClick }: LoginPageProps) {
  const { login } = useAuth();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(t('login.invalid'));
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'doctor') => {
    if (type === 'admin') {
      setEmail('admin@medtriage.ai');
      setPassword('admin123');
    } else {
      setEmail('doctor@medtriage.ai');
      setPassword('doctor123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackClick}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('login.backHome')}
        </Button>

        <Card className="border shadow-xl">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t('login.title')}</CardTitle>
            <CardDescription>
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('common.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('common.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-input" />
                  <span className="text-muted-foreground">{t('login.remember')}</span>
                </label>
                <button type="button" className="text-primary hover:underline">
                  {t('login.forgot')}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full clinical-button-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t('common.signIn')
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">
                {t('login.demo')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('doctor')}
                  className="p-2 text-xs text-left rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="font-medium flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {t('login.doctor')}
                  </div>
                  <div className="text-muted-foreground mt-0.5">doctor@medtriage.ai</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="p-2 text-xs text-left rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {t('login.admin')}
                  </div>
                  <div className="text-muted-foreground mt-0.5">admin@medtriage.ai</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-sm text-primary hover:underline"
          >
            {t('login.createDoctor')}
          </button>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>SOC 2 Type II · HIPAA-ready · End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}
