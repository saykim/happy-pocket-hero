
import { useState } from "react";
import { PlusCircle, MinusCircle, CalendarIcon } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";
import CategoryIcon, { CategoryType } from "./CategoryIcon";
import { cn } from "@/lib/utils";

// A mock transaction for the initial state
const initialTransactions = [
  {
    id: "1",
    type: "income",
    amount: 10000,
    category: "용돈" as CategoryType,
    description: "주간 용돈",
    date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
  {
    id: "2",
    type: "expense",
    amount: 3000,
    category: "간식" as CategoryType,
    description: "아이스크림",
    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: "3",
    type: "expense",
    amount: 2000,
    category: "교통" as CategoryType,
    description: "버스비",
    date: new Date().toISOString(),
  },
];

const AllowanceTracker = () => {
  const [balance, setBalance] = useState(5000);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryType>("용돈");
  const [description, setDescription] = useState("");

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseInt(amount) <= 0) return;
    
    const newTransaction = {
      id: Date.now().toString(),
      type: transactionType,
      amount: parseInt(amount),
      category,
      description,
      date: new Date().toISOString(),
    };
    
    setTransactions([newTransaction, ...transactions]);
    
    if (transactionType === "income") {
      setBalance((prev) => prev + parseInt(amount));
    } else {
      setBalance((prev) => prev - parseInt(amount));
    }
    
    // Reset form
    setAmount("");
    setDescription("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Balance Card */}
      <div className="candy-card bg-gradient-to-br from-candy-blue to-candy-purple overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-gray-700 font-semibold">현재 잔액</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => {
                setTransactionType("income");
                setShowAddForm(true);
              }}
              className="bg-candy-green text-green-700 p-1.5 rounded-full hover:bg-green-200 transition-colors"
            >
              <PlusCircle size={20} />
            </button>
            <button 
              onClick={() => {
                setTransactionType("expense");
                setShowAddForm(true);
              }}
              className="bg-candy-pink text-red-500 p-1.5 rounded-full hover:bg-red-200 transition-colors"
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
            className="text-4xl font-bold text-blue-900"
          />
        </div>
      </div>
      
      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="candy-card animate-scale-up">
          <h3 className="text-lg font-semibold mb-4">
            {transactionType === "income" ? "돈 받기" : "돈 쓰기"}
          </h3>
          
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block mb-1 text-sm font-medium text-gray-700">
                {transactionType === "income" ? "받은 금액" : "쓴 금액"}
              </label>
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="candy-input w-full pl-7"
                  required
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₩</span>
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">
                분류
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="candy-input w-full"
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
              <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                내용 (선택)
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="무엇에 썼나요?"
                className="candy-input w-full"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="candy-button flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                취소
              </button>
              <button
                type="submit"
                className={cn(
                  "candy-button flex-1",
                  transactionType === "income" 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-pink-500 hover:bg-pink-600"
                )}
              >
                저장하기
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Recent Transactions */}
      <div className="candy-card">
        <h3 className="text-lg font-semibold mb-4">최근 거래</h3>
        
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">거래 내역이 없습니다</div>
          ) : (
            transactions.map((transaction) => (
              <div 
                key={transaction.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  "border hover:shadow-sm",
                  transaction.type === "income" 
                    ? "border-green-100 bg-green-50" 
                    : "border-red-100 bg-red-50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <CategoryIcon category={transaction.category} />
                  <div>
                    <p className="font-medium">{transaction.description || transaction.category}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon size={12} className="mr-1" />
                      {new Date(transaction.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <span 
                  className={cn(
                    "font-semibold",
                    transaction.type === "income" ? "text-green-600" : "text-red-500"
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {transaction.amount.toLocaleString()}원
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AllowanceTracker;
