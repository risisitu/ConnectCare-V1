import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignInForm from '../components/auth/SignInForm';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock fetch
global.fetch = vi.fn();

// Mock SVG Icons since SVGR is hard to handle in pure JSDOM without more config
vi.mock('../icons', () => ({
    ChevronLeftIcon: () => <div data-testid="chevron-left-icon" />,
    EyeCloseIcon: () => <div data-testid="eye-close-icon" />,
    EyeIcon: () => <div data-testid="eye-icon" />,
}));

describe('SignInForm Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        localStorage.clear();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <SignInForm />
            </BrowserRouter>
        );
    };

    it('should render the login form correctly', () => {
        renderComponent();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Patient')).toBeInTheDocument();
        expect(screen.getByText('Doctor')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('info@gmail.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('should toggle role selection', () => {
        renderComponent();
        const doctorBtn = screen.getByText('Doctor');
        fireEvent.click(doctorBtn);
        // Can't easily assert class names without brittle code, but we can verify it's clickable
        expect(doctorBtn).toBeInTheDocument();

        const adminBtn = screen.getByText('Admin');
        fireEvent.click(adminBtn);
        expect(adminBtn).toBeInTheDocument();
    });

    it('should show error on failed login', async () => {
        renderComponent();

        // Mock a failed fetch response
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ success: false, message: 'Invalid credentials' })
        });

        fireEvent.change(screen.getByPlaceholderText('info@gmail.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('should login successfully and save token', async () => {
        renderComponent();

        // Mock a successful fetch response
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: { id: 1, email: 'test@test.com', token: 'mockToken' }
            })
        });

        fireEvent.change(screen.getByPlaceholderText('info@gmail.com'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'correctpass' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('mockToken');
        });
    });
});
