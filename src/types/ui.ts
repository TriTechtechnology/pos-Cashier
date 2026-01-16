// UI Component Types

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
export type InputVariant = 'default' | 'error' | 'success';
export type InputSize = 'sm' | 'default' | 'lg';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Grid and Layout Types
export interface GridConfig {
  cols: number;
  gap: number;
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export interface LayoutProps extends BaseComponentProps {
  sidebar?: boolean;
  header?: boolean;
  footer?: boolean;
}
