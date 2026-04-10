/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Wallet, 
  History, 
  Zap, 
  ChevronRight, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { derivService, Tick, Market } from './services/derivService';
import { analyzeMarket } from './services/geminiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'sonner';

export default function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('R_100');
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [balance, setBalance] = useState(10000);
  const [stake, setStake] = useState(10);
  const [aiAnalysis, setAiAnalysis] = useState<{ sentiment: string; score: number; reasoning: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize Deriv Service
  useEffect(() => {
    derivService.on('active_symbols', (data) => {
      setMarkets(data.active_symbols);
    });

    derivService.on('tick', (data) => {
      if (data.tick.symbol === selectedSymbol) {
        setTicks(prev => {
          const newTicks = [...prev, data.tick].slice(-50);
          return newTicks;
        });
      }
    });

    derivService.getActiveSymbols();
    derivService.subscribeTicks(selectedSymbol);

    return () => {
      derivService.unsubscribeTicks(selectedSymbol);
    };
  }, [selectedSymbol]);

  // AI Market Pulse
  const runAiAnalysis = async () => {
    if (ticks.length < 10) return;
    setIsAnalyzing(true);
    const result = await analyzeMarket(ticks.map(t => t.quote), selectedSymbol);
    setAiAnalysis(result);
    setIsAnalyzing(false);
    toast.success('AI Analysis Updated');
  };

  const currentPrice = ticks.length > 0 ? ticks[ticks.length - 1].quote : 0;
  const previousPrice = ticks.length > 1 ? ticks[ticks.length - 2].quote : 0;
  const isPriceUp = currentPrice >= previousPrice;

  const filteredMarkets = markets.filter(m => 
    m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTrade = (type: 'Rise' | 'Fall') => {
    const newTrade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      type,
      stake,
      entry: currentPrice,
      time: new Date().toLocaleTimeString(),
      status: 'Open'
    };
    setTrades([newTrade, ...trades]);
    setBalance(prev => prev - stake);
    toast.info(`Trade Opened: ${type} on ${selectedSymbol}`);

    // Simulate trade result after 5 seconds
    setTimeout(() => {
      setTrades(prev => prev.map(t => {
        if (t.id === newTrade.id) {
          const win = Math.random() > 0.5;
          if (win) {
            setBalance(b => b + stake * 1.95);
            toast.success(`Trade Won! +$${(stake * 0.95).toFixed(2)}`);
          } else {
            toast.error(`Trade Lost: -$${stake.toFixed(2)}`);
          }
          return { ...t, status: win ? 'Won' : 'Lost' };
        }
        return t;
      }));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Toaster position="top-right" theme="dark" />
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Zap className="text-black fill-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">DERIV <span className="text-emerald-500">AI</span> TRADER</h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Mission Control v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Account Balance</span>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-mono font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <Separator orientation="vertical" className="h-8 bg-zinc-800" />
          <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800">
            Deposit
          </Button>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar - Asset Selection */}
        <aside className="w-72 border-r border-zinc-800 flex flex-col bg-black/20">
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input 
                placeholder="Search assets..." 
                className="pl-9 bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-2 pb-4 space-y-1">
              {markets.length === 0 ? (
                Array(10).fill(0).map((_, i) => (
                  <div key={i} className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-800" />
                  </div>
                ))
              ) : (
                filteredMarkets.map((market) => (
                  <button
                    key={market.symbol}
                    onClick={() => setSelectedSymbol(market.symbol)}
                    className={`w-full text-left p-3 rounded-lg transition-all group ${
                      selectedSymbol === market.symbol 
                        ? 'bg-emerald-500/10 border border-emerald-500/20' 
                        : 'hover:bg-zinc-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-medium text-sm ${selectedSymbol === market.symbol ? 'text-emerald-400' : 'text-zinc-300'}`}>
                          {market.display_name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">{market.symbol}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedSymbol === market.symbol ? 'text-emerald-500 translate-x-0' : 'text-zinc-700 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content - Chart */}
        <section className="flex-1 flex flex-col bg-zinc-950/50">
          <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-black/20">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {markets.find(m => m.symbol === selectedSymbol)?.display_name || selectedSymbol}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono text-[10px]">
                    REAL-TIME FEED
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPrice}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-3xl font-mono font-bold ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}
                >
                  {currentPrice.toFixed(2)}
                </motion.div>
              </AnimatePresence>
              <div className="flex items-center justify-end gap-1">
                {isPriceUp ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
                <span className={`text-xs font-mono ${isPriceUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {((currentPrice - previousPrice) / (previousPrice || 1) * 100).toFixed(4)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 min-h-0">
            <div className="h-full w-full bg-zinc-900/20 rounded-2xl border border-zinc-800/50 p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ticks}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPriceUp ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isPriceUp ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis 
                    dataKey="epoch" 
                    hide 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right"
                    tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981', fontFamily: 'monospace' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="quote" 
                    stroke={isPriceUp ? "#10b981" : "#f43f5e"} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade History Area */}
          <div className="h-64 border-t border-zinc-900 bg-black/40">
            <Tabs defaultValue="trades" className="h-full flex flex-col">
              <div className="px-6 border-b border-zinc-900 flex items-center justify-between">
                <TabsList className="bg-transparent h-12 gap-6">
                  <TabsTrigger value="trades" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 px-0 h-12 text-xs font-mono uppercase tracking-widest">
                    Open Positions
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 px-0 h-12 text-xs font-mono uppercase tracking-widest">
                    Trade History
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase">
                  <Activity className="w-3 h-3" />
                  Live Execution Engine
                </div>
              </div>
              <TabsContent value="trades" className="flex-1 m-0 p-0">
                <ScrollArea className="h-full">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 bg-zinc-950/80 backdrop-blur text-zinc-500 uppercase tracking-tighter border-b border-zinc-900">
                      <tr>
                        <th className="p-4 font-medium">Asset</th>
                        <th className="p-4 font-medium">Type</th>
                        <th className="p-4 font-medium">Stake</th>
                        <th className="p-4 font-medium">Entry</th>
                        <th className="p-4 font-medium">Time</th>
                        <th className="p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-600 italic">No active positions found.</td>
                        </tr>
                      ) : (
                        trades.map((trade) => (
                          <tr key={trade.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4 font-bold">{trade.symbol}</td>
                            <td className="p-4">
                              <Badge variant="outline" className={trade.type === 'Rise' ? 'border-emerald-500/50 text-emerald-500' : 'border-rose-500/50 text-rose-500'}>
                                {trade.type}
                              </Badge>
                            </td>
                            <td className="p-4">${trade.stake}</td>
                            <td className="p-4 text-zinc-400">{trade.entry.toFixed(2)}</td>
                            <td className="p-4 text-zinc-500">{trade.time}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                trade.status === 'Open' ? 'bg-zinc-800 text-zinc-400' :
                                trade.status === 'Won' ? 'bg-emerald-500/20 text-emerald-500' :
                                'bg-rose-500/20 text-rose-500'
                              }`}>
                                {trade.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="history" className="flex-1 m-0 p-0 flex items-center justify-center text-zinc-600 italic">
                History view coming soon...
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Right Panel - Trade Execution & AI */}
        <aside className="w-80 border-l border-zinc-800 bg-black/20 flex flex-col">
          <div className="p-6 space-y-6">
            {/* AI Market Pulse */}
            <Card className="bg-zinc-900/30 border-zinc-800 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-emerald-500" />
                    AI MARKET PULSE
                  </CardTitle>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 text-zinc-500 hover:text-emerald-500"
                    onClick={runAiAnalysis}
                    disabled={isAnalyzing || ticks.length < 10}
                  >
                    <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <CardDescription className="text-[10px] font-mono uppercase">Gemini Powered Insights</CardDescription>
              </CardHeader>
              <CardContent>
                {aiAnalysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Sentiment</span>
                      <Badge className={
                        aiAnalysis.sentiment === 'Bullish' ? 'bg-emerald-500 text-black' :
                        aiAnalysis.sentiment === 'Bearish' ? 'bg-rose-500 text-white' :
                        'bg-zinc-700 text-zinc-300'
                      }>
                        {aiAnalysis.sentiment}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">CONFIDENCE</span>
                        <span className="text-emerald-500">{aiAnalysis.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${aiAnalysis.score}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "{aiAnalysis.reasoning}"
                    </p>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-3">
                    <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto">
                      <BrainCircuit className="w-6 h-6 text-zinc-700" />
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono">Collect 10 ticks to analyze</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black"
                      onClick={runAiAnalysis}
                      disabled={ticks.length < 10 || isAnalyzing}
                    >
                      Initialize Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trade Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Stake Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-mono">$</span>
                  <Input 
                    type="number" 
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="pl-8 bg-zinc-900/50 border-zinc-800 text-xl font-mono font-bold"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map(val => (
                    <button 
                      key={val}
                      onClick={() => setStake(val)}
                      className="py-1 text-[10px] font-mono bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800 transition-colors"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <Button 
                  onClick={() => handleTrade('Rise')}
                  className="h-16 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <div className="flex flex-col items-center relative z-10">
                    <TrendingUp className="w-5 h-5 mb-1" />
                    RISE
                  </div>
                </Button>
                <Button 
                  onClick={() => handleTrade('Fall')}
                  className="h-16 bg-rose-500 hover:bg-rose-400 text-white font-bold text-lg group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <div className="flex flex-col items-center relative z-10">
                    <TrendingDown className="w-5 h-5 mb-1" />
                    FALL
                  </div>
                </Button>
              </div>

              <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase">
                  <span>Potential Payout</span>
                  <span className="text-emerald-500">95.0%</span>
                </div>
                <div className="flex justify-between text-lg font-mono font-bold">
                  <span className="text-zinc-400">$</span>
                  <span className="text-emerald-500">{(stake * 1.95).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto p-6 border-t border-zinc-800 bg-black/40">
            <div className="flex items-center gap-3 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-mono uppercase tracking-widest">Global Network Active</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
