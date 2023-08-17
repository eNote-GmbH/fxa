import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './header';

describe('Example Header', () => {
  it('renders the example header', () => {
    render(<Header />);

    const exampleHeader = screen.getByTestId('header');

    expect(exampleHeader).toBeVisible();
  });
});
