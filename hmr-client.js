if (import.meta.hot) {
  // 在 HMR 更新前保存游戏状态
  import.meta.hot.on("vite:beforeUpdate", () => {
    // 将当前游戏状态保存到 sessionStorage，避免刷新后丢失
    const gameState = localStorage.getItem('pendingGameSettings');
    if (gameState) {
      sessionStorage.setItem('hmr_game_recovery', gameState);
    }
  });

  import.meta.hot.on("vite:error", (error) => {
    console.log("hmr-error", error);
    // 保存当前路由和状态，便于恢复
    sessionStorage.setItem('hmr_last_path', window.location.hash);
    window.parent.postMessage(
      {
        type: "hmr-error",
        data: {
          error: error,
        },
      },
      "*"
    );
  });
  
  import.meta.hot.on("vite:afterUpdate", (update) => {
    console.log("hmr-update-complete", update);
    window.parent.postMessage(
      {
        type: "hmr-update-complete"
      },
      "*"
    );
  });
  
  // 处理连接断开
  import.meta.hot.on("vite:disconnect", () => {
    console.warn("[HMR] 服务器连接断开，尝试保存状态...");
    // 保存当前游戏进度到 sessionStorage
    const pendingSettings = localStorage.getItem('pendingGameSettings');
    if (pendingSettings) {
      sessionStorage.setItem('hmr_game_recovery', pendingSettings);
    }
    sessionStorage.setItem('hmr_disconnected_at', Date.now().toString());
  });
  
  // 连接成功恢复
  import.meta.hot.on("vite:connect", () => {
    console.log("[HMR] 服务器已连接");
    sessionStorage.removeItem('hmr_disconnected_at');
  });
}
