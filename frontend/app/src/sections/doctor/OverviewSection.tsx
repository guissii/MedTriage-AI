import { useState } from 'react';
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
import { mockDashboardMetrics, mockConsultations, mockPatients } from '@/data/mockData';
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

  const activityData = [
    { day: 'Mon', consultations: 12, analyses: 10 },
    { day: 'Tue', consultations: 15, analyses: 13 },
    { day: 'Wed', consultations: 8, analyses: 7 },
    { day: 'Thu', consultations: 18, analyses: 16 },
    { day: 'Fri', consultations: 14, analyses: 12 },
    { day: 'Sat', consultations: 6, analyses: 5 },
    { day: 'Sun', consultations: 4, analyses: 4 },
  ];

  const diseaseData = [
    { name: 'Pneumonia', count: 18 },
    { name: 'Bronchitis', count: 12 },
    { name: 'URI', count: 14 },
    { name: 'COPD', count: 9 },
    { name: 'Asthma', count: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <Button onClick={onNewConsultation} className="gap-2">
          <Plus className="w-4 h-4" />
          New Consultation
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Today's Patients"
          value={mockDashboardMetrics.consultationsToday}
          change={+12}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Consultations"
          value={mockDashboardMetrics.totalConsultations}
          change={+8}
          icon={FileText}
          color="purple"
        />
        <MetricCard
          title="AI Analyses"
          value={mockDashboardMetrics.aiAnalysesRun}
          change={+15}
          icon={Brain}
          color="teal"
        />
        <MetricCard
          title="Avg Triage Time"
          value={`${mockDashboardMetrics.averageTriageTime}m`}
          change={-5}
          icon={Clock}
          color="amber"
          isTime
        />
        <MetricCard
          title="Pending Reviews"
          value={mockDashboardMetrics.pendingReviews}
          change={-2}
          icon={AlertCircle}
          color="red"
        />
        <MetricCard
          title="Completion Rate"
          value={`${mockDashboardMetrics.completionRate}%`}
          change={+3}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Activity Overview</CardTitle>
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
                  {range}
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
            <CardTitle className="text-lg">Top Diagnoses</CardTitle>
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
            <CardTitle className="text-lg">Recent Consultations</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockConsultations.slice(0, 3).map((consultation) => {
                const patient = mockPatients.find(p => p.id === consultation.patientId);
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
                          {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(consultation.createdAt)} at {formatTime(consultation.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={consultation.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {consultation.status}
                      </Badge>
                      {consultation.aiAnalysis && (
                        <div className="text-xs text-muted-foreground">
                          {consultation.aiAnalysis.confidenceScore}% confidence
                        </div>
                      )}
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
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Confidence</span>
                <span className="font-medium">82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Processing Time</span>
                <span className="font-medium">2.3s</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Accuracy Rate</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span>Model: MT-Clinical-v2.4</span>
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
  change: number;
  icon: React.ElementType;
  color: string;
  isTime?: boolean;
}

function MetricCard({ title, value, change, icon: Icon, color, isTime }: MetricCardProps) {
  const isPositive = isTime ? change < 0 : change > 0;
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
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            <TrendIcon className="w-3 h-3" />
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
