
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatSummary, UserSummary, COLORS } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type TaskCompletionChartProps = {
  stats: StatSummary;
  userSummaries: UserSummary[];
};

type UserTaskStats = {
  userId: string;
  completedTasks: number;
  pendingTasks: number;
};

const TaskCompletionChart = ({ stats, userSummaries }: TaskCompletionChartProps) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [userTaskStats, setUserTaskStats] = useState<UserTaskStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTasks = async () => {
      setIsLoading(true);
      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*');
        
        if (error) throw error;
        
        // Calculate task stats for each user
        const userStats: UserTaskStats[] = userSummaries.map(user => {
          const userTasks = tasks.filter(t => t.user_id === user.id);
          const completed = userTasks.filter(t => t.status === 'done').length;
          
          return {
            userId: user.id,
            completedTasks: completed,
            pendingTasks: userTasks.length - completed
          };
        });
        
        setUserTaskStats(userStats);
      } catch (error) {
        console.error('Error fetching user tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserTasks();
  }, [userSummaries]);

  // Overall task completion data
  const overallTaskData = [
    { name: '완료된 할일', value: stats.completedTasks },
    { name: '미완료 할일', value: stats.totalTasks - stats.completedTasks },
  ];

  // Get the task data for individual users
  const userSpecificData = () => {
    if (selectedUser === 'all') {
      return overallTaskData;
    }

    const userStat = userTaskStats.find(s => s.userId === selectedUser);
    if (!userStat) return [];
    
    return [
      { name: '완료된 할일', value: userStat.completedTasks },
      { name: '미완료 할일', value: userStat.pendingTasks },
    ];
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">할일 완료 현황</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">할일 완료 현황</h3>
      
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

export default TaskCompletionChart;
