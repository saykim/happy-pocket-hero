import { useState, useEffect } from "react";
import { PlusCircle, MinusCircle, CalendarIcon, Wallet, Coins, Trash2 } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";
import CategoryIcon, { CategoryType } from "./CategoryIcon";
import { cn, updateUserBadgeProgress } from "@/lib/utils";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQueryClient } from '@tanstack/react-query';

// Types for our transactions
type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: CategoryType;
  description: string;
  date: string;
};

const AllowanceTracker = () => {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [balance, setBalance] = useState(5000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<CategoryType>("용돈");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Predefined amounts for quick selection
  const presetAmounts = [
    { value: 100, label: "100원" },
    { value: 500, label: "500원" },
    { value: 1000, label: "1천원" },
    { value: 5000, label: "5천원" },
    { value: 10000, label: "1만원" },
  ];

  // Fetch transactions on component mount or when user changes
  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [currentUser]);

  const fetchTransactions = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      
      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }
      
      // Type cast the data to ensure it matches our Transaction type
      const typedTransactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        type: item.type as "income" | "expense", // Cast the string to our union type
        amount: item.amount,
        category: item.category as CategoryType,
        description: item.description || "",
        date: item.date
      }));
      
      setTransactions(typedTransactions);
      
      // Calculate balance from transactions
      const totalIncome = (data || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = (data || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setBalance(totalIncome - totalExpense);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const addAmountValue = (value: number) => {
    setAmount(prev => prev + value);
  };

  const resetAmount = () => {
    setAmount(0);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || amount <= 0 || !currentUser) return;
    
    setIsLoading(true);
    
    const newTransaction = {
      user_id: currentUser.id,
      type: transactionType,
      amount: amount,
      category,
      description,
      date: new Date().toISOString(),
    };
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();
      
      if (error) {
        console.error("Error saving transaction:", error);
        toast({
          title: "저장 실패",
          description: "거래 내역을 저장하는데 문제가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
      if (data && data.length > 0) {
        // Convert the returned data to match our Transaction type
        const newTypedTransaction: Transaction = {
          id: data[0].id,
          type: data[0].type as "income" | "expense",
          amount: data[0].amount,
          category: data[0].category as CategoryType,
          description: data[0].description || "",
          date: data[0].date
        };
        
        setTransactions([newTypedTransaction, ...transactions]);
        
        if (transactionType === "income") {
          setBalance(prev => prev + amount);
        } else {
          setBalance(prev => prev - amount);
        }
        
        // 거래 내역 추가에 대한 배지 업데이트
        try {
          console.log(`💰 거래 내역 추가 감지: 유형=${transactionType}, 금액=${amount}원`);
          
          // 'expenses' 카테고리 배지 업데이트 (모든 거래 내역)
          const expensesResult = await updateUserBadgeProgress(currentUser.id, 'expenses');
          console.log("거래 내역 배지 업데이트 결과:", expensesResult);
          
          // 첫 번째 거래인 경우 활동 배지 추가
          if (transactions.length === 0) {
            console.log("🌟 첫 거래 감지! 활동 배지 업데이트 중...");
            const activityResult = await updateUserBadgeProgress(currentUser.id, 'activity');
            console.log("활동 배지 업데이트 결과:", activityResult);
          }
          
          // 배지 데이터 새로고침
          await queryClient.invalidateQueries({ queryKey: ['badges', currentUser.id] });
          console.log("배지 데이터 새로고침 완료");
          
          toast({
            title: "저장 완료",
            description: "거래 내역이 저장되었습니다.",
          });
        } catch (badgeError) {
          console.error("배지 업데이트 중 오류:", badgeError);
          
          // 배지 업데이트 실패해도 거래 내역은 저장됨을 알림
          toast({
            title: "저장 완료",
            description: "거래 내역이 저장되었지만, 배지 업데이트에 실패했습니다.",
          });
        }
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
      toast({
        title: "저장 실패",
        description: "거래 내역을 저장하는데 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      // Reset form
      setAmount(0);
      setDescription("");
      setShowAddForm(false);
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete || !currentUser) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionToDelete.id)
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error("Error deleting transaction:", error);
        toast({
          title: "삭제 실패",
          description: "거래 내역을 삭제하는데 문제가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
      
      // Update balance
      if (transactionToDelete.type === "income") {
        setBalance(prev => prev - transactionToDelete.amount);
      } else {
        setBalance(prev => prev + transactionToDelete.amount);
      }
      
      toast({
        title: "삭제 완료",
        description: "거래 내역이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    }
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Balance Card */}
      <div className="candy-card bg-gradient-to-br from-candy-blue to-candy-purple overflow-hidden dark:from-blue-900 dark:to-purple-900 dark:text-white">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-700 font-semibold dark:text-gray-200">현재 잔액</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                setTransactionType("income");
                resetAmount();
                setShowAddForm(true);
              }}
              className="bg-candy-green text-green-700 p-1.5 rounded-full hover:bg-green-200 transition-colors dark:bg-green-800 dark:text-green-200 dark:hover:bg-green-700"
            >
              <PlusCircle size={20} />
            </button>
            <button 
              onClick={() => {
                setTransactionType("expense");
                resetAmount();
                setShowAddForm(true);
              }}
              className="bg-candy-pink text-red-500 p-1.5 rounded-full hover:bg-red-200 transition-colors dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
            >
              <MinusCircle size={20} />
            </button>
          </div>
        </div>
        
        <div className="py-4 px-1">
          <AnimatedNumber 
            value={balance} 
            suffix="원" 
            formatOptions={{ style: 'decimal', minimumFractionDigits: 0 }}
            className="text-4xl font-bold text-blue-900 dark:text-blue-100"
          />
        </div>
      </div>
      
      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="candy-card animate-scale-up">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            {transactionType === "income" 
              ? <><Wallet className="mr-2 text-green-600 dark:text-green-400" size={20} /> 돈 받기</>
              : <><Coins className="mr-2 text-red-500 dark:text-red-400" size={20} /> 돈 쓰기</>}
          </h3>
          
          <form onSubmit={handleAddTransaction} className="space-y-5">
            {/* Amount display */}
            <div className="bg-gray-100 p-3 rounded-lg text-center dark:bg-gray-700">
              <p className="text-sm text-gray-500 mb-1 dark:text-gray-300">
                {transactionType === "income" ? "받을 금액" : "쓸 금액"}
              </p>
              <div className={cn(
                "text-3xl font-bold",
                transactionType === "income" 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {amount.toLocaleString()}원
              </div>
              {amount > 0 && (
                <button 
                  type="button" 
                  onClick={resetAmount}
                  className="mt-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  초기화
                </button>
              )}
            </div>
            
            {/* Amount buttons */}
            <div>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => addAmountValue(preset.value)}
                    className={cn(
                      "p-3 rounded-xl text-center transition-all border-2",
                      "flex flex-col items-center justify-center",
                      transactionType === "income"
                        ? "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/30 dark:hover:bg-green-800/50 dark:text-green-200"
                        : "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-200"
                    )}
                  >
                    <span className="text-xl font-semibold">{preset.value.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">원</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                분류
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="candy-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                {Object.keys(
                  transactionType === "income" 
                    ? { "용돈": true, "선물": true, "기타": true } 
                    : { "저축": true, "쇼핑": true, "간식": true, "게임": true, "책": true, "교통": true, "음료": true, "기타": true }
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                내용 (선택)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={transactionType === "income" ? "누구한테 받았나요?" : "무엇에 썼나요?"}
                className="candy-input w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                className={cn(
                  "flex-1",
                  transactionType === "income" 
                    ? "bg-green-500 hover:bg-green-600 text-white dark:bg-green-700 dark:hover:bg-green-600" 
                    : "bg-pink-500 hover:bg-pink-600 text-white dark:bg-pink-700 dark:hover:bg-pink-600"
                )}
                disabled={amount <= 0 || isLoading}
              >
                {isLoading ? "저장 중..." : transactionType === "income" ? "받기" : "쓰기"}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Recent Transactions */}
      <div className="candy-card">
        <h3 className="text-lg font-semibold mb-4">최근 거래</h3>
        
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">거래 내역이 없습니다</div>
          ) : (
            transactions.map((transaction) => (
              <div 
                key={transaction.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  "border hover:shadow-sm",
                  transaction.type === "income" 
                    ? "border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-900/20" 
                    : "border-red-100 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                )}
              >
                <div className="flex items-center space-x-3">
                  <CategoryIcon category={transaction.category as CategoryType} />
                  <div>
                    <p className="font-medium dark:text-white">{transaction.description || transaction.category}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <CalendarIcon size={12} className="mr-1" />
                      {new Date(transaction.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className={cn(
                      "font-semibold",
                      transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                    )}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {transaction.amount.toLocaleString()}원
                  </span>
                  <button
                    onClick={() => openDeleteDialog(transaction)}
                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거래 내역 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 거래 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {transactionToDelete && (
              <div className={cn(
                "p-3 rounded-lg",
                transactionToDelete.type === "income" 
                  ? "bg-green-50 dark:bg-green-900/20" 
                  : "bg-red-50 dark:bg-red-900/20"
              )}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <CategoryIcon category={transactionToDelete.category as CategoryType} />
                    <span className="font-medium dark:text-white">
                      {transactionToDelete.description || transactionToDelete.category}
                    </span>
                  </div>
                  <span className={cn(
                    "font-semibold",
                    transactionToDelete.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                  )}>
                    {transactionToDelete.type === "income" ? "+" : "-"}
                    {transactionToDelete.amount.toLocaleString()}원
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(transactionToDelete.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTransaction}
              disabled={isLoading}
            >
              {isLoading ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllowanceTracker;
