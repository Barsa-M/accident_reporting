import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import IncidentRouter from '../routes/IncidentRouter';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    currentUser: { uid: 'test-user-id' },
    loading: false
  })
}));

// Mock the incident service
jest.mock('../services/incidentService', () => ({
  createIncident: jest.fn(),
  getIncidents: jest.fn(),
  getIncidentById: jest.fn(),
  updateIncidentStatus: jest.fn()
}));

describe('IncidentRouter', () => {
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render the incident form by default', () => {
    renderWithRouter(<IncidentRouter />);
    expect(screen.getByText(/Report an Incident/i)).toBeInTheDocument();
  });

  it('should navigate to incident list', async () => {
    renderWithRouter(<IncidentRouter />);
    
    const listLink = screen.getByText(/View Incidents/i);
    fireEvent.click(listLink);
    
    await waitFor(() => {
      expect(screen.getByText(/Active Incidents/i)).toBeInTheDocument();
    });
  });

  it('should navigate to incident details', async () => {
    const mockIncident = {
      id: 'test-id',
      type: 'fire',
      status: 'pending'
    };

    const { getIncidentById } = require('../services/incidentService');
    getIncidentById.mockResolvedValueOnce(mockIncident);

    renderWithRouter(<IncidentRouter />);
    
    // Navigate to incident list first
    const listLink = screen.getByText(/View Incidents/i);
    fireEvent.click(listLink);
    
    // Wait for the list to load and click on an incident
    await waitFor(() => {
      const incidentLink = screen.getByText(/test-id/i);
      fireEvent.click(incidentLink);
    });
    
    // Check if we're on the details page
    await waitFor(() => {
      expect(screen.getByText(/Incident Details/i)).toBeInTheDocument();
    });
  });

  it('should handle 404 for non-existent incidents', async () => {
    const { getIncidentById } = require('../services/incidentService');
    getIncidentById.mockRejectedValueOnce(new Error('Not found'));

    renderWithRouter(<IncidentRouter />);
    
    // Navigate to a non-existent incident
    window.history.pushState({}, '', '/incidents/non-existent');
    
    await waitFor(() => {
      expect(screen.getByText(/404/i)).toBeInTheDocument();
    });
  });
}); 