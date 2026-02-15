import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doctorApi } from '@/services/api';
import { Shield, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';
import { useT } from '@/context/LangContext';

interface Props {
  onBackClick: () => void;
}

export function DoctorRegisterPage({ onBackClick }: Props) {
  const t = useT();
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    license_number: '',
    national_id: '',
    department: '',
  });
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('changeme');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await doctorApi.register(form);
      setDoctorId(res.id);
    } catch (e) {
      setError(t('register.fail'));
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    if (!doctorId) return;
    setError('');
    setLoading(true);
    try {
      await doctorApi.approve(doctorId, adminKey);
      setApproved(true);
    } catch (e) {
      setError(t('register.approvalFail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Button variant="ghost" size="sm" onClick={onBackClick} className="mb-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t('register.title')}</CardTitle>
                <CardDescription>{t('register.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t('register.fullName')}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>{t('common.password')}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('register.license')}</Label>
                  <Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>CIN</Label>
                  <Input value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('register.department')}</Label>
                <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('register.creating') : t('register.create')}
              </Button>
            </form>

            {doctorId && (
              <div className="mt-6 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4" />
                  <div className="font-medium">{t('register.approvalTitle')}</div>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  ID Docteur: <span className="font-mono">{doctorId}</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input
                    placeholder={t('register.adminKey')}
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                  />
                  <Button onClick={approve} disabled={loading || approved}>
                    {approved ? (
                      <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('register.approved')}</span>
                    ) : t('register.approve')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
