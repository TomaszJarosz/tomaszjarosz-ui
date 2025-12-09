import { render, screen } from '@testing-library/react';
import { Legend, type LegendItem } from './Legend';

describe('Legend', () => {
  const defaultItems: LegendItem[] = [
    { color: 'bg-blue-500', label: 'Current' },
    { color: 'bg-green-400', label: 'Found' },
    { color: 'bg-red-400', label: 'Not found' },
  ];

  describe('rendering', () => {
    it('renders all legend items', () => {
      render(<Legend items={defaultItems} />);

      expect(screen.getByText('Current')).toBeInTheDocument();
      expect(screen.getByText('Found')).toBeInTheDocument();
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });

    it('renders color boxes for each item', () => {
      const { container } = render(<Legend items={defaultItems} />);

      const colorBoxes = container.querySelectorAll('.w-3.h-3.rounded');
      expect(colorBoxes).toHaveLength(3);
    });

    it('applies color classes to boxes', () => {
      const { container } = render(<Legend items={defaultItems} />);

      const colorBoxes = container.querySelectorAll('.w-3.h-3.rounded');
      expect(colorBoxes[0]).toHaveClass('bg-blue-500');
      expect(colorBoxes[1]).toHaveClass('bg-green-400');
      expect(colorBoxes[2]).toHaveClass('bg-red-400');
    });

    it('applies border style when provided', () => {
      const itemsWithBorder: LegendItem[] = [
        { color: 'bg-blue-50', label: 'Highlighted', border: '#60a5fa' },
      ];

      const { container } = render(<Legend items={itemsWithBorder} />);

      const colorBox = container.querySelector('.w-3.h-3.rounded');
      expect(colorBox).toHaveAttribute('style', expect.stringContaining('border'));
    });

    it('shows keyboard hints by default', () => {
      render(<Legend items={defaultItems} />);

      expect(screen.getByText(/P.*\[.*\].*R/)).toBeInTheDocument();
    });

    it('hides keyboard hints when showKeyboardHints is false', () => {
      render(<Legend items={defaultItems} showKeyboardHints={false} />);

      expect(screen.queryByText(/P.*\[.*\].*R/)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders keyboard hints even with no items', () => {
      render(<Legend items={[]} />);

      expect(screen.getByText(/P.*\[.*\].*R/)).toBeInTheDocument();
    });
  });

  describe('single item', () => {
    it('renders correctly with single item', () => {
      const singleItem: LegendItem[] = [{ color: 'bg-yellow-400', label: 'Processing' }];

      render(<Legend items={singleItem} />);

      expect(screen.getByText('Processing')).toBeInTheDocument();
    });
  });

  describe('many items', () => {
    it('renders correctly with many items', () => {
      const manyItems: LegendItem[] = [
        { color: 'bg-blue-500', label: 'Item 1' },
        { color: 'bg-green-500', label: 'Item 2' },
        { color: 'bg-red-500', label: 'Item 3' },
        { color: 'bg-yellow-500', label: 'Item 4' },
        { color: 'bg-purple-500', label: 'Item 5' },
      ];

      render(<Legend items={manyItems} />);

      manyItems.forEach((item) => {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      });
    });
  });
});
