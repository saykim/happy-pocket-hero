
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { updateBadgesOnTaskCompletion } from '@/utils/badgeUtils';
import { Task } from '@/components/tasks/TaskItem';

export const useTaskMutations = (userId: string | undefined, tasks: Task[]) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
          // Get updated task count
          const updatedTasks = [...tasks];
          const taskIndex = updatedTasks.findIndex(t => t.id === result.taskId);
          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], completed: true };
          }
          
          const newCompletedCount = updatedTasks.filter(t => t.completed).length;
          console.log(`완료된 작업 수 업데이트: ${newCompletedCount}/${updatedTasks.length}`);
          
          // Check if all tasks of current view are completed
          const allTasksCompleted = updatedTasks.length > 0 && 
                                  updatedTasks.every(t => 
                                    t.id === result.taskId ? true : t.completed
                                  );
          
          await updateBadgesOnTaskCompletion(
            userId, 
            newCompletedCount, 
            allTasksCompleted, 
            updatedTasks.length,
            queryClient
          );
          
          // Special toast message for all completed
          if (allTasksCompleted) {
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

  return {
    addTaskMutation,
    toggleTaskMutation,
    deleteTaskMutation
  };
};
