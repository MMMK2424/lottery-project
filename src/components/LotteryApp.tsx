import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Smartphone, Monitor, Save, Lock, History, Clock } from 'lucide-react';

const ADMIN_PASSWORD = '1324';
const STORAGE_KEY = 'lottery_app_data';
const HISTORY_STORAGE_KEY = 'lottery_app_history';
const DRAW_LIMIT_KEY = 'lottery_app_draw_limits';

const LotteryApp = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [currentGroup, setCurrentGroup] = useState('groupA');
  const [groups, setGroups] = useState({
    groupA: {
      name: '抽奖活动',
      prizes: [
        { number: 1, name: '一等奖', remaining: 1 },
        { number: 2, name: '二等奖', remaining: 2 },
      ],
      drawLimit: 3,  // 每个组默认抽奖次数限制
      currentDraws: 0  // 当前已抽奖次数
    },
    groupB: {
      name: '抽奖活动',
      prizes: [
        { number: 1, name: '特等奖', remaining: 1 },
        { number: 2, name: '纪念奖', remaining: 3 },
      ],
      drawLimit: 5,
      currentDraws: 0
    }
  });
  
  const [currentNumber, setCurrentNumber] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winPrize, setWinPrize] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 加载数据和历史记录
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setGroups(parsedData);
      } catch (e) {
        console.error('Failed to load saved data');
      }
    }

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setLotteryHistory(parsedHistory);
      } catch (e) {
        console.error('Failed to load lottery history');
      }
    }

    // 重置每日抽奖次数
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem('lottery_reset_date');
    if (lastResetDate !== today) {
      const resetGroups = { ...groups };
      Object.keys(resetGroups).forEach(groupId => {
        resetGroups[groupId].currentDraws = 0;
      });
      setGroups(resetGroups);
      localStorage.setItem('lottery_reset_date', today);
    }
  }, []);

  // 保存数据到本地存储
  const saveData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(lotteryHistory));
    alert('保存成功！');
  };

  // 抽奖逻辑
  const startLottery = () => {
    const currentGroupData = groups[currentGroup];

    // 检查抽奖次数限制
    if (currentGroupData.currentDraws >= currentGroupData.drawLimit) {
      alert(`本组今日抽奖次数已达到上限 (${currentGroupData.drawLimit} 次)`);
      return;
    }

    setIsRolling(true);
    setWinPrize(null);
    
    let count = 0;
    const maxRolls = 20;
    const interval = setInterval(() => {
      setCurrentNumber(Math.floor(Math.random() * 100) + 1);
      count++;
      
      if (count >= maxRolls) {
        clearInterval(interval);
        setIsRolling(false);
        
        const availablePrizes = currentGroupData.prizes.filter(p => p.remaining > 0);
        if (availablePrizes.length > 0) {
          const randomPrize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
          setWinPrize(randomPrize);
          
          // 更新奖品数量和抽奖次数
          setGroups(prevGroups => {
            const updatedGroups = { ...prevGroups };
            const group = updatedGroups[currentGroup];
            
            group.prizes = group.prizes.map(p => 
              p.number === randomPrize.number 
                ? {...p, remaining: p.remaining - 1}
                : p
            );
            
            group.currentDraws += 1;
            
            return updatedGroups;
          });

          // 添加历史记录
          const newHistoryEntry = {
            group: currentGroup,
            groupName: currentGroupData.name,
            prize: randomPrize,
            timestamp: new Date().toLocaleString(),
            drawNumber: currentGroupData.currentDraws
          };

          const updatedHistory = [newHistoryEntry, ...lotteryHistory].slice(0, 50);
          setLotteryHistory(updatedHistory);
        }
      }
    }, 100);
  };

  // 更新抽奖次数限制
  const updateDrawLimit = (groupId, newLimit) => {
    setGroups(prevGroups => ({
      ...prevGroups,
      [groupId]: {
        ...prevGroups[groupId],
        drawLimit: parseInt(newLimit) || 0,
        currentDraws: 0  // 重置当前抽奖次数
      }
    }));
  };

  // 重置某个组的抽奖次数
  const resetGroupDraws = (groupId) => {
    setGroups(prevGroups => ({
      ...prevGroups,
      [groupId]: {
        ...prevGroups[groupId],
        currentDraws: 0
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* 其他模态框和界面保持不变 */}
      <div className="max-w-md mx-auto">
        {!isAdmin ? (
          // 抽奖界面
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center">幸运抽奖</CardTitle>
              <CardDescription className="text-center flex items-center justify-center">
                <Smartphone className="inline-block mr-2" />
                {groups[currentGroup].name}
                <span className="ml-2 text-sm text-gray-500">
                  (剩余{groups[currentGroup].drawLimit - groups[currentGroup].currentDraws}次)
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className="text-6xl font-bold mb-4 text-blue-600">
                  {currentNumber || '?'}
                </div>
                {winPrize && !isRolling && (
                  <div className="text-2xl text-green-600 font-bold mb-4">
                    恭喜获得 {winPrize.name}！
                  </div>
                )}
                <Button 
                  onClick={startLottery}
                  disabled={
                    isRolling || 
                    groups[currentGroup].currentDraws >= groups[currentGroup].drawLimit ||
                    groups[currentGroup].prizes.every(p => p.remaining === 0)
                  }
                  className="w-32 h-32 rounded-full"
                >
                  {isRolling ? '抽奖中...' : '开始抽奖'}
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(true)}
                >
                  管理后台
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // 管理界面
          <Card>
            <CardHeader>
              <CardTitle>奖品管理后台</CardTitle>
              <CardDescription>
                <Monitor className="inline-block mr-2" />
                设置奖品和抽奖次数
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(groups).map(([groupId, group]) => (
                <div key={groupId} className="mb-6 p-4 border rounded">
                  <div className="mb-4">
                    <Label>组名</Label>
                    <Input
                      value={group.name}
                      onChange={(e) => {
                        setGroups(prev => ({
                          ...prev,
                          [groupId]: {
                            ...prev[groupId],
                            name: e.target.value
                          }
                        }));
                      }}
                      className="mb-2"
                    />
                    
                    {/* 抽奖次数限制 */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <Label>每日抽奖次数限制</Label>
                      <Input
                        type="number"
                        value={group.drawLimit}
                        onChange={(e) => updateDrawLimit(groupId, e.target.value)}
                        className="w-20"
                        min="0"
                      />
                      <span className="text-sm text-gray-500">
                        (已抽 {group.currentDraws} 次)
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => resetGroupDraws(groupId)}
                      >
                        重置
                      </Button>
                    </div>
                  </div>
                  
                  {/* 奖品设置部分保持不变 */}
                  {group.prizes.map((prize) => (
                    <div key={prize.number} className="mb-4 p-4 border rounded">
                      {/* 原有的奖品配置代码 */}
                    </div>
                  ))}
                  
                  <Button onClick={() => {
                    const newGroups = {...groups};
                    const newPrizeNumber = newGroups[groupId].prizes.length + 1;
                    newGroups[groupId].prizes.push({
                      number: newPrizeNumber,
                      name: `奖品${newPrizeNumber}`,
                      remaining: 1
                    });
                    setGroups(newGroups);
                  }} className="mt-2">
                    添加奖品
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-4 mt-4">
                <Button onClick={saveData} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  保存设置
                </Button>
                <Button variant="outline" onClick={() => setIsAdmin(false)}>
                  返回抽奖
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LotteryApp;