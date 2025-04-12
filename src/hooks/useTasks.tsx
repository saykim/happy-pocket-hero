
import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkCompletedTasksForBadges } from '@/utils/badgeUtils';
import { calculateTaskStats, calculateDailyTasks } from '@/utils/taskUtils';
import { useTaskMutations } from './useTaskMutations';
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
  
  // Get task mutations
  const {
    addTaskMutation,
    toggleTaskMutation,
    deleteTaskMutation
  } = useTaskMutations(userId, tasks);

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
  const { totalCompletedTasks, recurringTasks, oneTimeTasks } = calculateTaskStats(tasks);
  
  // Group tasks by date
  const dailyTasks = calculateDailyTasks(tasks);

  // Check for completed tasks on initial load
  useEffect(() => {
    checkCompletedTasksForBadges(userId, tasks, queryClient);
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
