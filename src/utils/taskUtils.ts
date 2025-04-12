
import { Task } from '@/components/tasks/TaskItem';
import { DailyTasks } from '@/components/tasks/DailyTaskView';

/**
 * Calculate stats from tasks
 */
export const calculateTaskStats = (tasks: Task[]) => {
  const totalCompletedTasks = tasks.filter(task => task.completed).length;
  const recurringTasks = tasks.filter(task => task.recurrence !== 'one-time');
  const oneTimeTasks = tasks.filter(task => task.recurrence === 'one-time');

  return {
    totalCompletedTasks,
    recurringTasks,
    oneTimeTasks
  };
};

/**
 * Group tasks by date
 */
export const calculateDailyTasks = (tasks: Task[]): DailyTasks[] => {
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
