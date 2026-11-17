import React, { useState } from 'react';
import { ArrowUpDown, Search, Filter } from 'lucide-react';
import { Transaction } from '../utils/types';

interface TransactionTableProps {
  transactions: Transaction[];
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'withdrawal' | 'deposit'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique categories
  const categories = [...new Set(transactions.map(t => t.category))].sort();

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: 'date' | 'withdrawal' | 'deposit') => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600"
                onClick={() => toggleSort('date')}
              >
                <span className="flex items-center gap-1">
                  Date
                  {sortField === 'date' && <ArrowUpDown className="w-3 h-3" />}
                </span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                Category
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right cursor-pointer hover:text-blue-600"
                onClick={() => toggleSort('withdrawal')}
              >
                <span className="flex items-center gap-1 justify-end">
                  Withdrawal
                  {sortField === 'withdrawal' && <ArrowUpDown className="w-3 h-3" />}
                </span>
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right cursor-pointer hover:text-blue-600"
                onClick={() => toggleSort('deposit')}
              >
                <span className="flex items-center gap-1 justify-end">
                  Deposit
                  {sortField === 'deposit' && <ArrowUpDown className="w-3 h-3" />}
                </span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTransactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(txn.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">
                  {txn.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">
                  {txn.ref}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {txn.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  {txn.withdrawal > 0 ? (
                    <span className="text-red-600 font-medium">
                      -RM {txn.withdrawal.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                  {txn.deposit > 0 ? (
                    <span className="text-green-600 font-medium">
                      +RM {txn.deposit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-700 whitespace-nowrap">
                  RM {txn.balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No transactions found matching your criteria.
        </div>
      )}

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
