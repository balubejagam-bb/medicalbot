import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MiniChat from '@/components/MiniChat';
import { 
  FileText, 
  MessageSquare, 
  Upload, 
  Camera, 
  Activity, 
  Users, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Heart
} from 'lucide-react';

interface DashboardStats {
  totalSessions: number;
  totalChats: number;
  recentActivity: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalChats: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start a safety timeout to avoid indefinite loading
    const safetyTimeout = setTimeout(() => {
      console.log('Dashboard: Safety timeout reached, clearing loading state');
      setLoading(false);
    }, 3000); // 3 second timeout for loading
    
    if (user) {
      console.log('Dashboard: User loaded, fetching stats');
      fetchDashboardStats();
    } else {
      console.log('Dashboard: No user available, clearing loading state');
      setLoading(false);
    }
    
    return () => clearTimeout(safetyTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      console.log('Dashboard: Fetching stats for user', user?.id);
      
      // Use Promise.allSettled to ensure one failure doesn't block everything
      const [sessionsResult, chatsResult] = await Promise.allSettled([
        supabase
          .from('document_sessions')
          .select('id', { count: 'exact' })
          .eq('user_id', user?.id),
        supabase
          .from('chat_history')
          .select('id', { count: 'exact' })
          .eq('user_id', user?.id),
      ]);
      
      // Process results safely
      let sessions = 0;
      let chats = 0;
      
      if (sessionsResult.status === 'fulfilled') {
        if (sessionsResult.value && typeof sessionsResult.value.count === 'number') {
          sessions = sessionsResult.value.count;
        } else if (sessionsResult.value && sessionsResult.value.data) {
          sessions = sessionsResult.value.data.length; 
        }
      }
      
      if (chatsResult.status === 'fulfilled') {
        if (chatsResult.value && typeof chatsResult.value.count === 'number') {
          chats = chatsResult.value.count;
        } else if (chatsResult.value && chatsResult.value.data) {
          chats = chatsResult.value.data.length;
        }
      }

      console.log('Dashboard: Stats fetched successfully', { sessions, chats });
      
      setStats({
        totalSessions: sessions,
        totalChats: chats,
        recentActivity: Math.floor(Math.random() * 10) + 1, // Mock data for demo
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default stats on error
      setStats({
        totalSessions: 0,
        totalChats: 0,
        recentActivity: 0
      });
    } finally {
      console.log('Dashboard: Clearing loading state');
      setLoading(false);
    }
  };

  const getRoleSpecificFeatures = () => {
    switch (user?.role) {
      case 'healthcare_professional':
        return [
          {
            title: 'Clinical Document Analysis',
            description: 'Advanced AI-powered analysis of medical reports, lab results, and imaging studies',
            icon: FileText,
            action: () => navigate('/document-processing'),
            color: 'bg-primary',
          },
          {
            title: 'Emergency Protocols',
            description: 'Quick access to ICU/ER protocols and decision support systems',
            icon: AlertTriangle,
            action: () => navigate('/chat'),
            color: 'bg-destructive',
          },
          {
            title: 'Patient Chat Assistant',
            description: 'AI assistant for clinical decision support and patient information',
            icon: MessageSquare,
            action: () => navigate('/chat'),
            color: 'bg-accent',
          },
        ];
      case 'nurse':
        return [
          {
            title: 'Nursing Documentation',
            description: 'Process and analyze nursing notes, medication records, and care plans',
            icon: Heart,
            action: () => navigate('/document-processing'),
            color: 'bg-success',
          },
          {
            title: 'Medication Assistant',
            description: 'Get guidance on medication administration and patient monitoring',
            icon: MessageSquare,
            action: () => navigate('/chat'),
            color: 'bg-primary',
          },
          {
            title: 'Patient Monitoring',
            description: 'AI-assisted patient monitoring and alert interpretation',
            icon: Activity,
            action: () => navigate('/chat'),
            color: 'bg-warning',
          },
        ];
      default:
        return [
          {
            title: 'Medical Report Review',
            description: 'Upload and understand your medical reports in simple terms',
            icon: FileText,
            action: () => navigate('/document-processing'),
            color: 'bg-primary',
          },
          {
            title: 'Health Assistant',
            description: 'Ask questions about your health and medical reports',
            icon: MessageSquare,
            action: () => navigate('/chat'),
            color: 'bg-accent',
          },
          {
            title: 'Family Support',
            description: 'Get family-friendly explanations of medical information',
            icon: Users,
            action: () => navigate('/chat'),
            color: 'bg-success',
          },
        ];
    }
  };

  const quickActions = [
    {
      title: 'Upload Document',
      description: 'Process new medical documents',
      icon: Upload,
      action: () => navigate('/document-processing'),
    },
    {
      title: 'Camera Scan',
      description: 'Scan documents with camera',
      icon: Camera,
      action: () => navigate('/camera'),
    },
    {
      title: 'Start Chat',
      description: 'Begin AI conversation',
      icon: MessageSquare,
      action: () => navigate('/chat'),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 relative">
      {/* Medical background pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDVMMTggN0gxNlYxMUgyMFY5SDIyVjdIMjBWNVoiIGZpbGw9ImhzbCh2YXIoLS1wcmltYXJ5KSkiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPgo8L3N2Zz4=')] opacity-20"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-card/90 backdrop-blur-lg shadow-medical border-b border-primary/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent flex items-center space-x-3">
                <div className="relative p-3 rounded-full bg-gradient-to-r from-primary to-accent">
                  <Heart className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <span>Welcome back, {user?.first_name}</span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base flex items-center space-x-2">
                <Activity className="w-4 h-4 text-accent" />
                <span>ICU Medical Assistant Dashboard - <span className="text-primary font-semibold">{user?.role?.replace('_', ' ').toUpperCase()}</span></span>
              </p>
            </div>
            <Button 
              onClick={() => navigate('/profile')}
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-gradient-to-r hover:from-primary hover:to-accent hover:text-white hover:border-transparent transition-all duration-300 w-full sm:w-auto shadow-sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Profile Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Document Sessions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Total processed documents
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.totalChats}</div>
              <p className="text-xs text-muted-foreground">
                Total chat interactions
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.recentActivity}</div>
              <p className="text-xs text-muted-foreground">
                Actions this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>Medical Quick Actions</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={index}
                  className="shadow-medical border-0 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card/90 backdrop-blur-sm border border-primary/10 hover:border-primary/30 group"
                  onClick={action.action}
                >
                  <CardHeader className="text-center pb-2 px-4 sm:px-6">
                    <div className="flex justify-center mb-2">
                      <div className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary group-hover:text-accent transition-all duration-300" />
                      </div>
                    </div>
                    <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-all duration-300">{action.title}</CardTitle>
                    <CardDescription className="text-sm group-hover:text-muted-foreground/80">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Role-specific Features */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              {user?.role === 'healthcare_professional' ? 'Clinical Tools' : 
               user?.role === 'nurse' ? 'Nursing Tools' : 'Patient Tools'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {getRoleSpecificFeatures().map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card 
                    key={index}
                    className="shadow-card border-0 cursor-pointer hover:shadow-medical transition-all duration-200"
                    onClick={feature.action}
                  >
                    <CardHeader className="px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 sm:p-3 rounded-lg ${feature.color}`}>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">{feature.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription className="mt-3 text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Mini Chat */}
          <div className="xl:col-span-1">
            <div className="sticky top-4">
              <MiniChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;