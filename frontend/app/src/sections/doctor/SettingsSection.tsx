import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLang } from '@/context/LangContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Mail, 
  Smartphone,
  Key,
  Save,
  Camera,
  CheckCircle
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { doctorApi, FILES_BASE_URL } from '@/services/api';

export function SettingsSection() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language } = useLang();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampUrl, setStampUrl] = useState<string>('');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'profile', label: language === 'fr' ? 'Profil' : 'Profile', icon: User },
    { id: 'notifications', label: language === 'fr' ? 'Notifications' : 'Notifications', icon: Bell },
    { id: 'security', label: language === 'fr' ? 'Sécurité' : 'Security', icon: Shield },
    { id: 'appearance', label: language === 'fr' ? 'Apparence' : 'Appearance', icon: resolvedTheme === 'dark' ? Moon : Sun },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">{language === 'fr' ? 'Paramètres' : 'Settings'}</h1>
        <p className="text-sm text-muted-foreground">
          {language === 'fr'
            ? 'Gérer les préférences et paramètres du compte'
            : 'Manage your account preferences and settings'}
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Informations du profil' : 'Profile Information'}</CardTitle>
                <CardDescription>
                  {language === 'fr'
                    ? 'Mettre à jour vos informations personnelles et professionnelles'
                    : 'Update your personal and professional information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user?.name ? getInitials(user.name) : 'DR'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Camera className="w-4 h-4" />
                      {language === 'fr' ? 'Changer la photo' : 'Change Photo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'fr' ? 'JPG, PNG ou GIF. Taille max 2MB.' : 'JPG, PNG or GIF. Max size 2MB.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Label className="text-sm">Cachet du médecin</Label>
                  <input type="file" onChange={(e) => setStampFile(e.target.files?.[0] || null)} />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!stampFile || !user?.id) return;
                      try {
                        const res = await doctorApi.uploadStamp(user.id, stampFile);
                        const path = res.stamp_path as string;
                        const url = path.startsWith('uploads') ? `${FILES_BASE_URL}/${path.split('uploads/')[1]}` : path;
                        setStampUrl(url);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Upload Stamp
                  </Button>
                </div>
                {stampUrl && (
                  <div className="mt-2">
                    <img src={stampUrl} alt="Stamp" className="h-20 object-contain border rounded bg-white" />
                  </div>
                )}

                <Separator />

                {/* Form Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{language === 'fr' ? 'Prénom' : 'First Name'}</Label>
                    <Input id="firstName" defaultValue={user?.name?.split(' ')[0] || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{language === 'fr' ? 'Nom' : 'Last Name'}</Label>
                    <Input id="lastName" defaultValue={user?.name?.split(' ').slice(1).join(' ') || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{language === 'fr' ? 'Téléphone' : 'Phone Number'}</Label>
                    <Input id="phone" type="tel" placeholder={language === 'fr' ? '+212 6xx xx xx xx' : '+1 (555) 000-0000'} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">{language === 'fr' ? 'Service' : 'Department'}</Label>
                    <Input id="department" defaultValue={user?.department || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license">{language === 'fr' ? 'Numéro d’ordre' : 'License Number'}</Label>
                    <Input id="license" defaultValue={user?.licenseNumber || ''} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{language === 'fr' ? 'Bio' : 'Bio'}</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={language === 'fr' ? 'Brève description de votre spécialité…' : 'Brief description of your specialization...'}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {language === 'fr' ? 'Enregistré' : 'Saved'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {language === 'fr' ? 'Enregistrer' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Préférences de notification' : 'Notification Preferences'}</CardTitle>
                <CardDescription>
                  {language === 'fr' ? 'Choisir comment vous souhaitez être notifié' : 'Choose how you want to be notified'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {language === 'fr' ? 'Notifications email' : 'Email Notifications'}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { id: 'consultation_complete', label: language === 'fr' ? 'Consultation terminée' : 'Consultation completed', default: true },
                      { id: 'ai_analysis', label: language === 'fr' ? 'Résultats IA disponibles' : 'AI analysis results ready', default: true },
                      { id: 'patient_update', label: language === 'fr' ? 'Mises à jour dossier patient' : 'Patient record updates', default: false },
                      { id: 'system_alert', label: language === 'fr' ? 'Alertes système et maintenance' : 'System alerts and maintenance', default: true },
                      { id: 'weekly_report', label: language === 'fr' ? 'Rapport hebdomadaire' : 'Weekly analytics report', default: true },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
                        <Switch id={item.id} defaultChecked={item.default} />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    {language === 'fr' ? 'Notifications push' : 'Push Notifications'}
                  </h4>
                  <div className="space-y-3">
                    {[
                      { id: 'push_critical', label: language === 'fr' ? 'Alertes critiques' : 'Critical alerts', default: true },
                      { id: 'push_consultation', label: language === 'fr' ? 'Nouvelle consultation assignée' : 'New consultation assigned', default: true },
                      { id: 'push_message', label: language === 'fr' ? 'Messages directs' : 'Direct messages', default: false },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <Label htmlFor={item.id} className="cursor-pointer">{item.label}</Label>
                        <Switch id={item.id} defaultChecked={item.default} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    {language === 'fr' ? 'Enregistrer' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'fr' ? 'Changer le mot de passe' : 'Change Password'}</CardTitle>
                  <CardDescription>
                    {language === 'fr'
                      ? 'Mettre à jour votre mot de passe pour sécuriser votre compte'
                      : 'Update your password to keep your account secure'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{language === 'fr' ? 'Mot de passe actuel' : 'Current Password'}</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{language === 'fr' ? 'Nouveau mot de passe' : 'New Password'}</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{language === 'fr' ? 'Confirmer le nouveau mot de passe' : 'Confirm New Password'}</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="gap-2">
                    <Key className="w-4 h-4" />
                    {language === 'fr' ? 'Mettre à jour' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === 'fr' ? 'Authentification à deux facteurs' : 'Two-Factor Authentication'}</CardTitle>
                  <CardDescription>
                    {language === 'fr'
                      ? 'Ajouter une couche de sécurité supplémentaire'
                      : 'Add an extra layer of security to your account'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{language === 'fr' ? 'Application d’authentification' : 'Authenticator App'}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'fr' ? 'Utiliser une application pour générer des codes' : 'Use an authenticator app to generate codes'}
                      </div>
                    </div>
                    <Button variant="outline">{language === 'fr' ? 'Activer' : 'Enable'}</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === 'fr' ? 'Sessions actives' : 'Active Sessions'}</CardTitle>
                  <CardDescription>
                    {language === 'fr' ? 'Gérer vos sessions actives' : 'Manage your active login sessions'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <div className="font-medium">{language === 'fr' ? 'Session actuelle' : 'Current Session'}</div>
                          <div className="text-xs text-muted-foreground">
                            Chrome on Windows · IP: 192.168.1.100
                          </div>
                        </div>
                      </div>
                      <Badge>{language === 'fr' ? 'Active' : 'Active'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Apparence' : 'Appearance'}</CardTitle>
                <CardDescription>
                  {language === 'fr'
                    ? 'Personnaliser l’apparence de MedTriage'
                    : 'Customize how MedTriage AI looks for you'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">{language === 'fr' ? 'Thème' : 'Theme'}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`p-4 rounded-lg border text-center transition-colors ${
                          theme === t
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex justify-center mb-2">
                          {t === 'light' && <Sun className="w-6 h-6" />}
                          {t === 'dark' && <Moon className="w-6 h-6" />}
                          {t === 'system' && (
                            <div className="flex">
                              <Sun className="w-4 h-4" />
                              <Moon className="w-4 h-4 -ml-1" />
                            </div>
                          )}
                        </div>
                        <div className="font-medium capitalize">
                          {language === 'fr'
                            ? t === 'light'
                              ? 'clair'
                              : t === 'dark'
                                ? 'sombre'
                                : 'système'
                            : t}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">{language === 'fr' ? 'Préférences d’affichage' : 'Display Preferences'}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compactMode" className="cursor-pointer">{language === 'fr' ? 'Mode compact' : 'Compact Mode'}</Label>
                      <Switch id="compactMode" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showAnimations" className="cursor-pointer">{language === 'fr' ? 'Afficher les animations' : 'Show Animations'}</Label>
                      <Switch id="showAnimations" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="highContrast" className="cursor-pointer">{language === 'fr' ? 'Contraste élevé' : 'High Contrast'}</Label>
                      <Switch id="highContrast" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    {language === 'fr' ? 'Enregistrer' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
