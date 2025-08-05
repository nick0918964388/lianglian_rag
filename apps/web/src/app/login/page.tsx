'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, Alert, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { trpc } from '../../lib/trpc/client';
import { useAuth } from '../../contexts/auth-context';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');

  // Get redirect parameter from URL
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  // tRPC mutations
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.success && data.token && data.user) {
        // Convert user data to match our User interface
        const user = {
          id: data.user.id,
          email: data.user.email,
          createdAt: new Date(data.user.createdAt),
          updatedAt: new Date(data.user.updatedAt),
        };
        
        login(data.token, user);
        router.push(redirectTo);
      } else {
        setError(data.message || '登入失敗');
      }
    },
    onError: (error) => {
      setError(error.message || '網路錯誤，請稍後再試');
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setError('');
        setIsLogin(true);
        form.resetFields();
        // Clear any existing error and show success message
        setTimeout(() => {
          setError('註冊成功！請登入您的帳號。');
        }, 100);
      } else {
        setError(data.message || '註冊失敗');
      }
    },
    onError: (error) => {
      console.error('Registration error:', error);
      setError(error.message || '註冊失敗，請稍後再試');
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    setError('');
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setError('');
    
    // Client-side validation for password confirmation
    if (values.password !== values.confirmPassword) {
      setError('密碼確認不一致');
      return;
    }

    // Additional client-side validation
    if (values.password.length < 6) {
      setError('密碼至少需要6個字元');
      return;
    }

    registerMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    form.resetFields();
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '400px' }}>
        <Col span={24}>
          <Card
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <div>
                <Title level={2} style={{ marginBottom: '8px', color: '#1677ff' }}>
                  良聯智慧諮詢平台
                </Title>
                <Text type="secondary">
                  {isLogin ? '歡迎回來！請登入您的帳號' : '建立新帳號開始使用'}
                </Text>
              </div>

              {error && (
                <Alert
                  message={error}
                  type={error.includes('成功') ? 'success' : 'error'}
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
              )}

              <Form
                form={form}
                name={isLogin ? 'login' : 'register'}
                onFinish={isLogin ? handleLogin : handleRegister}
                layout="vertical"
                size="large"
                autoComplete="off"
              >
                <Form.Item
                  name="email"
                  label="電子郵件"
                  rules={[
                    { required: true, message: '請輸入電子郵件！' },
                    { type: 'email', message: '請輸入有效的電子郵件格式！' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="請輸入電子郵件"
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="密碼"
                  rules={[
                    { required: true, message: '請輸入密碼！' },
                    { min: 6, message: '密碼至少需要6個字元！' },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="請輸入密碼"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                </Form.Item>

                {!isLogin && (
                  <Form.Item
                    name="confirmPassword"
                    label="確認密碼"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '請確認密碼！' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('密碼確認不一致！'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="請再次輸入密碼"
                      autoComplete="new-password"
                    />
                  </Form.Item>
                )}

                <Form.Item style={{ marginBottom: '16px' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    style={{ width: '100%', height: '48px' }}
                  >
                    {isLogin ? '登入' : '註冊'}
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  {isLogin ? '還沒有帳號？' : '已經有帳號了？'}
                </Text>
                <Button type="link" onClick={switchMode} style={{ padding: '0 8px' }}>
                  {isLogin ? '立即註冊' : '返回登入'}
                </Button>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}