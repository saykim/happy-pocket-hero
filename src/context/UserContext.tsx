
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
        console.log('Fetching users from database...');
        const { data, error } = await supabase
          .from('users')
          .select('*');
        
        if (error) {
          console.error('Error fetching users:', error);
          return;
        }
        
        if (data && data.length > 0) {
          console.log('Users fetched successfully:', data.length);
          setUsers(data);
          
          // Check if we have a stored username in localStorage
          const storedUsername = localStorage.getItem('currentUsername');
          if (storedUsername) {
            console.log('Found stored username:', storedUsername);
            const foundUser = data.find(user => user.username === storedUsername);
            if (foundUser) {
              console.log('Setting current user from stored username');
              setCurrentUser(foundUser);
            } else {
              console.log('Stored username not found in data');
              localStorage.removeItem('currentUsername');
            }
          }
        } else {
          console.log('No users found in database');
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
        console.log('Logging out');
        setCurrentUser(null);
        localStorage.removeItem('currentUsername');
        return;
      }
      
      console.log('Switching to user:', username);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        console.error('Error switching user:', error);
        return;
      }
      
      console.log('User found:', data);
      setCurrentUser(data);
      localStorage.setItem('currentUsername', username);
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
