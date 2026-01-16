import React from "react";

export const Loading = () => {
  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
};
