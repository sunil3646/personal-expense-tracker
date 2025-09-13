import React, { useState, useEffect } from 'react';

const API_URL = 'https://personal-expense-tracker-b4ix.onrender.com/';

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [insightText, setInsightText] = useState('');
  const [goalText, setGoalText] = useState('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isLoadingGoal, setIsLoadingGoal] = useState(false);

  const categories = ['Food', 'Bills', 'Salary', 'Travel', 'Shopping', 'Other'];

  const MessageBox = ({ text, onClose }) => {
    if (!text) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-auto text-center">
          <p className="text-gray-800 font-medium mb-4">{text}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      calculateTotals(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setMessage('Failed to load transactions. Please check the backend server.');
    }
  };

  const addTransaction = async (newTransaction) => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });
      if (!response.ok) throw new Error('Failed to add transaction');
      await fetchTransactions();
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Error adding transaction:', error);
      setMessage('Failed to add transaction. Please try again.');
    }
  };

  const updateTransaction = async (updatedTransaction) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${updatedTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTransaction),
      });
      if (!response.ok) throw new Error('Failed to update transaction');
      await fetchTransactions();
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Error updating transaction:', error);
      setMessage('Failed to update transaction. Please try again.');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete transaction');
      await fetchTransactions();
      setIsDeleteModalOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setMessage('Failed to delete transaction. Please try again.');
    }
  };

  const getFinancialInsights = async () => {
    setIsLoadingInsight(true);
    setInsightText('');
    try {
      const response = await fetch(`${API_URL}/llm/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      if (!response.ok) throw new Error('Failed to get insights from backend');
      const data = await response.json();
      setInsightText(data.text);
    } catch (error) {
      console.error('Error getting insights:', error);
      setMessage('Failed to generate insights. Please check the backend connection.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const getFinancialGoals = async () => {
    setIsLoadingGoal(true);
    setGoalText('');
    try {
      const response = await fetch(`${API_URL}/llm/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ income, expenses }),
      });
      if (!response.ok) throw new Error('Failed to get goal from backend');
      const data = await response.json();
      setGoalText(data.text);
    } catch (error) {
      console.error('Error getting goal:', error);
      setMessage('Failed to generate a financial goal. Please check the backend connection.');
    } finally {
      setIsLoadingGoal(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const calculateTotals = (trans) => {
    let totalIncome = 0;
    let totalExpenses = 0;
    trans.forEach(t => {
      if (t.amount > 0) {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });
    setIncome(totalIncome);
    setExpenses(totalExpenses);
    setBalance(totalIncome + totalExpenses);
  };

  const filteredAndSortedTransactions = transactions
    .filter(t => categoryFilter === 'All' || t.category === categoryFilter)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const Navbar = () => (
    <nav className="bg-white shadow-lg p-4 rounded-b-xl sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Finance Tracker</h1>
        <div className="space-x-4">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setCurrentPage('add'); setSelectedTransaction(null); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Add Transaction
          </button>
        </div>
      </div>
    </nav>
  );

  const Dashboard = () => (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Your Financial Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <p className="text-sm font-semibold uppercase text-gray-400">Total Balance</p>
          <p className="text-4xl font-bold mt-2">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-green-600 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <p className="text-sm font-semibold uppercase">Total Income</p>
          <p className="text-4xl font-bold mt-2">${income.toFixed(2)}</p>
        </div>
        <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <p className="text-sm font-semibold uppercase">Total Expenses</p>
          <p className="text-4xl font-bold mt-2">${expenses.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4 mb-6 p-4 bg-gray-100 rounded-xl shadow-inner">
        <button
          onClick={getFinancialInsights}
          className="w-full md:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingInsight || transactions.length === 0}
        >
          {isLoadingInsight ? 'Generating Insights...' : 'Get Financial Insights ✨'}
        </button>
        <button
          onClick={getFinancialGoals}
          className="w-full md:w-auto px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingGoal}
        >
          {isLoadingGoal ? 'Generating Goal...' : 'Get a Financial Goal ✨'}
        </button>
      </div>

      {(insightText || goalText) && (
        <div className="space-y-6 mb-8">
          {insightText && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-purple-500">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Financial Insights</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{insightText}</p>
            </div>
          )}
          {goalText && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Next Financial Goal</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{goalText}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-gray-100 rounded-xl shadow-inner">
        <div className="flex items-center space-x-2 w-full md:w-auto mb-4 md:mb-0">
          <label htmlFor="categoryFilter" className="font-medium text-gray-700">Filter:</label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label htmlFor="sortOrder" className="font-medium text-gray-700">Sort:</label>
          <select
            id="sortOrder"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedTransactions.length > 0 ? (
          filteredAndSortedTransactions.map(t => (
            <div key={t._id} className="bg-white p-5 rounded-2xl shadow-lg flex items-center justify-between transition-transform transform hover:scale-[1.01] hover:shadow-xl">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{t.title}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">{t.category}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{new Date(t.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right ml-4">
                <span className={`font-bold text-xl ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(t.amount).toFixed(2)}
                </span>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => { setSelectedTransaction(t); setCurrentPage('edit'); }}
                    className="p-2 bg-yellow-400 text-white rounded-lg shadow-md hover:bg-yellow-500 transition-colors"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-3.828 4.242L15 2l3 3-7.242 7.242-1.758 6.586-6.586-1.758L2 15l7.242-7.242z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { setSelectedTransaction(t); setIsDeleteModalOpen(true); }}
                    className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 text-lg mt-10">No transactions found. Add one to get started!</p>
        )}
      </div>
    </div>
  );

  const TransactionForm = ({ transaction, onSave, onCancel }) => {
    const [title, setTitle] = useState(transaction?.title || '');
    const [amount, setAmount] = useState(transaction?.amount || '');
    const [date, setDate] = useState(transaction?.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(transaction?.category || categories[0]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!title || !amount || !date || !category) {
        setMessage('Please fill out all fields.');
        return;
      }
      onSave({ ...transaction, title, amount: parseFloat(amount), date, category });
    };

    return (
      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {transaction ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (e.g., -50.75 for expense, 100 for income)</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const DeleteModal = ({ isOpen, onClose, onConfirm, transaction }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete the transaction "{transaction?.title}"?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(transaction._id)}
              className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  let content;
  switch (currentPage) {
    case 'dashboard':
      content = <Dashboard />;
      break;
    case 'add':
      content = <TransactionForm onSave={addTransaction} onCancel={() => setCurrentPage('dashboard')} />;
      break;
    case 'edit':
      content = <TransactionForm transaction={selectedTransaction} onSave={updateTransaction} onCancel={() => setCurrentPage('dashboard')} />;
      break;
    default:
      content = <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Navbar />
      <main className="pb-10">
        {content}
        <MessageBox text={message} onClose={() => setMessage('')} />
        {isDeleteModalOpen && (
          <DeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => { setIsDeleteModalOpen(false); setSelectedTransaction(null); }}
            onConfirm={deleteTransaction}
            transaction={selectedTransaction}
          />
        )}
      </main>
    </div>
  );
};

export default App;