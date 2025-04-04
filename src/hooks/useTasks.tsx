
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updateUserBadgeProgress } from '@/lib/utils';
import type { Task } from '@/components/tasks/TaskItem';

export const useTasks = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch tasks using react-query
  const { 
    data: tasks = [], 
    isLoading,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
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
        recurrence: task.recurrence || 'one-time',
      }));
    },
    enabled: !!userId,
    refetchInterval: 3000, // Check every 3 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });
  
  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: { title: string, recurrence: string }) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: taskData.title,
            user_id: userId,
            status: 'todo',
            recurrence: taskData.recurrence
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      
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
      if (!userId) throw new Error("User not authenticated");
      
      const newStatus = completed ? 'completed' : 'todo';
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      
      return { taskId, completed, data };
    },
    onSuccess: async (result) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      
      // Check if the task is being completed (not uncompleted)
      if (result.completed) {
        try {
          console.log("🏆 할일 완료 감지! 배지 업데이트 중...");
          
          // 1. Update task badge progress for every task completion
          const tasksResult = await updateUserBadgeProgress(userId, 'tasks');
          console.log("할일 배지 업데이트 결과:", tasksResult);
          
          // 2. Update activity badge progress for task completion
          const activityResult = await updateUserBadgeProgress(userId, 'activity');
          console.log("활동 배지 업데이트 결과:", activityResult);
          
          // 3. Get updated task count
          const updatedTasks = [...tasks];
          const taskIndex = updatedTasks.findIndex(t => t.id === result.taskId);
          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], completed: true };
          }
          
          const newCompletedCount = updatedTasks.filter(t => t.completed).length;
          console.log(`완료된 작업 수 업데이트: ${newCompletedCount}/${updatedTasks.length}`);
          
          // 4. Check if all tasks of current view are completed
          const allTasksCompleted = updatedTasks.length > 0 && 
                                   updatedTasks.every(t => 
                                     t.id === result.taskId ? true : t.completed
                                   );
          
          if (allTasksCompleted) {
            console.log("🎯 모든 할일 완료! 추가 배지 업데이트 중...");
            
            // 특별 보상: 모든 작업을 완료하면 추가 배지 포인트 제공
            await updateUserBadgeProgress(userId, 'activity', newCompletedCount);
            console.log(`모든 할일 완료 보너스: 활동 배지에 ${newCompletedCount}점 추가`);
            
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
          
          // 5. Refresh badges data to show new earned badges
          await queryClient.invalidateQueries({ queryKey: ['badges', userId] });
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
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      
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

  // Handle task operations
  const handleAddTask = (title: string, recurrence: string) => {
    if (!title.trim() || !userId) return;
    addTaskMutation.mutate({ title, recurrence });
  };

  const toggleTaskCompletion = (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate || !userId) return;
    toggleTaskMutation.mutate({ taskId, completed: !taskToUpdate.completed });
  };

  const deleteTask = (taskId: string) => {
    if (!userId) return;
    deleteTaskMutation.mutate(taskId);
  };

  // Calculate stats
  const totalCompletedTasks = tasks.filter(task => task.completed).length;
  const recurringTasks = tasks.filter(task => task.recurrence !== 'one-time');
  const oneTimeTasks = tasks.filter(task => task.recurrence === 'one-time');

  // Group tasks by date
  const calculateDailyTasks = () => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const dateKey = task.createdAt.split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(task);
    });
    
    return Object.entries(grouped).map(([date, tasks]) => {
      const completedTasks = tasks.filter(task => task.completed);
      
      return {
        date,
        completedCount: completedTasks.length,
        tasks
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const dailyTasks = calculateDailyTasks();

  // Check for completed tasks on initial load
  useEffect(() => {
    const checkAllCompleted = async () => {
      if (!userId || tasks.length === 0) return;
      
      // Count completed tasks
      const completedCount = tasks.filter(task => task.completed).length;
      console.log(`현재 완료된 작업: ${completedCount}/${tasks.length}`);
      
      // Only proceed if there are completed tasks
      if (completedCount > 0) {
        try {
          // Update badge progress for tasks category based on completion count
          await updateUserBadgeProgress(userId, 'tasks', completedCount);
          console.log(`작업 완료 배지 업데이트: ${completedCount}개 적용됨`);
          
          // Update activity badge progress
          await updateUserBadgeProgress(userId, 'activity', completedCount);
          console.log(`활동 배지 업데이트: ${completedCount}개 적용됨`);
          
          // If all tasks are completed, give special bonus
          if (completedCount === tasks.length && tasks.length > 0) {
            console.log("🌟 모든 작업이 완료되었습니다! 특별 보너스 지급");
            
            // Give additional bonus points for completing all tasks
            await updateUserBadgeProgress(userId, 'activity', tasks.length);
            console.log(`전체 완료 보너스: 활동 배지에 ${tasks.length}점 추가`);
          }
          
          // Refresh badges data
          await queryClient.invalidateQueries({ queryKey: ['badges', userId] });
        } catch (error) {
          console.error('배지 업데이트 중 오류:', error);
        }
      }
    };
    
    // Run the check when tasks data changes
    checkAllCompleted();
  }, [userId, tasks, queryClient]);

  return {
    tasks,
    isLoading,
    handleAddTask,
    toggleTaskCompletion,
    deleteTask,
    totalCompletedTasks,
    recurringTasks,
    oneTimeTasks,
    dailyTasks,
    refetchTasks
  };
};
