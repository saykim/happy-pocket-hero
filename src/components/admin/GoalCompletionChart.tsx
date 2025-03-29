
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatSummary, UserSummary, COLORS } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type GoalCompletionChartProps = {
  stats: StatSummary;
  userSummaries: UserSummary[];
};

type UserGoalStats = {
  userId: string;
  completedGoals: number;
  ongoingGoals: number;
};

const GoalCompletionChart = ({ stats, userSummaries }: GoalCompletionChartProps) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [userGoalStats, setUserGoalStats] = useState<UserGoalStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserGoals = async () => {
      setIsLoading(true);
      try {
        const { data: goals, error } = await supabase
          .from('goals')
          .select('*');
        
        if (error) throw error;
        
        // Calculate goal stats for each user
        const userStats: UserGoalStats[] = userSummaries.map(user => {
          const userGoals = goals.filter(g => g.user_id === user.id);
          const completed = userGoals.filter(g => g.status === 'completed').length;
          
          return {
            userId: user.id,
            completedGoals: completed,
            ongoingGoals: userGoals.length - completed
          };
        });
        
        setUserGoalStats(userStats);
      } catch (error) {
        console.error('Error fetching user goals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserGoals();
  }, [userSummaries]);

  // Overall goal completion data
  const overallGoalData = [
    { name: '달성한 목표', value: stats.completedGoals },
    { name: '진행중 목표', value: stats.totalGoals - stats.completedGoals },
  ];

  // Get the goal data for individual users
  const userSpecificData = () => {
    if (selectedUser === 'all') {
      return overallGoalData;
    }

    const userStat = userGoalStats.find(s => s.userId === selectedUser);
    if (!userStat) return [];
    
    return [
      { name: '달성한 목표', value: userStat.completedGoals },
      { name: '진행중 목표', value: userStat.ongoingGoals },
    ];
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">목표 달성 현황</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">목표 달성 현황</h3>
      
      <Tabs defaultValue="all" onValueChange={setSelectedUser}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          {userSummaries.map(user => (
            <TabsTrigger key={user.id} value={user.id}>
              {user.nickname || user.username}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={selectedUser} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={userSpecificData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userSpecificData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default GoalCompletionChart;
