import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders LoginScreen when localStorage is clean (no auth session)', () => {
    render(<App />);
    const loginHeading = screen.getByText(/Smart Traffic Indore/i);
    expect(loginHeading).toBeInTheDocument();
    const otpButton = screen.getByText(/Send Verification OTP/i);
    expect(otpButton).toBeInTheDocument();
  });

  test('renders MainContent when localStorage has valid userEmail and authToken', () => {
    localStorage.setItem('userEmail', 'test.user@indore.gov.in');
    localStorage.setItem('authToken', 'valid_test_jwt_token_123');
    render(<App />);
    const mainHeader = screen.getByText(/Indore AI Traffic Control/i);
    expect(mainHeader).toBeInTheDocument();
  });

  test('renders LoginScreen when only userEmail is in localStorage without authToken', () => {
    localStorage.setItem('userEmail', 'test.user@indore.gov.in');
    render(<App />);
    const loginHeading = screen.getByText(/Smart Traffic Indore/i);
    expect(loginHeading).toBeInTheDocument();
  });
});
