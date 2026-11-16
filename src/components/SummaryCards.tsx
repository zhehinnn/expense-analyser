import React from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { StatementInfo } from '../utils/types';

interface SummaryCardsProps {
  statementInfo: StatementInfo;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ statementInfo }) => {
  const cards = [
    {
      title: 'Total Income',
      value: statementInfo.totalIncome,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Total Expenses',
      value: statementInfo.totalExpenses,
      icon: TrendingDown,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      title: 'Net Balance',
      value: statementInfo.totalIncome - statementInfo.totalExpenses,
      icon: Wallet,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Closing Balance',
      value: statementInfo.closingBalance,
      icon: CreditCard,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">{card.title}</span>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.textColor}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${card.textColor}`}>
            RM {card.value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      ))}
    </div>
  );
};
