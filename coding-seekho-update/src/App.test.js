import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the LLC World sign in experience', async () => {
  render(<App />);
  expect(await screen.findByText('Welcome back')).toBeInTheDocument();
  expect(screen.getAllByText('LLC World').length).toBeGreaterThan(0);
});
