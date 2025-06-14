
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { CalendarIcon, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import CategoryIcon, { CategoryType } from '../CategoryIcon';

type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: string;
  description: string | null;
  date: string;
};

const COLORS = ['#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#84CC16', '#F97316'];

const IncomeAnalytics = () => {
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

  // Prepare income category analysis data
  const incomeCategoryData = useMemo(() => {
    const incomeByCategory = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(incomeByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  // Prepare monthly income trend data
  const monthlyIncomeData = useMemo(() => {
    const monthlyIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, transaction) => {
        const date = new Date(transaction.date).toLocaleDateString('ko-KR', { 
          year: 'numeric',
          month: 'short' 
        });
        acc[date] = (acc[date] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(monthlyIncome)
      .map(([date, amount]) => ({ date, amount }))
      .slice(-6); // Show last 6 months
  }, [filteredTransactions]);

  // Calculate income summary stats
  const incomeSummaryStats = useMemo(() => {
    const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgIncome = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
    const highestIncome = incomeTransactions.length > 0 ? Math.max(...incomeTransactions.map(t => t.amount)) : 0;
    
    return {
      totalIncome,
      avgIncome,
      highestIncome,
      incomeCount: incomeTransactions.length
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-gray-100">수입 분석</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-300">
            나의 수입 패턴을 분석해보세요
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
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 수입</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {incomeSummaryStats.totalIncome.toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">평균 수입</p>
              <p className="text-lg font-semibold dark:text-white">
                {Math.round(incomeSummaryStats.avgIncome).toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">최고 수입</p>
              <p className="text-lg font-semibold dark:text-white">
                {incomeSummaryStats.highestIncome.toLocaleString()}원
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">수입 건수</p>
              <p className="text-lg font-semibold dark:text-white">
                {incomeSummaryStats.incomeCount}건
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Category Pie Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">카테고리별 수입</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#10B981"
                  dataKey="amount"
                >
                  {incomeCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Income Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">월별 수입 추이</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyIncomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
                <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Income Category Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">카테고리별 수입 상세</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeCategoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()}원`} />
              <Bar dataKey="amount" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Income Details List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">카테고리별 수입 내역</h3>
        <div className="space-y-3">
          {incomeCategoryData.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <CategoryIcon category={item.category as CategoryType} />
                <span className="font-medium dark:text-white">{item.category}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {item.amount.toLocaleString()}원
                </span>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {((item.amount / incomeSummaryStats.totalIncome) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
          {incomeCategoryData.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              선택한 기간에 수입 내역이 없습니다.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default IncomeAnalytics;
