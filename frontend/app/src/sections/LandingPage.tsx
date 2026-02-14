import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  ArrowRight, 
  Brain, 
  Shield, 
  Database, 
  Eye, 
  Stethoscope,
  FileText,
  Lock,
  CheckCircle,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'Biological Analysis Engine',
      description: 'Interpret labs with reference ranges, trends, and risk flags in real-time.',
    },
    {
      icon: Database,
      title: 'Drug Cost Optimization',
      description: 'Compare alternatives by efficacy, safety, and cost for optimal patient outcomes.',
    },
    {
      icon: Lock,
      title: 'Local AI Confidentiality',
      description: 'Run models on-premise with Ollama. No patient data ever leaves your network.',
    },
    {
      icon: Eye,
      title: 'Explainable AI',
      description: 'Every suggestion includes clinical reasoning and confidence scores you can trust.',
    },
    {
      icon: FileText,
      title: 'Imaging Integration',
      description: 'Attach findings and link radiology reports to triage decisions seamlessly.',
    },
    {
      icon: Shield,
      title: 'Audit-Ready Logs',
      description: 'Full traceability for compliance and quality reviews at every step.',
    },
  ];

  const stats = [
    { value: '4.2', unit: 'min', label: 'Avg Triage Time' },
    { value: '28', unit: 'fields', label: 'Lab Fields Parsed' },
    { value: '85', unit: '%', label: 'Confidence Threshold' },
    { value: '6', unit: 'options', label: 'Cost Checks / Case' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background/90 backdrop-blur-lg border-b shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">MedTriage AI</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#workflow" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Workflow
              </a>
              <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Security
              </a>
              <Button variant="ghost" size="sm" onClick={onLoginClick}>
                Sign In
              </Button>
              <Button size="sm" onClick={onLoginClick}>
                Request Demo
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b p-4 space-y-3">
            <a href="#features" className="block py-2 text-muted-foreground">Features</a>
            <a href="#workflow" className="block py-2 text-muted-foreground">Workflow</a>
            <a href="#security" className="block py-2 text-muted-foreground">Security</a>
            <Button variant="outline" className="w-full" onClick={onLoginClick}>
              Sign In
            </Button>
            <Button className="w-full" onClick={onLoginClick}>
              Request Demo
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent opacity-60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                <Stethoscope className="w-3 h-3 mr-1" />
                CLINICAL DECISION SUPPORT
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                AI-Powered{' '}
                <span className="text-primary">Clinical Decision</span>{' '}
                Support
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Real-time triage assistance, lab interpretation, and imaging insights—
                designed to augment clinical judgment, not replace it.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={onLoginClick} className="gap-2">
                  Request Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={onLoginClick}>
                  View Triage Workflow
                </Button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>SOC 2 Type II</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>HIPAA-ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>On-premise option</span>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative animate-slide-in-right">
              <div className="relative bg-card rounded-2xl shadow-2xl border overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 text-center text-xs text-muted-foreground">
                    MedTriage AI Dashboard
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Patients Today</div>
                      <div className="text-xl font-bold">24</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">AI Analyses</div>
                      <div className="text-xl font-bold">18</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">Avg Time</div>
                      <div className="text-xl font-bold">4.2m</div>
                    </div>
                  </div>

                  {/* Mock Chart */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-3">Disease Probability</div>
                    <div className="space-y-2">
                      {[
                        { name: 'Pneumonia', prob: 78 },
                        { name: 'Bronchitis', prob: 45 },
                        { name: 'Viral URI', prob: 32 },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-20 text-xs">{item.name}</div>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${item.prob}%` }}
                            />
                          </div>
                          <div className="w-8 text-xs text-right">{item.prob}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Alert */}
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-red-800 dark:text-red-200">
                          Risk Alert
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-300">
                          Elevated CRP with pulmonary opacity
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-lg border p-3 animate-pulse-soft">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">AI Processing</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg border p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">Analysis Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for the full clinical workflow
            </h2>
            <p className="text-lg text-muted-foreground">
              From intake to imaging to explainable recommendations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span 
                    className={`text-4xl sm:text-5xl font-bold text-primary transition-all duration-1000 ${
                      statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-lg text-muted-foreground">{stat.unit}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Streamlined triage workflow
            </h2>
            <p className="text-lg text-muted-foreground">
              Four simple steps from patient intake to AI-powered insights.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Patient Info',
                description: 'Enter demographics, history, and current medications.',
                icon: Activity,
              },
              {
                step: '02',
                title: 'Symptoms',
                description: 'Document presenting complaints and vital signs.',
                icon: Stethoscope,
              },
              {
                step: '03',
                title: 'Lab Analysis',
                description: 'Input biological markers with real-time validation.',
                icon: Database,
              },
              {
                step: '04',
                title: 'AI Insights',
                description: 'Review probabilities, risks, and recommendations.',
                icon: Brain,
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="bg-card rounded-xl p-6 border shadow-sm h-full">
                  <div className="text-4xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Security and compliance built-in
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                MedTriage AI is designed with healthcare security standards from the ground up.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'SOC 2 Type II Certified', desc: 'Independent audit verification' },
                  { icon: Lock, title: 'HIPAA Compliant', desc: 'Full PHI protection and encryption' },
                  { icon: Database, title: 'On-Premise Deployment', desc: 'Keep data within your network' },
                  { icon: Eye, title: 'Full Audit Logs', desc: 'Complete traceability for compliance' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-card rounded-2xl shadow-xl border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold">Compliance Status</div>
                    <div className="text-sm text-muted-foreground">All systems operational</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Data Encryption', status: 'Active' },
                    { label: 'Access Controls', status: 'Active' },
                    { label: 'Audit Logging', status: 'Active' },
                    { label: 'Backup Systems', status: 'Active' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{item.label}</span>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to streamline triage?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading healthcare institutions using MedTriage AI to enhance clinical decision-making.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={onLoginClick} className="gap-2">
              Request Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLoginClick}>
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">MedTriage AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered clinical decision support for modern healthcare.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground">Case Studies</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">HIPAA Notice</a></li>
                <li><a href="#" className="hover:text-foreground">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 MedTriage AI. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground max-w-md text-center md:text-right">
              DISCLAIMER: MedTriage AI is a clinical decision support tool and does not replace professional medical judgment. 
              Always verify recommendations with qualified healthcare providers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
