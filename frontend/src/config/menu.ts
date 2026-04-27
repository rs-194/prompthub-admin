export interface AppMenuItem {
  path: string;
  name: string;
  title: string;
  icon?: string;
}

export const appMenus: AppMenuItem[] = [
  { path: '/dashboard', name: 'dashboard', title: '首页', icon: 'House' },
  { path: '/prompts', name: 'prompts', title: '提示词管理', icon: 'Document' },
  { path: '/knowledge', name: 'knowledge', title: '知识库管理', icon: 'Collection' },
  { path: '/models', name: 'models', title: '模型配置', icon: 'Cpu' },
  { path: '/chat-test', name: 'chat-test', title: '对话测试', icon: 'ChatLineRound' },
  { path: '/settings', name: 'settings', title: '系统设置', icon: 'Setting' }
];
