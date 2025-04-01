
import { useState, useEffect } from 'react';
import { ListTodo, CheckCircle, Circle, Trash2, Plus, StarIcon, ChevronDown, ChevronUp, Calendar, RepeatIcon, ClockIcon, Settings, FilterIcon } from 'lucide-react';
import { cn, updateUserBadgeProgress } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  points: number;
  recurrence: string;
};

// 일별 점수 타입 정의
type DailyScore = {
  date: string;
  totalPoints: number;
  tasks: Task[];
};

const TaskList = () => {
  const [showInput, setShowInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskRecurrence, setNewTaskRecurrence] = useState('one-time');
  const [showDailyScores, setShowDailyScores] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks using react-query
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      
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
        return [];
      }
      
      // Transform data to match Task type
      return data.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.status === 'completed',
        createdAt: task.created_at,
        points: task.reward || Math.floor(Math.random() * 50) + 30,
        recurrence: task.recurrence || 'one-time',
      }));
    },
    enabled: !!currentUser
  });
  
  // Calculate total points
  const totalPoints = tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.points, 0);
  
  // Group tasks by recurrence type
  const recurringTasks = tasks.filter(task => task.recurrence !== 'one-time');
  const oneTimeTasks = tasks.filter(task => task.recurrence === 'one-time');
  
  // Calculate daily scores
  const dailyScores: DailyScore[] = (() => {
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
  })();

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string, recurrence: string }) => {
      if (!currentUser) throw new Error("User not authenticated");
      
      const pointsValue = Math.floor(Math.random() * 50) + 30; // Random points between 30-80
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            user_id: currentUser.id,
            reward: pointsValue,
            status: 'todo',
            recurrence: taskData.recurrence
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Add the new task to cache
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser?.id] });
      
      setNewTaskTitle('');
      setNewTaskRecurrence('one-time');
      setShowInput(false);
      
      toast({
        title: '성공',
        description: '새로운 할 일이 추가되었습니다.',
      });
    },
    onError: (error) => {
      console.error('Error adding task:', error);
      toast({
        title: '오류',
        description: '할 일을 추가하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  });

  // Toggle task completion mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string, completed: boolean }) => {
      if (!currentUser) throw new Error("User not authenticated");
      
      const newStatus = completed ? 'completed' : 'todo';
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', currentUser.id)
        .select();
      
      if (error) throw error;
      
      return { taskId, completed, data };
    },
    onSuccess: async (result) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser?.id] });
      
      // Check if the task is being completed (not uncompleted)
      if (result.completed) {
        try {
          console.log("🏆 할일 완료 감지! 배지 업데이트 중...");
          const tasksResult = await updateUserBadgeProgress(currentUser.id, 'tasks');
          console.log("할일 배지 업데이트 결과:", tasksResult);
          
          // Check if all tasks of current view are completed
          const currentViewTasks = activeTab === 'recurring' ? recurringTasks : 
                                 activeTab === 'one-time' ? oneTimeTasks : 
                                 tasks;
          
          const allTasksCompleted = currentViewTasks.every(t => t.id === result.taskId ? true : t.completed);
          
          if (allTasksCompleted && currentViewTasks.length > 0) {
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
          
          // Refresh badges data
          await queryClient.invalidateQueries({ queryKey: ['badges', currentUser.id] });
          console.log("배지 데이터 새로고침 완료");
        } catch (badgeError) {
          console.error('배지 업데이트 중 오류:', badgeError);
        }
      }
      
      toast({
        title: '성공',
        description: `할 일이 ${result.completed ? '완료' : '미완료'}로 변경되었습니다.`,
      });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast({
        title: '오류',
        description: '할 일 상태를 변경하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!currentUser) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      
      return taskId;
    },
    onSuccess: (taskId) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['tasks', currentUser?.id] });
      
      toast({
        title: '성공',
        description: '할 일이 삭제되었습니다.',
      });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast({
        title: '오류',
        description: '할 일을 삭제하는 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentUser) return;
    
    addTaskMutation.mutate({ 
      title: newTaskTitle,
      recurrence: newTaskRecurrence
    });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate || !currentUser) return;
    
    toggleTaskMutation.mutate({ 
      taskId, 
      completed: !taskToUpdate.completed 
    });
  };

  const deleteTask = (taskId: string) => {
    if (!currentUser) return;
    deleteTaskMutation.mutate(taskId);
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

  // Get tasks based on active tab
  const getFilteredTasks = () => {
    switch (activeTab) {
      case 'recurring':
        return recurringTasks;
      case 'one-time':
        return oneTimeTasks;
      default:
        return tasks;
    }
  };

  // Get recurrence badge text
  const getRecurrenceBadge = (recurrence: string) => {
    switch (recurrence) {
      case 'daily':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">매일</Badge>;
      case 'weekly':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">매주</Badge>;
      case 'monthly':
        return <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">매월</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">일회성</Badge>;
    }
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

      {/* 할일 헤더와 탭 */}
      <div className="flex flex-col space-y-4">
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="candy-button bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <Plus size={16} className="mr-1" />
                  할 일 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>새로운 할 일 추가</DialogTitle>
                  <DialogDescription>
                    할 일의 제목과 반복 주기를 입력하세요.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTask}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-title">할 일 제목</Label>
                      <Input
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="새로운 할 일을 입력하세요..."
                        className="candy-input"
                        autoFocus
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-recurrence">반복 주기</Label>
                      <Select
                        value={newTaskRecurrence}
                        onValueChange={setNewTaskRecurrence}
                      >
                        <SelectTrigger id="task-recurrence">
                          <SelectValue placeholder="반복 주기를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">
                            <div className="flex items-center">
                              <ClockIcon size={16} className="mr-2 text-gray-500" />
                              일회성
                            </div>
                          </SelectItem>
                          <SelectItem value="daily">
                            <div className="flex items-center">
                              <RepeatIcon size={16} className="mr-2 text-blue-500" />
                              매일
                            </div>
                          </SelectItem>
                          <SelectItem value="weekly">
                            <div className="flex items-center">
                              <RepeatIcon size={16} className="mr-2 text-purple-500" />
                              매주
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div className="flex items-center">
                              <RepeatIcon size={16} className="mr-2 text-pink-500" />
                              매월
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!newTaskTitle.trim()}>
                      추가하기
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 필터 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all" className="flex items-center">
              <FilterIcon size={14} className="mr-1" />
              모두 ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center">
              <RepeatIcon size={14} className="mr-1" />
              반복 ({recurringTasks.length})
            </TabsTrigger>
            <TabsTrigger value="one-time" className="flex items-center">
              <ClockIcon size={14} className="mr-1" />
              일회성 ({oneTimeTasks.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
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

      {/* Tasks list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">할 일을 불러오는 중...</p>
          </div>
        ) : getFilteredTasks().length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <ListTodo size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">
              {activeTab === 'recurring' 
                ? '반복 할 일이 없습니다' 
                : activeTab === 'one-time' 
                  ? '일회성 할 일이 없습니다' 
                  : '할 일 목록이 비어있어요'}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="mt-3 text-blue-500">
                  첫 번째 할 일을 추가해 보세요!
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>새로운 할 일 추가</DialogTitle>
                  <DialogDescription>
                    할 일의 제목과 반복 주기를 입력하세요.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTask}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-title-empty">할 일 제목</Label>
                      <Input
                        id="task-title-empty"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="새로운 할 일을 입력하세요..."
                        className="candy-input"
                        autoFocus
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-recurrence-empty">반복 주기</Label>
                      <Select
                        value={newTaskRecurrence}
                        onValueChange={setNewTaskRecurrence}
                      >
                        <SelectTrigger id="task-recurrence-empty">
                          <SelectValue placeholder="반복 주기를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">
                            <div className="flex items-center">
                              <ClockIcon size={16} className="mr-2 text-gray-500" />
                              일회성
                            </div>
                          </SelectItem>
                          <SelectItem value="daily">
                            <div className="flex items-center">
                              <RepeatIcon size={16} className="mr-2 text-blue-500" />
                              매일
                            </div>
                          </SelectItem>
                          <SelectItem value="weekly">
                            <div className="flex items-center">
                              <RepeatIcon size={16} className="mr-2 text-purple-500" />
                              매주
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div className="flex items-center">
                              <RepeatIcon size={16} className="mr-2 text-pink-500" />
                              매월
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={!newTaskTitle.trim()}>
                      추가하기
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          getFilteredTasks().map((task) => (
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
                  <div className="flex items-center space-x-2">
                    <p
                      className={cn(
                        "font-medium truncate transition-all",
                        task.completed && "line-through text-gray-400"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.recurrence !== 'one-time' && (
                      <div className="flex-shrink-0">
                        {getRecurrenceBadge(task.recurrence)}
                      </div>
                    )}
                  </div>
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
