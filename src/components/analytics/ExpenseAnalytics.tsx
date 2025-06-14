
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { CalendarIcon, TrendingDown, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import CategoryIcon, { CategoryType } from '../CategoryIcon';

type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: string;
  description: string | null;
  date: string;
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042'];

const ExpenseAnalytics = () => {
  const { currentUser } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return data as Transaction[];
    },
    enabled: !!currentUser?.id,
  });

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return transactions.filter(t => new Date(t.date) >= cutoffDate);
  }, [transactions, selectedPeriod]);

  // Prepare category analysis data
  const categoryData = useMemo(() => {
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Prepare daily spending data
  const dailySpendingData = useMemo(() => {
    const dailySpending = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const date = new Date(transaction.date).toLocaleDateString('ko-KR', { 
          month: 'short', 
          day: 'numeric' 
        });
        acc[date] = (acc[date] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-10); // Show last 10 days
  }, [filteredTransactions]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const income = filteredTransactions.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyExpense = expenses.length > 0 ? totalExpense / Math.max(1, selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365) : 0;
    
    return {
      totalExpense,
      totalIncome,
      netAmount: totalIncome - totalExpense,
      avgDailyExpense,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, selectedPeriod]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">가계부 통계</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-300">
            나의 소비 패턴을 분석해보세요
          </p>
        </div>
        
        {/* Period selector */}
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'week' | 'month' | 'year')}>
          <TabsList>
            <TabsTrigger value="week">1주일</TabsTrigger>
            <TabsTrigger value="month">1개월</TabsTrigger>
            <TabsTrigger value="year">1년</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 지출</p>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {summaryStats.totalExpense.toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 수입</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {summaryStats.totalIncome.toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">일평균 지출</p>
              <p className="text-lg font-semibold dark:text-white">
                {Math.round(summaryStats.avgDailyExpense).toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">거래 건수</p>
              <p className="text-lg font-semibold dark:text-white">
                {summaryStats.transactionCount}건
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">카테고리별 지출</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Daily Spending Line Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">일별 지출 추이</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySpendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">카테고리별 상세 분석</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Details List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">카테고리별 지출 내역</h3>
        <div className="space-y-3">
          {categoryData.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <CategoryIcon category={item.category as CategoryType} />
                <span className="font-medium dark:text-white">{item.category}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {item.amount.toLocaleString()}원
                </span>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {((item.amount / summaryStats.totalExpense) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
          {categoryData.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              선택한 기간에 지출 내역이 없습니다.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ExpenseAnalytics;
