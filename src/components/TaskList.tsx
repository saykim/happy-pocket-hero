
import { useState, useEffect } from 'react';
import { ListTodo, CheckCircle, Circle, Trash2, Plus, StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  points: number;
};

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUser();
  const { toast } = useToast();

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
      
      setTasks([newTask, ...tasks]);
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
      setTasks(
        tasks.map((task) => {
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
        })
      );
      
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
      setTasks(tasks.filter((task) => task.id !== taskId));
      
      toast({
        title: '성공',
        description: '할 일이 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Unexpected error deleting task:', error);
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

      {/* Tasks header with add button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <ListTodo className="mr-2 text-blue-500" />
          할 일
        </h2>
        <button
          onClick={() => setShowInput(true)}
          className="candy-button bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
        >
          할 일 추가
        </button>
      </div>

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
                task.completed ? "bg-gray-50 opacity-75" : "bg-white"
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
