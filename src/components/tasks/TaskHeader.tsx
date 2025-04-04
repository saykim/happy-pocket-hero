
import { useState } from 'react';
import { ListTodo, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TaskForm } from './TaskForm';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterIcon, RepeatIcon, ClockIcon } from 'lucide-react';

interface TaskHeaderProps {
  showDailyTasks: boolean;
  setShowDailyTasks: (show: boolean) => void;
  onAddTask: (title: string, recurrence: string) => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  totalTasksCount: number;
  recurringTasksCount: number;
  oneTimeTasksCount: number;
}

export const TaskHeader = ({
  showDailyTasks,
  setShowDailyTasks,
  onAddTask,
  setActiveTab,
  activeTab,
  totalTasksCount,
  recurringTasksCount,
  oneTimeTasksCount
}: TaskHeaderProps) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <ListTodo className="mr-2 text-blue-500" />
          할 일
        </h2>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowDailyTasks(!showDailyTasks)}
            variant="outline"
            size="sm"
            className="candy-button flex items-center text-gray-700 dark:text-white"
          >
            <Calendar size={16} className="mr-1" />
            {showDailyTasks ? "일별 현황 숨기기" : "일별 현황 보기"}
            {showDailyTasks ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </Button>
          <TaskForm onAddTask={onAddTask} />
        </div>
      </div>

      {/* 필터 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all" className="flex items-center">
            <FilterIcon size={14} className="mr-1" />
            모두 ({totalTasksCount})
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center">
            <RepeatIcon size={14} className="mr-1" />
            반복 ({recurringTasksCount})
          </TabsTrigger>
          <TabsTrigger value="one-time" className="flex items-center">
            <ClockIcon size={14} className="mr-1" />
            일회성 ({oneTimeTasksCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
