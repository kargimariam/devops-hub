import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API calls used by the app flows.
    (global.fetch as any) = vi.fn((url: string, options?: RequestInit) => {
      if (url === '/api/projects' && (!options || options.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: '1', name: 'Test Project', status: 'Active', description: 'Test Desc' }
          ]),
        });
      }
      if (url === '/api/health') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy', timestamp: new Date().toISOString(), uptime: 123 }),
        });
      }
      if (url === '/api/projects/1') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: '1',
            name: 'Test Project',
            status: 'Active',
            description: 'Test Desc',
          }),
        });
      }
      if (url === '/api/projects' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'new-id',
            name: 'Created Project',
            status: 'Pending',
            description: 'Created from test',
          }),
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('renders progress management dashboard correctly', async () => {
    render(<App />);
    const linkElement = screen.getByText(/DevOps Hub/i);
    expect(linkElement).toBeInTheDocument();
    
    // Wait for the mocked data to appear
    await waitFor(() => {
      expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/projects');
  });

  it('renders the "New Project" button', () => {
    render(<App />);
    const buttonElement = screen.getByText(/New Project/i);
    expect(buttonElement).toBeInTheDocument();
  });

  it('navigates to project details when "View Details" is clicked', async () => {
    render(<App />);

    const detailsLink = await screen.findByRole('link', { name: /view details/i });
    fireEvent.click(detailsLink);

    await waitFor(() => {
      expect(screen.getByText(/project overview/i)).toBeInTheDocument();
      expect(screen.getByText(/project id/i)).toBeInTheDocument();
    });
  });

  it('submits new project form and calls POST endpoint', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('link', { name: /new project/i }));
    expect(await screen.findByText(/register new project/i)).toBeInTheDocument();

    fireEvent.change(document.getElementById('project-name') as HTMLInputElement, {
      target: { value: 'Created Project' },
    });
    fireEvent.change(document.getElementById('project-desc') as HTMLTextAreaElement, {
      target: { value: 'Created from test' },
    });

    fireEvent.click(screen.getByRole('button', { name: /deploy project/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Created Project',
            description: 'Created from test',
            status: 'Pending',
          }),
        }),
      );
    });
  });
});
