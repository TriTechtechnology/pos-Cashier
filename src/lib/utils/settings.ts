import { SettingSection } from "@/types/settings";
import { Palette, Settings, Bell, Shield, Database, Store } from "lucide-react";
import type { BranchConfig } from "@/types/pos";

export const generateSettingsData = (
  tileSettings: {
    size: 'small' | 'medium' | 'large';
    dragMode: 'enabled' | 'disabled';
    showImages: boolean;
    holdDuration: number;
  },
  animationSettings: {
    level: 'high' | 'medium' | 'low' | 'off';
    enableTouchFeedback: boolean;
    enableHoverEffects: boolean;
    enableTransitions: boolean;
    enableAnimations: boolean;
    reduceMotion: boolean;
  },
  branchConfig?: BranchConfig | null
): SettingSection[] => {
  return [
    // Branch Configuration (if available) - READ ONLY for cashiers (set from backend)
    ...(branchConfig ? [{
      id: 'branch',
      title: 'Branch Configuration',
      description: 'POS settings configured by your administrator',
      icon: Store,
      items: [
        {
          id: 'branchInfo',
          label: 'Branch Information',
          description: `${branchConfig.branchName} • ${branchConfig.currency} • ID: ${branchConfig.branchId}`,
          type: 'info' as const,
          value: branchConfig.branchName
        },
        {
          id: 'paymentMode',
          label: 'Payment Mode',
          description: 'How customers pay for their orders',
          type: 'info' as const,
          value: branchConfig.paymentMode || branchConfig.posConfig?.paymentMode || 'payNow'
        },
        {
          id: 'enableTableService',
          label: 'Table Service',
          description: 'Table service for dine-in orders',
          type: 'info' as const,
          value: branchConfig.enableTableService || branchConfig.posConfig?.enableTableService || false
        },
        {
          id: 'receiptShowLogo',
          label: 'Receipt Logo',
          description: 'Display restaurant logo on receipts',
          type: 'info' as const,
          value: branchConfig.receiptConfig?.showLogo || branchConfig.posConfig?.receiptConfig?.showLogo || false
        },
        {
          id: 'receiptLogoUrl',
          label: 'Logo URL',
          description: 'URL of your restaurant logo',
          type: 'info' as const,
          value: branchConfig.receiptConfig?.logoUrl || branchConfig.posConfig?.receiptConfig?.logoUrl || 'Not set'
        },
        {
          id: 'receiptFooterText',
          label: 'Receipt Footer',
          description: 'Custom message at the bottom of receipts',
          type: 'info' as const,
          value: branchConfig.receiptConfig?.footerText || branchConfig.posConfig?.receiptConfig?.footerText || 'Thank you for your business!'
        },
        {
          id: 'paymentMethods',
          label: 'Accepted Payment Methods',
          description: 'Payment methods enabled for this branch',
          type: 'info' as const,
          value: {
            cash: branchConfig.paymentMethods?.cash?.enabled ?? branchConfig.posConfig?.paymentMethods?.cash?.enabled ?? true,
            card: branchConfig.paymentMethods?.card?.enabled ?? branchConfig.posConfig?.paymentMethods?.card?.enabled ?? true,
            mobile: branchConfig.paymentMethods?.mobile?.enabled ?? branchConfig.posConfig?.paymentMethods?.mobile?.enabled ?? true
          }
        }
      ]
    }] : []),
    {
      id: 'general',
      title: 'General Settings',
      description: 'Application preferences',
      icon: Settings,
      items: [
        {
          id: 'auto-save',
          label: 'Auto Save',
          description: 'Automatically save changes',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Tiles, animations, and display',
      icon: Palette,
      items: [
        {
          id: 'tileSize',
          label: 'Tile Size',
          description: 'Adjust the size of menu and slot tiles',
          type: 'select',
          value: tileSettings.size,
          options: ['small', 'medium', 'large']
        },
        {
          id: 'dragMode',
          label: 'Drag & Drop',
          description: 'Enable hold and drag to reorder items',
          type: 'toggle',
          value: tileSettings.dragMode === 'enabled'
        },
        {
          id: 'showImages',
          label: 'Show Images',
          description: 'Display item images instead of icons',
          type: 'toggle',
          value: tileSettings.showImages
        },
        {
          id: 'holdDuration',
          label: 'Hold Duration',
          description: 'Time to hold for drag mode (seconds)',
          type: 'input',
          value: (tileSettings.holdDuration / 1000).toString()
        },
        {
          id: 'animationLevel',
          label: 'Animation Level',
          description: 'Set animation intensity for performance',
          type: 'select',
          value: animationSettings.level,
          options: ['high', 'medium', 'low', 'off']
        },
        {
          id: 'touchFeedback',
          label: 'Touch Feedback',
          description: 'Enable touch feedback animations',
          type: 'toggle',
          value: animationSettings.enableTouchFeedback
        },
        {
          id: 'hoverEffects',
          label: 'Hover Effects',
          description: 'Enable hover effects for mouse users',
          type: 'toggle',
          value: animationSettings.enableHoverEffects
        },
        {
          id: 'transitions',
          label: 'Transitions',
          description: 'Enable smooth transitions',
          type: 'toggle',
          value: animationSettings.enableTransitions
        },
        {
          id: 'animations',
          label: 'Animations',
          description: 'Enable all animations',
          type: 'toggle',
          value: animationSettings.enableAnimations
        },
        {
          id: 'reduceMotion',
          label: 'Reduce Motion',
          description: 'Minimize animations for accessibility',
          type: 'toggle',
          value: animationSettings.reduceMotion
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Customize your notifications',
      icon: Bell,
      items: [
        {
          id: 'order-notifications',
          label: 'Order Notifications',
          description: 'Get notified for new orders',
          type: 'toggle',
          value: true
        },
        {
          id: 'low-stock-alerts',
          label: 'Low Stock Alerts',
          description: 'Alert when items are running low',
          type: 'toggle',
          value: true
        },
        {
          id: 'sound-notifications',
          label: 'Sound Notifications',
          description: 'Play sound for notifications',
          type: 'toggle',
          value: false
        }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Configure Password, PIN, etc',
      icon: Shield,
      items: [
        {
          id: 'session-timeout',
          label: 'Session Timeout',
          description: 'Auto logout after inactivity (minutes)',
          type: 'input',
          value: '30'
        },
        {
          id: 'two-factor-auth',
          label: 'Two-Factor Authentication',
          description: 'Enable 2FA for additional security',
          type: 'toggle',
          value: false
        },
        {
          id: 'password-requirements',
          label: 'Strong Password Requirements',
          description: 'Enforce strong password policies',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'data',
      title: 'Data Management',
      description: 'Backup and data settings',
      icon: Database,
      items: [
        {
          id: 'auto-backup',
          label: 'Auto Backup',
          description: 'Automatically backup data daily',
          type: 'toggle',
          value: true
        },
        {
          id: 'backup-retention',
          label: 'Backup Retention',
          description: 'Keep backups for (days)',
          type: 'input',
          value: '30'
        },
        {
          id: 'export-data',
          label: 'Export Data',
          description: 'Download all data as backup',
          type: 'button'
        }
      ]
    }
  ];
};