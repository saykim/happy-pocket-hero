
import { useState, useEffect } from 'react';
import { ListTodo, ChevronDown, ChevronUp, Calendar, RepeatIcon, ClockIcon, FilterIcon } from 'lucide-react';
import { updateUserBadgeProgress } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Task, TaskItem } from './tasks/TaskItem';
import { TaskForm } from './tasks/TaskForm';
import { DailyTaskView, DailyTasks } from './tasks/DailyTaskView';
import { EmptyTaskState } from './tasks/EmptyTaskState';
import { TaskStats } from './tasks/TaskStats';

const TaskList = () => {
  const [showDailyTasks, setShowDailyTasks] = useState(false);
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
      
      // Transform data to match Task type, explicitly extracting recurrence property
      return data.map(task => ({
        id: task.id,
        title: task.title,
        completed: task.status === 'completed',
        createdAt: task.created_at,
        recurrence: task.recurrence || 'one-time',
      }));
    },
    enabled: !!currentUser
  });
  
  // Calculate total completed tasks
  const totalCompletedTasks = tasks.filter(task => task.completed).length;
  
  // Group tasks by recurrence type
  const recurringTasks = tasks.filter(task => task.recurrence !== 'one-time');
  const oneTimeTasks = tasks.filter(task => task.recurrence === 'one-time');
  
  // Calculate daily tasks
  const dailyTasks: DailyTasks[] = (() => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      // 날짜만 추출 (YYYY-MM-DD 형식)
      const dateKey = task.createdAt.split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(task);
    });
    
    // DailyTasks 배열로 변환
    return Object.entries(grouped).map(([date, tasks]) => {
      const completedTasks = tasks.filter(task => task.completed);
      
      return {
        date,
        completedCount: completedTasks.length,
        tasks
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신 날짜순 정렬
  })();

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string, recurrence: string }) => {
      if (!currentUser) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            user_id: currentUser.id,
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
          // Update task badge progress for every task completion
          const tasksResult = await updateUserBadgeProgress(currentUser.id, 'tasks');
          console.log("할일 배지 업데이트 결과:", tasksResult);
          
          // Check if all tasks of current view are completed
          const currentViewTasks = activeTab === 'recurring' ? recurringTasks : 
                                 activeTab === 'one-time' ? oneTimeTasks : 
                                 tasks;
          
          // Get count of all completed tasks in current view
          const completedTasksCount = currentViewTasks.filter(t => 
            t.id === result.taskId ? true : t.completed
          ).length;
          
          console.log(`완료된 작업 수: ${completedTasksCount}/${currentViewTasks.length}`);
          
          // Check if all tasks in current view are completed
          const allTasksCompleted = completedTasksCount === currentViewTasks.length && currentViewTasks.length > 0;
          
          if (allTasksCompleted) {
            console.log("🎯 모든 할일 완료! 추가 배지 업데이트 중...");
            // Award activity badges when all tasks are completed
            // Passing the total number of completed tasks to count each completion as an individual activity
            const activityResult = await updateUserBadgeProgress(currentUser.id, 'activity', totalCompletedTasks);
            console.log("활동 배지 업데이트 결과:", activityResult);
            
            // Special toast message
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

  // Check for all completed tasks on initial load or when tasks change
  useEffect(() => {
    const checkAllCompleted = async () => {
      if (!currentUser || tasks.length === 0) return;
      
      // Only proceed if all tasks are completed
      const allCompleted = tasks.length > 0 && tasks.every(task => task.completed);
      
      if (allCompleted) {
        console.log("🔍 모든 할일이 이미 완료됨! 배지 확인 중...");
        try {
          // Update badge progress for each category
          await updateUserBadgeProgress(currentUser.id, 'tasks', tasks.length);
          await updateUserBadgeProgress(currentUser.id, 'activity', tasks.length);
          
          console.log(`총 ${tasks.length}개의 할일 완료에 대한 배지 업데이트 완료`);
          
          // Refresh badges data
          await queryClient.invalidateQueries({ queryKey: ['badges', currentUser.id] });
        } catch (error) {
          console.error('배지 업데이트 중 오류:', error);
        }
      }
    };
    
    checkAllCompleted();
  }, [currentUser, tasks, queryClient]);

  const handleAddTask = (title: string, recurrence: string) => {
    if (!title.trim() || !currentUser) return;
    addTaskMutation.mutate({ title, recurrence });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate || !currentUser) return;
    toggleTaskMutation.mutate({ taskId, completed: !taskToUpdate.completed });
  };

  const deleteTask = (taskId: string) => {
    if (!currentUser) return;
    deleteTaskMutation.mutate(taskId);
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

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 완료한 할일 통계 */}
      <TaskStats completedCount={totalCompletedTasks} />

      {/* 할일 헤더와 탭 */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <ListTodo className="mr-2 text-blue-500" />
            할 일
          </h2>
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowDailyTasks(!showDailyTasks)}
              variant="outline"
              size="sm"
              className="candy-button flex items-center text-gray-700 dark:text-white"
            >
              <Calendar size={16} className="mr-1" />
              {showDailyTasks ? "일별 현황 숨기기" : "일별 현황 보기"}
              {showDailyTasks ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </Button>
            <TaskForm onAddTask={handleAddTask} />
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

      {/* 일별 할일 현황 */}
      {showDailyTasks && <DailyTaskView dailyTasks={dailyTasks} />}

      {/* Tasks list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">할 일을 불러오는 중...</p>
          </div>
        ) : getFilteredTasks().length === 0 ? (
          <EmptyTaskState activeTab={activeTab} onAddTask={handleAddTask} />
        ) : (
          getFilteredTasks().map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleCompletion={toggleTaskCompletion}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
