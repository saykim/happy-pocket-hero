
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: string;
  description: string | null;
  date: string;
};

const TrendAnalytics = () => {
  const { currentUser } = useUser();
  const [selectedView, setSelectedView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return data as Transaction[];
    },
    enabled: !!currentUser?.id,
  });

  // Prepare trend data based on selected view
  const trendData = useMemo(() => {
    const groupedData: Record<string, { income: number; expense: number; net: number }> = {};
    
    transactions.forEach(transaction => {
      let dateKey = '';
      const date = new Date(transaction.date);
      
      switch (selectedView) {
        case 'monthly':
          dateKey = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          dateKey = weekStart.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
          break;
        case 'daily':
          dateKey = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
          break;
      }
      
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { income: 0, expense: 0, net: 0 };
      }
      
      if (transaction.type === 'income') {
        groupedData[dateKey].income += transaction.amount;
      } else {
        groupedData[dateKey].expense += transaction.amount;
      }
      
      groupedData[dateKey].net = groupedData[dateKey].income - groupedData[dateKey].expense;
    });
    
    return Object.entries(groupedData)
      .map(([date, data]) => ({ date, ...data }))
      .slice(-12); // Show last 12 periods
  }, [transactions, selectedView]);

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (trendData.length < 2) {
      return { incomeGrowth: 0, expenseGrowth: 0, netGrowth: 0, avgNet: 0 };
    }
    
    const latest = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    
    const incomeGrowth = previous.income === 0 ? 0 : ((latest.income - previous.income) / previous.income) * 100;
    const expenseGrowth = previous.expense === 0 ? 0 : ((latest.expense - previous.expense) / previous.expense) * 100;
    const netGrowth = previous.net === 0 ? 0 : ((latest.net - previous.net) / Math.abs(previous.net)) * 100;
    const avgNet = trendData.reduce((sum, item) => sum + item.net, 0) / trendData.length;
    
    return { incomeGrowth, expenseGrowth, netGrowth, avgNet };
  }, [trendData]);

  // Balance trend data (cumulative)
  const balanceTrendData = useMemo(() => {
    let cumulativeBalance = 0;
    return trendData.map(item => {
      cumulativeBalance += item.net;
      return {
        ...item,
        balance: cumulativeBalance
      };
    });
  }, [trendData]);

  // Net income data with colors
  const netIncomeData = useMemo(() => {
    return trendData.map(item => ({
      ...item,
      fill: item.net >= 0 ? '#10B981' : '#EF4444'
    }));
  }, [trendData]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">트렌드 분석</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-300">
            시간에 따른 수입과 지출의 변화를 확인하세요
          </p>
        </div>
        
        {/* View selector */}
        <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'monthly' | 'weekly' | 'daily')}>
          <TabsList>
            <TabsTrigger value="daily">일별</TabsTrigger>
            <TabsTrigger value="weekly">주별</TabsTrigger>
            <TabsTrigger value="monthly">월별</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Trend Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className={`h-5 w-5 ${trendStats.incomeGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">수입 증감률</p>
              <p className={`text-lg font-semibold ${trendStats.incomeGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trendStats.incomeGrowth > 0 ? '+' : ''}{trendStats.incomeGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingDown className={`h-5 w-5 ${trendStats.expenseGrowth <= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">지출 증감률</p>
              <p className={`text-lg font-semibold ${trendStats.expenseGrowth <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trendStats.expenseGrowth > 0 ? '+' : ''}{trendStats.expenseGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className={`h-5 w-5 ${trendStats.netGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">순수익 증감률</p>
              <p className={`text-lg font-semibold ${trendStats.netGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trendStats.netGrowth > 0 ? '+' : ''}{trendStats.netGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">평균 순수익</p>
              <p className={`text-lg font-semibold ${trendStats.avgNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trendStats.avgNet.toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Income vs Expense Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">수입 vs 지출 추이</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value.toLocaleString()}원`,
                    name === 'income' ? '수입' : name === 'expense' ? '지출' : '순수익'
                  ]}
                />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="income" />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="expense" />
                <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={2} name="net" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Balance Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">누적 잔액 추이</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Net Income Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">순수익 변화</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netIncomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                <Bar 
                  dataKey="net" 
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Data unavailable message */}
      {trendData.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>트렌드 분석을 위한 데이터가 부족합니다.</p>
            <p className="text-sm mt-2">더 많은 거래 내역을 추가해주세요.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrendAnalytics;
