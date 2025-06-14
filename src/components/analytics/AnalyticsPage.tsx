
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExpenseAnalytics from './ExpenseAnalytics';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold dark:text-gray-100">통계 분석</h1>
      </div>

      <Tabs defaultValue="expense" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expense" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>지출 분석</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>수입 분석</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>트렌드</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          <ExpenseAnalytics />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>수입 분석 기능은 곧 추가될 예정입니다.</p>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>트렌드 분석 기능은 곧 추가될 예정입니다.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
