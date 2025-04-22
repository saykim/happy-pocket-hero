import { useState } from 'react';
import { Target, CheckCircle2, PiggyBank, Plus, Minus, Pencil, Trash2 } from 'lucide-react';
import AnimatedNumber from './ui/AnimatedNumber';
import { cn, updateUserBadgeProgress } from '@/lib/utils';
import { Button } from './ui/button';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from './ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

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
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showSavingsForm, setShowSavingsForm] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState(1000);
  const [lastSelectedAmount, setLastSelectedAmount] = useState(100);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
  });
  
  const [editGoal, setEditGoal] = useState({
    id: '',
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
  });

  // Define saving amount options
  const savingAmountOptions = [100, 500, 1000, 5000, 10000, 50000];

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

  // Edit a goal mutation
  const editGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      const { data, error } = await supabase
        .from('goals')
        .update({
          title: goalData.title,
          target_amount: parseInt(goalData.targetAmount),
          current_amount: parseInt(goalData.currentAmount),
          deadline: goalData.deadline || null,
        })
        .eq('id', goalData.id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] });
      toast.success('목표가 수정되었습니다!');
      setEditGoal({ id: '', title: '', targetAmount: '', currentAmount: '', deadline: '' });
      setShowEditForm(null);
    },
    onError: (error) => {
      console.error('Error editing goal:', error);
      toast.error('목표 수정 중 오류가 발생했습니다');
    }
  });

  // Delete a goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      
      if (error) throw error;
      return { goalId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] });
      toast.success('목표가 삭제되었습니다!');
      setShowDeleteConfirm(null);
    },
    onError: (error) => {
      console.error('Error deleting goal:', error);
      toast.error('목표 삭제 중 오류가 발생했습니다');
    }
  });

  // Update goal (add to savings) mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string, amount: number }) => {
      // First get current goal data
      const { data: goalData, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount, target_amount')
        .eq('id', goalId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the goal with the new amount
      const newAmount = goalData.current_amount + amount;
      const wasCompleted = goalData.current_amount >= goalData.target_amount;
      const isNowCompleted = newAmount >= goalData.target_amount;
      const becameCompleted = !wasCompleted && isNowCompleted;
      
      const { data, error } = await supabase
        .from('goals')
        .update({ 
          current_amount: newAmount, 
          status: isNowCompleted ? 'completed' : 'ongoing' 
        })
        .eq('id', goalId)
        .select();
      
      if (error) throw error;
      
      return { data, becameCompleted, isNowCompleted, amount };
    },
    onSuccess: async (result, variables) => {
      // 즉시 로컬 쿼리 데이터 업데이트
      queryClient.invalidateQueries({ queryKey: ['goals', currentUser?.id] });
      
      if (!currentUser) {
        console.error("배지 업데이트 실패: 현재 사용자가 없습니다.");
        return;
      }
      
      try {
        console.log(`저금 수행: ${variables.amount}원 추가됨`);
        
        // 1. 저금 액션에 대한 배지 업데이트 (저금할 때마다)
        const savingsResult = await updateUserBadgeProgress(currentUser.id, 'savings');
        console.log("저축 배지 업데이트 결과:", savingsResult);
        
        // 2. 목표가 완료된 경우 추가 배지 업데이트
        if (result.becameCompleted) {
          console.log("🎯 목표 달성 감지됨! 목표 배지 업데이트 중...");
          const goalsResult = await updateUserBadgeProgress(currentUser.id, 'goals');
          console.log("목표 배지 업데이트 결과:", goalsResult);
          
          toast.success('🎉 목표를 달성했습니다! 새로운 배지를 확인해보세요!', {
            duration: 5000,
            action: {
              label: "배지 확인",
              onClick: () => window.location.href = "/badges"
            }
          });
        } else {
          toast.success('저금이 완료되었습니다!');
        }
        
        // 배지 데이터 갱신
        await queryClient.invalidateQueries({ queryKey: ['badges', currentUser.id] });
        console.log("배지 데이터 새로고침 완료");
        
      } catch (error) {
        console.error("배지 업데이트 중 오류 발생:", error);
        toast.error('배지 업데이트 중 오류가 발생했습니다');
      } finally {
        // 폼 상태 초기화
        setShowSavingsForm(null);
        setSavingAmount(1000);
        setLastSelectedAmount(100);
      }
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

  const handleEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editGoal.title || !editGoal.targetAmount) return;
    
    editGoalMutation.mutate(editGoal);
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoalMutation.mutate(goalId);
  };

  const handleAddToGoal = (goalId: string) => {
    updateGoalMutation.mutate({ goalId, amount: savingAmount });
  };

  const startEditing = (goal: Goal) => {
    setEditGoal({
      id: goal.id,
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline || '',
    });
    setShowEditForm(goal.id);
  };

  // Helper function to safely format numbers
  const safeFormat = (value: number | undefined | null) => {
    if (value === undefined || value === null) {
      return '0';
    }
    return value.toLocaleString();
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

      {/* Filter section */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50">
        <div className="flex items-center">
          <button
            onClick={() => setShowCompletedGoals(!showCompletedGoals)}
            className={cn(
              "flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              showCompletedGoals 
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
          >
            {showCompletedGoals ? (
              <>
                <CheckCircle2 size={16} className="mr-1.5" />
                진행 중인 목표만 보기
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-1.5" />
                달성한 목표 보기 {goals.filter(g => g.completed).length > 0 && `(${goals.filter(g => g.completed).length})`}
              </>
            )}
          </button>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          총 {goals.length}개 중 {goals.filter(g => g.completed).length}개 달성
        </div>
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

      {/* Edit Goal Form */}
      {showEditForm && (
        <div className="candy-card animate-scale-up">
          <h3 className="text-lg font-semibold mb-4">목표 수정하기</h3>
          <form onSubmit={handleEditGoal} className="space-y-4">
            <div>
              <label htmlFor="editGoalTitle" className="block mb-1 text-sm font-medium text-gray-700">
                목표 이름
              </label>
              <input
                id="editGoalTitle"
                type="text"
                value={editGoal.title}
                onChange={(e) => setEditGoal({ ...editGoal, title: e.target.value })}
                placeholder="무엇을 위해 모을건가요?"
                className="candy-input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="editTargetAmount" className="block mb-1 text-sm font-medium text-gray-700">
                목표 금액
              </label>
              <div className="relative">
                <input
                  id="editTargetAmount"
                  type="number"
                  value={editGoal.targetAmount}
                  onChange={(e) => setEditGoal({ ...editGoal, targetAmount: e.target.value })}
                  placeholder="0"
                  className="candy-input w-full pl-7"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
              </div>
            </div>

            <div>
              <label htmlFor="editCurrentAmount" className="block mb-1 text-sm font-medium text-gray-700">
                현재 모은 금액
              </label>
              <div className="relative">
                <input
                  id="editCurrentAmount"
                  type="number"
                  value={editGoal.currentAmount}
                  onChange={(e) => setEditGoal({ ...editGoal, currentAmount: e.target.value })}
                  placeholder="0"
                  className="candy-input w-full pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
              </div>
            </div>

            <div>
              <label htmlFor="editDeadline" className="block mb-1 text-sm font-medium text-gray-700">
                목표일 (선택)
              </label>
              <input
                id="editDeadline"
                type="date"
                value={editGoal.deadline}
                onChange={(e) => setEditGoal({ ...editGoal, deadline: e.target.value })}
                className="candy-input w-full"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowEditForm(null)}
                className="candy-button flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                취소
              </button>
              <button type="submit" className="candy-button flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                목표 수정하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 이 목표를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 목표와 관련된 모든 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteConfirm && handleDeleteGoal(showDeleteConfirm)}
              className="bg-red-500 hover:bg-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {/* 진행 중인 목표 */}
          {goals.filter(goal => !goal.completed).length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 dark:bg-gray-800/30 dark:border-gray-700">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-green-500" />
              <p className="text-gray-500 dark:text-gray-400">모든 목표를 달성했어요!</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-blue-500 hover:underline dark:text-blue-400"
              >
                새로운 목표를 추가해 보세요
              </button>
            </div>
          )}
          
          {/* 목표 목록 */}
          {goals
            .filter(goal => !goal.completed)
            .map((goal) => (
              <div 
                key={goal.id} 
                className="candy-card border-l-4 border-l-blue-500 transition-all animate-fade-in"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg flex items-center">
                    {goal.title}
                  </h3>
                  <div className="flex space-x-2">
                    {showSavingsForm === goal.id ? (
                      <button 
                        className="candy-button px-3 py-1 bg-red-100 text-red-600"
                        onClick={() => setShowSavingsForm(null)}
                      >
                        취소
                      </button>
                    ) : (
                      <>
                        <button 
                          className="candy-button px-3 py-1 bg-candy-yellow text-amber-700"
                          onClick={() => setShowSavingsForm(goal.id)}
                        >
                          <span className="flex items-center">
                            <PiggyBank size={16} className="mr-1" /> 저금
                          </span>
                        </button>
                        <button 
                          className="candy-button px-3 py-1 bg-blue-100 text-blue-600"
                          onClick={() => startEditing(goal)}
                        >
                          <span className="flex items-center">
                            <Pencil size={16} className="mr-1" /> 수정
                          </span>
                        </button>
                        <button 
                          className="candy-button px-3 py-1 bg-red-100 text-red-600"
                          onClick={() => setShowDeleteConfirm(goal.id)}
                        >
                          <span className="flex items-center">
                            <Trash2 size={16} className="mr-1" /> 삭제
                          </span>
                        </button>
                      </>
                    )}
                  </div>
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
                            lastSelectedAmount === amount 
                              ? "bg-amber-500 text-white" 
                              : "bg-amber-200 text-amber-800 hover:bg-amber-300"
                          )}
                          onClick={() => {
                            setSavingAmount(savingAmount + amount);
                            setLastSelectedAmount(amount);
                          }}
                        >
                          {amount.toLocaleString()}원
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center mb-2">
                      <button 
                        className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded-full text-amber-800"
                        onClick={() => setSavingAmount(Math.max(0, savingAmount - lastSelectedAmount))}
                      >
                        <Minus size={16} />
                      </button>
                      <div className="flex-1 px-3">
                        <input
                          type="number"
                          value={savingAmount}
                          onChange={(e) => setSavingAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full border border-amber-300 rounded-md p-1 text-center text-amber-800 bg-white"
                        />
                      </div>
                      <button 
                        className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded-full text-amber-800"
                        onClick={() => setSavingAmount(savingAmount + lastSelectedAmount)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <button 
                        className="flex-1 py-1 bg-gray-200 text-gray-600 rounded-md font-medium transition-all hover:bg-gray-300"
                        onClick={() => {
                          setSavingAmount(0);
                        }}
                      >
                        취소
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
                    <span className="text-gray-500">{safeFormat(goal.targetAmount)}원</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-400 to-purple-500"
                      style={{ width: `${Math.min(100, ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Deadline or completion status */}
                <div className="mt-4 text-sm">
                  {goal.deadline ? (
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

          {/* 완료된 목표 섹션 */}
          {showCompletedGoals && goals.filter(goal => goal.completed).length > 0 && (
            <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-green-700 dark:text-green-500">
                <CheckCircle2 size={20} className="mr-2" /> 
                달성한 목표 ({goals.filter(goal => goal.completed).length}개)
              </h3>
              
              <div className="space-y-4">
                {goals
                  .filter(goal => goal.completed)
                  .map((goal) => (
                    <div 
                      key={goal.id} 
                      className="candy-card border-l-4 border-l-green-500 transition-all animate-fade-in bg-gray-50 dark:bg-gray-800/30"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg flex items-center">
                          <CheckCircle2 size={18} className="mr-1 text-green-500" />
                          {goal.title}
                        </h3>
                        <div className="flex space-x-2">
                          <button 
                            className="candy-button px-3 py-1 bg-red-100 text-red-600"
                            onClick={() => setShowDeleteConfirm(goal.id)}
                          >
                            <span className="flex items-center">
                              <Trash2 size={16} className="mr-1" /> 삭제
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar - 완료된 목표는 항상 100% */}
                      <div className="mt-3 mb-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">
                            <AnimatedNumber
                              value={goal.currentAmount}
                              suffix="원"
                              formatOptions={{ maximumFractionDigits: 0 }}
                              className="text-green-600 font-semibold"
                            />
                          </span>
                          <span className="text-gray-500">{safeFormat(goal.targetAmount)}원</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-green-400 to-green-500 animate-pulse-soft"
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                      </div>

                      {/* Completion status */}
                      <div className="mt-4 text-sm">
                        <span className="text-green-600 font-medium flex items-center">
                          <CheckCircle2 size={14} className="mr-1" /> 목표 달성 완료!
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
