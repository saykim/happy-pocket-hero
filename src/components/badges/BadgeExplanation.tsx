
import { BadgeCheck, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const BadgeExplanation = () => {
  return (
    <div className="candy-card bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      <div className="flex items-center space-x-2 mb-3">
        <h3 className="font-bold dark:text-gray-100">배지를 얻는 방법</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Info size={16} className="text-gray-400 hover:text-gray-600 cursor-help" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>배지는 앱을 사용하면서 자동으로 획득합니다.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start">
          <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
          <span className="dark:text-gray-300">저축 목표에 돈을 추가하거나 목표를 달성하세요.</span>
        </li>
        <li className="flex items-start">
          <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
          <span className="dark:text-gray-300">할일 목록에서 작업을 완료하세요.</span>
        </li>
        <li className="flex items-start">
          <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
          <span className="dark:text-gray-300">용돈 내역을 꾸준히 기록하세요.</span>
        </li>
        <li className="flex items-start">
          <BadgeCheck className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
          <span className="dark:text-gray-300">매일 앱에 접속하여 기록 스트릭을 유지하세요.</span>
        </li>
      </ul>
    </div>
  );
};

export default BadgeExplanation;
