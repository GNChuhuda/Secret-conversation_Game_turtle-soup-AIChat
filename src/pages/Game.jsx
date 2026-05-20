
import { useState, useEffect } from "react";
import { useTurtleSoup } from "@/hooks/useTurtleSoup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Send, Flag, RotateCcw, Trophy, AlertCircle, WifiOff, Bot, User, Sparkles, ExternalLink, Ghost, Laugh, Brain, Zap, Skull, Home, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// 分类图标映射
const CATEGORY_ICONS = {
  humor: Laugh,
  horror: Ghost,
  psycho: Skull,
  logic: Brain,
  twist: Zap,
};

// 分类颜色映射
const CATEGORY_COLORS = {
  humor: "bg-yellow-100 text-yellow-800 border-yellow-300",
  horror: "bg-purple-100 text-purple-800 border-purple-300",
  psycho: "bg-red-100 text-red-800 border-red-300",
  logic: "bg-blue-100 text-blue-800 border-blue-300",
  twist: "bg-green-100 text-green-800 border-green-300",
};

const Game = () => {
  const navigate = useNavigate();
  const {
    gameState,
    puzzle,
    history,
    rounds,
    score,
    loading,
    error,
    difficulty,
    category,
    usingDefaultPuzzle,
    lastAnswerFromAI,
    DIFFICULTY_LEVELS,
    PUZZLE_TYPES,
    startGame,
    startWithDefaultPuzzle,
    askQuestion,
    submitAnswer,
    surrender,
    resetGame,
  } = useTurtleSoup();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showTruth, setShowTruth] = useState(false);
  const [crackResult, setCrackResult] = useState(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const [hmrRecovered, setHmrRecovered] = useState(false);

  // 组件加载时检查是否有待开始的游戏设置
  useEffect(() => {
    if (autoStarted) return;
    
    const pendingSettings = localStorage.getItem('pendingGameSettings');
    if (pendingSettings && gameState === "idle") {
      try {
        const settings = JSON.parse(pendingSettings);
        // 检查设置是否过期（30分钟内有效，给HMR恢复留足够时间）
        if (Date.now() - settings.timestamp < 30 * 60 * 1000) {
          setAutoStarted(true);
          setHmrRecovered(true);
          // 清除设置避免重复开始
          localStorage.removeItem('pendingGameSettings');
          // 自动开始游戏
          if (settings.difficulty || settings.category) {
            startGame(settings.difficulty, settings.category);
            toast.success("已自动恢复之前的游戏设置", { duration: 2000 });
          } else {
            startGame();
          }
        } else {
          localStorage.removeItem('pendingGameSettings');
          // 设置过期，自动跳转到首页
          navigate('/');
        }
      } catch (e) {
        console.error("解析游戏设置失败:", e);
        localStorage.removeItem('pendingGameSettings');
        // 解析失败，跳转到首页
        navigate('/');
      }
    } else if (gameState === "idle" && !pendingSettings && !loading) {
      // 没有待开始的设置且不在加载中，自动跳转到首页
      navigate('/');
    }
  }, [gameState, startGame, autoStarted, navigate, loading]);

  // 监听 HMR 恢复标记
  useEffect(() => {
    const checkHmrRecovery = () => {
      const recovered = sessionStorage.getItem('hmr_just_recovered');
      if (recovered) {
        setHmrRecovered(true);
        sessionStorage.removeItem('hmr_just_recovered');
        toast.success("开发服务器已重连，游戏状态已恢复", { duration: 3000 });
      }
    };
    checkHmrRecovery();
  }, []);

  // 提问处理
  const handleAsk = async () => {
    if (!question.trim()) return;
    const result = await askQuestion(question);
    setQuestion("");
    
    // 显示AI回答来源提示
    if (result.fromAI) {
      toast.success("千问AI已回答", { duration: 1500 });
    }
  };

  // 提交真相
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    const result = await submitAnswer(answer);
    setCrackResult(result);
    
    if (result.cracked) {
      const aiBadge = result.fromAI ? "（千问判定）" : "";
      toast.success(`恭喜破解${aiBadge}！获得 ${result.score} 分`);
      setShowTruth(true);
    } else {
      toast.info(`破解度 ${result.percentage}%，再接再厉！`);
    }
  };

  // 投降
  const handleSurrender = () => {
    surrender();
    setShowTruth(true);
    toast.info("已投降，查看真相");
  };

  // 返回首页（新游戏）
  const handleNewGame = () => {
    resetGame();
    navigate('/');
  };

  // 判断是否为账户相关错误
  const isAccountError = error && (
    error.includes("账户") || 
    error.includes("欠费") || 
    error.includes("API密钥") ||
    error.includes("Access denied")
  );

  // 获取分类图标
  const getCategoryIcon = (catKey) => {
    const Icon = CATEGORY_ICONS[catKey] || Sparkles;
    return <Icon className="w-4 h-4" />;
  };

  // 获取分类颜色
  const getCategoryColor = (catKey) => {
    return CATEGORY_COLORS[catKey] || "bg-gray-100 text-gray-800";
  };

  // 空闲状态 - 显示加载中或自动跳转
  if (gameState === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-amber-800">
              🐢 准备开始
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              {loading ? "正在加载游戏..." : "正在跳转到首页..."}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {loading ? (
              <div className="py-8">
                <Loader2 className="animate-spin w-8 h-8 mx-auto text-amber-600 mb-4" />
                <p className="text-gray-600">正在连接千问AI生成题目...</p>
                {hmrRecovered && (
                  <p className="text-xs text-amber-600 mt-2">正在恢复之前的游戏...</p>
                )}
              </div>
            ) : (
              <div className="py-8">
                <Loader2 className="animate-spin w-8 h-8 mx-auto text-amber-600 mb-4" />
                <p className="text-gray-600">正在跳转到首页...</p>
              </div>
            )}

            {/* 显示API连接错误 */}
            {error && (
              <Alert variant="destructive" className="text-left mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {isAccountError ? "千问API账户异常" : "千问API连接失败"}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p className="text-sm">{error}</p>
                  
                  {isAccountError && (
                    <div className="bg-red-50 p-2 rounded text-xs space-y-1">
                      <p className="font-medium">可能的原因：</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>API密钥无效或已过期</li>
                        <li>阿里云百炼账户欠费</li>
                        <li>账户未开通相关服务</li>
                      </ul>
                      <a 
                        href="https://bailian.console.aliyun.com/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline mt-1"
                      >
                        前往阿里云百炼控制台检查
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                  
                  <p className="text-sm font-medium mt-2">您可以：</p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startGame()}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                      重试连接
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => startWithDefaultPuzzle()}
                    >
                      <WifiOff className="w-4 h-4 mr-1" />
                      使用示例题目
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/')}
                    className="w-full mt-2"
                  >
                    <Home className="w-4 h-4 mr-1" />
                    返回首页
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* 顶部信息栏 */}
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                第 {rounds} 轮
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                <Trophy className="w-4 h-4 mr-1" />
                得分: {score}
              </Badge>
              <Badge 
                variant={difficulty === 'easy' ? 'default' : difficulty === 'hard' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {DIFFICULTY_LEVELS[difficulty].name}
              </Badge>
              {puzzle?.category && (
                <Badge className={`text-xs ${getCategoryColor(puzzle.category)}`}>
                  {getCategoryIcon(puzzle.category)}
                  <span className="ml-1">{PUZZLE_TYPES[puzzle.category]?.name || puzzle.category}</span>
                </Badge>
              )}
              {usingDefaultPuzzle ? (
                <Badge variant="destructive" className="text-xs">
                  <WifiOff className="w-3 h-3 mr-1" />
                  离线模式
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-600 text-xs">
                  <Bot className="w-3 h-3 mr-1" />
                  千问AI在线
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {gameState === "playing" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleSurrender}
                  disabled={loading}
                >
                  <Flag className="w-4 h-4 mr-1" />
                  投降
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewGame}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                新游戏
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 离线模式警告 */}
        {usingDefaultPuzzle && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">离线模式</AlertTitle>
            <AlertDescription className="text-yellow-700">
              当前使用示例题目，未连接千问API。回答由本地逻辑模拟，点击"新游戏"可尝试连接千问AI。
            </AlertDescription>
          </Alert>
        )}

        {/* HMR恢复提示 */}
        {hmrRecovered && (
          <Alert className="bg-blue-50 border-blue-200">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">已自动恢复游戏</AlertTitle>
            <AlertDescription className="text-blue-700">
              检测到开发服务器重新连接，已自动恢复游戏状态。如果看到此提示说明恢复成功！
            </AlertDescription>
          </Alert>
        )}

        {/* 汤面展示 */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2 flex-wrap">
              🍲 汤面
              <Badge variant="outline" className="text-xs font-normal">
                {DIFFICULTY_LEVELS[difficulty].name}
              </Badge>
              {puzzle?.category && (
                <Badge className={`text-xs ${getCategoryColor(puzzle.category)}`}>
                  {getCategoryIcon(puzzle.category)}
                  <span className="ml-1">{PUZZLE_TYPES[puzzle.category]?.name}</span>
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{puzzle?.surface}</p>
          </CardContent>
        </Card>

        {/* 对话历史 */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-600" />
              与千问AI的对话记录
              {!usingDefaultPuzzle && (
                <Badge variant="default" className="bg-green-600 text-xs">
                  实时对话中
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 pr-4">
              {history.length === 0 ? (
                <div className="text-gray-400 text-center py-8 space-y-2">
                  <Bot className="w-12 h-12 mx-auto opacity-30" />
                  <p>还没有提问，向千问AI提出你的第一个问题吧！</p>
                  <p className="text-sm">千问AI只会回答"是"、"否"或"无关"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="space-y-2"
                    >
                      {/* 玩家问题 */}
                      <div className="flex gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <User className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 mb-1">你问（第{item.round}轮）</p>
                          <p className="font-medium text-gray-800">{item.question}</p>
                        </div>
                      </div>
                      {/* AI回答 */}
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-amber-400 ml-6">
                        {item.fromAI !== false ? (
                          <Bot className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-amber-600 mb-1">
                            {item.fromAI !== false ? "千问AI回答" : "离线模拟回答"}
                          </p>
                          <p
                            className={`font-bold ${
                              item.answer === "是"
                                ? "text-green-600"
                                : item.answer === "否"
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 游戏进行中 - 提问区域 */}
        {gameState === "playing" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="向千问AI提问（AI只能回答是/否/无关）..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  disabled={loading}
                />
                <Button
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {usingDefaultPuzzle 
                  ? "离线模式：回答由本地逻辑模拟" 
                  : "千问AI在线：你的问题将实时发送给千问大模型"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 破解失败提示 - 未破解时显示 */}
        {gameState === "ended" && !showTruth && crackResult && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                真相尚未完全破解
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>当前破解进度</span>
                  <span className="font-bold text-orange-600">{crackResult.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${crackResult.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-orange-200">
                <p className="text-sm font-medium text-orange-800 mb-1">千问AI反馈：</p>
                <p className="text-sm text-orange-700">
                  {crackResult.feedback || "还需要更多线索，继续提问推理吧！"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCrackResult(null);
                    setAnswer("");
                  }}
                  className="flex-1"
                >
                  继续推理
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSurrender}
                >
                  投降看答案
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 游戏结束 - 显示真相（只有破解成功或投降后才显示） */}
        {gameState === "ended" && showTruth && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                📖 完整汤底
                {crackResult?.fromAI && (
                  <Badge className="bg-green-600 text-xs">千问判定</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg leading-relaxed">{puzzle?.truth}</p>
              {score > 0 ? (
                <Badge className="bg-green-600 text-white">
                  累计获得 {score} 分！
                </Badge>
              ) : (
                <Badge variant="secondary">本局未得分</Badge>
              )}
              {usingDefaultPuzzle && (
                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  注：本局使用离线示例题目，未连接千问API
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 提交真相区域 - 只在游戏进行中且未提交答案时显示 */}
        {gameState === "playing" && !crackResult && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                提交真相
                {!usingDefaultPuzzle && (
                  <span className="text-xs font-normal text-blue-600">由千问AI判定</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-600">
                如果你已经推理出真相，可以直接输入你的答案提交，千问AI会判断是否破解成功
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="输入你推理出的真相..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                  disabled={loading}
                />
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answer.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  提交
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Game;

