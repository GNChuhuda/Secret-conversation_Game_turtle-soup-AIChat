
// 千问API客户端配置 - 参照OpenAI兼容模式
const API_KEY = "sk-6a0f7303e90340f7b0d0405201b622bb";
// OpenAI兼容模式API地址
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

// 海龟汤题目分类
const PUZZLE_CATEGORIES = {
  humor: { name: "幽默搞笑", description: "轻松有趣，出人意料的搞笑结局" },
  horror: { name: "悬疑恐怖", description: "惊悚诡异，细思极恐的故事" },
  psycho: { name: "变态猎奇", description: "扭曲诡异，重口味的故事" },
  logic: { name: "思维严谨", description: "逻辑严密，需要仔细推理" },
  twist: { name: "反差思考", description: "反转结局，打破常规思维" }
};

// 经典海龟汤题库（按分类）
const CLASSIC_PUZZLES = {
  humor: [
    {
      surface: "一个人半夜醒来打了自己一巴掌，然后闻着一股燃烧的味道安心睡去了，请问发生了什么？",
      truth: "这个人被蚊子叮醒，打了一下没打着，然后点起了蚊香。",
      category: "humor"
    },
    {
      surface: "她站在原地跳舞，微笑地看着同伴一个接着一个死去，请问这是发生了什么？",
      truth: "她是植物大战僵尸里的向日葵， producing阳光的同时看着僵尸吃掉其他植物。",
      category: "humor"
    }
  ],
  horror: [
    {
      surface: "在沙漠里躺着他和一些行李还有一盒火柴跟一根半根的火柴。",
      truth: "他跟一个旅行团去沙漠乘热气球旅游，半路的时候热气球没有火了，为了让热气球继续飞，他们就把行李都扔下去，还是不够，就决定用火柴来抽签，谁抽到半根的就自己跳下去，然后他抽到了半根火柴。",
      category: "horror"
    },
    {
      surface: "我的妈妈最近有些反常，不但偷偷用我的香水穿我的衣服，还老是半夜出去。那天我实在忍不住向她理论，并发生了争执，结果不小心把她推倒在地，我赶忙上前扶她，却发现自己的双手沾满了鲜血。",
      truth: "我的妈妈前几天去世了，妈妈的去世对我产生了极大打击，以至于我产生了幻觉和梦游症，到了夜晚，梦游状态的我穿上妈妈生前给我买的漂亮衣服，喷上妈妈生前送我的香水，到她的墓地前和她聊天。那天我在照镜子时，把镜子里的自己幻想成了妈妈，我便与她理论，却不小心把镜子推倒了，镜子碎了一地，我赶忙用手去捡，手被玻璃割破，鲜血流了出来。",
      category: "horror"
    }
  ],
  logic: [
    {
      surface: "一个人离他的车有30米，但是他只走了五步就上车了，这是为什么？",
      truth: "他在十楼上班，做电梯到地下车库上车，他的车停在地下的电梯口。",
      category: "logic"
    }
  ],
  twist: [
    {
      surface: "一个人从一间屋子里出来，伸手招了辆出租车，然后他再也没能回来这间屋子，请问这是为什么？",
      truth: "这个人是小偷，出租车司机是这间屋子的主人，于是直接带着他开去了警察局。",
      category: "twist"
    }
  ]
};

// 难度配置
const DIFFICULTY_CONFIG = {
  easy: {
    name: "简单",
    description: "线索直接，逻辑简单，适合新手",
    promptModifier: "创建一个简单的海龟汤题目：1. 真相直接明了，线索明显 2. 不需要复杂的推理链条 3. 关键线索在汤面中有明显暗示 4. 适合5-10轮内破解",
    maxRoundsForFullScore: 5,
    scoreRules: { quick: 3, normal: 2, slow: 1 }
  },
  medium: {
    name: "中等",
    description: "需要一定的推理和联想",
    promptModifier: "创建一个中等难度的海龟汤题目：1. 真相需要一定的推理 2. 需要联想和观察细节 3. 关键线索需要深入思考 4. 适合10-20轮内破解",
    maxRoundsForFullScore: 10,
    scoreRules: { quick: 3, normal: 2, slow: 1 }
  },
  hard: {
    name: "困难",
    description: "需要深度推理，隐藏线索较多",
    promptModifier: "创建一个困难的海龟汤题目：1. 真相隐藏较深，需要深度推理 2. 有误导性线索 3. 需要多步骤推理才能得出结论 4. 可能需要20轮以上",
    maxRoundsForFullScore: 15,
    scoreRules: { quick: 3, normal: 2, slow: 1 }
  }
};

class QwenClient {
  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = BASE_URL;
    this.conversationHistory = [];
  }

  // 获取难度配置
  getDifficultyConfig(difficulty = 'medium') {
    return DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  }

  // 获取随机分类
  getRandomCategory() {
    const categories = Object.keys(PUZZLE_CATEGORIES);
    return categories[Math.floor(Math.random() * categories.length)];
  }

  // 获取分类配置
  getCategoryConfig(category) {
    return PUZZLE_CATEGORIES[category] || PUZZLE_CATEGORIES.humor;
  }

  // 封装fetch请求，统一处理错误
  async makeRequest(endpoint, body, stream = false) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };

    const options = {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    };

    console.log(`[千问API] 请求: ${url}`);
    console.log(`[千问API] 请求体:`, JSON.stringify(body, null, 2));

    try {
      const response = await fetch(url, options);

      // 处理HTTP错误
      if (!response.ok) {
        const errorText = await response.text();
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }

        console.error("[千问API] HTTP错误:", response.status, errorData);

        // 根据状态码给出具体提示
        if (response.status === 400) {
          const errorMsg = errorData.error?.message || "";
          if (errorMsg.includes("Access denied") || errorMsg.includes("account") || errorMsg.includes("good standing")) {
            throw new Error("千问API账户异常：可能是API密钥无效或账户欠费，请检查阿里云百炼控制台");
          }
          throw new Error(`请求参数错误(400): ${errorMsg}`);
        } else if (response.status === 401) {
          throw new Error("API密钥无效或已过期，请检查阿里云百炼API Key");
        } else if (response.status === 429) {
          throw new Error("请求过于频繁，请稍后再试");
        } else if (response.status >= 500) {
          throw new Error("千问服务器错误，请稍后再试");
        }

        throw new Error(`API请求失败(${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      if (!stream) {
        const data = await response.json();
        console.log("[千问API] 响应:", JSON.stringify(data, null, 2));
        return data;
      }

      return response;
    } catch (error) {
      // 网络错误处理
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("网络连接失败，请检查网络或API地址是否正确");
      }
      throw error;
    }
  }

  async chat(messages, onStream = null, options = {}) {
    // 优化参数配置：使用qwen3.5-flash模型，提升响应速度
    const body = {
      model: "qwen3.5-flash", // 切换至flash模型：速度快，免费额度充足
      messages: messages,
      stream: !!onStream, // 流式输出：降低感知延迟，体验更流畅
      max_tokens: options.max_tokens || 50, // 限制输出长度：主持人只需回答"是/否"，提速省钱
      temperature: options.temperature !== undefined ? options.temperature : 0.1, // 低随机性：确保逻辑一致，避免前后矛盾
      top_p: options.top_p !== undefined ? options.top_p : 0.8, // 采样概率：配合低temperature，保证回答稳定
    };

    try {
      if (!onStream) {
        const data = await this.makeRequest("/chat/completions", body, false);
        return data.choices[0].message.content;
      }

      // 流式处理
      const response = await this.makeRequest("/chat/completions", body, true);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0].delta;

              // 处理正式回复
              if (delta.content) {
                content += delta.content;
                onStream({ type: "content", content: delta.content });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      return { content };
    } catch (error) {
      console.error("[千问API] 调用异常:", error);
      throw error;
    }
  }

  // 生成海龟汤题目 - 简化版，去掉keyPoints和hints以加快生成速度
  async generatePuzzle(difficulty = 'medium', category = null) {
    const config = this.getDifficultyConfig(difficulty);
    const selectedCategory = category || this.getRandomCategory();
    const categoryConfig = this.getCategoryConfig(selectedCategory);
    
    const systemPrompt = `你是一个海龟汤游戏的主持人。请生成一个${config.name}难度的海龟汤推理题目，类型为「${categoryConfig.name}」。

类型说明：${categoryConfig.description}

${config.promptModifier}

要求：
1. 提供情境描述（汤面），要简短但有悬念
2. 提供合理的真相解释（汤底），逻辑自洽
3. 只输出JSON格式：{"surface": "汤面描述", "truth": "完整汤底", "category": "${selectedCategory}"}
4. 确保JSON格式正确，可以被直接解析
5. 请创造性地设计题目，可以参考经典题目思路`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `请生成一个${config.name}难度、「${categoryConfig.name}」类型的海龟汤题目` },
    ];

    try {
      console.log(`[千问API] 正在生成${config.name}难度[${categoryConfig.name}]题目`);
      
      // 生成题目时使用更短的token限制，因为不需要keyPoints和hints
      const response = await this.chat(messages, null, { max_tokens: 800, temperature: 0.7, top_p: 0.9 });
      
      console.log("[千问API] 原始响应:", response);
      
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("API返回格式不正确，未找到JSON");
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 验证必要字段（简化后只保留surface和truth）
      if (!parsed.surface || !parsed.truth) {
        throw new Error("API返回数据缺少必要字段");
      }
      
      console.log("[千问API] 成功生成题目:", parsed.surface.slice(0, 30) + "...");
      return {
        ...parsed,
        difficulty,
        category: selectedCategory
      };
      
    } catch (e) {
      console.error("[千问API] 生成题目失败:", e);
      // 重新抛出错误，让上层处理
      throw new Error(`千问API调用失败: ${e.message}`);
    }
  }

  // 获取默认题目（当API失败时使用）- 随机选择分类
  getDefaultPuzzle(difficulty = 'medium', category = null) {
    const selectedCategory = category || this.getRandomCategory();
    const categoryPuzzles = CLASSIC_PUZZLES[selectedCategory];
    
    if (!categoryPuzzles || categoryPuzzles.length === 0) {
      // 如果没有该分类的题目，随机选一个分类
      const allCategories = Object.keys(CLASSIC_PUZZLES);
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
      const puzzles = CLASSIC_PUZZLES[randomCategory];
      const randomIndex = Math.floor(Math.random() * puzzles.length);
      return { ...puzzles[randomIndex], isDefault: true, difficulty, category: randomCategory };
    }
    
    const randomIndex = Math.floor(Math.random() * categoryPuzzles.length);
    return { ...categoryPuzzles[randomIndex], isDefault: true, difficulty, category: selectedCategory };
  }

  // 获取所有分类列表
  getCategories() {
    return Object.entries(PUZZLE_CATEGORIES).map(([key, config]) => ({
      key,
      ...config
    }));
  }

  // 回答问题（只能回答是/否/无关）
  async answerQuestion(question, surface, truth, history) {
    // 构建包含完整对话历史的提示
    const historyText = history.map((h) => `玩家第${h.round}轮问：${h.question}\n千问回答：${h.answer}`).join("\n");
    
    const systemPrompt = `你是千问大模型(Qwen3.5-flash)，正在主持一场海龟汤推理游戏。玩家正在通过提问来推理以下题目：

【汤面】${surface}
【真相】${truth}

游戏规则：
1. 你只能回答"是"、"否"或"无关"
2. 回答必须严格基于事实真相
3. 如果问题与真相相关且可以用是/否回答，必须回答是或否
4. 如果问题与真相无关或无法判断，回答"无关"
5. 保持神秘，不要透露真相
6. 每次回答都要记住这是在多轮对话中，考虑之前的问答历史

当前对话历史：
${historyText || "（游戏刚开始，还没有问答记录）"}

重要：必须只回答"是"、"否"或"无关"这三个字之一，不要有任何解释。`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `玩家现在问：${question}\n\n请根据真相，只回答"是"、"否"或"无关"：` },
    ];

    try {
      console.log(`[千问API] 正在回答问题: "${question.slice(0, 30)}..."`);
      
      // 回答问题使用优化参数：50token限制，低temperature确保稳定
      const response = await this.chat(messages, null, { max_tokens: 50, temperature: 0.1, top_p: 0.8 });
      const cleanResponse = response.trim();
      
      console.log("[千问API] 原始回答:", cleanResponse);
      
      // 严格提取是/否/无关
      const validAnswers = ["是", "否", "无关"];
      for (const valid of validAnswers) {
        if (cleanResponse.includes(valid) && !cleanResponse.includes("不是") && !cleanResponse.includes("无关的")) {
          // 简单处理避免误判
          if (valid === "是" && cleanResponse.includes("否")) continue;
          if (valid === "否" && cleanResponse.includes("是")) continue;
          console.log("[千问API] 提取到回答:", valid);
          return valid;
        }
      }
      
      // 如果没有匹配到标准答案，返回"无关"
      console.log("[千问API] 未匹配到标准回答，返回无关");
      return "无关";
    } catch (error) {
      console.error("[千问API] 回答问题失败:", error);
      // API失败时返回错误提示
      throw new Error("千问API服务暂时不可用: " + error.message);
    }
  }

  // 判断用户是否破解真相 - 简化版，不需要keyPoints
  async checkAnswer(userAnswer, truth) {
    const systemPrompt = `你是千问大模型(Qwen3.5-flash)，作为海龟汤游戏的裁判。请判断玩家给出的答案是否破解了真相。

【真相】${truth}

评分标准：
- 如果玩家答案包含核心真相的关键要素，破解度为100%
- 如果只提到部分线索，破解度约30-60%
- 如果完全偏离，破解度为0%

请只输出JSON格式：{"cracked": true/false, "percentage": 破解百分比数字(0-100), "feedback": "给玩家的反馈说明，用中文"}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `玩家提交的答案：${userAnswer}\n\n请判断破解程度，返回JSON格式：` },
    ];

    try {
      console.log("[千问API] 正在判断答案...");
      
      // 判断答案需要更完整的输出，适当增加token限制
      const response = await this.chat(messages, null, { max_tokens: 300, temperature: 0.1, top_p: 0.8 });
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // 验证必要字段
        if (typeof parsed.cracked === 'boolean' && typeof parsed.percentage === 'number') {
          console.log("[千问API] 判断结果:", parsed);
          return {
            cracked: parsed.cracked,
            percentage: Math.max(0, Math.min(100, parsed.percentage)),
            feedback: parsed.feedback || (parsed.cracked ? "回答正确！你成功破解了真相！" : "答案还不够完整，继续提问推理吧！")
          };
        }
      }
      throw new Error("返回格式不正确");
    } catch (e) {
      console.error("[千问API] 判断答案失败:", e);
      // 使用本地简单判断作为fallback
      const lowerAnswer = userAnswer.toLowerCase();
      const lowerTruth = truth.toLowerCase();
      
      // 提取关键词进行匹配
      const truthWords = lowerTruth.split(/[，。！？、]/).filter(w => w.length > 2);
      let matchCount = 0;
      
      truthWords.forEach(word => {
        if (lowerAnswer.includes(word)) matchCount++;
      });
      
      const matchRatio = truthWords.length > 0 ? matchCount / Math.min(truthWords.length, 5) : 0;
      
      if (matchRatio >= 0.6) {
        return { cracked: true, percentage: 100, feedback: "恭喜你破解了真相！" };
      } else if (matchRatio > 0.2) {
        return { cracked: false, percentage: Math.round(matchRatio * 100), feedback: `接近了，但还需要更多信息。当前破解度约${Math.round(matchRatio * 100)}%` };
      }
      
      return { cracked: false, percentage: 0, feedback: "答案偏离较远，继续提问推理吧！" };
    }
  }
}

export const qwenClient = new QwenClient();
export const DIFFICULTY_LEVELS = DIFFICULTY_CONFIG;
export const PUZZLE_TYPES = PUZZLE_CATEGORIES;

