// 模拟 AI 服务
export const aiService = {
  // 模拟总结功能
  summarize: async (text: string): Promise<string> => {
    console.log('[Mock AI] Summarizing:', text);
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟 AI 返回的 Markdown 格式总结
        resolve(
          `**AI Summary**:\n\n` +
          `- The input text was about: "${text.slice(0, 15)}..."\n` +
          `- Key point extracted successfully.\n` +
          `- This is a mock response from the specialized AI service.`
        );
      }, 1500); // 模拟 1.5s 网络延迟
    });
  },

  // 模拟润色功能
  polish: async (text: string): Promise<string> => {
    console.log('[Mock AI] Polishing:', text);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`${text}\n\n✨ (Polished: The text has been refined for better clarity and professional tone.)`);
      }, 1000);
    });
  },

  // 模拟检查连接（用于 UI 测试 Hook）
  checkConnection: async (): Promise<{ status: string; latency: number }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟 90% 成功率
        if (Math.random() > 0.1) {
          resolve({ status: 'ok', latency: 42 });
        } else {
          reject(new Error('Connection timeout'));
        }
      }, 800);
    });
  }
};
