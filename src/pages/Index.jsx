import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Gamepad2, History, Trophy, Brain, Ghost, Laugh, Skull, Zap, Sparkles, RotateCcw } from "lucide-react";
import { DIFFICULTY_LEVELS, PUZZLE_TYPES } from "@/lib/qwenClient";

// 分类图标映射
const CATEGORY_ICONS = {
  humor: Laugh,
  horror: Ghost,
  psycho: Skull,
  logic: Brain,
  twist: Zap,
};

const Index = () => {
  const navigate = useNavigate();
  const [currentScore, setCurrentScore] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hasPendingGame, setHasPendingGame] = useState(false);
  const [pendingGameInfo, setPendingGameInfo] = useState(null);

  // 从localStorage读取当前分数和检查是否有未完成的游戏
  useEffect(() => {
    const stored = localStorage.getItem('turtleSoupCurrentScore');
    if (stored) {
      setCurrentScore(parseInt(stored, 10));
    }
    
    // 检查是否有未完成的游戏记录（从历史记录中找最近的一条）
    try {
      const historyStr = localStorage.getItem("turtleSoupHistory");
      if (historyStr) {
        const history = JSON.parse(historyStr);
        if (history.length > 0) {
          const lastGame = history[0];
          // 如果最近的游戏是未破解的，且是今天内的，认为是可能想继续的
          const gameDate = new Date(lastGame.date);
          const now = new Date();
          const isToday = gameDate.toDateString() === now.toDateString();
          
          if (!lastGame.cracked && isToday) {
            setHasPendingGame(true);
            setPendingGameInfo(lastGame);
          }
        }
      }
    } catch {
      // 忽略解析错误
    }
  }, []);

  // 开始游戏
  const handleStartGame = () => {
    // 存储游戏设置到localStorage，Game页面会读取并自动开始
    const gameSettings = {
      difficulty: selectedDifficulty,
      category: selectedCategory,
      autoStart: true,
      timestamp: Date.now(),
    };
    localStorage.setItem('pendingGameSettings', JSON.stringify(gameSettings));
    navigate('/game');
  };

  // 继续上一局
  const handleContinueGame = () => {
    if (pendingGameInfo) {
      // 使用上一局的设置开始新游戏（因为无法真正继续，只能重新开始同类型题目）
      const gameSettings = {
        difficulty: pendingGameInfo.difficulty || 'medium',
        category: pendingGameInfo.category,
        autoStart: true,
        timestamp: Date.now(),
      };
      localStorage.setItem('pendingGameSettings', JSON.stringify(gameSettings));
      navigate('/game');
    }
  };

  // 清零分数
  const handleResetScore = () => {
    if (confirm('确定要清零当前分数吗？')) {
      localStorage.removeItem('turtleSoupCurrentScore');
      setCurrentScore(0);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-amber-800">
            🐢 大侦探海龟汤
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-center leading-relaxed">
            欢迎来到海龟汤推理游戏！AI会生成一个看似奇怪的情境（汤面），
            你需要通过提问来推理出背后的真相（汤底）。AI只能回答"是"、"否"或"无关"。
          </p>
          
          {/* 当前分数显示 */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-lg border-2 border-amber-300">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-600" />
              <span className="text-amber-800 font-bold text-lg">当前分数：</span>
              <span className="text-3xl font-bold text-amber-600">{currentScore}</span>
            </div>
            <p className="text-xs text-amber-600 text-center mt-1">
              只有刷新页面才会清零分数
              {currentScore > 0 && (
                <button 
                  onClick={handleResetScore}
                  className="ml-2 text-red-500 hover:text-red-700 underline"
                >
                  手动清零
                </button>
              )}
            </p>
          </div>

          {/* 继续游戏按钮（如果有未完成的游戏） */}
          {hasPendingGame && (
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
              <p className="text-blue-800 font-medium text-center mb-2">
                📌 你有未完成的游戏
              </p>
              <p className="text-xs text-blue-600 text-center mb-3">
                上次玩了 {pendingGameInfo.rounds} 轮，{pendingGameInfo.difficulty === 'easy' ? '简单' : pendingGameInfo.difficulty === 'hard' ? '困难' : '中等'}难度
              </p>
              <Button
                onClick={handleContinueGame}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                继续同类型游戏
              </Button>
            </div>
          )}

          {/* 难度选择 */}
          <div className="space-y-3">
            <p className="font-medium text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              选择难度
            </p>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(DIFFICULTY_LEVELS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDifficulty(key)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedDifficulty === key
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <p className={`font-bold text-sm ${
                    selectedDifficulty === key ? "text-amber-700" : "text-gray-700"
                  }`}>
                    {config.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 题目类型选择 */}
          <div className="space-y-3">
            <p className="font-medium text-gray-700 flex items-center gap-2">
              <Ghost className="w-4 h-4 text-purple-500" />
              题目类型
              <span className="text-xs font-normal text-gray-400 ml-auto">不选则随机</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PUZZLE_TYPES).map(([key, config]) => {
                const Icon = CATEGORY_ICONS[key] || Sparkles;
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(isSelected ? null : key)}
                    className={`p-3 rounded-lg border-2 text-left transition-all flex items-start gap-2 ${
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? "text-purple-600" : "text-gray-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${isSelected ? "text-purple-700" : "text-gray-700"}`}>
                        {config.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{config.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedCategory && (
              <p className="text-xs text-purple-600 bg-purple-50 p-2 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                已选择「{PUZZLE_TYPES[selectedCategory].name}」类型
              </p>
            )}
          </div>
          
          {/* 计分规则 */}
          <div className="bg-amber-50 p-4 rounded-lg text-sm">
            <p className="font-medium text-amber-800 mb-2">计分规则（{DIFFICULTY_LEVELS[selectedDifficulty].name}）</p>
            <div className="space-y-1 text-amber-700">
              <p>🥇 {DIFFICULTY_LEVELS[selectedDifficulty].maxRoundsForFullScore}轮内破解：+3分</p>
              <p>🥈 {DIFFICULTY_LEVELS[selectedDifficulty].maxRoundsForFullScore * 2}轮内破解：+2分</p>
              <p>🥉 更多轮数：+1分</p>
              <p>🏳️ 投降：0分</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-700" 
              size="lg"
              onClick={handleStartGame}
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              开始游戏
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/history')}
            >
              <History className="w-4 h-4 mr-2" />
              历史记录
            </Button>
          </div>
          
          <Badge variant="secondary" className="w-full justify-center py-2">
            接入千问API智能推理
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
