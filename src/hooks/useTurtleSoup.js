import { useState, useCallback, useEffect } from "react";
import { qwenClient, DIFFICULTY_LEVELS, PUZZLE_TYPES } from "@/lib/qwenClient";

// localStorage key
const STORAGE_KEY = "turtleSoupHistory";
const SCORE_KEY = "turtleSoupCurrentScore";

// 计算得分 - 根据难度调整
const calculateScore = (rounds, difficulty = 'medium') => {
  const config = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.medium;
  const maxRounds = config.maxRoundsForFullScore;
  
  if (rounds <= maxRounds) return 3;
  if (rounds <= maxRounds * 2) return 2;
  return 1;
};

// 从localStorage读取记录
const loadRecords = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// 从localStorage读取分数
const loadScore = () => {
  try {
    const stored = localStorage.getItem(SCORE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

// 保存记录到localStorage
const saveRecords = (records) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("保存记录失败:", e);
  }
};

// 保存分数到localStorage
const saveScore = (score) => {
  try {
    localStorage.setItem(SCORE_KEY, score.toString());
  } catch (e) {
    console.error("保存分数失败:", e);
  }
};

export const useTurtleSoup = () => {
  const [gameState, setGameState] = useState("idle"); // idle, playing, ended
  const [puzzle, setPuzzle] = useState(null);
  const [history, setHistory] = useState([]);
  const [rounds, setRounds] = useState(0);
  // 分数从 localStorage 读取，支持跨页面保留，只有刷新页面才会清零
  const [score, setScoreState] = useState(loadScore());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingDefaultPuzzle, setUsingDefaultPuzzle] = useState(false);
  const [difficulty, setDifficulty] = useState("medium"); // easy, medium, hard
  const [category, setCategory] = useState(null); // 题目分类
  const [gameRecords, setGameRecords] = useState(loadRecords());
  const [lastAnswerFromAI, setLastAnswerFromAI] = useState(true); // 标记上次回答是否来自AI

  // 同步分数到localStorage
  const setScore = useCallback((newScore) => {
    setScoreState(newScore);
    saveScore(newScore);
  }, []);

  // 累加分数（用于不清零的情况）
  const addScore = useCallback((delta) => {
    setScoreState((prev) => {
      const newScore = prev + delta;
      saveScore(newScore);
      return newScore;
    });
  }, []);

  // 同步到localStorage
  useEffect(() => {
    saveRecords(gameRecords);
  }, [gameRecords]);

  // 设置难度
  const setGameDifficulty = useCallback((level) => {
    setDifficulty(level);
  }, []);

  // 开始新游戏 - 使用API生成题目（不清零分数，继续累加）
  const startGame = useCallback(async (selectedDifficulty = difficulty, selectedCategory = null) => {
    setLoading(true);
    setError(null);
    setUsingDefaultPuzzle(false);
    setLastAnswerFromAI(true);
    // 不移除 setScore(0)，保持原有分数，继续累加
    setDifficulty(selectedDifficulty);
    setCategory(selectedCategory);
    try {
      const newPuzzle = await qwenClient.generatePuzzle(selectedDifficulty, selectedCategory);
      setPuzzle(newPuzzle);
      setHistory([]);
      setRounds(0);
      setGameState("playing");
    } catch (error) {
      console.error("API生成题目失败:", error);
      
      // 分析错误类型，提供更具体的提示
      let errorMsg = error.message || "千问API调用失败，请检查网络连接";
      
      if (errorMsg.includes("账户异常") || errorMsg.includes("欠费") || errorMsg.includes("API密钥")) {
        errorMsg = "千问API账户问题：" + errorMsg + "。请前往阿里云百炼控制台检查账户状态：https://bailian.console.aliyun.com/";
      } else if (errorMsg.includes("网络连接失败")) {
        errorMsg = "无法连接到千问服务器，请检查网络或稍后重试";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  // 使用默认题目开始游戏（不清零分数，继续累加）
  const startWithDefaultPuzzle = useCallback((selectedDifficulty = difficulty, selectedCategory = null) => {
    const defaultPuzzle = qwenClient.getDefaultPuzzle(selectedDifficulty, selectedCategory);
    setPuzzle(defaultPuzzle);
    setUsingDefaultPuzzle(true);
    setLastAnswerFromAI(false);
    setHistory([]);
    setRounds(0);
    // 不移除 setScore(0)，保持原有分数，继续累加
    setDifficulty(selectedDifficulty);
    setCategory(selectedCategory || defaultPuzzle.category);
    setGameState("playing");
    setError(null);
  }, [difficulty]);

  // 提问
  const askQuestion = useCallback(
    async (question) => {
      if (!puzzle || gameState !== "playing") return;

      setLoading(true);
      try {
        // 如果使用默认题目，模拟AI回答（因为API可能不可用）
        let answer;
        let fromAI = false;
        
        if (usingDefaultPuzzle) {
          // 简单的本地逻辑回答
          const lowerQ = question.toLowerCase();
          const lowerTruth = puzzle.truth.toLowerCase();
          
          // 简单的关键词匹配逻辑
          const positiveWords = ['死', '杀', '吃', '跳', '坠', '失忆', '实验', '猫', '窗户'];
          const negativeWords = ['活', '救', '爱', '喜欢', '朋友', '帮助', '狗'];
          
          let hasPositive = positiveWords.some(w => lowerQ.includes(w) && lowerTruth.includes(w));
          let hasNegative = negativeWords.some(w => lowerQ.includes(w) && !lowerTruth.includes(w));
          
          if (hasPositive && !hasNegative) {
            answer = "是";
          } else if (hasNegative && !hasPositive) {
            answer = "否";
          } else {
            // 根据难度调整随机性
            const randomVal = Math.random();
            if (randomVal > 0.6) answer = "是";
            else if (randomVal > 0.3) answer = "否";
            else answer = "无关";
          }
          fromAI = false;
        } else {
          // 调用千问API
          answer = await qwenClient.answerQuestion(
            question,
            puzzle.surface,
            puzzle.truth,
            history
          );
          fromAI = true;
        }

        const newHistory = [...history, { question, answer, round: rounds + 1, fromAI }];
        setHistory(newHistory);
        setRounds((prev) => prev + 1);
        setLastAnswerFromAI(fromAI);

        return { answer, fromAI };
      } catch (error) {
        console.error("提问失败:", error);
        
        // 如果是API账户问题，标记为离线模式并继续
        const errorMsg = error.message || "";
        if (errorMsg.includes("账户问题") || errorMsg.includes("API密钥") || errorMsg.includes("401")) {
          toast.error("千问API连接异常，已切换到离线模拟模式");
          setUsingDefaultPuzzle(true);
        }
        
        // 即使失败也记录一个"无关"的回答，让游戏可以继续
        const newHistory = [...history, { question, answer: "无关（API异常）", round: rounds + 1, fromAI: false }];
        setHistory(newHistory);
        setRounds((prev) => prev + 1);
        setLastAnswerFromAI(false);
        return { answer: "无关", fromAI: false };
      } finally {
        setLoading(false);
      }
    },
    [puzzle, gameState, history, rounds, usingDefaultPuzzle]
  );

  // 提交答案 - 简化版，不需要keyPoints
  const submitAnswer = useCallback(
    async (userAnswer) => {
      if (!puzzle || gameState !== "playing") return { cracked: false, percentage: 0, score: 0 };

      setLoading(true);
      try {
        let result;
        let fromAI = false;
        
        if (usingDefaultPuzzle) {
          // 本地判断逻辑
          const lowerAnswer = userAnswer.toLowerCase();
          const lowerTruth = puzzle.truth.toLowerCase();
          
          const truthWords = lowerTruth.split(/[，。！？、]/).filter(w => w.length > 2);
          let matchCount = 0;
          
          truthWords.forEach(word => {
            if (lowerAnswer.includes(word)) matchCount++;
          });
          
          const matchRatio = truthWords.length > 0 ? matchCount / Math.min(truthWords.length, 5) : 0;
          
          if (matchRatio >= 0.5) {
            result = { cracked: true, percentage: 100, feedback: "恭喜你破解了真相！" };
          } else if (matchRatio > 0.2) {
            result = { cracked: false, percentage: Math.round(matchRatio * 100), feedback: `接近了，但还需要更多信息。当前破解度约${Math.round(matchRatio * 100)}%` };
          } else {
            result = { cracked: false, percentage: 0, feedback: "答案偏离较远，继续提问推理吧！" };
          }
        } else {
          // 调用千问API判断 - 简化版不需要keyPoints
          result = await qwenClient.checkAnswer(
            userAnswer,
            puzzle.truth
          );
          fromAI = true;
        }

        const finalScore = result.cracked ? calculateScore(rounds, difficulty) : 0;
        // 分数累加：在原有分数基础上增加本次得分
        addScore(finalScore);

        const record = {
          id: Date.now(),
          date: new Date().toLocaleString("zh-CN"),
          surface: puzzle.surface,
          truth: puzzle.truth,
          rounds,
          score: finalScore,
          cracked: result.cracked,
          userAnswer,
          history: [...history],
          isDefaultPuzzle: usingDefaultPuzzle,
          difficulty,
          category: puzzle.category,
        };

        setGameRecords((prev) => [record, ...prev]);
        setGameState("ended");

        return { ...result, score: finalScore, fromAI };
      } catch (error) {
        console.error("提交答案失败:", error);
        return { cracked: false, percentage: 0, score: 0, fromAI: false };
      } finally {
        setLoading(false);
      }
    },
    [puzzle, gameState, history, rounds, difficulty, usingDefaultPuzzle, addScore]
  );

  // 投降
  const surrender = useCallback(() => {
    if (!puzzle || gameState !== "playing") return;

    const record = {
      id: Date.now(),
      date: new Date().toLocaleString("zh-CN"),
      surface: puzzle.surface,
      truth: puzzle.truth,
      rounds,
      score: 0,
      cracked: false,
      userAnswer: "投降",
      history: [...history],
      isDefaultPuzzle: usingDefaultPuzzle,
      difficulty,
      category: puzzle?.category,
    };

    setGameRecords((prev) => [record, ...prev]);
    // 投降也不清零分数，保持累计
    setGameState("ended");
  }, [puzzle, gameState, history, rounds, usingDefaultPuzzle, difficulty]);

  // 重新开始 - 返回到选择界面，但不清零分数
  const resetGame = useCallback(() => {
    setGameState("idle");
    setPuzzle(null);
    setHistory([]);
    setRounds(0);
    setCategory(null);
    // 不移除 setScore(0)，保持分数累计
    setError(null);
    setUsingDefaultPuzzle(false);
    setLastAnswerFromAI(true);
  }, []);

  // 获取可用的题目分类
  const getCategories = useCallback(() => {
    return qwenClient.getCategories();
  }, []);

  return {
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
    gameRecords,
    setGameDifficulty,
    startGame,
    startWithDefaultPuzzle,
    askQuestion,
    submitAnswer,
    surrender,
    resetGame,
    getCategories,
    PUZZLE_TYPES,
    DIFFICULTY_LEVELS,
  };
};
