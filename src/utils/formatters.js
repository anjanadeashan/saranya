import { format, parseISO } from 'date-fns';

// Currency formatter
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

// Number formatter
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number || 0);
};

// Date formatter
export const formatDate = (dateString, formatStr = 'MMM dd, yyyy') => {
  if (!dateString) return '-';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
};

// Percentage formatter
export const formatPercentage = (decimal, decimals = 1) => {
  return `${(decimal * 100).toFixed(decimals)}%`;
};

// Stock status formatter
export const getStockStatus = (currentStock, threshold) => {
  if (currentStock <= threshold) {
    return { status: 'Low', variant: 'danger' };
  } else if (currentStock <= threshold * 1.5) {
    return { status: 'Medium', variant: 'warning' };
  } else {
    return { status: 'Good', variant: 'success' };
  }
};

// Credit status formatter
export const getCreditStatus = (outstandingBalance, creditLimit) => {
  if (!creditLimit || creditLimit === 0) {
    return { status: 'No Credit', variant: 'secondary' };
  }
  
  const utilizationPercent = (outstandingBalance / creditLimit) * 100;
  
  if (utilizationPercent >= 90) {
    return { status: 'Credit Risk', variant: 'danger' };
  } else if (utilizationPercent >= 70) {
    return { status: 'High Usage', variant: 'warning' };
  } else if (utilizationPercent > 0) {
    return { status: 'Active', variant: 'info' };
  } else {
    return { status: 'Good Standing', variant: 'success' };
  }
};

// Payment method formatter
export const formatPaymentMethod = (method) => {
  const methods = {
    'CASH': 'Cash',
    'DEBIT_CARD': 'Debit Card',
    'CREDIT_CARD': 'Credit Card',
    'BANK_TRANSFER': 'Bank Transfer',
    'CREDIT_CHECK': 'Credit (Check)'
  };
  
  return methods[method] || method;
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};