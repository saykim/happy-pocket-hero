
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { TaskStats } from './tasks/TaskStats';
import { TasksContainer } from './tasks/TasksContainer';
import { useTasks } from '@/hooks/useTasks';

const TaskList = () => {
  const { currentUser } = useUser();
  
  const {
    tasks,
    isLoading,
    totalCompletedTasks,
    dailyTasks,
    handleAddTask,
    toggleTaskCompletion,
    deleteTask
  } = useTasks(currentUser?.id);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 완료한 할일 통계 */}
      <TaskStats completedCount={totalCompletedTasks} />

      {/* Tasks container with all task-related components */}
      <TasksContainer 
        tasks={tasks}
        isLoading={isLoading}
        dailyTasks={dailyTasks}
        onAddTask={handleAddTask}
        onToggleCompletion={toggleTaskCompletion}
        onDelete={deleteTask}
      />
    </div>
  );
};

export default TaskList;
