import React from 'react';

export const PageHeader: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
