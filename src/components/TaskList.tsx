import { useState, useEffect } from 'react';
import { ListTodo, CheckCircle, Circle, Trash2, Plus, StarIcon, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { cn, updateUserBadgeProgress } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  points: number;
};

// 일별 점수 타입 정의
type DailyScore = {
  date: string;
  totalPoints: number;
  tasks: Task[];
};

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDailyScores, setShowDailyScores] = useState(false);
  const [dailyScores, setDailyScores] = useState<DailyScore[]>([]);
  const { currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 할일을 일별로 그룹화하는 함수
  const groupTasksByDate = (tasks: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      // 날짜만 추출 (YYYY-MM-DD 형식)
      const dateKey = task.createdAt.split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(task);
    });
    
    // DailyScore 배열로 변환
    return Object.entries(grouped).map(([date, tasks]) => {
      const completedTasks = tasks.filter(task => task.completed);
      const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
      
      return {
        date,
        totalPoints,
        tasks
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신 날짜순 정렬
  };

  // Fetch tasks when component mounts or when user changes
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching tasks:', error);
          toast({
            title: '오류',
            description: '할 일 목록을 불러오는 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
          return;
        }
        
        // Transform data to match Task type
        const formattedTasks = data.map(task => ({
          id: task.id,
          title: task.title,
          completed: task.status === 'completed',
          createdAt: task.created_at,
          points: task.reward || Math.floor(Math.random() * 50) + 30, // Use reward or generate random
        }));
        
        setTasks(formattedTasks);
        
        // 일별 점수 계산
        setDailyScores(groupTasksByDate(formattedTasks));
        
        // Calculate total points from completed tasks
        const completedPoints = formattedTasks
          .filter(task => task.completed)
          .reduce((sum, task) => sum + task.points, 0);
          
        setTotalPoints(completedPoints);
      } catch (error) {
        console.error('Unexpected error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [currentUser, toast]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim() || !currentUser) return;
    
    const pointsValue = Math.floor(Math.random() * 50) + 30; // Random points between 30-80
    
    // Create task in the database
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTaskTitle,
            user_id: currentUser.id,
            reward: pointsValue,
            status: 'todo'
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding task:', error);
        toast({
          title: '오류',
          description: '할 일을 추가하는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        return;
      }
      
      // Add the new task to the local state
      const newTask = {
        id: data.id,
        title: data.title,
        completed: false,
        createdAt: data.created_at,
        points: data.reward,
      };
      
      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      setDailyScores(groupTasksByDate(updatedTasks));
      setNewTaskTitle('');
      setShowInput(false);
      
      toast({
        title: '성공',
        description: '새로운 할 일이 추가되었습니다.',
      });
    } catch (error) {
      console.error('Unexpected error adding task:', error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate || !currentUser) return;
    
    const newStatus = taskToUpdate.completed ? 'todo' : 'completed';
    const beingCompleted = !taskToUpdate.completed; // 미완료 -> 완료로 변경되는 경우
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error updating task:', error);
        toast({
          title: '오류',
          description: '할 일 상태를 변경하는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        return;
      }
      
      // Update local state
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          const newCompletedState = !task.completed;
          
          // Update total points
          if (newCompletedState) {
            setTotalPoints(prev => prev + task.points);
          } else {
            setTotalPoints(prev => prev - task.points);
          }
          
          return { ...task, completed: newCompletedState };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      setDailyScores(groupTasksByDate(updatedTasks));
      
      // 할일이 완료 상태로 변경된 경우에만 배지 업데이트
      if (beingCompleted) {
        try {
          console.log("🏆 할일 완료 감지! 배지 업데이트 중...");
          const tasksResult = await updateUserBadgeProgress(currentUser.id, 'tasks');
          console.log("할일 배지 업데이트 결과:", tasksResult);
          
          // 모든 태스크가 완료되었는지 확인
          const allTasksCompleted = updatedTasks.every(t => t.completed);
          
          if (allTasksCompleted) {
            console.log("🎯 모든 할일 완료! 추가 배지 업데이트 중...");
            // 추가 배지 부여 (모든 할일 완료)
            const activityResult = await updateUserBadgeProgress(currentUser.id, 'activity', 3);
            console.log("활동 배지 업데이트 결과:", activityResult);
            
            // 특별 토스트 메시지 표시
            toast({
              title: '축하합니다!',
              description: '모든 할일을 완료했습니다. 배지를 확인해보세요!',
              variant: 'default',
              action: (
                <div className="cursor-pointer" onClick={() => window.location.href = "/badges"}>
                  배지 확인
                </div>
              ),
            });
          }
          
          // 배지 데이터 새로고침
          await queryClient.invalidateQueries({ queryKey: ['badges', currentUser.id] });
          console.log("배지 데이터 새로고침 완료");
          
        } catch (badgeError) {
          console.error('배지 업데이트 중 오류:', badgeError);
        }
      }
      
      toast({
        title: '성공',
        description: `할 일이 ${newStatus === 'completed' ? '완료' : '미완료'}로 변경되었습니다.`,
      });
    } catch (error) {
      console.error('Unexpected error updating task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) return;
    
    const taskToDelete = tasks.find((task) => task.id === taskId);
    if (!taskToDelete) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error deleting task:', error);
        toast({
          title: '오류',
          description: '할 일을 삭제하는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
        return;
      }
      
      // If completed, subtract points
      if (taskToDelete.completed) {
        setTotalPoints(prev => prev - taskToDelete.points);
      }
      
      // Remove from local state
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);
      setDailyScores(groupTasksByDate(updatedTasks));
      
      toast({
        title: '성공',
        description: '할 일이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Unexpected error deleting task:', error);
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header with points */}
      <div className="candy-card bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-amber-800">내 포인트</h3>
          <div className="flex items-center text-amber-800">
            <StarIcon className="mr-1 text-yellow-500 animate-spin-slow" size={20} />
            <span className="text-2xl font-bold">{totalPoints}</span>
            <span className="ml-1 text-sm">점</span>
          </div>
        </div>
      </div>

      {/* 일별 달성 점수 토글 버튼 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <ListTodo className="mr-2 text-blue-500" />
          할 일
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDailyScores(!showDailyScores)}
            className={cn(
              "candy-button flex items-center",
              showDailyScores 
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Calendar size={16} className="mr-1" />
            {showDailyScores ? "일별 점수 숨기기" : "일별 점수 보기"}
            {showDailyScores ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
          <button
            onClick={() => setShowInput(true)}
            className="candy-button bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
          >
            할 일 추가
          </button>
        </div>
      </div>

      {/* 일별 달성 점수 표시 */}
      {showDailyScores && (
        <div className="candy-card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-purple-800 dark:text-purple-300">일별 달성 점수</h3>
          
          {dailyScores.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">데이터가 없습니다</p>
          ) : (
            <div className="space-y-4">
              {dailyScores.map(dailyScore => (
                <div 
                  key={dailyScore.date}
                  className="border border-purple-100 dark:border-purple-800 rounded-lg p-4 bg-white dark:bg-gray-800/30"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-purple-500" />
                      <h4 className="font-medium text-purple-800 dark:text-purple-300">
                        {formatDate(dailyScore.date)}
                      </h4>
                    </div>
                    <div className="flex items-center bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                      <StarIcon size={14} className="mr-1 text-yellow-500" />
                      <span className="font-bold text-purple-800 dark:text-purple-300">{dailyScore.totalPoints}</span>
                      <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">점</span>
                    </div>
                  </div>
                  
                  <div className="pl-2 border-l-2 border-purple-200 dark:border-purple-700 mt-3 space-y-2">
                    {dailyScore.tasks.filter(task => task.completed).map(task => (
                      <div key={task.id} className="flex justify-between items-center text-sm">
                        <span className="flex items-center text-gray-700 dark:text-gray-300">
                          <CheckCircle size={14} className="mr-1.5 text-green-500" />
                          {task.title}
                        </span>
                        <span className="flex items-center text-amber-700 dark:text-amber-400 font-medium">
                          <StarIcon size={12} className="mr-0.5 text-yellow-500" />
                          {task.points}점
                        </span>
                      </div>
                    ))}
                    
                    {dailyScore.tasks.filter(task => !task.completed).map(task => (
                      <div key={task.id} className="flex justify-between items-center text-sm opacity-50">
                        <span className="flex items-center text-gray-500 dark:text-gray-400">
                          <Circle size={14} className="mr-1.5" />
                          {task.title}
                        </span>
                        <span className="flex items-center text-gray-500 dark:text-gray-400">
                          <StarIcon size={12} className="mr-0.5 text-gray-400" />
                          {task.points}점
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add task input */}
      {showInput && (
        <form onSubmit={handleAddTask} className="candy-card animate-scale-up p-4">
          <div className="flex items-center">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="새로운 할 일을 입력하세요..."
              className="candy-input flex-1 mr-2"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="candy-button px-4 py-2 bg-green-500 text-white disabled:bg-gray-300"
            >
              <Plus size={18} />
            </button>
          </div>
        </form>
      )}

      {/* Tasks list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">할 일을 불러오는 중...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <ListTodo size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">할 일 목록이 비어있어요</p>
            <button
              onClick={() => setShowInput(true)}
              className="mt-3 text-blue-500 hover:underline"
            >
              첫 번째 할 일을 추가해 보세요!
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "candy-card p-4 flex items-center justify-between transition-all",
                task.completed ? "bg-gray-50 dark:bg-gray-800/30 opacity-75" : "bg-white dark:bg-gray-800"
              )}
            >
              <div className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => toggleTaskCompletion(task.id)}
                  className={cn(
                    "flex-shrink-0 mr-3 transition-all",
                    task.completed ? "text-green-500" : "text-gray-300 hover:text-gray-400"
                  )}
                >
                  {task.completed ? (
                    <CheckCircle size={24} className="animate-scale-up" />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-medium truncate transition-all",
                      task.completed && "line-through text-gray-400"
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="text-sm flex items-center text-gray-500 mt-1 space-x-2">
                    <div className="flex items-center">
                      <StarIcon size={14} className="mr-0.5 text-yellow-500" />
                      <span>{task.points}점</span>
                    </div>
                    <span>•</span>
                    <span>
                      {new Date(task.createdAt).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
