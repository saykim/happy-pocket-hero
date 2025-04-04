
import { useState } from 'react';
import { Task } from './TaskItem';
import { TaskItem } from './TaskItem';
import { EmptyTaskState } from './EmptyTaskState';
import { DailyTaskView } from './DailyTaskView';
import { DailyTasks } from './DailyTaskView';
import { TaskHeader } from './TaskHeader';

interface TasksContainerProps {
  tasks: Task[];
  isLoading: boolean;
  dailyTasks: DailyTasks[];
  onAddTask: (title: string, recurrence: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TasksContainer = ({
  tasks,
  isLoading,
  dailyTasks,
  onAddTask,
  onToggleCompletion,
  onDelete
}: TasksContainerProps) => {
  const [showDailyTasks, setShowDailyTasks] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Get tasks based on active tab
  const getFilteredTasks = () => {
    const recurringTasks = tasks.filter(task => task.recurrence !== 'one-time');
    const oneTimeTasks = tasks.filter(task => task.recurrence === 'one-time');
    
    switch (activeTab) {
      case 'recurring':
        return recurringTasks;
      case 'one-time':
        return oneTimeTasks;
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="space-y-6">
      <TaskHeader 
        showDailyTasks={showDailyTasks}
        setShowDailyTasks={setShowDailyTasks}
        onAddTask={onAddTask}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalTasksCount={tasks.length}
        recurringTasksCount={tasks.filter(task => task.recurrence !== 'one-time').length}
        oneTimeTasksCount={tasks.filter(task => task.recurrence === 'one-time').length}
      />

      {/* 일별 할일 현황 */}
      {showDailyTasks && <DailyTaskView dailyTasks={dailyTasks} />}

      {/* Tasks list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">할 일을 불러오는 중...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyTaskState activeTab={activeTab} onAddTask={onAddTask} />
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleCompletion={onToggleCompletion}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
