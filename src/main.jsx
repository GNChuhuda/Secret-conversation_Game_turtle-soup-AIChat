import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 检测页面刷新原因
const [navigationEntry] = performance.getEntriesByType('navigation');

// 检查是否是 HMR 导致的刷新（有恢复标记且时间很近）
const hmrRecovery = sessionStorage.getItem('hmr_game_recovery');
const hmrDisconnected = sessionStorage.getItem('hmr_disconnected_at');

if (hmrRecovery && hmrDisconnected) {
  const disconnectTime = parseInt(hmrDisconnected, 10);
  const now = Date.now();
  // 如果断开时间在 30 秒内，认为是 HMR 刷新，恢复游戏状态
  if (now - disconnectTime < 30000) {
    console.log("[HMR] 检测到热更新，恢复游戏状态...");
    localStorage.setItem('pendingGameSettings', hmrRecovery);
  }
  // 清除恢复标记
  sessionStorage.removeItem('hmr_game_recovery');
  sessionStorage.removeItem('hmr_disconnected_at');
}

// 正常的页面刷新检测：如果是用户手动刷新则清除分数
if (navigationEntry && navigationEntry.type === 'reload' && !hmrRecovery) {
  localStorage.removeItem('turtleSoupCurrentScore');
  localStorage.removeItem('pendingGameSettings');
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <App />
);
