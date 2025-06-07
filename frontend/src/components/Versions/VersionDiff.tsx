import React from 'react';
import * as Diff from 'diff';
import { htmlToText } from 'html-to-text';

interface VersionDiffProps {
  oldVersionContent?: string;
  newVersionContent?: string;
}

const VersionDiff: React.FC<VersionDiffProps> = ({ oldVersionContent = '', newVersionContent = '' }) => {
  const options = {
    wordwrap: 130,
    baseElements: {
      selectors: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'pre', 'td'],
    },
  };

  const oldText = htmlToText(oldVersionContent, options);
  const newText = htmlToText(newVersionContent, options);

  const changes = Diff.diffWords(oldText, newText);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 font-mono text-sm leading-relaxed">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 font-sans">Visualização das Alterações</h3>
      <pre className="whitespace-pre-wrap break-words">
        {changes.map((part, index) => {
          const color = part.added ? 'bg-green-100 text-green-800' :
                        part.removed ? 'bg-red-100 text-red-800 line-through' :
                        'text-gray-600';
          return (
            <span key={index} className={`${color}`}>
              {part.value}
            </span>
          );
        })}
      </pre>
    </div>
  );
};

export default VersionDiff;