import { SettingItem as SettingItemType } from "@/types/settings";
import { Button } from "@/components/ui/button";
import { Download, Check, X, CreditCard, Banknote, Smartphone } from "lucide-react";

export const SettingItem = ({
  item,
  sectionId,
  handleSettingChange,
  handleExportData,
  showPassword,
}: {
  item: SettingItemType;
  sectionId: string;
  handleSettingChange: (
    sectionId: string,
    itemId: string,
    value: string | number | boolean
  ) => void;
  handleExportData: () => void;
  showPassword: boolean;
}) => {
  switch (item.type) {
    case "info":
      // Read-only informational display (for branch config)
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            {item.label}
          </label>
          {item.description && (
            <p className="text-xs text-text-secondary mb-2">{item.description}</p>
          )}

          {/* Special handling for payment methods object */}
          {item.id === 'paymentMethods' && typeof item.value === 'object' ? (
            <div className="flex flex-wrap gap-2">
              {(item.value as any).cash && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800">
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm font-medium">Cash</span>
                  <Check className="w-4 h-4" />
                </div>
              )}
              {(item.value as any).card && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Card</span>
                  <Check className="w-4 h-4" />
                </div>
              )}
              {(item.value as any).mobile && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm font-medium">Mobile</span>
                  <Check className="w-4 h-4" />
                </div>
              )}
              {!(item.value as any).cash && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50">
                  <Banknote className="w-4 h-4" />
                  <span className="text-sm font-medium">Cash</span>
                  <X className="w-4 h-4" />
                </div>
              )}
              {!(item.value as any).card && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Card</span>
                  <X className="w-4 h-4" />
                </div>
              )}
              {!(item.value as any).mobile && (
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm font-medium">Mobile</span>
                  <X className="w-4 h-4" />
                </div>
              )}
            </div>
          ) : typeof item.value === 'boolean' ? (
            // Boolean values - show as badge
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
              item.value
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            }`}>
              {item.value ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              <span className="text-sm font-medium">{item.value ? 'Enabled' : 'Disabled'}</span>
            </div>
          ) : item.id === 'paymentMode' ? (
            // Payment mode - special styling
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
              item.value === 'payNow'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            }`}>
              <span className="text-sm font-semibold">
                {item.value === 'payNow' ? 'Pay Now (Fast Food)' : 'Pay Later (Fine Dining)'}
              </span>
            </div>
          ) : (
            // String/number values - show as text
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-text-primary break-words">{String(item.value || 'Not set')}</p>
            </div>
          )}
        </div>
      );

    case "toggle":
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className={`text-sm font-medium ${item.disabled ? 'text-text-secondary' : 'text-text-primary'}`}>
              {item.label}
            </label>
            {item.description && (
              <p className="text-xs text-text-secondary mt-1">
                {item.description}
              </p>
            )}
          </div>
          <button
            onClick={() => !item.disabled && handleSettingChange(sectionId, item.id, !item.value)}
            disabled={item.disabled}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                ${item.value ? "bg-primary" : "bg-border"}
                ${item.disabled ? "opacity-50 cursor-not-allowed" : "focus:outline-none touch-manipulation select-none"}
              `}
            role="switch"
            aria-checked={Boolean(item.value)}
          >
            <span
              className={`
                  inline-block h-4 w-4 transform rounded-full bg-card-foreground transition-transform duration-200
                  ${item.value ? "translate-x-6" : "translate-x-1"}
                `}
            />
          </button>
        </div>
      );

    case "input":
      return (
        <div className="space-y-2">
          <label className={`text-sm font-medium ${item.disabled ? 'text-text-secondary' : 'text-text-primary'}`}>
            {item.label}
          </label>
          {item.description && (
            <p className="text-xs text-text-secondary">{item.description}</p>
          )}
          <input
            type={
              item.id.includes("password")
                ? showPassword
                  ? "text"
                  : "password"
                : "text"
            }
            value={String(item.value || "")}
            onChange={(e) =>
              !item.disabled && handleSettingChange(sectionId, item.id, e.target.value)
            }
            disabled={item.disabled}
            readOnly={item.disabled}
            className={`w-full px-3 py-2 bg-card border border-border rounded-md text-text-primary placeholder-text-secondary ${
              item.disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                : 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent touch-manipulation select-none'
            }`}
            placeholder={`Enter ${item.label.toLowerCase()}`}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <label className={`text-sm font-medium ${item.disabled ? 'text-text-secondary' : 'text-text-primary'}`}>
            {item.label}
          </label>
          {item.description && (
            <p className="text-xs text-text-secondary">{item.description}</p>
          )}
          <select
            value={String(item.value || "")}
            onChange={(e) =>
              !item.disabled && handleSettingChange(sectionId, item.id, e.target.value)
            }
            disabled={item.disabled}
            className={`w-full px-3 py-2 bg-card border border-border rounded-md text-text-primary ${
              item.disabled
                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                : 'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent touch-manipulation select-none'
            }`}
          >
            {item.options?.map((option) => (
              <option
                key={typeof option === "string" ? option : option.value}
                value={typeof option === "string" ? option : option.value}
              >
                {typeof option === "string" ? option : option.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "button":
      return (
        <div className="space-y-2">
          <label className={`text-sm font-medium ${item.disabled ? 'text-text-secondary' : 'text-text-primary'}`}>
            {item.label}
          </label>
          {item.description && (
            <p className="text-xs text-text-secondary">{item.description}</p>
          )}
          <Button
            variant="line"
            size="sm"
            onClick={() => {
              if (item.id === "export-data" && !item.disabled) handleExportData();
            }}
            disabled={item.disabled}
            className={`
                transition-all duration-200 active:scale-95 touch-manipulation select-none
                ${
                  item.id === "export-data"
                    ? "text-blue-500 active:text-blue-600 active:border-blue-500"
                    : ""
                }
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
          >
            {item.id === "export-data" && <Download className="w-4 h-4 mr-2" />}
            {item.label}
          </Button>
        </div>
      );

    default:
      return null;
  }
};
