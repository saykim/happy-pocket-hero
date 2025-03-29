
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { UserSummary } from './types';

type UserActivityChartProps = {
  userSummaries: UserSummary[];
};

const UserActivityChart = ({ userSummaries }: UserActivityChartProps) => {
  const userActivityData = userSummaries.map(user => ({
    name: user.nickname || user.username,
    거래: user.transactions,
    목표: user.goals,
    할일: user.tasks,
  }));

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">사용자별 활동</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={userActivityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="거래" fill="#8884d8" />
            <Bar dataKey="목표" fill="#82ca9d" />
            <Bar dataKey="할일" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default UserActivityChart;
