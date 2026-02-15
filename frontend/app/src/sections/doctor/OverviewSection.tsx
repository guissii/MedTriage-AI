import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Activity, 
  Clock, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/context/LangContext';
import { doctorApi } from '@/services/api';
import { formatDate, formatTime } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface OverviewSectionProps {
  onNewConsultation: () => void;
}

export function OverviewSection({ onNewConsultation }: OverviewSectionProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const { user } = useAuth();
  const t = useT();
  const effectiveDoctorId = user?.id || '2';
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await doctorApi.dashboard(effectiveDoctorId);
        setDashboard(data);
      } catch {
      }
      try {
        const url = new URL('http://localhost:8000/api/metrics/ai-usage');
        url.searchParams.set('doctor_id', effectiveDoctorId);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('metrics_failed');
        setMetrics(await res.json());
      } catch {
      }
    }
    load();
  }, [effectiveDoctorId]);

  const series = Array.isArray(metrics?.by_day) ? metrics.by_day : [];
  const maxDays = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
  const activityData = series
    .slice(-maxDays)
    .map((d: any) => ({
      day: String(d?.date ?? '').slice(5),
      consultations: Number(d?.count ?? 0),
      analyses: Number(d?.count ?? 0),
    }));

  const diseaseData = (Array.isArray(metrics?.top_diseases) ? metrics.top_diseases : [])
    .slice(0, 8)
    .map((d: any) => ({
      name: String(d?.disease ?? ''),
      count: Number(d?.count ?? 0),
    }));

  const recentConsultations = Array.isArray(dashboard?.recent_consultations) ? dashboard.recent_consultations : [];
  const avgProcessingMs = typeof metrics?.avg_processing_ms === 'number' ? metrics.avg_processing_ms : 0;
  const latestModel = metrics?.latest?.[0]?.model ? String(metrics.latest[0].model) : 'mistral';
  const totalTokens = typeof metrics?.tokens?.total_tokens === 'number' ? metrics.tokens.total_tokens : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('overview.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('overview.subtitle')}
          </p>
        </div>
        <Button onClick={onNewConsultation} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('overview.newConsultation')}
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title={t('overview.metric.patientsToday')}
          value={dashboard?.patients_count ?? 0}
          change={null}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title={t('overview.metric.totalConsultations')}
          value={metrics?.total_consultations ?? 0}
          change={null}
          icon={FileText}
          color="purple"
        />
        <MetricCard
          title={t('overview.metric.aiAnalyses')}
          value={metrics?.total_ai_analyses ?? 0}
          change={null}
          icon={Brain}
          color="teal"
        />
        <MetricCard
          title={t('overview.metric.avgTriageTime')}
          value={`${(avgProcessingMs / 1000).toFixed(1)}s`}
          change={null}
          icon={Clock}
          color="amber"
          isTime
        />
        <MetricCard
          title={t('overview.metric.pendingReviews')}
          value={totalTokens}
          change={null}
          icon={AlertCircle}
          color="red"
        />
        <MetricCard
          title={t('overview.metric.completionRate')}
          value={latestModel}
          change={null}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{t('overview.activityTitle')}</CardTitle>
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {range === 'day' ? t('common.day') : range === 'week' ? t('common.week') : t('common.month')}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="consultations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="analyses" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('overview.topDiagnoses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('overview.recentConsultations')}</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              {t('common.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConsultations.slice(0, 3).map((consultation: any) => {
                const createdAt = consultation?.created_at ? new Date(String(consultation.created_at)) : new Date();
                return (
                  <div
                    key={consultation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {consultation?.patient_name || t('overview.unknownPatient')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(createdAt)} {t('common.at')} {formatTime(createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="default"
                        className="text-xs"
                      >
                        {t('status.completed')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg processing</span>
              <span className="font-medium">{(avgProcessingMs / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total tokens</span>
              <span className="font-medium">{totalTokens}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Latest model</span>
              <span className="font-medium">{latestModel}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span>AI usage is computed from saved consultations.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number | null;
  icon: React.ElementType;
  color: string;
  isTime?: boolean;
}

function MetricCard({ title, value, change, icon: Icon, color, isTime }: MetricCardProps) {
  const hasChange = typeof change === 'number';
  const isPositive = hasChange ? (isTime ? change < 0 : change > 0) : true;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600',
    purple: 'bg-purple-500/10 text-purple-600',
    teal: 'bg-teal-500/10 text-teal-600',
    amber: 'bg-amber-500/10 text-amber-600',
    red: 'bg-red-500/10 text-red-600',
    emerald: 'bg-emerald-500/10 text-emerald-600',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {hasChange && (
            <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
}
