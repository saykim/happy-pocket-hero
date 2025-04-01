
import { useState } from 'react';
import { CheckCircle, Circle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  recurrence: string;
};

interface TaskItemProps {
  task: Task;
  onToggleCompletion: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem = ({ task, onToggleCompletion, onDelete }: TaskItemProps) => {
  // 반복 주기 배지 가져오기
  const getRecurrenceBadge = (recurrence: string) => {
    switch (recurrence) {
      case 'daily':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">매일</Badge>;
      case 'weekly':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">매주</Badge>;
      case 'monthly':
        return <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">매월</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">일회성</Badge>;
    }
  };

  return (
    <div
      className={cn(
        "candy-card p-4 flex items-center justify-between transition-all",
        task.completed ? "bg-gray-50 dark:bg-gray-800/30 opacity-75" : "bg-white dark:bg-gray-800"
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <button
          onClick={() => onToggleCompletion(task.id)}
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
          <div className="flex items-center space-x-2">
            <p
              className={cn(
                "font-medium truncate transition-all",
                task.completed && "line-through text-gray-400"
              )}
            >
              {task.title}
            </p>
            {task.recurrence !== 'one-time' && (
              <div className="flex-shrink-0">
                {getRecurrenceBadge(task.recurrence)}
              </div>
            )}
          </div>
          <div className="text-sm flex items-center text-gray-500 mt-1">
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
        onClick={() => onDelete(task.id)}
        className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
