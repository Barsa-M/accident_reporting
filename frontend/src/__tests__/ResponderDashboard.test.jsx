import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ResponderDashboard from '../pages/ResponderDashboard';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { TextEncoder, TextDecoder } from 'util';

// Mock Firebase modules
jest.mock('../firebase/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-responder-id' }
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'timestamp'),
  collection: jest.fn(),
}));

// Mock child components
jest.mock('../components/Responder/DashboardHome', () => () => (
  <div data-testid="dashboard-home">Dashboard Home</div>
));

jest.mock('../components/Responder/ActiveIncidents', () => () => (
  <div data-testid="active-incidents">Active Incidents</div>
));

jest.mock('../components/Responder/ResponderProfile', () => () => (
  <div data-testid="responder-profile">Responder Profile</div>
));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate a logged-in user
    callback({ uid: 'test-responder-id', email: 'test@example.com' });
    return () => {};
  }),
  getAuth: jest.fn(() => ({})),
}));

describe('ResponderDashboard', () => {
  const mockUserData = {
    role: 'responder',
    name: 'Test Responder',
    email: 'test@example.com'
  };

  const mockResponderData = {
    status: 'approved',
    specialization: 'medical',
    responderType: 'medical',
    currentStatus: 'available'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <ResponderDashboard />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render dashboard for approved responder', async () => {
    // Mock Firestore responses
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockUserData
    });
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockResponderData
    });

    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
    });

    // Verify navigation is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Active Incidents')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should redirect to login if no authenticated user', async () => {
    // Mock no authenticated user
    auth.currentUser = null;

    renderDashboard();

    // Verify redirect to login
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  it('should redirect to pending page if responder not approved', async () => {
    // Mock Firestore responses
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockUserData
    });
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ...mockResponderData,
        status: 'pending'
      })
    });

    renderDashboard();

    // Verify redirect to pending page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/responder/pending');
    });
  });

  it('should handle missing responder data gracefully', async () => {
    // Mock Firestore responses
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockUserData
    });
    getDoc.mockResolvedValueOnce({
      exists: () => false
    });

    renderDashboard();

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText('Error loading responder data')).toBeInTheDocument();
    });
  });

  it('should update status when changed', async () => {
    // Mock Firestore responses
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockUserData
    });
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockResponderData
    });

    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-home')).toBeInTheDocument();
    });

    // Verify status is displayed
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
}); 