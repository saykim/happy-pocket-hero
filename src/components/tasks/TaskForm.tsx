
import { useState } from 'react';
import { Plus, ClockIcon, RepeatIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskFormProps {
  onAddTask: (title: string, recurrence: string) => void;
  buttonClassName?: string;
}

export const TaskForm = ({ onAddTask, buttonClassName }: TaskFormProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskRecurrence, setNewTaskRecurrence] = useState('one-time');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    onAddTask(newTaskTitle, newTaskRecurrence);
    setNewTaskTitle('');
    setNewTaskRecurrence('one-time');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={buttonClassName || "candy-button bg-gradient-to-r from-blue-500 to-indigo-500 text-white"}>
          <Plus size={16} className="mr-1" />
          할 일 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새로운 할 일 추가</DialogTitle>
          <DialogDescription>
            할 일의 제목과 반복 주기를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">할 일 제목</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="새로운 할 일을 입력하세요..."
                className="candy-input"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-recurrence">반복 주기</Label>
              <Select
                value={newTaskRecurrence}
                onValueChange={setNewTaskRecurrence}
              >
                <SelectTrigger id="task-recurrence">
                  <SelectValue placeholder="반복 주기를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">
                    <div className="flex items-center">
                      <ClockIcon size={16} className="mr-2 text-gray-500" />
                      일회성
                    </div>
                  </SelectItem>
                  <SelectItem value="daily">
                    <div className="flex items-center">
                      <RepeatIcon size={16} className="mr-2 text-blue-500" />
                      매일
                    </div>
                  </SelectItem>
                  <SelectItem value="weekly">
                    <div className="flex items-center">
                      <RepeatIcon size={16} className="mr-2 text-purple-500" />
                      매주
                    </div>
                  </SelectItem>
                  <SelectItem value="monthly">
                    <div className="flex items-center">
                      <RepeatIcon size={16} className="mr-2 text-pink-500" />
                      매월
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!newTaskTitle.trim()}>
              추가하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
