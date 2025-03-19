
import { useState } from 'react';
import { Target, CheckCircle2, ChevronRight, PiggyBank } from 'lucide-react';
import AnimatedNumber from './ui/AnimatedNumber';
import { cn } from '@/lib/utils';

// Initial goals data
const initialGoals = [
  {
    id: '1',
    title: '자전거 사기',
    targetAmount: 120000,
    currentAmount: 45000,
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
    completed: false,
  },
  {
    id: '2',
    title: '닌텐도 게임',
    targetAmount: 65000,
    currentAmount: 10000,
    deadline: new Date(Date.now() + 45 * 86400000).toISOString(), // 45 days from now
    completed: false,
  },
];

const GoalTracker = () => {
  const [goals, setGoals] = useState(initialGoals);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
  });

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.title || !newGoal.targetAmount) return;
    
    const goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: parseInt(newGoal.targetAmount),
      currentAmount: parseInt(newGoal.currentAmount || '0'),
      deadline: newGoal.deadline ? new Date(newGoal.deadline).toISOString() : '',
      completed: false,
    };
    
    setGoals([...goals, goal]);
    setNewGoal({ title: '', targetAmount: '', currentAmount: '0', deadline: '' });
    setShowAddForm(false);
  };

  const handleAddToGoal = (goalId: string, amount: number) => {
    setGoals(
      goals.map((goal) => {
        if (goal.id === goalId) {
          const newAmount = goal.currentAmount + amount;
          return {
            ...goal,
            currentAmount: newAmount,
            completed: newAmount >= goal.targetAmount,
          };
        }
        return goal;
      })
    );
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
      {goals.length === 0 ? (
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
                <button 
                  className="candy-button px-3 py-1 bg-candy-yellow text-amber-700"
                  onClick={() => handleAddToGoal(goal.id, 1000)}
                >
                  <span className="flex items-center">
                    <PiggyBank size={16} className="mr-1" /> 저금하기
                  </span>
                </button>
              </div>

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
