
import { useState } from 'react';
import { Target, CheckCircle2, ChevronRight, PiggyBank, Plus, Minus } from 'lucide-react';
import AnimatedNumber from './ui/AnimatedNumber';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from './ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Define the Goal type
type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  completed: boolean;
};

const GoalTracker = () => {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
  });
  const [showSavingsForm, setShowSavingsForm] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState(1000);

  // Define saving amount options
  const savingAmountOptions = [500, 1000, 5000, 10000, 50000];

  // Fetch goals from Supabase
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error fetching goals:', error);
        return [];
      }
      
      return data.map(goal => ({
        id: goal.id,
        title: goal.title,
        targetAmount: goal.target_amount,
        currentAmount: goal.current_amount,
        deadline: goal.deadline,
        completed: goal.current_amount >= goal.target_amount
      }));
    },
    enabled: !!currentUser
  });

  // Add a new goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const { data, error } = await supabase
        .from('goals')
        .insert([{
          user_id: currentUser!.id,
          title: goalData.title,
          target_amount: parseInt(goalData.targetAmount),
          current_amount: parseInt(goalData.currentAmount || '0'),
          deadline: goalData.deadline || null,
        }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] });
      toast.success('목표가 추가되었습니다!');
      setNewGoal({ title: '', targetAmount: '', currentAmount: '0', deadline: '' });
      setShowAddForm(false);
    },
    onError: (error) => {
      console.error('Error adding goal:', error);
      toast.error('목표 추가 중 오류가 발생했습니다');
    }
  });

  // Update goal (add to savings) mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string, amount: number }) => {
      // First get current goal data
      const { data: goalData, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount')
        .eq('id', goalId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the goal with the new amount
      const newAmount = goalData.current_amount + amount;
      const { data, error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount, status: newAmount >= goals.find(g => g.id === goalId)?.targetAmount ? 'completed' : 'ongoing' })
        .eq('id', goalId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] });
      toast.success('저금이 완료되었습니다!');
      setShowSavingsForm(null);
      setSavingAmount(1000);
    },
    onError: (error) => {
      console.error('Error updating goal:', error);
      toast.error('저금 중 오류가 발생했습니다');
    }
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.title || !newGoal.targetAmount) return;
    
    addGoalMutation.mutate(newGoal);
  };

  const handleAddToGoal = (goalId: string) => {
    updateGoalMutation.mutate({ goalId, amount: savingAmount });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <Target className="mr-2 text-pink-500" />
          나의 목표
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="candy-button bg-gradient-to-r from-pink-500 to-purple-500 text-white"
        >
          새 목표 추가
        </button>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="candy-card animate-scale-up">
          <h3 className="text-lg font-semibold mb-4">새로운 목표 설정하기</h3>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label htmlFor="goalTitle" className="block mb-1 text-sm font-medium text-gray-700">
                목표 이름
              </label>
              <input
                id="goalTitle"
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="무엇을 위해 모을건가요?"
                className="candy-input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="targetAmount" className="block mb-1 text-sm font-medium text-gray-700">
                목표 금액
              </label>
              <div className="relative">
                <input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="0"
                  className="candy-input w-full pl-7"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
              </div>
            </div>

            <div>
              <label htmlFor="currentAmount" className="block mb-1 text-sm font-medium text-gray-700">
                현재 모은 금액 (선택)
              </label>
              <div className="relative">
                <input
                  id="currentAmount"
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  placeholder="0"
                  className="candy-input w-full pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
              </div>
            </div>

            <div>
              <label htmlFor="deadline" className="block mb-1 text-sm font-medium text-gray-700">
                목표일 (선택)
              </label>
              <input
                id="deadline"
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="candy-input w-full"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="candy-button flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                취소
              </button>
              <button type="submit" className="candy-button flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                목표 설정하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">목표를 불러오는 중...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Target size={48} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">아직 설정한, 어떠한 목표도 없어요.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-blue-500 hover:underline"
          >
            첫 번째 목표를 설정해 보세요!
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div 
              key={goal.id} 
              className={cn(
                "candy-card border-l-4 transition-all",
                goal.completed 
                  ? "border-l-green-500" 
                  : "border-l-blue-500"
              )}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg flex items-center">
                  {goal.completed && <CheckCircle2 size={18} className="mr-1 text-green-500" />}
                  {goal.title}
                </h3>
                {showSavingsForm === goal.id ? (
                  <button 
                    className="candy-button px-3 py-1 bg-red-100 text-red-600"
                    onClick={() => setShowSavingsForm(null)}
                  >
                    취소
                  </button>
                ) : (
                  <button 
                    className="candy-button px-3 py-1 bg-candy-yellow text-amber-700"
                    onClick={() => setShowSavingsForm(goal.id)}
                  >
                    <span className="flex items-center">
                      <PiggyBank size={16} className="mr-1" /> 저금하기
                    </span>
                  </button>
                )}
              </div>

              {/* Savings amount form */}
              {showSavingsForm === goal.id && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg animate-scale-up">
                  <h4 className="font-medium text-amber-800 mb-2">저금할 금액을 선택하세요</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {savingAmountOptions.map(amount => (
                      <button
                        key={amount}
                        className={cn(
                          "py-1 px-3 rounded-full text-sm font-medium transition-all",
                          savingAmount === amount
                            ? "bg-amber-500 text-white"
                            : "bg-amber-200 text-amber-800 hover:bg-amber-300"
                        )}
                        onClick={() => setSavingAmount(amount)}
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center mb-2">
                    <button 
                      className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded-full text-amber-800"
                      onClick={() => setSavingAmount(Math.max(100, savingAmount - 500))}
                    >
                      <Minus size={16} />
                    </button>
                    <div className="flex-1 px-3">
                      <input
                        type="number"
                        value={savingAmount}
                        onChange={(e) => setSavingAmount(Math.max(100, parseInt(e.target.value) || 0))}
                        className="w-full border border-amber-300 rounded-md p-1 text-center text-amber-800 bg-white"
                      />
                    </div>
                    <button 
                      className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded-full text-amber-800"
                      onClick={() => setSavingAmount(savingAmount + 500)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    onClick={() => handleAddToGoal(goal.id)}
                    className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-md font-medium transition-all hover:from-amber-500 hover:to-yellow-600"
                  >
                    {savingAmount.toLocaleString()}원 저금하기
                  </button>
                </div>
              )}

              {/* Progress bar */}
              <div className="mt-3 mb-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    <AnimatedNumber
                      value={goal.currentAmount}
                      suffix="원"
                      formatOptions={{ maximumFractionDigits: 0 }}
                      className="text-blue-600 font-semibold"
                    />
                  </span>
                  <span className="text-gray-500">{goal.targetAmount.toLocaleString()}원</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      goal.completed 
                        ? "bg-gradient-to-r from-green-400 to-green-500 animate-pulse-soft" 
                        : "bg-gradient-to-r from-blue-400 to-purple-500"
                    )}
                    style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Deadline or completion status */}
              <div className="mt-4 text-sm">
                {goal.completed ? (
                  <span className="text-green-600 font-medium flex items-center">
                    <CheckCircle2 size={14} className="mr-1" /> 목표 달성 완료!
                  </span>
                ) : goal.deadline ? (
                  <span className="text-gray-500">
                    목표일: {new Date(goal.deadline).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                ) : (
                  <span className="text-gray-500">기한 없는 목표</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
