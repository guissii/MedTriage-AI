import { useState } from 'react';
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
import { mockAIUsageStats, mockDashboardMetrics } from '@/data/mockData';
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

export function AnalyticsSection() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const consultationData = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 15 },
    { day: 'Wed', count: 8 },
    { day: 'Thu', count: 18 },
    { day: 'Fri', count: 14 },
    { day: 'Sat', count: 6 },
    { day: 'Sun', count: 4 },
  ];

  const aiPerformanceData = mockAIUsageStats.map(stat => ({
    date: stat.date.slice(5),
    analyses: stat.totalAnalyses,
    confidence: stat.averageConfidenceScore,
    time: stat.averageProcessingTime,
  }));

  const diseaseDistribution = [
    { name: 'Pneumonia', value: 28, color: 'hsl(var(--primary))' },
    { name: 'Bronchitis', value: 22, color: 'hsl(var(--primary) / 0.8)' },
    { name: 'URI', value: 18, color: 'hsl(var(--primary) / 0.6)' },
    { name: 'COPD', value: 15, color: 'hsl(var(--primary) / 0.4)' },
    { name: 'Asthma', value: 12, color: 'hsl(var(--primary) / 0.3)' },
    { name: 'Other', value: 5, color: 'hsl(var(--muted))' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance metrics and insights
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
              {range}
            </button>
          ))}
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Consultations"
          value={mockDashboardMetrics.totalConsultations}
          change={+12}
          icon={FileText}
        />
        <AnalyticsCard
          title="AI Analyses"
          value={mockDashboardMetrics.aiAnalysesRun}
          change={+18}
          icon={Brain}
        />
        <AnalyticsCard
          title="Avg Confidence"
          value="82%"
          change={+5}
          icon={TrendingUp}
        />
        <AnalyticsCard
          title="Avg Processing"
          value="2.3s"
          change={-8}
          icon={Clock}
          isTime
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Consultation Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consultation Trend</CardTitle>
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
            <CardTitle className="text-lg">Disease Distribution</CardTitle>
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
            <CardTitle className="text-lg">AI Performance Over Time</CardTitle>
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
                    dataKey="confidence" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-primary" />
                <span className="text-xs text-muted-foreground">Analyses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Confidence %</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Diagnoses This {timeRange}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { disease: 'Pneumonia', count: 28, change: +12 },
                { disease: 'Acute Bronchitis', count: 22, change: +8 },
                { disease: 'Viral URI', count: 18, change: -3 },
                { disease: 'COPD Exacerbation', count: 15, change: +5 },
                { disease: 'Asthma Exacerbation', count: 12, change: +2 },
              ].map((item, index) => (
                <div key={item.disease} className="flex items-center gap-4">
                  <div className="w-6 text-sm text-muted-foreground font-medium">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.disease}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.count} cases</span>
                        <Badge 
                          variant={item.change > 0 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.change > 0 ? '+' : ''}{item.change}
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(item.count / 30) * 100}%` }}
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
          <CardTitle className="text-lg">System Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="font-semibold">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">API Response</span>
                <span className="font-semibold">145ms</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Model Accuracy</span>
                <span className="font-semibold">94.2%</span>
              </div>
              <Progress value={94.2} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">User Satisfaction</span>
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
