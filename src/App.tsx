import { useEffect, useState, useRef } from 'react';
import { aiService } from './services';
import { useRequest } from './hooks';

function App() {
  const [mounted, setMounted] = useState(false);
  // 使用 ref 来确保 logseq.ready 只被调用一次 (解决 React StrictMode 问题)
  const isInitializedRef = useRef(false);

   // 使用 useRequest 管理 "检查连接" 的状态
  // 当点击按钮时，调用 run() 触发 aiService.checkConnection
  const { 
    loading: connectLoading, 
    data: connectData, 
    error: connectError, 
    run: checkConnection 
  } = useRequest(aiService.checkConnection);

  useEffect(() => {
    // 如果已经在浏览器环境但没有 logseq 对象（比如在 Chrome 直接打开），直接标记为 mounted 以便调试 UI
    if (typeof window.logseq === 'undefined') {
      console.log('⚠️ Running in browser mode (no Logseq API found)');
      setMounted(true);
      return;
    }

    // 防止重复初始化
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Attempting to connect to Logseq...');

    const initPlugin = async () => {
      console.log('✅ Logseq Copilot loaded via Vite!');

      // --- 注册 Slash 命令 ---

      // 1. 总结
      try {
        logseq.Editor.registerSlashCommand('✨ Copilot: Summarize', async () => {
          const block = await logseq.Editor.getCurrentBlock();
          if (!block) return;

          await logseq.Editor.insertBlock(
            block.uuid,
            "🤖 Vite AI: Summarizing block... (This is a test)",
            { sibling: false }
          );
        });
        console.log('Command [Summarize] registered.');

        // 2. 润色
        logseq.Editor.registerSlashCommand('✨ Copilot: Polish', async () => {
          const block = await logseq.Editor.getCurrentBlock();
          if (!block) return;

          await logseq.Editor.updateBlock(
            block.uuid,
            `${block.content}\n\n(Polished by Vite Plugin ⚡️)`
          );
        });
        console.log('Command [Polish] registered.');

        // 成功连接后更新 UI 状态
        setMounted(true);

        // 可选：弹出一个提示，确认插件加载成功 (仅调试用)
        // logseq.UI.showMsg('Copilot Plugin Loaded Successfully!');

      } catch (e) {
        console.error('Failed to register commands', e);
      }
    };

    // 启动 Logseq
    // 注意：这里不需要 catch console.error，因为某些 Logseq 版本会因为 console 上下文报错
    window.logseq.ready(initPlugin).catch((e: any) => {
      console.error('Logseq ready error:', e);
    });

  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-gray-800 font-sans">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="text-xl">✨</span>
            Copilot Settings
          </h2>
          <p className="text-indigo-100 text-xs mt-1 opacity-80">Mock Mode Active</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className={`w-3 h-3 rounded-full shadow-sm transition-colors duration-500 ${mounted ? "bg-green-500 animate-pulse" : "bg-yellow-400"}`}></div>
            <span className="text-sm font-medium text-gray-600">
              {mounted ? "Plugin Connected" : "Connecting..."}
            </span>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Registered Commands: <br/>
            <b>/Copilot: Summarize</b><br/>
            <b>/Copilot: Polish</b>
          </p>

          <hr className="border-gray-100 my-4"/>

          {/* 测试区域：展示 useRequest Hook 的效果 */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Service Test</span>
                {connectLoading && <span className="text-xs text-indigo-500 animate-pulse">Checking API...</span>}
             </div>
             
             {/* 按钮：绑定 checkConnection (即 useRequest 的 run 方法) */}
             <button 
                onClick={() => checkConnection()}
                disabled={!mounted || connectLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all
                  ${connectLoading 
                    ? "bg-gray-100 text-gray-400 cursor-wait" 
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                  }`}
              >
                {connectLoading ? "Testing Connection..." : "Test AI Connectivity"}
              </button>

              {/* 结果展示：根据 Hook 返回的 data 和 error 渲染 */}
              {connectData && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded border border-green-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                  <span className="font-semibold">✅ {connectData.status}</span>
                  <span className="font-mono bg-green-100 px-1 rounded">{connectData.latency}ms</span>
                </div>
              )}
              
              {connectError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <b>Error:</b> {connectError.message}
                </div>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
