import { useState, useCallback } from 'react';

// T: 返回数据类型
// P: 参数类型数组
export function useRequest<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>
) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (...args: P) => {
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      // 可以在这里统一处理错误提示，例如 logseq.UI.showMsg
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { 
    loading, 
    data, 
    error, 
    run 
  };
}
