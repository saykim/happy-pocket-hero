
import { ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskForm } from './TaskForm';

interface EmptyTaskStateProps {
  activeTab: string;
  onAddTask: (title: string, recurrence: string) => void;
}

export const EmptyTaskState = ({ activeTab, onAddTask }: EmptyTaskStateProps) => {
  let message = '';
  
  switch (activeTab) {
    case 'recurring':
      message = '반복 할 일이 없습니다';
      break;
    case 'one-time':
      message = '일회성 할 일이 없습니다';
      break;
    default:
      message = '할 일 목록이 비어있어요';
  }
  
  return (
    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <ListTodo size={48} className="mx-auto mb-3 text-gray-400" />
      <p className="text-gray-500">{message}</p>
      <TaskForm 
        onAddTask={onAddTask} 
        buttonClassName="mt-3 text-blue-500"
      />
    </div>
  );
};
