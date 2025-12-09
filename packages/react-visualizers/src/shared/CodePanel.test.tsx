import { render, screen } from '@testing-library/react';
import { CodePanel } from './CodePanel';

describe('CodePanel', () => {
  const defaultCode = [
    'function hash(key):',
    '  return key % capacity',
    '',
    'function put(key, value):',
    '  index = hash(key)',
    '  bucket[index] = value',
  ];

  describe('rendering', () => {
    it('renders pseudocode header', () => {
      render(<CodePanel code={defaultCode} activeLine={-1} />);

      expect(screen.getByText('Pseudocode')).toBeInTheDocument();
    });

    it('renders all code lines', () => {
      render(<CodePanel code={defaultCode} activeLine={-1} />);

      expect(screen.getByText(/function hash/)).toBeInTheDocument();
      expect(screen.getByText(/return key % capacity/)).toBeInTheDocument();
      expect(screen.getByText(/function put/)).toBeInTheDocument();
    });

    it('renders line numbers', () => {
      render(<CodePanel code={defaultCode} activeLine={-1} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('renders vars section', () => {
      render(<CodePanel code={defaultCode} activeLine={-1} />);

      expect(screen.getByText('Variables')).toBeInTheDocument();
    });

    it('shows dash when no variables', () => {
      render(<CodePanel code={defaultCode} activeLine={-1} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('active line highlighting', () => {
    it('highlights active line', () => {
      const { container } = render(<CodePanel code={defaultCode} activeLine={0} />);

      // Updated selector for new class: bg-yellow-400/40
      const activeLine = container.querySelector('.bg-yellow-400\\/40');
      expect(activeLine).toBeInTheDocument();
      expect(activeLine).toHaveTextContent('function hash');
    });

    it('does not highlight when activeLine is -1', () => {
      const { container } = render(<CodePanel code={defaultCode} activeLine={-1} />);

      const activeLine = container.querySelector('.bg-yellow-400\\/40');
      expect(activeLine).not.toBeInTheDocument();
    });

    it('highlights correct line based on index', () => {
      const { container } = render(<CodePanel code={defaultCode} activeLine={4} />);

      const activeLine = container.querySelector('.bg-yellow-400\\/40');
      expect(activeLine).toHaveTextContent('index = hash(key)');
    });
  });

  describe('variables display', () => {
    it('renders variables when provided', () => {
      const variables = { key: 'Alice', hash: 42, idx: 7 };
      render(<CodePanel code={defaultCode} activeLine={1} variables={variables} />);

      expect(screen.getByText('key')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('hash')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('idx')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('renders variable with equals sign', () => {
      const variables = { x: 10 };
      render(<CodePanel code={defaultCode} activeLine={1} variables={variables} />);

      expect(screen.getByText('=')).toBeInTheDocument();
    });

    it('handles string variables', () => {
      const variables = { name: '"Bob"', status: 'found' };
      render(<CodePanel code={defaultCode} activeLine={1} variables={variables} />);

      expect(screen.getByText('"Bob"')).toBeInTheDocument();
      expect(screen.getByText('found')).toBeInTheDocument();
    });

    it('handles numeric variables', () => {
      const variables = { count: 0, total: 100, negative: -5 };
      render(<CodePanel code={defaultCode} activeLine={1} variables={variables} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('shows dash when variables is empty object', () => {
      render(<CodePanel code={defaultCode} activeLine={1} variables={{}} />);

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty code array', () => {
      render(<CodePanel code={[]} activeLine={-1} />);

      expect(screen.getByText('Pseudocode')).toBeInTheDocument();
      expect(screen.getByText('Variables')).toBeInTheDocument();
    });

    it('handles single line code', () => {
      render(<CodePanel code={['return 42']} activeLine={0} />);

      expect(screen.getByText(/return 42/)).toBeInTheDocument();
    });

    it('handles code with special characters', () => {
      const codeWithSpecialChars = [
        'if (x < y && y > z):',
        '  return arr[i]',
        '  hash = key % n',
      ];
      render(<CodePanel code={codeWithSpecialChars} activeLine={-1} />);

      expect(screen.getByText(/x < y && y > z/)).toBeInTheDocument();
      expect(screen.getByText(/arr\[i\]/)).toBeInTheDocument();
    });

    it('handles empty lines in code', () => {
      const codeWithEmptyLines = ['line 1', '', 'line 3'];
      const { container } = render(<CodePanel code={codeWithEmptyLines} activeLine={-1} />);

      // Should have 3 line numbers
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Line 2 should render a space character
      const lines = container.querySelectorAll('.whitespace-pre');
      expect(lines).toHaveLength(3);
    });

    it('handles very long lines', () => {
      const longLine = 'a'.repeat(200);
      render(<CodePanel code={[longLine]} activeLine={0} />);

      expect(screen.getByText(longLine)).toBeInTheDocument();
    });
  });
});
