import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface CalloutProps {
  type:
    | 'info'
    | 'warning'
    | 'success'
    | 'error'
    | 'note'
    | 'problem'
    | 'solution'
    | 'solutions'
    | 'example'
    | 'tip';
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({ type, title, children }) => {
  const styles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-4 w-4 text-blue-500" />,
      title: 'text-blue-900',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      title: 'text-yellow-900',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      title: 'text-green-900',
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      title: 'text-red-900',
    },
    note: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-4 w-4 text-blue-500" />,
      title: 'text-blue-900',
    },
    problem: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      title: 'text-red-900',
    },
    solution: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      title: 'text-green-900',
    },
    solutions: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      title: 'text-green-900',
    },
    example: {
      container: 'bg-purple-50 border-purple-200 text-purple-800',
      icon: <Info className="h-4 w-4 text-purple-500" />,
      title: 'text-purple-900',
    },
    tip: {
      container: 'bg-cyan-50 border-cyan-200 text-cyan-800',
      icon: <Info className="h-4 w-4 text-cyan-500" />,
      title: 'text-cyan-900',
    },
  };

  const style = styles[type];

  return (
    <div className={`border-l-4 p-3 my-2 rounded-r-md ${style.container}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="ml-2 flex-1">
          {title && (
            <h4 className={`text-sm font-semibold mb-1 ${style.title}`}>
              {title}
            </h4>
          )}
          <div className="text-sm leading-snug">{children}</div>
        </div>
      </div>
    </div>
  );
};
