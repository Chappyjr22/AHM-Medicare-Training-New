import React from 'react';
import { render, screen } from '@testing-library/react';
import MedicareTrainingApp from '../../medicare_welcome_slides (4)';

describe('MedicareTrainingApp', () => {
  test('renders without crashing', () => {
    render(<MedicareTrainingApp />);
    const heading = screen.getByText(/Welcome to the Medicare Training Program/i);
    expect(heading).toBeInTheDocument();
  });
});
