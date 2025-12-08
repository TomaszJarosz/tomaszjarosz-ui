import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

type CalloutType =
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

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  /** Custom class name to override default styles */
  className?: string;
}

const icons: Record<CalloutType, React.ReactNode> = {
  info: <Info />,
  note: <Info />,
  warning: <AlertTriangle />,
  success: <CheckCircle />,
  solution: <CheckCircle />,
  solutions: <CheckCircle />,
  error: <XCircle />,
  problem: <XCircle />,
  example: <Info />,
  tip: <Lightbulb />,
};

export const Callout: React.FC<CalloutProps> = ({ type, title, children, className }) => {
  const icon = icons[type];

  return (
    <div className={className || `rm-callout rm-callout-${type}`}>
      <div className="rm-callout-inner">
        <div className="rm-callout-icon">{icon}</div>
        <div className="rm-callout-content">
          {title && <h4 className="rm-callout-title">{title}</h4>}
          <div className="rm-callout-body">{children}</div>
        </div>
      </div>
    </div>
  );
};
