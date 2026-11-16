import { Transaction, CategorySummary } from './types';

const CATEGORY_RULES: { category: string; keywords: string[]; color: string }[] = [
  {
    category: 'Food & Dining',
    keywords: ['RESTAURANT', 'CAFE', 'COFFEE', 'MCDONALD', 'KFC', 'STARBUCKS', 'GRABFOOD', 'FOODPANDA', 'FOOD', 'DINING', 'LUNCH', 'DINNER', 'BREAKFAST', 'MAMAK', 'NASI', 'TEA GARDEN', 'PIZZA', 'BURGER', 'SUSHI', 'MART', 'BAKERY', 'CAFE'],
    color: '#FF6384',
  },
  {
    category: 'Shopping',
    keywords: ['SHOPEE', 'LAZADA', 'ZALORA', 'PGMALL', 'TAOBAO', 'PODI', 'MR DIY', 'MR.DIY', 'PODI', 'UNIQLO', 'H&M', 'NIKE', 'ADIDAS', 'SHOP', 'STORE', 'MALL', 'DEPARTMENT STORE', 'POH KONG', 'WATCH'],
    color: '#36A2EB',
  },
  {
    category: 'Transportation',
    keywords: ['GRAB', 'TOLL', 'PETRONAS', 'SHELL', 'PETRON', 'BP', 'CALTEX', 'PARKING', 'TRANSIT', 'RAPID', 'LRT', 'MRT', 'KTM', 'UBER', 'FUEL', 'ROADTAX', 'JPJ', 'CAR', 'MOTOR'],
    color: '#FFCE56',
  },
  {
    category: 'Bills & Utilities',
    keywords: ['TNB', 'UNIFI', 'TM', 'CELCOM', 'DIGI', 'MAXIS', 'U MOBILE', 'YES', 'WIFI', 'INTERNET', 'BILL', 'UTILITY', 'ELECTRICITY', 'WATER', 'SAJ', 'INDAH WATER', 'IWK'],
    color: '#4BC0C0',
  },
  {
    category: 'Housing',
    keywords: ['RENT', 'RENTAL', 'LOAN', 'MORTGAGE', 'HOUSING', 'MAINTENANCE', 'JMB', 'MC', 'ASSESSMENT', 'QUIT RENT', 'Cukai'],
    color: '#9966FF',
  },
  {
    category: 'Insurance',
    keywords: ['INSURANCE', 'TAKAFUL', 'PRUDENTIAL', 'AIA', 'ALLIANZ', 'ZURICH', 'GREAT EASTERN', 'LIFE', 'MEDICAL', 'INSUR'],
    color: '#FF9F40',
  },
  {
    category: 'Entertainment',
    keywords: ['NETFLIX', 'SPOTIFY', 'GSC', 'TGV', 'CINEMA', 'MOVIE', 'GAME', 'STEAM', 'PLAYSTATION', 'ENTERTAINMENT', 'SUBSCRIPTION'],
    color: '#FF6384',
  },
  {
    category: 'Healthcare',
    keywords: ['PHARMACY', 'HOSPITAL', 'CLINIC', 'DOCTOR', 'MEDICAL', 'HEALTH', 'GUARDIAN', 'WATSONS', 'AAPHARMACY', 'BIG PHARMACY'],
    color: '#C9CBCF',
  },
  {
    category: 'Education',
    keywords: ['SCHOOL', 'UNIVERSITY', 'TUITION', 'COURSE', 'BOOK', 'BOOKSTORE', 'EDUCATION', 'FEE'],
    color: '#4DC08D',
  },
  {
    category: 'Transfer',
    keywords: ['TRANSFER', 'IBG', 'DUITNOW', 'JIFFY', 'FPX', 'INTERBANK'],
    color: '#7C8CFF',
  },
  {
    category: 'ATM & Cash',
    keywords: ['ATM', 'CASH', 'WITHDRAWAL', 'CASH DEPOSIT'],
    color: '#E8A0BF',
  },
  {
    category: 'Income',
    keywords: ['SALARY', 'BONUS', 'DIVIDEND', 'INTEREST', 'REFUND', 'CASHBACK', 'REWARD'],
    color: '#4CAF50',
  },
];

export function categorizeTransaction(description: string): string {
  const upperDesc = description.toUpperCase();
  
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (upperDesc.includes(keyword.toUpperCase())) {
        return rule.category;
      }
    }
  }
  
  return 'Others';
}

export function getCategoryColor(category: string): string {
  const rule = CATEGORY_RULES.find(r => r.category === category);
  if (rule) return rule.color;
  
  const othersColors: Record<string, string> = {
    'Others': '#B0B0B0',
  };
  return othersColors[category] || '#999999';
}

export function generateCategorySummary(transactions: Transaction[]): CategorySummary[] {
  const categoryMap = new Map<string, { total: number; count: number }>();
  
  transactions.forEach(t => {
    if (t.withdrawal > 0) {
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
      existing.total += t.withdrawal;
      existing.count += 1;
      categoryMap.set(t.category, existing);
    }
  });
  
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      color: getCategoryColor(category),
    }))
    .sort((a, b) => b.total - a.total);
}
