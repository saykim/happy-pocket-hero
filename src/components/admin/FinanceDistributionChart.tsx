
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatSummary, UserSummary, COLORS } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

type FinanceDistributionChartProps = {
  stats: StatSummary;
  userSummaries: UserSummary[];
};

const FinanceDistributionChart = ({ stats, userSummaries }: FinanceDistributionChartProps) => {
  const [selectedUser, setSelectedUser] = useState<string>('all');

  // Overall finance distribution data
  const overallFinanceData = [
    { name: '총 수입', value: stats.totalSavings },
    { name: '총 지출', value: stats.totalSpending },
  ];

  // Get the finance data for individual users
  const userSpecificData = () => {
    if (selectedUser === 'all') {
      return overallFinanceData;
    }

    const user = userSummaries.find(u => u.id === selectedUser);
    if (!user) return [];
    
    // For the selected user, the balance represents income minus expenses
    // Since we don't have direct income/expense values for users in the summary, we'll calculate:
    const userIncome = user.balance > 0 ? user.balance : 0;
    const userExpense = user.balance < 0 ? Math.abs(user.balance) : 0;
    
    return [
      { name: '수입', value: userIncome },
      { name: '지출', value: userExpense },
    ];
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">자금 분배</h3>
      
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
              <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default FinanceDistributionChart;
