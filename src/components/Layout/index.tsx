import React from 'react';
import { Layout, Menu, Typography, Button, Tooltip } from 'antd';
import {
  RobotOutlined,
  ToolOutlined,
  DatabaseOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // 深蓝色调暗色主题
  const isDark = theme === 'dark';
  const darkBg = '#0f1a2e';
  const darkBg2 = '#0c1628';
  const darkStroke = 'rgba(255, 255, 255, 0.10)';

  const menuItems = [
    {
      key: '/agent',
      icon: <RobotOutlined />,
      label: 'Agent 管理',
    },
    {
      key: '/llm',
      icon: <DatabaseOutlined />,
      label: 'LLM 模型管理',
    },
    {
      key: '/tools',
      icon: <ToolOutlined />,
      label: '工具管理',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme={isDark ? 'dark' : 'light'}
        style={{
          boxShadow: isDark ? 'none' : '2px 0 8px rgba(0,0,0,0.06)',
          background: isDark ? darkBg : undefined,
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: `1px solid ${isDark ? darkStroke : '#f0f0f0'}`,
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
            🤖 后台系统
          </Title>
        </div>
        <Menu
          mode="inline"
          theme={isDark ? 'dark' : 'light'}
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, background: isDark ? darkBg : undefined }}
        />
      </Sider>
      <Layout style={{ background: isDark ? darkBg2 : undefined }}>
        <Header
          style={{
            background: isDark ? darkBg : '#fff',
            padding: '0 24px',
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isDark ? `1px solid ${darkStroke}` : undefined,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Xuan 管理平台
          </Title>
          <Tooltip title={isDark ? '切换到白天模式' : '切换到黑夜模式'}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ fontSize: 18 }}
            />
          </Tooltip>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: isDark ? darkBg : '#fff',
            borderRadius: 8,
            minHeight: 280,
            border: isDark ? `1px solid ${darkStroke}` : undefined,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
