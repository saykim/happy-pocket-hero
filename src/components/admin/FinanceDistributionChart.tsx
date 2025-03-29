
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatSummary, COLORS } from './types';

type FinanceDistributionChartProps = {
  stats: StatSummary;
};

const FinanceDistributionChart = ({ stats }: FinanceDistributionChartProps) => {
  const financeDistributionData = [
    { name: '총 수입', value: stats.totalSavings },
    { name: '총 지출', value: stats.totalSpending },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">자금 분배</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={financeDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {financeDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default FinanceDistributionChart;
