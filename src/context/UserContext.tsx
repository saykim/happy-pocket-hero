
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Define types for our user data and context
type User = {
  id: string;
  username: string;
  nickname: string;
};

type UserContextType = {
  currentUser: User | null;
  isLoading: boolean;
  switchUser: (username: string) => Promise<void>;
  users: User[];
};

// Create the context with default values
const UserContext = createContext<UserContextType>({
  currentUser: null,
  isLoading: true,
  switchUser: async () => {},
  users: [],
});

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) {
          console.error('Error fetching users:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setUsers(data);
          // Set the first user as current by default
          setCurrentUser(data[0]);
        }
      } catch (error) {
        console.error('Unexpected error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Function to switch between users
  const switchUser = async (username: string) => {
    try {
      // If empty username is provided, set currentUser to null (logout)
      if (!username) {
        setCurrentUser(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('Error switching user:', error);
        return;
      }
      
      setCurrentUser(data);
    } catch (error) {
      console.error('Unexpected error switching user:', error);
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, isLoading, switchUser, users }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = () => useContext(UserContext);
