'use client';

interface SpecialInstructionsProps {
  value: string;
  onChange: (value: string) => void;
}

export const SpecialInstructions: React.FC<SpecialInstructionsProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <h4 className="text-xl font-medium text-text-primary font-inter">Special Instructions</h4>
      {/* Textarea */}
      <div className="bg-input-bg border border-border rounded-lg p-1.5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Please, Make it Well Done."
          className="w-full bg-transparent text-input-text placeholder-input-text resize-none focus:outline-none text-sm leading-normal font-inter"
          rows={2}
        />
      </div>
    </div>
  );
};
