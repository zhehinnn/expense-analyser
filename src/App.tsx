import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { SummaryCards } from './components/SummaryCards';
import { ExpenseReport } from './components/ExpenseReport';
import { TransactionTable } from './components/TransactionTable';
import { parsePDF, parseDemoData } from './utils/pdfParser';
import { Transaction, StatementInfo } from './utils/types';
import { Download, RotateCcw, FileText, Info } from 'lucide-react';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statementInfo, setStatementInfo] = useState<StatementInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [hasData, setHasData] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await parsePDF(file);
      setTransactions(result.transactions);
      setStatementInfo(result.statementInfo);
      setRawText(result.rawText);
      setHasData(true);
      
      if (result.transactions.length === 0) {
        setError('No transactions were detected in this PDF. The statement format may not be recognized. You can view the raw extracted text below to verify.');
      }
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to parse the PDF. Please ensure it is a valid Public Bank statement.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = () => {
    const result = parseDemoData();
    setTransactions(result.transactions);
    setStatementInfo(result.statementInfo);
    setRawText(null);
    setHasData(true);
    setError(null);
  };

  const handleReset = () => {
    setTransactions([]);
    setStatementInfo(null);
    setRawText(null);
    setHasData(false);
    setError(null);
    setShowRawText(false);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Ref', 'Category', 'Withdrawal', 'Deposit', 'Balance'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description}"`,
      t.ref,
      t.category,
      t.withdrawal.toFixed(2),
      t.deposit.toFixed(2),
      t.balance.toFixed(2),
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">PB Statement Analyzer</h1>
              <p className="text-xs text-gray-500">Public Bank Expense Report Generator</p>
            </div>
          </div>
          {hasData && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">New Analysis</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-4xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Analyze Your Bank Statement
                </h2>
                <p className="text-gray-500 max-w-lg mx-auto">
                  Upload your Public Bank PDF statement to automatically extract transactions,
                  categorize expenses, and generate a comprehensive financial report.
                </p>
              </div>
              <FileUpload
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                onLoadDemo={handleLoadDemo}
              />
              
              {/* Features */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">📄</span>
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1">PDF Parsing</h3>
                  <p className="text-sm text-gray-500">Automatically extracts transaction data from your PDF statement</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xl">🏷️</span>
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1">Smart Categorization</h3>
                  <p className="text-sm text-gray-500">Intelligently categorizes expenses into meaningful groups</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-1">Visual Reports</h3>
                  <p className="text-sm text-gray-500">Beautiful charts and breakdowns of your spending patterns</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statement Info */}
            {statementInfo && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Account:</span>
                  <span className="font-medium text-gray-700">{statementInfo.accountNumber}</span>
                </div>
                <div className="w-px h-4 bg-gray-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Period:</span>
                  <span className="font-medium text-gray-700">{statementInfo.statementDate}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
                <div className="flex items-center gap-2 hidden sm:flex">
                  <span className="text-gray-500">Transactions:</span>
                  <span className="font-medium text-gray-700">{transactions.length}</span>
                </div>
                {rawText && (
                  <>
                    <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
                    <button
                      onClick={() => setShowRawText(!showRawText)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Info className="w-3 h-3" />
                      {showRawText ? 'Hide' : 'Show'} Raw Text
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium">⚠️ Notice</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {/* Raw Text Viewer */}
            {showRawText && rawText && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Extracted Raw Text</h3>
                  <button
                    onClick={() => setShowRawText(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                <pre className="p-4 text-xs text-gray-600 overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
                  {rawText}
                </pre>
              </div>
            )}

            {/* Summary Cards */}
            {statementInfo && <SummaryCards statementInfo={statementInfo} />}

            {/* Expense Report Charts */}
            {transactions.length > 0 && <ExpenseReport transactions={transactions} />}

            {/* Transaction Table */}
            {transactions.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">All Transactions</h2>
                <TransactionTable transactions={transactions} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-sm text-gray-400">
          <p>PB Statement Analyzer — All processing is done locally in your browser. No data is sent to any server.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
