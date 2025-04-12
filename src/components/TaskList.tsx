
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { TaskStats } from './tasks/TaskStats';
import { TasksContainer } from './tasks/TasksContainer';
import { useTasks } from '@/hooks/useTasks';
import MascotGuide from './MascotGuide';

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

  // 할 일 완료율 계산
  const completionRate = tasks.length > 0 
    ? Math.round((totalCompletedTasks / tasks.length) * 100) 
    : 0;

  // 마스코트 상태 결정
  const getMascotState = () => {
    if (completionRate >= 80) return 'happy';
    if (completionRate <= 20 && tasks.length > 0) return 'hungry';
    if (totalCompletedTasks > 0 && completionRate === 100) return 'sleeping';
    return 'normal';
  };

  // 시간에 따른 메시지 생성
  const getMascotMessage = () => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return '좋은 아침이에요! 오늘의 할 일을 시작해볼까요?';
    } else if (hour < 18) {
      return tasks.length > 0 && completionRate === 0 
        ? '할 일을 하나씩 완료해보세요!' 
        : '오늘도 열심히 하고 있네요!';
    } else {
      return completionRate >= 70 
        ? '오늘 정말 잘했어요! 조금만 더 화이팅!' 
        : '하루를 마무리할 시간이에요. 남은 할 일을 확인해보세요.';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 마스코트 가이드 */}
      <div className="flex justify-center mb-4">
        <MascotGuide 
          taskCompletion={completionRate}
          state={getMascotState()}
          message={getMascotMessage()}
        />
      </div>
      
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
