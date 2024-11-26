import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Smartphone, Monitor, Save, Lock } from 'lucide-react';

const ADMIN_PASSWORD = '1324';
const STORAGE_KEY = 'lottery_app_data';

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
      ]
    },
    groupB: {
      name: '抽奖活动',
      prizes: [
        { number: 1, name: '特等奖', remaining: 1 },
        { number: 2, name: '纪念奖', remaining: 3 },
      ]
    }
  });
  
  const [currentNumber, setCurrentNumber] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winPrize, setWinPrize] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 从本地存储加载数据
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setGroups(parsedData);
      } catch (e) {
        console.error('Failed to load saved data');
      }
    }
  }, []);

  // 从URL获取组ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get('group');
    if (groupId && groups[groupId]) {
      setCurrentGroup(groupId);
    }
  }, []);

  // 保存数据到本地存储
  const saveData = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    alert('保存成功！');
  };

  // 验证密码
  const verifyPassword = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPasswordModal(false);
      setPassword('');
    } else {
      alert('密码错误！');
    }
  };

  // 抽奖逻辑
  const startLottery = () => {
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
        
        const availablePrizes = groups[currentGroup].prizes.filter(p => p.remaining > 0);
        if (availablePrizes.length > 0) {
          const randomPrize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
          setWinPrize(randomPrize);
          
          setGroups(prevGroups => ({
            ...prevGroups,
            [currentGroup]: {
              ...prevGroups[currentGroup],
              prizes: prevGroups[currentGroup].prizes.map(p => 
                p.number === randomPrize.number 
                  ? {...p, remaining: p.remaining - 1}
                  : p
              )
            }
          }));
        }
      }
    }, 100);
  };

  // 添加新奖品
  const addPrize = (groupId) => {
    setGroups(prevGroups => ({
      ...prevGroups,
      [groupId]: {
        ...prevGroups[groupId],
        prizes: [
          ...prevGroups[groupId].prizes,
          {
            number: prevGroups[groupId].prizes.length + 1,
            name: `奖品${prevGroups[groupId].prizes.length + 1}`,
            remaining: 1
          }
        ]
      }
    }));
  };

  // 复制组链接
  const copyGroupLink = (groupId) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?group=${groupId}`;
    navigator.clipboard.writeText(link);
    alert('链接已复制到剪贴板！');
  };

  // 更新奖品数量
  const updatePrizeRemaining = (groupId, prizeNumber, newRemaining) => {
    setGroups(prevGroups => ({
      ...prevGroups,
      [groupId]: {
        ...prevGroups[groupId],
        prizes: prevGroups[groupId].prizes.map(p => 
          p.number === prizeNumber 
            ? {...p, remaining: parseInt(newRemaining) || 0}
            : p
        )
      }
    }));
  };

  // 更新奖品名称
  const updatePrizeName = (groupId, prizeNumber, newName) => {
    setGroups(prevGroups => ({
      ...prevGroups,
      [groupId]: {
        ...prevGroups[groupId],
        prizes: prevGroups[groupId].prizes.map(p => 
          p.number === prizeNumber 
            ? {...p, name: newName}
            : p
        )
      }
    }));
  };

  // 更新组名
  const updateGroupName = (groupId, newName) => {
    setGroups(prevGroups => ({
      ...prevGroups,
      [groupId]: {
        ...prevGroups[groupId],
        name: newName
      }
    }));
  };

  // 密码输入模态框
  const PasswordModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={verifyPassword}>确认</Button>
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                取消
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {showPasswordModal && <PasswordModal />}
      
      <div className="max-w-md mx-auto">
        {!isAdmin ? (
          // 抽奖界面
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center">幸运抽奖</CardTitle>
              <CardDescription className="text-center">
                <Smartphone className="inline-block mr-2" />
                {groups[currentGroup].name}
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
                  disabled={isRolling || groups[currentGroup].prizes.every(p => p.remaining === 0)}
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
                设置奖品和数量
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(groups).map(([groupId, group]) => (
                <div key={groupId} className="mb-6 p-4 border rounded">
                  <div className="mb-4">
                    <Label>组名（仅后台显示）</Label>
                    <Input
                      value={group.name}
                      onChange={(e) => updateGroupName(groupId, e.target.value)}
                      className="mb-2"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => copyGroupLink(groupId)}
                      className="w-full"
                    >
                      复制该组链接
                    </Button>
                  </div>
                  
                  {group.prizes.map((prize) => (
                    <div key={prize.number} className="mb-4 p-4 border rounded">
                      <div className="flex gap-4 items-center">
                        <Gift className="flex-shrink-0" />
                        <div className="flex-grow">
                          <Label>奖品名称</Label>
                          <Input
                            value={prize.name}
                            onChange={(e) => updatePrizeName(groupId, prize.number, e.target.value)}
                            className="mb-2"
                          />
                          <Label>剩余数量</Label>
                          <Input
                            type="number"
                            value={prize.remaining}
                            onChange={(e) => updatePrizeRemaining(groupId, prize.number, e.target.value)}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button onClick={() => addPrize(groupId)} className="mt-2">
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