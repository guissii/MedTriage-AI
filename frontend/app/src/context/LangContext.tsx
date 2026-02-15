import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'fr' | 'en';

interface LangContextValue {
  language: Lang;
  setLanguage: (lng: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    'app.loading': 'Chargement…',
    'common.dashboard': 'Tableau de bord',
    'common.searchPatients': 'Rechercher des patients…',
    'common.logout': 'Déconnexion',
    'common.back': 'Retour',
    'common.email': 'Email',
    'common.password': 'Mot de passe',
    'common.signIn': 'Se connecter',
    'common.signOut': 'Déconnexion',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.language': 'Langue',
    'common.viewAll': 'Tout voir',
    'common.at': 'à',
    'common.day': 'jour',
    'common.week': 'semaine',
    'common.month': 'mois',
    'common.confidence': 'confiance',
    'status.completed': 'terminée',
    'status.in_progress': 'en cours',
    'nav.overview': 'Aperçu',
    'nav.newConsultation': 'Nouvelle consultation',
    'nav.patients': 'Dossiers patients',
    'nav.analytics': 'Analyses',
    'nav.settings': 'Paramètres',
    'nav.doctors': 'Médecins',
    'nav.logs': 'Journaux',
    'nav.aiStats': 'Statistiques IA',
    'nav.drugs': 'Médicaments',
    'nav.references': 'Références',
    'patients.title': 'Dossiers patients',
    'patients.subtitle': 'Gérer et consulter les informations patient',
    'patients.add': 'Ajouter un patient',
    'consultation.title': 'Nouvelle consultation',
    'consultation.subtitle': 'Étape {step} sur 5 · Compléter le formulaire pour l’analyse IA',
    'consultation.newCase': 'Nouveau cas',
    'consultation.patient': 'Patient',
    'consultation.actions': 'Actions',
    'consultation.refresh': 'Rafraîchir',
    'consultation.patientRequired': 'La consultation nécessite un patient sélectionné.',
    'consultation.selectPatient': 'Sélectionner un patient',
    'consultation.stepPatient': 'Patient',
    'consultation.stepSymptoms': 'Symptômes',
    'consultation.stepLabs': 'Biologie',
    'consultation.stepImaging': 'Imagerie',
    'consultation.stepResults': 'Résultats',
    'results.title': 'Résultat de l’analyse IA',
    'results.exportPdf': 'Exporter PDF',
    'results.saveEhr': 'Enregistrer dans le dossier',
    'results.diseaseProbability': 'Probabilité des maladies',
    'results.riskAlerts': 'Alertes de risque',
    'results.therapeuticDirection': 'Orientation thérapeutique',
    'results.costComparison': 'Comparaison et optimisation des coûts',
    'results.explanation': 'Explication clinique (IA)',
    'results.rawResponse': 'Réponse brute (Ollama)',
    'overview.title': 'Aperçu',
    'overview.subtitle': 'Résumé des activités et indicateurs du jour.',
    'overview.newConsultation': 'Nouvelle consultation',
    'overview.metric.patientsToday': 'Patients du jour',
    'overview.metric.totalConsultations': 'Consultations',
    'overview.metric.aiAnalyses': 'Analyses IA',
    'overview.metric.avgTriageTime': 'Temps moyen',
    'overview.metric.pendingReviews': 'En attente',
    'overview.metric.completionRate': 'Taux de complétion',
    'overview.activityTitle': 'Activité',
    'overview.recentConsultations': 'Consultations récentes',
    'overview.topDiagnoses': 'Diagnostics fréquents',
    'overview.unknownPatient': 'Patient inconnu',
    'landing.nav.features': 'Fonctionnalités',
    'landing.nav.workflow': 'Workflow',
    'landing.nav.security': 'Sécurité',
    'landing.nav.signIn': 'Connexion',
    'landing.hero.badge': 'ASSISTANCE À LA DÉCISION CLINIQUE',
    'landing.hero.title': 'Assistance clinique par IA',
    'landing.hero.subtitle': 'Triage en temps réel, interprétation biologique et imagerie — pour soutenir le jugement clinique.',
    'landing.hero.ctaPrimary': 'Demander une démo',
    'landing.hero.ctaSecondary': 'Voir le workflow',
    'landing.features.title': 'Conçu pour tout le workflow clinique',
    'landing.features.subtitle': 'De l’admission à l’imagerie, jusqu’aux recommandations explicables.',
    'landing.workflow.title': 'Un workflow clair en 4 étapes',
    'landing.security.title': 'Sécurité et conformité intégrées',
    'landing.security.subtitle': 'Conçu selon les standards de sécurité santé dès le départ.',
    'landing.cta.title': 'Prêt à optimiser le triage ?',
    'landing.cta.subtitle': 'Rejoignez les établissements qui utilisent MedTriage AI pour améliorer la décision clinique.',
    'landing.cta.contact': 'Contacter le support',
    'landing.footer.product': 'Produit',
    'landing.footer.resources': 'Ressources',
    'landing.footer.legal': 'Légal',
    'login.backHome': 'Retour à l’accueil',
    'login.title': 'Bienvenue',
    'login.subtitle': 'Connectez-vous pour accéder à votre tableau de bord MedTriage AI',
    'login.invalid': 'Email ou mot de passe invalide. Réessayez.',
    'login.remember': 'Se souvenir de moi',
    'login.forgot': 'Mot de passe oublié ?',
    'login.demo': 'Accès démo (cliquer pour remplir)',
    'login.doctor': 'Docteur',
    'login.admin': 'Admin',
    'login.createDoctor': 'Créer un compte docteur',
    'register.title': 'Créer un compte Docteur',
    'register.subtitle': 'Vérification par numéro d’ordre et CIN',
    'register.fullName': 'Nom complet',
    'register.license': 'Numéro d’ordre',
    'register.department': 'Service/Spécialité',
    'register.create': 'Créer le compte',
    'register.creating': 'En cours…',
    'register.fail': 'Échec de l’inscription. Vérifiez les champs.',
    'register.approvalTitle': 'Approbation Admin',
    'register.adminKey': 'Clé Admin',
    'register.approve': 'Approuver',
    'register.approved': 'Approuvé',
    'register.approvalFail': 'Échec de l’approbation (clé admin invalide ?).',
  },
  en: {
    'app.loading': 'Loading...',
    'common.dashboard': 'Dashboard',
    'common.searchPatients': 'Search patients...',
    'common.logout': 'Logout',
    'common.back': 'Back',
    'common.email': 'Email',
    'common.password': 'Password',
    'common.signIn': 'Sign In',
    'common.signOut': 'Sign Out',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.next': 'Next',
    'common.previous': 'Back',
    'common.language': 'Language',
    'common.viewAll': 'View All',
    'common.at': 'at',
    'common.day': 'day',
    'common.week': 'week',
    'common.month': 'month',
    'common.confidence': 'confidence',
    'status.completed': 'completed',
    'status.in_progress': 'in progress',
    'nav.overview': 'Overview',
    'nav.newConsultation': 'New Consultation',
    'nav.patients': 'Patient Records',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.doctors': 'Manage Doctors',
    'nav.logs': 'System Logs',
    'nav.aiStats': 'AI Usage Stats',
    'nav.drugs': 'Drug Database',
    'nav.references': 'Reference Ranges',
    'patients.title': 'Patient Records',
    'patients.subtitle': 'Manage and view patient information',
    'patients.add': 'Add Patient',
    'consultation.title': 'New Consultation',
    'consultation.subtitle': 'Step {step} of 5 · Complete the form for AI analysis',
    'consultation.newCase': 'New Case',
    'consultation.patient': 'Patient',
    'consultation.actions': 'Actions',
    'consultation.refresh': 'Refresh',
    'consultation.patientRequired': 'A patient must be selected to run a consultation.',
    'consultation.selectPatient': 'Select a patient',
    'consultation.stepPatient': 'Patient',
    'consultation.stepSymptoms': 'Symptoms',
    'consultation.stepLabs': 'Lab Analysis',
    'consultation.stepImaging': 'Imaging',
    'consultation.stepResults': 'AI Results',
    'results.title': 'AI Analysis Result',
    'results.exportPdf': 'Export PDF',
    'results.saveEhr': 'Save to EHR',
    'results.diseaseProbability': 'Disease Probability',
    'results.riskAlerts': 'Risk Alerts',
    'results.therapeuticDirection': 'Therapeutic Direction',
    'results.costComparison': 'Cost Optimization Comparison',
    'results.explanation': 'AI Clinical Explanation',
    'results.rawResponse': 'Raw Ollama Response',
    'overview.title': 'Dashboard Overview',
    'overview.subtitle': "Welcome back! Here's what's happening today.",
    'overview.newConsultation': 'New Consultation',
    'overview.metric.patientsToday': "Today's Patients",
    'overview.metric.totalConsultations': 'Total Consultations',
    'overview.metric.aiAnalyses': 'AI Analyses',
    'overview.metric.avgTriageTime': 'Avg Triage Time',
    'overview.metric.pendingReviews': 'Pending Reviews',
    'overview.metric.completionRate': 'Completion Rate',
    'overview.activityTitle': 'Activity Overview',
    'overview.recentConsultations': 'Recent Consultations',
    'overview.topDiagnoses': 'Top Diagnoses',
    'overview.unknownPatient': 'Unknown Patient',
    'landing.nav.features': 'Features',
    'landing.nav.workflow': 'Workflow',
    'landing.nav.security': 'Security',
    'landing.nav.signIn': 'Sign In',
    'landing.hero.badge': 'CLINICAL DECISION SUPPORT',
    'landing.hero.title': 'AI-Powered Clinical Decision Support',
    'landing.hero.subtitle': 'Real-time triage, lab interpretation, and imaging insights—designed to augment clinical judgment.',
    'landing.hero.ctaPrimary': 'Request Demo',
    'landing.hero.ctaSecondary': 'View Triage Workflow',
    'landing.features.title': 'Built for the full clinical workflow',
    'landing.features.subtitle': 'From intake to imaging to explainable recommendations.',
    'landing.workflow.title': 'A clear 4-step workflow',
    'landing.security.title': 'Security and compliance built-in',
    'landing.security.subtitle': 'Designed with healthcare security standards from the ground up.',
    'landing.cta.title': 'Ready to streamline triage?',
    'landing.cta.subtitle': 'Join leading institutions using MedTriage AI to enhance clinical decision-making.',
    'landing.cta.contact': 'Contact Support',
    'landing.footer.product': 'Product',
    'landing.footer.resources': 'Resources',
    'landing.footer.legal': 'Legal',
    'login.backHome': 'Back to Home',
    'login.title': 'Welcome back',
    'login.subtitle': 'Sign in to access your MedTriage AI dashboard',
    'login.invalid': 'Invalid email or password. Please try again.',
    'login.remember': 'Remember me',
    'login.forgot': 'Forgot password?',
    'login.demo': 'Demo Credentials (Click to fill)',
    'login.doctor': 'Doctor',
    'login.admin': 'Admin',
    'login.createDoctor': 'Create doctor account',
    'register.title': 'Create Doctor Account',
    'register.subtitle': 'Verification by license number and national ID',
    'register.fullName': 'Full Name',
    'register.license': 'License Number',
    'register.department': 'Department / Specialty',
    'register.create': 'Create account',
    'register.creating': 'Creating…',
    'register.fail': 'Registration failed. Check the fields.',
    'register.approvalTitle': 'Admin Approval',
    'register.adminKey': 'Admin Key',
    'register.approve': 'Approve',
    'register.approved': 'Approved',
    'register.approvalFail': 'Approval failed (invalid admin key?).',
  },
};

function translate(language: Lang, key: string): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Lang>('fr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app.language');
      if (saved === 'fr' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lng: Lang) => {
    setLanguageState(lng);
    try {
      localStorage.setItem('app.language', lng);
    } catch {}
  };

  const t = useMemo(() => (key: string) => translate(language, key), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within LangProvider');
  }
  return ctx;
}

export function useT() {
  return useLang().t;
}
