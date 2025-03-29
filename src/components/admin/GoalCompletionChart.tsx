
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatSummary, COLORS } from './types';

type GoalCompletionChartProps = {
  stats: StatSummary;
};

const GoalCompletionChart = ({ stats }: GoalCompletionChartProps) => {
  const goalCompletionData = [
    { name: '달성한 목표', value: stats.completedGoals },
    { name: '진행중 목표', value: stats.totalGoals - stats.completedGoals },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">목표 달성 현황</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={goalCompletionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {goalCompletionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default GoalCompletionChart;
