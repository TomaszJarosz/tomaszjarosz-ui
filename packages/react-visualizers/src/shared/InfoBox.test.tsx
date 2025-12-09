import { render, screen } from '@testing-library/react';
import { InfoBox } from './InfoBox';

describe('InfoBox', () => {
  const defaultProps = {
    title: 'Algorithm Info',
    items: ['First point', 'Second point', 'Third point'],
  };

  describe('rendering', () => {
    it('renders title', () => {
      render(<InfoBox {...defaultProps} />);

      expect(screen.getByText('Algorithm Info')).toBeInTheDocument();
    });

    it('renders all items', () => {
      render(<InfoBox {...defaultProps} />);

      expect(screen.getByText('First point')).toBeInTheDocument();
      expect(screen.getByText('Second point')).toBeInTheDocument();
      expect(screen.getByText('Third point')).toBeInTheDocument();
    });

    it('renders items as list', () => {
      render(<InfoBox {...defaultProps} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('renders icon when provided', () => {
      render(<InfoBox {...defaultProps} icon={<span data-testid="icon">🎯</span>} />);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<InfoBox {...defaultProps} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('variants', () => {
    const variants = ['indigo', 'purple', 'orange', 'green', 'blue', 'amber', 'teal'] as const;

    it.each(variants)('applies %s variant styles', (variant) => {
      const { container } = render(<InfoBox {...defaultProps} variant={variant} />);

      // Check that some color class is applied
      expect(container.firstChild).toHaveClass(`border-${variant}-200`);
    });

    it('uses indigo variant by default', () => {
      const { container } = render(<InfoBox {...defaultProps} />);

      expect(container.firstChild).toHaveClass('border-indigo-200');
    });
  });

  describe('accessibility', () => {
    it('has note role', () => {
      render(<InfoBox {...defaultProps} />);

      expect(screen.getByRole('note')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<InfoBox {...defaultProps} />);

      expect(screen.getByRole('note')).toHaveAttribute('aria-label', 'Algorithm Info information');
    });
  });

  describe('empty items', () => {
    it('renders empty list when items array is empty', () => {
      render(<InfoBox {...defaultProps} items={[]} />);

      expect(screen.getByText('Algorithm Info')).toBeInTheDocument();
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
  });
});
