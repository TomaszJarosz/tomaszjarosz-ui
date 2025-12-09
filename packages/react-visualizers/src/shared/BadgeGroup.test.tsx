import { render, screen } from '@testing-library/react';
import { BadgeGroup, Badge } from './BadgeGroup';

describe('BadgeGroup', () => {
  const sampleBadges: Badge[] = [
    { label: 'O(1)', variant: 'green' },
    { label: 'O(n)', variant: 'orange' },
    { label: 'Stable', variant: 'blue' },
  ];

  describe('rendering', () => {
    it('renders all badges', () => {
      render(<BadgeGroup badges={sampleBadges} />);

      expect(screen.getByText('O(1)')).toBeInTheDocument();
      expect(screen.getByText('O(n)')).toBeInTheDocument();
      expect(screen.getByText('Stable')).toBeInTheDocument();
    });

    it('returns null for empty badges array', () => {
      const { container } = render(<BadgeGroup badges={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('applies correct variant colors', () => {
      render(<BadgeGroup badges={sampleBadges} />);

      const greenBadge = screen.getByText('O(1)');
      const orangeBadge = screen.getByText('O(n)');
      const blueBadge = screen.getByText('Stable');

      expect(greenBadge).toHaveClass('bg-green-100', 'text-green-700');
      expect(orangeBadge).toHaveClass('bg-orange-100', 'text-orange-700');
      expect(blueBadge).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('applies custom className', () => {
      const { container } = render(<BadgeGroup badges={sampleBadges} className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('has list role', () => {
      render(<BadgeGroup badges={sampleBadges} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('has aria-label for list', () => {
      render(<BadgeGroup badges={sampleBadges} />);

      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Algorithm properties');
    });

    it('badges have listitem role', () => {
      render(<BadgeGroup badges={sampleBadges} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });
  });

  describe('variants', () => {
    const variants = [
      'orange',
      'amber',
      'green',
      'blue',
      'indigo',
      'purple',
      'red',
      'gray',
      'teal',
      'cyan',
      'pink',
    ] as const;

    it.each(variants)('renders %s variant correctly', (variant) => {
      render(<BadgeGroup badges={[{ label: 'Test', variant }]} />);

      const badge = screen.getByText('Test');
      expect(badge).toHaveClass(`bg-${variant}-100`, `text-${variant}-700`);
    });
  });
});
