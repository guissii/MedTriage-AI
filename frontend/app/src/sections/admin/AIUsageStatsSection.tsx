import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  BarChart3,
  Download
} from 'lucide-react';
import { mockAIUsageStats } from '@/data/mockData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export function AIUsageStatsSection() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');

  const chartData = mockAIUsageStats.map(stat => ({
    date: stat.date.slice(5),
    analyses: stat.totalAnalyses,
    confidence: stat.averageConfidenceScore,
    time: stat.averageProcessingTime,
  }));

  const totalAnalyses = mockAIUsageStats.reduce((sum, stat) => sum + stat.totalAnalyses, 0);
  const avgConfidence = mockAIUsageStats.reduce((sum, stat) => sum + stat.averageConfidenceScore, 0) / mockAIUsageStats.length;
  const avgProcessingTime = mockAIUsageStats.reduce((sum, stat) => sum + stat.averageProcessingTime, 0) / mockAIUsageStats.length;

  const allDiseases = mockAIUsageStats.flatMap(stat => stat.topDiseases);
  const diseaseCounts = allDiseases.reduce((acc, curr) => {
    acc[curr.disease] = (acc[curr.disease] || 0) + curr.count;
    return acc;
  }, {} as Record<string, number>);

  const topDiseases = Object.entries(diseaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([disease, count]) => ({ disease, count }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Usage Statistics</h1>
          <p className="text-sm text-muted-foreground">
            Monitor AI performance and usage metrics
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
        <StatCard
          title="Total Analyses"
          value={totalAnalyses}
          change={+15}
          icon={Brain}
        />
        <StatCard
          title="Avg Confidence"
          value={`${avgConfidence.toFixed(1)}%`}
          change={+5}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Processing"
          value={`${avgProcessingTime.toFixed(1)}s`}
          change={-8}
          icon={Clock}
          isTime
        />
        <StatCard
          title="Success Rate"
          value="98.5%"
          change={+2}
          icon={BarChart3}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Analysis Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="analyses" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorAnalyses)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Confidence Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[70, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Confidence']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Processing Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}s`, 'Processing Time']}
                  />
                  <Bar dataKey="time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Common Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDiseases.map((item, index) => (
                <div key={item.disease} className="flex items-center gap-4">
                  <div className="w-6 text-sm text-muted-foreground font-medium">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.disease}</span>
                      <span className="text-sm text-muted-foreground">{item.count} cases</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(item.count / topDiseases[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Precision</span>
                <span className="font-semibold">92.4%</span>
              </div>
              <Progress value={92.4} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Recall</span>
                <span className="font-semibold">89.7%</span>
              </div>
              <Progress value={89.7} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">F1 Score</span>
                <span className="font-semibold">91.0%</span>
              </div>
              <Progress value={91.0} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">AUC-ROC</span>
                <span className="font-semibold">94.2%</span>
              </div>
              <Progress value={94.2} className="h-2" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Current Model Version</div>
                <div className="text-sm text-muted-foreground">MT-Clinical-v2.4</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="font-medium">Jan 15, 2026</div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  isTime?: boolean;
}

function StatCard({ title, value, change, icon: Icon, isTime }: StatCardProps) {
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
