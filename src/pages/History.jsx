import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, MessageCircle, Home, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const History = () => {
  const navigate = useNavigate();

  // 从localStorage获取游戏记录
  const getStoredRecords = () => {
    try {
      const stored = localStorage.getItem("turtleSoupHistory");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const records = getStoredRecords();

  // 计算统计
  const totalGames = records.length;
  const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
  const crackedGames = records.filter((r) => r.cracked).length;

  // 清空历史记录
  const clearHistory = () => {
    if (confirm("确定要清空所有历史记录吗？此操作不可恢复。")) {
      localStorage.removeItem("turtleSoupHistory");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-amber-800">
            📜 游戏历史
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="bg-white hover:bg-amber-50"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-amber-600">{totalGames}</p>
              <p className="text-sm text-gray-600">总场次</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-green-600">{totalScore}</p>
              <p className="text-sm text-gray-600">总得分</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <p className="text-3xl font-bold text-blue-600">{crackedGames}</p>
              <p className="text-sm text-gray-600">破解次数</p>
            </CardContent>
          </Card>
        </div>

        {/* 历史记录列表 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>详细记录</CardTitle>
            {records.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                清空记录
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">还没有游戏记录</p>
                <p className="text-sm text-gray-300 mt-2">
                  快去开始你的第一局游戏吧！
                </p>
                <Button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-amber-600 hover:bg-amber-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  返回首页开始游戏
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <Accordion type="single" collapsible className="space-y-2">
                  {records.map((record, index) => (
                    <AccordionItem
                      key={record.id || index}
                      value={`item-${index}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-4 text-left w-full">
                          <Badge
                            variant={record.cracked ? "default" : "secondary"}
                            className={
                              record.cracked ? "bg-green-600" : "bg-gray-400"
                            }
                          >
                            {record.cracked ? "✓ 破解" : "✗ 未破解"}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">
                              {record.surface?.slice(0, 30)}...
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" />
                              {record.date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-amber-600">
                              {record.score > 0 ? `+${record.score}` : "0"}分
                            </p>
                            <p className="text-xs text-gray-500">
                              {record.rounds}轮
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-4">
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="font-medium text-amber-800 mb-1">
                            汤面：
                          </p>
                          <p className="text-sm">{record.surface}</p>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="font-medium text-blue-800 mb-1">
                            你的答案：
                          </p>
                          <p className="text-sm">{record.userAnswer}</p>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="font-medium text-green-800 mb-1">
                            完整汤底：
                          </p>
                          <p className="text-sm">{record.truth}</p>
                        </div>

                        {record.history && record.history.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              对话记录 ({record.history.length}轮)
                            </p>
                            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                              {record.history.map((h, i) => (
                                <div
                                  key={i}
                                  className="flex gap-2 text-xs border-b border-gray-200 pb-1 last:border-0"
                                >
                                  <span className="text-gray-500 w-8">
                                    #{h.round}
                                  </span>
                                  <span className="flex-1 line-clamp-1">
                                    Q: {h.question}
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      h.answer === "是"
                                        ? "text-green-600"
                                        : h.answer === "否"
                                        ? "text-red-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {h.answer}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;
