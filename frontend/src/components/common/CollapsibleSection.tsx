import React from 'react';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, defaultOpen = false, children }) => (
  <details className="border rounded-lg" open={defaultOpen}>
    <summary className="cursor-pointer select-none px-4 py-2 bg-gray-100 text-gray-900 font-medium flex items-center gap-2">
      {title}
    </summary>
    <div className="p-4 border-t bg-white">{children}</div>
  </details>
);

export default CollapsibleSection;
