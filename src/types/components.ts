// Re-export all component types for easy access
// Note: DiscountManagement types have been moved to menu/_components
export type { Discount, DiscountApplication, DiscountValidationResult } from '@/app/(routes)/menu/_components/discount-management';

// Common component props interfaces
export interface BaseComponentProps {
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface LoadingStateProps {
  isLoading?: boolean;
  loadingText?: string;
  loadingSpinner?: boolean;
}

export interface ErrorStateProps {
  error?: string | null;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  showNavigation?: boolean;
}

export interface SearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  showClearButton?: boolean;
  onClear?: () => void;
}

export interface SortProps<T> {
  sortBy: keyof T;
  sortOrder: 'asc' | 'desc';
  onSort: (field: keyof T) => void;
  sortableFields: Array<keyof T>;
}

export interface FilterProps<T> {
  filters: Partial<T>;
  onFilterChange: (filters: Partial<T>) => void;
  availableFilters: Array<keyof T>;
  onClearFilters?: () => void;
}
