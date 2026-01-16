export interface SettingSection {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    items: SettingItem[];
  }
  
  export interface SettingItem {
    id: string;
    label: string;
    description?: string;
    type: 'toggle' | 'input' | 'select' | 'button' | 'info'; // 'info' for read-only display
    value?: string | number | boolean;
    options?: string[] | { value: string; label: string }[];
    disabled?: boolean; // For read-only fields (e.g., branch config from server)
  }