import { render, screen } from '@testing-library/react';
import { StatusPanel } from './StatusPanel';

describe('StatusPanel', () => {
  const defaultProps = {
    description: 'Processing step',
    currentStep: 5,
    totalSteps: 10,
  };

  describe('rendering', () => {
    it('renders description', () => {
      render(<StatusPanel {...defaultProps} />);

      expect(screen.getByText('Processing step')).toBeInTheDocument();
    });

    it('renders step counter', () => {
      render(<StatusPanel {...defaultProps} />);

      expect(screen.getByText('Step 6 / 10')).toBeInTheDocument();
    });

    it('shows 1-indexed step number', () => {
      render(<StatusPanel {...defaultProps} currentStep={0} />);

      expect(screen.getByText('Step 1 / 10')).toBeInTheDocument();
    });

    it('handles last step correctly', () => {
      render(<StatusPanel {...defaultProps} currentStep={9} />);

      expect(screen.getByText('Step 10 / 10')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styling', () => {
      const { container } = render(<StatusPanel {...defaultProps} />);

      const description = container.querySelector('.text-gray-700');
      expect(description).toBeInTheDocument();
    });

    it('applies success variant styling', () => {
      const { container } = render(<StatusPanel {...defaultProps} variant="success" />);

      const description = container.querySelector('.text-green-700');
      expect(description).toBeInTheDocument();
    });

    it('applies error variant styling', () => {
      const { container } = render(<StatusPanel {...defaultProps} variant="error" />);

      const description = container.querySelector('.text-red-700');
      expect(description).toBeInTheDocument();
    });

    it('applies warning variant styling', () => {
      const { container } = render(<StatusPanel {...defaultProps} variant="warning" />);

      const description = container.querySelector('.text-orange-700');
      expect(description).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty description', () => {
      render(<StatusPanel {...defaultProps} description="" />);

      expect(screen.getByText('Step 6 / 10')).toBeInTheDocument();
    });

    it('handles long description', () => {
      const longDescription = 'This is a very long description that might wrap to multiple lines in the UI';
      render(<StatusPanel {...defaultProps} description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles description with special characters', () => {
      const specialDesc = 'Found "key" → return 42';
      render(<StatusPanel {...defaultProps} description={specialDesc} />);

      expect(screen.getByText(specialDesc)).toBeInTheDocument();
    });

    it('handles single step', () => {
      render(<StatusPanel {...defaultProps} currentStep={0} totalSteps={1} />);

      expect(screen.getByText('Step 1 / 1')).toBeInTheDocument();
    });

    it('handles many steps', () => {
      render(<StatusPanel {...defaultProps} currentStep={99} totalSteps={100} />);

      expect(screen.getByText('Step 100 / 100')).toBeInTheDocument();
    });
  });
});
