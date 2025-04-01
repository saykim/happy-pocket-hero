
import { Calendar, CheckCircle, Circle } from 'lucide-react';
import { Task } from './TaskItem';

export type DailyTasks = {
  date: string;
  completedCount: number;
  tasks: Task[];
};

interface DailyTaskViewProps {
  dailyTasks: DailyTasks[];
}

export const DailyTaskView = ({ dailyTasks }: DailyTaskViewProps) => {
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

  return (
    <div className="candy-card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 animate-fade-in">
      <h3 className="text-lg font-semibold mb-4 text-purple-800 dark:text-purple-300">일별 완료 현황</h3>
      
      {dailyTasks.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">데이터가 없습니다</p>
      ) : (
        <div className="space-y-4">
          {dailyTasks.map(dailyTask => (
            <div 
              key={dailyTask.date}
              className="border border-purple-100 dark:border-purple-800 rounded-lg p-4 bg-white dark:bg-gray-800/30"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-purple-500" />
                  <h4 className="font-medium text-purple-800 dark:text-purple-300">
                    {formatDate(dailyTask.date)}
                  </h4>
                </div>
                <div className="flex items-center bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                  <CheckCircle size={14} className="mr-1 text-green-500" />
                  <span className="font-bold text-purple-800 dark:text-purple-300">{dailyTask.completedCount}</span>
                  <span className="ml-1 text-xs text-purple-600 dark:text-purple-400">개</span>
                </div>
              </div>
              
              <div className="pl-2 border-l-2 border-purple-200 dark:border-purple-700 mt-3 space-y-2">
                {dailyTask.tasks.filter(task => task.completed).map(task => (
                  <div key={task.id} className="flex justify-between items-center text-sm">
                    <span className="flex items-center text-gray-700 dark:text-gray-300">
                      <CheckCircle size={14} className="mr-1.5 text-green-500" />
                      {task.title}
                    </span>
                  </div>
                ))}
                
                {dailyTask.tasks.filter(task => !task.completed).map(task => (
                  <div key={task.id} className="flex justify-between items-center text-sm opacity-50">
                    <span className="flex items-center text-gray-500 dark:text-gray-400">
                      <Circle size={14} className="mr-1.5" />
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
