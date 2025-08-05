'use client';

import React from 'react';
import { Layout, Typography, Button, Card, Space } from 'antd';
import { LogoutOutlined, UserOutlined, DatabaseOutlined, MessageOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/auth-context';
import { useRouter } from 'next/navigation';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    try {
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout fails
      router.push('/login');
    }
  };

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <Space direction="vertical" align="center">
          <div style={{ fontSize: '24px' }}>載入中...</div>
        </Space>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1677ff' }}>
          良聯智慧諮詢平台
        </Title>
        <Space>
          <Text>
            <UserOutlined /> {user.email}
          </Text>
          <Button 
            type="text" 
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            登出
          </Button>
        </Space>
      </Header>

      <Layout>
        <Sider 
          width={250} 
          style={{ 
            background: '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <div style={{ padding: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="text" 
                icon={<DatabaseOutlined />}
                style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                資料集列表
              </Button>
              <Button 
                type="text" 
                icon={<MessageOutlined />}
                style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
              >
                智慧問答
              </Button>
            </Space>
          </div>
        </Sider>

        <Content style={{ padding: '24px', background: '#f5f5f5' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Title level={2}>歡迎使用良聯智慧諮詢平台</Title>
                <Text type="secondary">
                  您已成功登入系統。這裡是您的主儀表板，您可以從左側選單存取各項功能。
                </Text>
              </Card>

              <Card title="快速開始">
                <Space direction="vertical" size="middle">
                  <div>
                    <Title level={4}>📁 資料集管理</Title>
                    <Text>上傳並管理您的文件資料集，系統會自動進行向量化處理。</Text>
                  </div>
                  <div>
                    <Title level={4}>🤖 智慧問答</Title>
                    <Text>使用自然語言詢問您的資料，獲得精準且附有來源的答案。</Text>
                  </div>
                </Space>
              </Card>

              <Card title="系統狀態">
                <Space direction="vertical" size="small">
                  <Text>✅ 使用者認證：正常</Text>
                  <Text>✅ 資料庫連接：正常</Text>
                  <Text>⏳ RAG 服務：準備中</Text>
                </Space>
              </Card>
            </Space>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}