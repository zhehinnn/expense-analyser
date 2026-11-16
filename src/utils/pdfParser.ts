import * as pdfjsLib from 'pdfjs-dist';
import { Transaction, StatementInfo } from './types';
import { categorizeTransaction } from './categorizer';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function parsePDF(file: File): Promise<{
  transactions: Transaction[];
  statementInfo: StatementInfo;
  rawText: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Sort items by y position (top to bottom) then x position (left to right)
    const items = textContent.items
      .filter((item) => 'str' in item && (item as any).str.trim() !== '')
      .map((item) => item as any)
      .sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5]; // Y position (inverted)
        if (Math.abs(yDiff) > 3) return yDiff;
        return a.transform[4] - b.transform[4]; // X position
      });
    
    // Group items by line (similar Y positions)
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let lastY = items.length > 0 ? items[0].transform[5] : 0;
    
    for (const item of items) {
      const y = item.transform[5];
      if (Math.abs(y - lastY) > 3 && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [];
      }
      currentLine.push(item.str);
      lastY = y;
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    // Join each line's items with spaces
    const pageText = lines.map(line => line.join(' ')).join('\n');
    fullText += pageText + '\n';
  }
  
  const transactions = extractTransactions(fullText);
  const statementInfo = extractStatementInfo(fullText, transactions);
  
  return { transactions, statementInfo, rawText: fullText };
}

function extractTransactions(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');
  
  // Patterns for Public Bank statements
  // Date formats: DD/MM/YYYY or DD-MM-YYYY
  const datePattern = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{2}[\/\-]\d{2})\s/;
  
  // Amount pattern: numbers with commas and decimals
  const amountPattern = /[\d,]+\.\d{2}/;
  
  let transactionId = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if line starts with a date
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    const dateStr = dateMatch[1];
    const restOfLine = line.substring(dateMatch[0].length).trim();
    
    // Try to parse the rest of the line for amounts
    // Public Bank format: Date | Description | Withdrawal | Deposit | Balance
    // or: Date | Description | Debit | Credit | Balance
    
    // Find all amounts in the line
    const amounts = restOfLine.match(new RegExp(amountPattern, 'g'));
    
    if (!amounts || amounts.length === 0) continue;
    
    // Extract description (text before the first amount)
    let description = '';
    let withdrawal = 0;
    let deposit = 0;
    let balance = 0;
    
    // Try to identify which amounts are withdrawal, deposit, and balance
    // The last amount is usually the balance
    // The second-to-last is either withdrawal or deposit
    
    if (amounts.length >= 2) {
      // Get the description - everything before the numeric amounts
      const firstAmountIndex = restOfLine.search(amountPattern);
      if (firstAmountIndex > 0) {
        description = restOfLine.substring(0, firstAmountIndex).trim();
      }
      
      // Parse amounts
      const parsedAmounts = amounts.map(a => parseFloat(a.replace(/,/g, '')));
      
      if (parsedAmounts.length >= 3) {
        // Format: withdrawal, deposit, balance
        withdrawal = parsedAmounts[parsedAmounts.length - 3] || 0;
        deposit = parsedAmounts[parsedAmounts.length - 2] || 0;
        balance = parsedAmounts[parsedAmounts.length - 1] || 0;
        
        // If withdrawal and deposit are both non-zero, it's likely just one is the transaction
        if (withdrawal > 0 && deposit === 0) {
          // withdrawal only
        } else if (deposit > 0 && withdrawal === 0) {
          // deposit only
        }
      } else if (parsedAmounts.length === 2) {
        // Could be: amount + balance, or withdrawal + deposit
        const firstAmount = parsedAmounts[0];
        const secondAmount = parsedAmounts[1];
        
        // Heuristic: if the second amount is larger and consistent with a running balance, it's the balance
        if (secondAmount > firstAmount * 5 || secondAmount > 1000) {
          balance = secondAmount;
          // Determine if it's withdrawal or deposit based on context
          if (line.includes('CR') || line.includes('CREDIT') || line.includes('DEPOSIT')) {
            deposit = firstAmount;
          } else {
            withdrawal = firstAmount;
          }
        } else {
          withdrawal = firstAmount;
          balance = secondAmount;
        }
      } else {
        balance = parsedAmounts[0];
      }
    }
    
    // Clean up description
    description = description
      .replace(/\s+/g, ' ')
      .replace(/^(DR|CR|DB|CR)\s*/i, '')
      .trim();
    
    if (description && (withdrawal > 0 || deposit > 0)) {
      transactionId++;
      transactions.push({
        id: `txn-${transactionId}`,
        date: normalizeDate(dateStr),
        description,
        withdrawal,
        deposit,
        balance,
        category: categorizeTransaction(description),
      });
    }
  }
  
  return transactions;
}

function normalizeDate(dateStr: string): string {
  // Handle DD/MM/YYYY or DD/MM format
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  } else if (parts.length === 2) {
    // Assume current year
    const year = new Date().getFullYear();
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

function extractStatementInfo(text: string, transactions: Transaction[]): StatementInfo {
  // Try to extract account number
  const accountMatch = text.match(/(\d{10,13})/);
  const accountNumber = accountMatch ? accountMatch[1] : 'N/A';
  
  // Try to extract statement date/period
  const dateMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:TO|to|-|–)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
  const statementDate = dateMatch ? `${dateMatch[1]} - ${dateMatch[2]}` : 'N/A';
  
  // Calculate totals from transactions
  const totalIncome = transactions.reduce((sum, t) => sum + t.deposit, 0);
  const totalExpenses = transactions.reduce((sum, t) => sum + t.withdrawal, 0);
  
  const openingBalance = transactions.length > 0 ? 
    transactions[0].balance - transactions[0].deposit + transactions[0].withdrawal : 0;
  const closingBalance = transactions.length > 0 ? 
    transactions[transactions.length - 1].balance : 0;
  
  return {
    accountNumber,
    statementDate,
    openingBalance,
    closingBalance,
    totalIncome,
    totalExpenses,
  };
}

export function parseDemoData(): { transactions: Transaction[]; statementInfo: StatementInfo } {
  // Demo data simulating a Public Bank statement
  const demoTransactions: Transaction[] = [
    { id: '1', date: '2024-01-02', description: 'SALARY PAYMENT', withdrawal: 0, deposit: 5500.00, balance: 12500.00, category: 'Income' },
    { id: '2', date: '2024-01-03', description: 'GRAB RIDE', withdrawal: 15.80, deposit: 0, balance: 12484.20, category: 'Transportation' },
    { id: '3', date: '2024-01-04', description: 'SHOPEE SP', withdrawal: 89.90, deposit: 0, balance: 12394.30, category: 'Shopping' },
    { id: '4', date: '2024-01-05', description: 'STARBUCKS COFFEE', withdrawal: 18.50, deposit: 0, balance: 12375.80, category: 'Food & Dining' },
    { id: '5', date: '2024-01-06', description: 'PETRONAS FUEL', withdrawal: 150.00, deposit: 0, balance: 12225.80, category: 'Transportation' },
    { id: '6', date: '2024-01-07', description: 'TNB BILL PAYMENT', withdrawal: 185.30, deposit: 0, balance: 12040.50, category: 'Bills & Utilities' },
    { id: '7', date: '2024-01-08', description: 'NETFLIX SUBSCRIPTION', withdrawal: 54.90, deposit: 0, balance: 11985.60, category: 'Entertainment' },
    { id: '8', date: '2024-01-09', description: 'MCDONALD', withdrawal: 25.90, deposit: 0, balance: 11959.70, category: 'Food & Dining' },
    { id: '9', date: '2024-01-10', description: 'UNIFI BILL', withdrawal: 149.00, deposit: 0, balance: 11810.70, category: 'Bills & Utilities' },
    { id: '10', date: '2024-01-11', description: 'ATM WITHDRAWAL', withdrawal: 500.00, deposit: 0, balance: 11310.70, category: 'ATM & Cash' },
    { id: '11', date: '2024-01-12', description: 'GUARDIAN PHARMACY', withdrawal: 45.60, deposit: 0, balance: 11265.10, category: 'Healthcare' },
    { id: '12', date: '2024-01-13', description: 'GRABFOOD ORDER', withdrawal: 32.50, deposit: 0, balance: 11232.60, category: 'Food & Dining' },
    { id: '13', date: '2024-01-14', description: 'LAZADA PURCHASE', withdrawal: 259.00, deposit: 0, balance: 10973.60, category: 'Shopping' },
    { id: '14', date: '2024-01-15', description: 'TOLL PLUS', withdrawal: 50.00, deposit: 0, balance: 10923.60, category: 'Transportation' },
    { id: '15', date: '2024-01-16', description: 'AIA INSURANCE', withdrawal: 350.00, deposit: 0, balance: 10573.60, category: 'Insurance' },
    { id: '16', date: '2024-01-17', description: 'CAFE COFFEE DAY', withdrawal: 22.00, deposit: 0, balance: 10551.60, category: 'Food & Dining' },
    { id: '17', date: '2024-01-18', description: 'SPOTIFY PREMIUM', withdrawal: 15.90, deposit: 0, balance: 10535.70, category: 'Entertainment' },
    { id: '18', date: '2024-01-19', description: 'SHELL FUEL', withdrawal: 120.00, deposit: 0, balance: 10415.70, category: 'Transportation' },
    { id: '19', date: '2024-01-20', description: 'RESTAURANT NASI KANDAR', withdrawal: 35.00, deposit: 0, balance: 10380.70, category: 'Food & Dining' },
    { id: '20', date: '2024-01-21', description: 'MR DIY PURCHASE', withdrawal: 67.80, deposit: 0, balance: 10312.90, category: 'Shopping' },
    { id: '21', date: '2024-01-22', description: 'DIGI POSTPAID', withdrawal: 80.00, deposit: 0, balance: 10232.90, category: 'Bills & Utilities' },
    { id: '22', date: '2024-01-23', description: 'GRAB RIDE', withdrawal: 22.30, deposit: 0, balance: 10210.60, category: 'Transportation' },
    { id: '23', date: '2024-01-24', description: 'FOODPANDA DELIVERY', withdrawal: 28.90, deposit: 0, balance: 10181.70, category: 'Food & Dining' },
    { id: '24', date: '2024-01-25', description: 'GSC CINEMA', withdrawal: 45.00, deposit: 0, balance: 10136.70, category: 'Entertainment' },
    { id: '25', date: '2024-01-26', description: 'WATSONS', withdrawal: 55.40, deposit: 0, balance: 10081.30, category: 'Healthcare' },
    { id: '26', date: '2024-01-27', description: 'PARKING CHARGES', withdrawal: 5.00, deposit: 0, balance: 10076.30, category: 'Transportation' },
    { id: '27', date: '2024-01-28', description: 'LUNCH MAMAK', withdrawal: 18.00, deposit: 0, balance: 10058.30, category: 'Food & Dining' },
    { id: '28', date: '2024-01-29', description: 'INTERBANK TRANSFER', withdrawal: 1000.00, deposit: 0, balance: 9058.30, category: 'Transfer' },
    { id: '29', date: '2024-01-30', description: 'COFFEE BEAN', withdrawal: 16.90, deposit: 0, balance: 9041.40, category: 'Food & Dining' },
    { id: '30', date: '2024-01-31', description: 'DIVIDEND CREDIT', withdrawal: 0, deposit: 25.50, balance: 9066.90, category: 'Income' },
  ];
  
  const totalIncome = demoTransactions.reduce((sum, t) => sum + t.deposit, 0);
  const totalExpenses = demoTransactions.reduce((sum, t) => sum + t.withdrawal, 0);
  
  const statementInfo: StatementInfo = {
    accountNumber: '1234567890',
    statementDate: '01/01/2024 - 31/01/2024',
    openingBalance: 7000.00,
    closingBalance: 9066.90,
    totalIncome,
    totalExpenses,
  };
  
  return { transactions: demoTransactions, statementInfo };
}
