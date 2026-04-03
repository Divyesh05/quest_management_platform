import { describe, it, expect } from 'vitest';
import { Input } from '@/components/ui/input';
import { render, screen } from '@testing-library/react';

describe('Input', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });
});
