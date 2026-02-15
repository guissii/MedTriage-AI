import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Brain,
  FileText,
  Download
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useLang } from '@/context/LangContext';
import { useAuth } from '@/context/AuthContext';

export function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [realMetrics, setRealMetrics] = useState<any | null>(null);
  const { language } = useLang();
  const { user } = useAuth();
  const effectiveDoctorId = user?.id || '2';

  useEffect(() => {
    const load = async () => {
      try {
        const url = new URL('http://localhost:8000/api/metrics/ai-usage');
        url.searchParams.set('doctor_id', effectiveDoctorId);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setRealMetrics(data);
        }
      } catch {
      }
    };
    load();
  }, [effectiveDoctorId]);

  const consultationData = realMetrics?.by_day?.map((d: any) => ({
    day: d.date.slice(5),
    count: d.count,
  })) ?? [];

  const aiPerformanceData = realMetrics?.by_day?.map((d: any) => ({
    date: d.date.slice(5),
    analyses: d.count,
    time: d.avg_processing_ms ? d.avg_processing_ms / 1000 : (realMetrics?.avg_processing_ms ? realMetrics.avg_processing_ms / 1000 : 0),
  })) ?? [];

  const topDiseases = Array.isArray(realMetrics?.top_diseases) ? realMetrics.top_diseases : [];
  const diseaseTotal = topDiseases.reduce((acc: number, x: any) => acc + Number(x?.count ?? 0), 0) || 1;
  const diseaseDistribution = topDiseases.slice(0, 8).map((d: any, idx: number) => ({
    name: String(d?.disease ?? ''),
    value: Number(d?.count ?? 0),
    color: idx === 0 ? 'hsl(var(--primary))' : `hsl(var(--primary) / ${Math.max(0.25, 0.9 - idx * 0.08)})`,
    percent: Math.round((Number(d?.count ?? 0) / diseaseTotal) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{language === 'fr' ? 'Analyses' : 'Analytics'}</h1>
          <p className="text-sm text-muted-foreground">
            {language === 'fr' ? 'Indicateurs de performance et insights' : 'Performance metrics and insights'}
          </p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {language === 'fr'
                ? range === 'week'
                  ? 'semaine'
                  : range === 'month'
                    ? 'mois'
                    : 'trimestre'
                : range}
            </button>
          ))}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            {language === 'fr' ? 'Exporter' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title={language === 'fr' ? 'Consultations' : 'Total Consultations'}
          value={realMetrics?.total_consultations ?? 0}
          change={0}
          icon={FileText}
        />
        <AnalyticsCard
          title={language === 'fr' ? 'Analyses IA' : 'AI Analyses'}
          value={realMetrics?.total_ai_analyses ?? 0}
          change={0}
          icon={Brain}
        />
        <AnalyticsCard
          title={language === 'fr' ? 'Tokens total' : 'Total tokens'}
          value={realMetrics?.tokens?.total_tokens ?? 0}
          change={0}
          icon={TrendingUp}
        />
        <AnalyticsCard
          title={language === 'fr' ? 'Temps moyen' : 'Avg Processing'}
          value={realMetrics ? `${(realMetrics.avg_processing_ms / 1000).toFixed(2)}s` : '0.00s'}
          change={0}
          icon={Clock}
          isTime
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Consultation Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{language === 'fr' ? 'Tendance des consultations' : 'Consultation Trend'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consultationData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Disease Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{language === 'fr' ? 'Répartition des maladies' : 'Disease Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {diseaseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {diseaseDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{language === 'fr' ? 'Performance IA dans le temps' : 'AI Performance Over Time'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="analyses" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-primary" />
                <span className="text-xs text-muted-foreground">{language === 'fr' ? 'Analyses' : 'Analyses'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">{language === 'fr' ? 'Temps (s)' : 'Time (s)'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {language === 'fr'
                ? `Diagnostics fréquents (${timeRange === 'week' ? 'semaine' : timeRange === 'month' ? 'mois' : 'trimestre'})`
                : `Top Diagnoses This ${timeRange}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(topDiseases.length ? topDiseases : []).slice(0, 8).map((item: any, index: number) => (
                <div key={item.disease} className="flex items-center gap-4">
                  <div className="w-6 text-sm text-muted-foreground font-medium">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{String(item.disease ?? '')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {Number(item.count ?? 0)} {language === 'fr' ? 'cas' : 'cases'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (Number(item.count ?? 0) / Math.max(1, Number(topDiseases?.[0]?.count ?? 1))) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'fr' ? 'Performance du système' : 'System Performance Metrics'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Disponibilité' : 'Uptime'}</span>
                <span className="font-semibold">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Réponse API' : 'API Response'}</span>
                <span className="font-semibold">145ms</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Précision modèle' : 'Model Accuracy'}</span>
                <span className="font-semibold">94.2%</span>
              </div>
              <Progress value={94.2} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Satisfaction' : 'User Satisfaction'}</span>
                <span className="font-semibold">4.8/5</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  isTime?: boolean;
}

function AnalyticsCard({ title, value, change, icon: Icon, isTime }: AnalyticsCardProps) {
  const isPositive = isTime ? change < 0 : change > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
}
