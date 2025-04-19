/**
 * slot_machine.js - 3x5老虎机游戏
 * 一个简单的JavaScript老虎机系统，模拟真实的老虎机游戏
 */

// 定义符号类型及其相关属性
const symbols = [
  { id: "WILD", name: "百搭", value: 0, probability: 0.05, payout: { 3: 15, 4: 50, 5: 100 } },
  { id: "SEVEN", name: "七", value: 1, probability: 0.08, payout: { 3: 30, 4: 100, 5: 250 } },
  { id: "BAR3", name: "三条", value: 2, probability: 0.10, payout: { 3: 20, 4: 60, 5: 180 } },
  { id: "BAR2", name: "双条", value: 3, probability: 0.12, payout: { 3: 16, 4: 50, 5: 120 } },
  { id: "BAR", name: "单条", value: 4, probability: 0.15, payout: { 3: 12, 4: 40, 5: 80 } },
  { id: "CHERRY", name: "樱桃", value: 5, probability: 0.18, payout: { 3: 10, 4: 30, 5: 60 } },
  { id: "ORANGE", name: "橙子", value: 6, probability: 0.20, payout: { 3: 8, 4: 20, 5: 40 } },
  { id: "PLUM", name: "李子", value: 7, probability: 0.12, payout: { 3: 5, 4: 15, 5: 30 } }
];

// 游戏状态
const gameState = {
  credits: 1000.00,          // 初始金币数
  betPerLine: 0.05,          // 每条线下注金额
  totalBet: 1.00,            // 总下注金额
  reels: [[], [], [], [], []], // 5个转轴
  lastResult: null,       // 上次旋转结果
  isSpinning: false,      // 是否正在旋转
  winAmount: 0.00,           // 本次赢得金额
  totalWon: 0.00,            // 总共赢得金额
  totalSpent: 0.00,          // 总共下注金额
  spinsCount: 0           // 旋转次数
};

// 常量定义
const REELS_COUNT = 5;    // 转轴数量
const SYMBOLS_PER_REEL = 3; // 每个转轴显示的符号数量
const REEL_SIZE = 20;     // 每个转轴的符号总数

// 总下注金额选项
const TOTAL_BET_OPTIONS = [
  0.20, 0.40, 0.60, 0.80, 1.00, 
  2.00, 5.00, 10.00, 20.00, 50.00, 100.00
];

// 与总下注对应的每线下注金额
const BET_PER_LINE_OPTIONS = [
  0.01, 0.02, 0.03, 0.04, 0.05,
  0.10, 0.25, 0.50, 1.00, 2.50, 5.00
];

// 活跃支付线数量，用户可以选择激活1-20条线
let activePaylines = 20;

// 定义支付线(Paylines)，每条线包含5个坐标，格式为[行,列]，从左到右
const PAYLINES = [
  [[0,0],[0,1],[0,2],[0,3],[0,4]], 
  [[1,0],[1,1],[1,2],[1,3],[1,4]], 
  [[2,0],[2,1],[2,2],[2,3],[2,4]], 
  [[0,0],[1,1],[2,2],[1,3],[0,4]], 
  [[2,0],[1,1],[0,2],[1,3],[2,4]], 
  [[1,0],[0,1],[1,2],[0,3],[1,4]], 
  [[1,0],[2,1],[1,2],[2,3],[1,4]], 
  [[0,0],[0,1],[1,2],[2,3],[2,4]], 
  [[2,0],[2,1],[1,2],[0,3],[0,4]], 
  [[1,0],[2,1],[1,2],[0,3],[1,4]], 
  [[1,0],[0,1],[1,2],[2,3],[1,4]], 
  [[0,0],[1,1],[1,2],[1,3],[0,4]], 
  [[2,0],[1,1],[1,2],[1,3],[2,4]], 
  [[0,0],[1,1],[0,2],[1,3],[0,4]], 
  [[2,0],[1,1],[2,2],[1,3],[2,4]], 
  [[1,0],[1,1],[0,2],[1,3],[1,4]], 
  [[1,0],[1,1],[2,2],[1,3],[1,4]], 
  [[0,0],[0,1],[2,2],[0,3],[0,4]], 
  [[2,0],[2,1],[0,2],[2,3],[2,4]], 
  [[0,0],[2,1],[2,2],[2,3],[0,4]], 
];

/**
 * 初始化转轴
 * 根据每个符号的概率填充转轴
 */
function initializeReels() {
  // 创建完整的符号池，基于概率
  const symbolPool = [];
  symbols.forEach(symbol => {
    // 将概率转换为实际数量，并添加到池中
    const count = Math.round(symbol.probability * REEL_SIZE);
    for (let i = 0; i < count; i++) {
      symbolPool.push(symbol);
    }
  });
  
  // 如果符号池的大小小于REEL_SIZE，添加更多随机符号
  while (symbolPool.length < REEL_SIZE) {
    const randomIndex = Math.floor(Math.random() * symbols.length);
    symbolPool.push(symbols[randomIndex]);
  }
  
  // 如果符号池的大小大于REEL_SIZE，随机移除一些
  while (symbolPool.length > REEL_SIZE) {
    const randomIndex = Math.floor(Math.random() * symbolPool.length);
    symbolPool.splice(randomIndex, 1);
  }
  
  // 为每个转轴随机洗牌并分配符号
  for (let i = 0; i < REELS_COUNT; i++) {
    // 创建一个新的符号数组（深拷贝）
    const reelSymbols = [...symbolPool];
    
    // 洗牌算法
    for (let j = reelSymbols.length - 1; j > 0; j--) {
      const randomIndex = Math.floor(Math.random() * (j + 1));
      [reelSymbols[j], reelSymbols[randomIndex]] = [reelSymbols[randomIndex], reelSymbols[j]];
    }
    
    gameState.reels[i] = reelSymbols;
  }
}

/**
 * 旋转老虎机
 * @returns {Array} 旋转后显示的符号矩阵 (3x5)
 */
function spin() {
  if (gameState.isSpinning) {
    return null; // 如果已经在旋转中，不做任何操作
  }
  
  // 使用总下注金额
  const totalBetAmount = gameState.totalBet;
  
  if (gameState.credits < totalBetAmount) {
    return { error: "金币不足！请减少下注金额或充值。" };
  }
  
  gameState.isSpinning = true;
  gameState.credits -= totalBetAmount;
  gameState.totalSpent += totalBetAmount;
  gameState.spinsCount++;
  
  // 创建一个3x5的结果矩阵
  const result = Array(SYMBOLS_PER_REEL).fill().map(() => Array(REELS_COUNT).fill(null));
  
  // 为每个转轴随机选择起始位置
  for (let reelIndex = 0; reelIndex < REELS_COUNT; reelIndex++) {
    const startingPosition = Math.floor(Math.random() * REEL_SIZE);
    
    for (let rowIndex = 0; rowIndex < SYMBOLS_PER_REEL; rowIndex++) {
      // 计算实际位置（环绕）
      const actualPosition = (startingPosition + rowIndex) % REEL_SIZE;
      result[rowIndex][reelIndex] = gameState.reels[reelIndex][actualPosition];
    }
  }
  
  gameState.lastResult = result;
  gameState.isSpinning = false;
  
  // 检查获胜
  const winInfo = checkWin(result);
  gameState.winAmount = winInfo.totalWin;
  gameState.credits += winInfo.totalWin;
  gameState.totalWon += winInfo.totalWin;
  
  return {
    result,
    winLines: winInfo.winLines,
    totalWin: winInfo.totalWin
  };
}

/**
 * 检查获胜线路
 * @param {Array} resultMatrix - 3x5的结果矩阵
 * @returns {Object} 获胜信息，包含获胜线路和总赢金
 */
function checkWin(resultMatrix) {
  const winLines = [];
  let totalWin = 0;
  
  // 检查每条活跃的支付线
  for (let i = 0; i < activePaylines; i++) {
    const payline = PAYLINES[i];
    const lineSymbols = [];
    
    // 获取这条支付线上的所有符号
    for (let j = 0; j < payline.length; j++) {
      const [row, col] = payline[j];
      lineSymbols.push(resultMatrix[row][col]);
    }
    
    // 检查这条线上的获胜情况
    const lineResult = checkPayline(lineSymbols, i);
    if (lineResult.win > 0) {
      winLines.push({
        paylineIndex: i,
        coordinates: payline,
        symbols: lineResult.symbols,
        count: lineResult.count,
        win: lineResult.win
      });
      totalWin += lineResult.win;
    }
  }
  
  return {
    winLines,
    totalWin
  };
}

/**
 * 检查单条支付线的获胜情况
 * @param {Array} lineSymbols - 一条支付线上的符号
 * @param {number} paylineIndex - 支付线索引
 * @returns {Object} 获胜信息
 */
function checkPayline(lineSymbols, paylineIndex) {
  // 必须从左向右检查连续匹配
  let currentSymbol = lineSymbols[0];
  let currentCount = 1;
  let includesWild = currentSymbol.id === "WILD";
  let effectiveSymbolId = currentSymbol.id === "WILD" ? null : currentSymbol.id;
  
  // 从左到右逐个检查
  for (let i = 1; i < lineSymbols.length; i++) {
    const symbol = lineSymbols[i];
    const isWild = symbol.id === "WILD";
    
    // 如果我们的有效符号还没确定（因为前面都是百搭），现在遇到了非百搭，就确定下来
    if (effectiveSymbolId === null && !isWild) {
      effectiveSymbolId = symbol.id;
    }
    
    // 判断是否匹配（要么是相同符号，要么是百搭）
    if (isWild || (effectiveSymbolId && symbol.id === effectiveSymbolId)) {
      currentCount++;
      if (isWild) includesWild = true;
    } else {
      // 一旦不匹配，立即中断
      break;
    }
  }
  
  // 如果没有找到连续3个或以上的符号，或者全是百搭但没有确定具体符号，则没有赢
  if (currentCount < 3 || (effectiveSymbolId === null && includesWild)) {
    return { win: 0, count: 0, symbols: [], paylineIndex: paylineIndex };
  }
  
  // 找出实际使用的符号（用于计算赔率）
  let symbolToUse;
  if (includesWild) {
    if (effectiveSymbolId) {
      // 如果有百搭和普通符号，使用普通符号的赔率
      symbolToUse = symbols.find(s => s.id === effectiveSymbolId);
    } else {
      // 全是百搭的情况（这种情况应该在上面已经排除了，这里是以防万一）
      symbolToUse = symbols.find(s => s.id === "WILD");
    }
  } else {
    // 没有百搭，直接用当前符号
    symbolToUse = currentSymbol;
  }
  
  // 计算奖金
  const winMultiplier = symbolToUse.payout[currentCount] || 0;
  const win = winMultiplier * gameState.betPerLine;
  
  return {
    win,
    count: currentCount,
    symbols: Array(currentCount).fill(symbolToUse),
    paylineIndex: paylineIndex
  };
}

/**
 * 设置总下注金额
 * @param {number} amount - 下注金额
 * @returns {boolean} 设置是否成功
 */
function setTotalBet(amount) {
  // 确保下注金额在允许范围内
  if (!TOTAL_BET_OPTIONS.includes(amount)) {
    return false;
  }
  
  const index = TOTAL_BET_OPTIONS.indexOf(amount);
  gameState.totalBet = BET_PER_LINE_OPTIONS[index] * activePaylines; // 修正计算方式
  gameState.betPerLine = BET_PER_LINE_OPTIONS[index];
  return true;
}

/**
 * 增加总下注金额
 * @returns {Object} 包含新的总下注和每线下注金额
 */
function increaseTotalBet() {
  const currentIndex = TOTAL_BET_OPTIONS.indexOf(gameState.totalBet / activePaylines * 20); // 适应不同线路数量
  if (currentIndex < TOTAL_BET_OPTIONS.length - 1) {
    const newIndex = currentIndex + 1;
    gameState.betPerLine = BET_PER_LINE_OPTIONS[newIndex];
    gameState.totalBet = gameState.betPerLine * activePaylines; // 计算实际总下注
  }
  return {
    totalBet: gameState.totalBet,
    betPerLine: gameState.betPerLine
  };
}

/**
 * 减少总下注金额
 * @returns {Object} 包含新的总下注和每线下注金额
 */
function decreaseTotalBet() {
  const currentIndex = TOTAL_BET_OPTIONS.indexOf(gameState.totalBet / activePaylines * 20); // 适应不同线路数量
  if (currentIndex > 0) {
    const newIndex = currentIndex - 1;
    gameState.betPerLine = BET_PER_LINE_OPTIONS[newIndex];
    gameState.totalBet = gameState.betPerLine * activePaylines; // 计算实际总下注
  }
  return {
    totalBet: gameState.totalBet,
    betPerLine: gameState.betPerLine
  };
}

/**
 * 获取游戏状态
 * @returns {Object} 当前游戏状态
 */
function getGameState() {
  return {
    credits: gameState.credits,
    betPerLine: gameState.betPerLine,
    totalBet: gameState.totalBet,
    lastResult: gameState.lastResult,
    isSpinning: gameState.isSpinning,
    winAmount: gameState.winAmount,
    totalWon: gameState.totalWon,
    totalSpent: gameState.totalSpent,
    spinsCount: gameState.spinsCount,
    activePaylines: activePaylines
  };
}

/**
 * 增加信用点（模拟充值）
 * @param {number} amount - 增加的金额
 * @returns {number} 新的信用点余额
 */
function addCredits(amount) {
  if (amount > 0) {
    gameState.credits += amount;
    // 保持两位小数
    gameState.credits = Math.round(gameState.credits * 100) / 100;
  }
  return gameState.credits;
}

/**
 * 重置游戏
 */
function resetGame() {
  gameState.credits = 1000.00;
  gameState.betPerLine = 0.05;
  gameState.totalBet = 1.00;
  gameState.lastResult = null;
  gameState.isSpinning = false;
  gameState.winAmount = 0.00;
  gameState.totalWon = 0.00;
  gameState.totalSpent = 0.00;
  gameState.spinsCount = 0;
  
  initializeReels();
}

/**
 * 设置活跃支付线数量
 * @param {number} count - 要激活的支付线数量(1-20)
 * @returns {number} 当前激活的支付线数量
 */
function setActivePaylines(count) {
  if (count >= 1 && count <= PAYLINES.length) {
    activePaylines = count;
    // 更新总下注金额以反映支付线变化
    gameState.totalBet = gameState.betPerLine * activePaylines;
  }
  return activePaylines;
}

/**
 * 增加活跃支付线
 * @returns {number} 新的活跃支付线数量
 */
function increasePaylines() {
  if (activePaylines < PAYLINES.length) {
    activePaylines++;
    // 更新总下注金额以反映支付线变化
    gameState.totalBet = gameState.betPerLine * activePaylines;
  }
  return activePaylines;
}

/**
 * 减少活跃支付线
 * @returns {number} 新的活跃支付线数量
 */
function decreasePaylines() {
  if (activePaylines > 1) {
    activePaylines--;
    // 更新总下注金额以反映支付线变化
    gameState.totalBet = gameState.betPerLine * activePaylines;
  }
  return activePaylines;
}

// 添加一个调试函数来帮助检查支付线
function debugPaylines() {
  if (!gameState.lastResult) return "没有上次旋转的结果";
  
  const debugInfo = [];
  for (let i = 0; i < activePaylines; i++) {
    const payline = PAYLINES[i];
    const lineSymbols = [];
    
    // 获取这条支付线上的所有符号
    for (let j = 0; j < payline.length; j++) {
      const [row, col] = payline[j];
      lineSymbols.push(gameState.lastResult[row][col]);
    }
    
    // 显示符号名称和检查结果
    const symbolNames = lineSymbols.map(s => s.name).join(", ");
    const checkResult = checkPayline(lineSymbols, i);
    const winStatus = checkResult.win > 0 ? 
      `获胜! 连续${checkResult.count}个${checkResult.symbols[0].name}符号 = ${checkResult.win}` : 
      "未获胜";
    
    debugInfo.push(`支付线 ${i+1}: ${symbolNames} => ${winStatus}`);
  }
  
  return debugInfo.join("\n");
}

// 初始化游戏
initializeReels();

// 导出函数（如果在Node.js环境中）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    spin,
    setTotalBet,
    increaseTotalBet,
    decreaseTotalBet,
    getGameState,
    addCredits,
    resetGame,
    symbols,
    initializeReels,
    PAYLINES,
    setActivePaylines,
    increasePaylines,
    decreasePaylines,
    activePaylines,
    debugPaylines,
    TOTAL_BET_OPTIONS,
    BET_PER_LINE_OPTIONS
  };
}

// 在浏览器环境中添加到window对象
if (typeof window !== 'undefined') {
  window.slotMachine = {
    spin,
    setTotalBet,
    increaseTotalBet,
    decreaseTotalBet,
    getGameState,
    addCredits,
    resetGame,
    symbols,
    initializeReels,
    PAYLINES,
    setActivePaylines,
    increasePaylines,
    decreasePaylines,
    activePaylines,
    debugPaylines,
    TOTAL_BET_OPTIONS,
    BET_PER_LINE_OPTIONS
  };
} 