import React from 'react';
import { Modal, Descriptions } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import type { ToolDetail } from '../../types/tool';

interface DetailModalProps {
  open: boolean;
  tool: ToolDetail | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ open, tool, onClose }) => {
  if (!tool) return null;
  
  const { theme: themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <Modal
      title="工具详情"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="工具名称">{tool.name}</Descriptions.Item>
        <Descriptions.Item label="描述">{tool.description || '-'}</Descriptions.Item>
        <Descriptions.Item label="参数定义">
          <div style={{ 
            margin: 0, 
            padding: 12, 
            backgroundColor: isDark ? '#1d1d1d' : '#f5f5f5', 
            borderRadius: 4,
            maxHeight: 300,
            overflow: 'auto',
            border: `1px solid ${isDark ? '#303030' : '#d9d9d9'}`,
            color: isDark ? '#ffffff' : '#000000'
          }}>
            <pre style={{ 
              margin: 0, 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.4
            }}>
              {tool.parameters_json || '{}'}
            </pre>
          </div>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default DetailModal;