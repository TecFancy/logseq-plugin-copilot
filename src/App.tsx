import { useEffect, useState, useRef } from 'react';

import { aiService } from './services/ai';
import { useRequest } from './hooks/useRequest';

function App() {
  // visible 控制 React 界面是否渲染（作为 Modal 弹窗）
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isInitializedRef = useRef(false);

  // Hook 示例：用于界面上的“测试连接”按钮
  const { 
    loading: connectLoading, 
    data: connectData, 
    error: connectError, 
    run: checkConnection 
  } = useRequest(aiService.checkConnection);

  // 关闭界面的通用方法
  const hideUI = () => {
    window.logseq.hideMainUI();
    setVisible(false);
  };

  useEffect(() => {
    // 浏览器调试模式兼容
    if (typeof window.logseq === 'undefined') {
      console.log('⚠️ Running in browser mode');
      setVisible(true); // 浏览器模式下默认显示，方便调试
      setMounted(true);
      return;
    }

    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initPlugin = async () => {
      console.log('✅ Logseq Copilot loaded!');

      // --- 1. 注册 Slash 命令 (集成 Mock Service) ---
      
      // 命令：总结
      window.logseq.Editor.registerSlashCommand('✨ Copilot: Summarize', async () => {
        const block = await window.logseq.Editor.getCurrentBlock();
        if (!block || !block.content) return;

        // 插入 Loading 块
        const loadingBlock = await window.logseq.Editor.insertBlock(
          block.uuid,
          "🤖 AI is thinking...",
          { sibling: false }
        );
        if (!loadingBlock) return;

        try {
          // 调用 Service
          const summary = await aiService.summarize(block.content);
          // 更新块内容
          await window.logseq.Editor.updateBlock(loadingBlock.uuid, summary);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : "Unknown error";
          await window.logseq.Editor.updateBlock(loadingBlock.uuid, `❌ Error: ${errorMsg}`);
        }
      });

      // 命令：润色
      window.logseq.Editor.registerSlashCommand('✨ Copilot: Polish', async () => {
        const block = await window.logseq.Editor.getCurrentBlock();
        if (!block || !block.content) return;

        window.logseq.UI.showMsg("Polishing content...", "success");

        try {
          // 调用 Service
          const polishedText = await aiService.polish(block.content);
          // 直接替换当前块
          await window.logseq.Editor.updateBlock(block.uuid, polishedText);
        } catch (e) {
          window.logseq.UI.showMsg("Polish failed", "error");
        }
      });

      // --- 2. 注册工具栏图标 (UI 入口) ---
      window.logseq.App.registerUIItem('toolbar', {
        key: 'copilot-btn',
        template: `
          <a data-on-click="show-copilot-ui" class="button">
            <i class="ti ti-sparkles" style="color: #6366f1;"></i>
          </a>
        `,
      });

      // --- 3. 注册 UI 事件模型 ---
      window.logseq.provideModel({
        'show-copilot-ui': () => {
          // 显示插件主界面 (iframe overlay)
          window.logseq.showMainUI();
          setVisible(true);
        },
      });

      setMounted(true);
    };

    window.logseq.ready(initPlugin).catch(console.error);

    // 监听：当用户在 Logseq 其他地方点击时，自动隐藏插件界面
    // 这是一个很好的体验优化，让插件表现得像一个原生弹窗
    // const handleOutsideClick = (e: MouseEvent) => {
    //     // 在实际 iframe 内部，如果点击了非卡片区域，也可以关闭
    //     // 这里我们在 JSX 结构中用一个 Overlay 层来处理
    // };
    
    // 如果插件 UI 隐藏了，同步 React 状态
    if (window.logseq) {
        window.logseq.on('ui:visible:changed', ({ visible }) => {
            setVisible(visible);
        });
    }

  }, []);

  // 如果不可见，为了性能可以渲染 null，或者渲染一个隐藏的空 div
  if (!visible && mounted) return null;

  return (
    // --- Overlay 层 ---
    // 这个全屏 div 负责捕捉点击事件，点击空白处关闭界面
    // 注意：onClick 需要阻止冒泡，以免点击内容时也关闭
    <div 
      className="fixed inset-0 flex justify-center items-center z-50"
      onClick={hideUI} 
      // 这里的背景色只是在调试时用，实际在 Logseq 中背景是透明的
      style={{ backgroundColor: typeof window.logseq === 'undefined' ? 'rgba(0,0,0,0.5)' : 'transparent' }} 
    >
      {/* --- 内容卡片 --- */}
      <div 
        className="max-w-sm w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all scale-100"
        onClick={(e) => e.stopPropagation()} // 阻止点击卡片关闭
      >
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="text-xl">✨</span>
              Copilot Settings
            </h2>
            <p className="text-indigo-100 text-xs mt-1 opacity-80">Mock Mode Active</p>
          </div>
          {/* Close Button */}
          <button 
            onClick={hideUI}
            className="text-white/80 hover:text-white bg-transparent p-1 border-none hover:bg-indigo-500 rounded"
          >
            ✕
          </button>
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
            Commands ready:<br/>
            <code className="bg-gray-100 px-1 rounded text-xs">/Copilot: Summarize</code><br/>
            <code className="bg-gray-100 px-1 rounded text-xs">/Copilot: Polish</code>
          </p>

          <hr className="border-gray-100 my-4"/>

          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">API Connection</span>
                {connectLoading && <span className="text-xs text-indigo-500 animate-pulse">Checking...</span>}
             </div>
             
             <button 
                onClick={() => checkConnection()}
                disabled={!mounted || connectLoading}
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all border
                  ${connectLoading 
                    ? "bg-gray-100 text-gray-400 border-transparent cursor-wait" 
                    : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm"
                  }`}
              >
                {connectLoading ? "Testing..." : "Test Connectivity"}
              </button>

              {connectData && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded border border-green-100 flex justify-between items-center">
                  <span className="font-semibold">✅ {connectData.status}</span>
                  <span className="font-mono bg-green-100 px-1 rounded">{connectData.latency}ms</span>
                </div>
              )}
              
              {connectError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100">
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
