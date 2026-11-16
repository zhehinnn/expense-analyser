import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CategorySummary } from '../utils/types';
import { generateCategorySummary } from '../utils/categorizer';
import { Transaction } from '../utils/types';

interface ExpenseReportProps {
  transactions: Transaction[];
}

export const ExpenseReport: React.FC<ExpenseReportProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const categorySummary = generateCategorySummary(transactions);
  const totalExpenses = categorySummary.reduce((sum, c) => sum + c.total, 0);

  // Prepare data for pie chart
  const pieData = categorySummary.map(c => ({
    name: c.category,
    value: c.total,
    color: c.color,
  }));

  // Prepare data for bar chart
  const barData = categorySummary.map(c => ({
    name: c.category.length > 12 ? c.category.substring(0, 12) + '...' : c.category,
    fullName: c.category,
    amount: c.total,
    count: c.count,
    color: c.color,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chart'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Charts
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'table'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Breakdown
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'chart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`,
                      'Amount',
                    ]}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Expense by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `RM${v}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2 })} (${props.payload.count} transactions)`,
                      props.payload.fullName,
                    ]}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Transactions</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">% of Total</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categorySummary.map((cat) => (
                  <tr key={cat.category} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-gray-800">
                      RM {cat.total.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {cat.count}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-600">
                      {totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="py-3 px-4 text-sm font-bold text-gray-700">Total</td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-800">
                    RM {totalExpenses.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-600">
                    {transactions.filter(t => t.withdrawal > 0).length}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-gray-600">100%</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
