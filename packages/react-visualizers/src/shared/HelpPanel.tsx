import React from 'react';

export const HelpPanel: React.FC = () => (
  <div className="bg-gray-100 rounded-lg p-2 text-[10px]">
    <div className="font-medium text-gray-700 mb-1">Keyboard Shortcuts</div>
    <div className="space-y-0.5 text-gray-600">
      <div>
        <kbd className="px-1 py-0.5 bg-white rounded border text-[9px] font-mono">
          P
        </kbd>{' '}
        Play / Pause
      </div>
      <div>
        <kbd className="px-1 py-0.5 bg-white rounded border text-[9px] font-mono">
          [
        </kbd>{' '}
        Step back
      </div>
      <div>
        <kbd className="px-1 py-0.5 bg-white rounded border text-[9px] font-mono">
          ]
        </kbd>{' '}
        Step forward
      </div>
      <div>
        <kbd className="px-1 py-0.5 bg-white rounded border text-[9px] font-mono">
          R
        </kbd>{' '}
        Reset
      </div>
    </div>
  </div>
);

export default HelpPanel;
