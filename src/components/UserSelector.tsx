
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Users } from 'lucide-react';

const UserSelector = () => {
  const { currentUser, users, switchUser } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm border border-gray-200 text-sm font-medium"
      >
        <Users size={16} className="text-purple-500" />
        <span>{currentUser.nickname}</span>
        <span className="text-xs text-gray-500">({currentUser.username})</span>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            {users.map((user) => (
              <button
                key={user.id}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  user.id === currentUser.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  switchUser(user.username);
                  setShowDropdown(false);
                }}
              >
                {user.nickname} ({user.username})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
