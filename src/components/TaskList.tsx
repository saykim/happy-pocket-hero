
import { useState } from 'react';
import { ListTodo, CheckCircle, Circle, Trash2, Plus, StarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  points: number;
};

// Initial tasks data
const initialTasks = [
  {
    id: '1',
    title: '저축통에 동전 모으기',
    completed: false,
    createdAt: new Date().toISOString(),
    points: 50,
  },
  {
    id: '2',
    title: '용돈기입장 작성하기',
    completed: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    points: 30,
  },
  {
    id: '3',
    title: '이번주 목표 저축액 달성하기',
    completed: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    points: 100,
  },
];

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [totalPoints, setTotalPoints] = useState(30); // Starting with 30 points for the completed task

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      createdAt: new Date().toISOString(),
      points: Math.floor(Math.random() * 50) + 30, // Random points between 30-80
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowInput(false);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          // Update total points
          if (!task.completed) {
            setTotalPoints((prev) => prev + task.points);
          } else {
            setTotalPoints((prev) => prev - task.points);
          }
          
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((task) => task.id === taskId);
    
    if (taskToDelete && taskToDelete.completed) {
      setTotalPoints((prev) => prev - taskToDelete.points);
    }
    
    setTasks(tasks.filter((task) => task.id !== taskId));
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
        {tasks.length === 0 ? (
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
