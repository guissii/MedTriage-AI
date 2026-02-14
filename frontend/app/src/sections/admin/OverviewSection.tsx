import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Activity, 
  Server, 
  Brain,
  TrendingUp, 
  TrendingDown,
  Database,
  FileText
} from 'lucide-react';
import { mockDashboardMetrics, mockDoctors, mockSystemLogs } from '@/data/mockData';
import { formatDate, formatTime } from '@/lib/utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Line
} from 'recharts';

export function OverviewSection() {
  const systemHealth = [
    { name: 'API Server', status: 'operational', uptime: '99.9%' },
    { name: 'AI Engine', status: 'operational', uptime: '99.7%' },
    { name: 'Database', status: 'operational', uptime: '99.9%' },
    { name: 'Storage', status: 'operational', uptime: '100%' },
  ];

  const activityData = [
    { time: '00:00', users: 5, requests: 120 },
    { time: '04:00', users: 2, requests: 45 },
    { time: '08:00', users: 15, requests: 380 },
    { time: '12:00', users: 28, requests: 650 },
    { time: '16:00', users: 22, requests: 520 },
    { time: '20:00', users: 12, requests: 280 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          System overview and key metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Doctors"
          value={mockDoctors.length}
          change={+2}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Consultations"
          value={mockDashboardMetrics.totalConsultations}
          change={+12}
          icon={FileText}
          color="purple"
        />
        <MetricCard
          title="AI Analyses"
          value={mockDashboardMetrics.aiAnalysesRun}
          change={+18}
          icon={Brain}
          color="teal"
        />
        <MetricCard
          title="System Uptime"
          value="99.9%"
          change={0}
          icon={Server}
          color="emerald"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">System Activity</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">Last 24h</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === 'operational' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{service.uptime}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Status</span>
                <Badge className="bg-emerald-500/10 text-emerald-600">All Systems Operational</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent System Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent System Logs</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSystemLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    log.level === 'error' ? 'bg-red-500' : 
                    log.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{log.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.level}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {log.message}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(log.timestamp)} at {formatTime(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Doctors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Doctors</CardTitle>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{doctor.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {doctor.department}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage & Performance */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Database className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Database Size</span>
            </div>
            <div className="text-2xl font-bold">2.4 GB</div>
            <Progress value={45} className="h-2 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">45% of 5 GB</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Storage Used</span>
            </div>
            <div className="text-2xl font-bold">847 GB</div>
            <Progress value={67} className="h-2 mt-2" />
            <div className="text-xs text-muted-foreground mt-1">67% of 1.2 TB</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">API Requests</span>
            </div>
            <div className="text-2xl font-bold">12.5K</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2">
              <TrendingUp className="w-3 h-3" />
              <span>+8% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">AI Processing</span>
            </div>
            <div className="text-2xl font-bold">2.3s</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2">
              <TrendingDown className="w-3 h-3" />
              <span>-12% faster</span>
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
}

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const isPositive = change >= 0;

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
          {change !== 0 && (
            <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
