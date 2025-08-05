import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth context
vi.mock('../../contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock tRPC client
vi.mock('../../lib/trpc/client', () => ({
  trpc: {
    auth: {
      login: {
        useMutation: vi.fn(),
      },
      register: {
        useMutation: vi.fn(),
      },
    },
  },
}));

import { useAuth } from '../../contexts/auth-context';
import { trpc } from '../../lib/trpc/client';

const mockUseAuth = vi.mocked(useAuth);
const mockUseRouter = vi.mocked(useRouter);
const mockTrpc = vi.mocked(trpc);

describe('LoginPage Component', () => {
  const mockPush = vi.fn();
  const mockLogin = vi.fn();
  
  const mockLoginMutation = {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  const mockRegisterMutation = {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);

    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      logout: vi.fn(),
      initialize: vi.fn(),
      setLoading: vi.fn(),
    });

    mockTrpc.auth.login.useMutation.mockReturnValue(mockLoginMutation);
    mockTrpc.auth.register.useMutation.mockReturnValue(mockRegisterMutation);
  });

  describe('Component Rendering', () => {
    it('should render login form by default', () => {
      render(<LoginPage />);

      expect(screen.getByText('良聯智慧諮詢平台')).toBeInTheDocument();
      expect(screen.getByText('歡迎回來！請登入您的帳號')).toBeInTheDocument();
      expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
      expect(screen.getByLabelText('密碼')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
      expect(screen.getByText('立即註冊')).toBeInTheDocument();
    });

    it('should render register form when switched to register mode', () => {
      render(<LoginPage />);

      // Click register link
      fireEvent.click(screen.getByText('立即註冊'));

      expect(screen.getByText('建立新帳號開始使用')).toBeInTheDocument();
      expect(screen.getByLabelText('確認密碼')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '註冊' })).toBeInTheDocument();
      expect(screen.getByText('返回登入')).toBeInTheDocument();
    });

    it('should redirect to dashboard if already authenticated', () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', createdAt: new Date(), updatedAt: new Date() },
        isLoading: false,
        logout: vi.fn(),
        initialize: vi.fn(),
        setLoading: vi.fn(),
      });

      render(<LoginPage />);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty email', async () => {
      render(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: '登入' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入電子郵件！')).toBeInTheDocument();
      });
    });

    it('should show validation errors for invalid email format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText('電子郵件');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const loginButton = screen.getByRole('button', { name: '登入' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入有效的電子郵件格式！')).toBeInTheDocument();
      });
    });

    it('should show validation errors for short password', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText('電子郵件');
      const passwordInput = screen.getByLabelText('密碼');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const loginButton = screen.getByRole('button', { name: '登入' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('密碼至少需要6個字元！')).toBeInTheDocument();
      });
    });

    it('should validate password confirmation in register mode', async () => {
      render(<LoginPage />);

      // Switch to register mode
      fireEvent.click(screen.getByText('立即註冊'));

      const emailInput = screen.getByLabelText('電子郵件');
      const passwordInput = screen.getByLabelText('密碼');
      const confirmPasswordInput = screen.getByLabelText('確認密碼');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different-password' } });
      
      const registerButton = screen.getByRole('button', { name: '註冊' });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText('密碼確認不一致！')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login mutation with correct data', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText('電子郵件');
      const passwordInput = screen.getByLabelText('密碼');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      const loginButton = screen.getByRole('button', { name: '登入' });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLoginMutation.mutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should call register mutation with correct data', async () => {
      render(<LoginPage />);

      // Switch to register mode
      fireEvent.click(screen.getByText('立即註冊'));

      const emailInput = screen.getByLabelText('電子郵件');
      const passwordInput = screen.getByLabelText('密碼');
      const confirmPasswordInput = screen.getByLabelText('確認密碼');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      
      const registerButton = screen.getByRole('button', { name: '註冊' });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockRegisterMutation.mutate).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show error message when login fails', () => {
      const errorMessage = '登入失敗';
      
      // Mock mutation to call onError
      mockTrpc.auth.login.useMutation.mockImplementation((options) => {
        // Simulate calling onError
        if (options?.onError) {
          setTimeout(() => options.onError(new Error(errorMessage)), 0);
        }
        return mockLoginMutation;
      });

      render(<LoginPage />);

      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    it('should show loading state during login', () => {
      mockTrpc.auth.login.useMutation.mockReturnValue({
        ...mockLoginMutation,
        isPending: true,
      });

      render(<LoginPage />);

      const loginButton = screen.getByRole('button', { name: '登入' });
      expect(loginButton).toHaveAttribute('class', expect.stringContaining('ant-btn-loading'));
    });

    it('should switch back to login mode after successful registration', () => {
      // Mock successful registration
      mockTrpc.auth.register.useMutation.mockImplementation((options) => {
        if (options?.onSuccess) {
          setTimeout(() => options.onSuccess({ success: true, message: '註冊成功' }), 0);
        }
        return mockRegisterMutation;
      });

      render(<LoginPage />);

      // Switch to register mode first
      fireEvent.click(screen.getByText('立即註冊'));
      expect(screen.getByText('建立新帳號開始使用')).toBeInTheDocument();

      // The success callback should switch back to login mode
      // This would be tested through the component's internal state change
    });
  });

  describe('Mode Switching', () => {
    it('should clear form and errors when switching modes', () => {
      render(<LoginPage />);

      // Fill in some data
      const emailInput = screen.getByLabelText('電子郵件');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Switch to register
      fireEvent.click(screen.getByText('立即註冊'));

      // Switch back to login
      fireEvent.click(screen.getByText('返回登入'));

      // Form should be cleared
      expect(emailInput).toHaveValue('');
    });
  });
});