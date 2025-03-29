
import { Card } from '@/components/ui/card';
import { UserSummary } from './types';

type UserSummaryTableProps = {
  userSummaries: UserSummary[];
};

const UserSummaryTable = ({ userSummaries }: UserSummaryTableProps) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 dark:text-white">사용자 요약</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="py-2 px-4 text-left">이름</th>
              <th className="py-2 px-4 text-left">거래수</th>
              <th className="py-2 px-4 text-left">목표수</th>
              <th className="py-2 px-4 text-left">할일수</th>
              <th className="py-2 px-4 text-left">잔액</th>
            </tr>
          </thead>
          <tbody>
            {userSummaries.map((user) => (
              <tr key={user.id} className="border-b dark:border-gray-700">
                <td className="py-2 px-4">{user.nickname || user.username}</td>
                <td className="py-2 px-4">{user.transactions}</td>
                <td className="py-2 px-4">{user.goals}</td>
                <td className="py-2 px-4">{user.tasks}</td>
                <td className={`py-2 px-4 ${user.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {user.balance.toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default UserSummaryTable;
