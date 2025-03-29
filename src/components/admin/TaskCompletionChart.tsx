
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatSummary, COLORS } from './types';

type TaskCompletionChartProps = {
  stats: StatSummary;
};

const TaskCompletionChart = ({ stats }: TaskCompletionChartProps) => {
  const taskCompletionData = [
    { name: '완료된 할일', value: stats.completedTasks },
    { name: '미완료 할일', value: stats.totalTasks - stats.completedTasks },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">할일 완료 현황</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={taskCompletionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {taskCompletionData.map((entry, index) => (
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

export default TaskCompletionChart;
