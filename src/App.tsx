import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  BrainCircuit,
  ShieldCheck,
  BarChart3,
  Settings2,
  Bell,
  Info,
  Layers,
  Cpu,
  Globe
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
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Toaster, toast } from 'sonner';
import { cn } from './lib/utils';

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl shadow-2xl ring-1 ring-white/10">
        <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">
          {new Date(payload[0].payload.epoch * 1000).toLocaleTimeString()}
        </p>
        <p className="text-sm font-bold text-emerald-400 font-mono">
          ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

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
  const [isLive, setIsLive] = useState(false);
  
  // Initialize Deriv Service
  useEffect(() => {
    derivService.on('active_symbols', (data) => {
      setMarkets(data.active_symbols);
    });

    derivService.on('tick', (data) => {
      if (data.tick && data.tick.symbol === selectedSymbol) {
        setTicks(prev => {
          const newTicks = [...prev, data.tick].slice(-50);
          return newTicks;
        });
        setIsLive(true);
      }
    });

    derivService.getActiveSymbols();
    
    return () => {
      derivService.unsubscribeTicks(selectedSymbol);
    };
  }, [selectedSymbol]);

  // Handle symbol change
  useEffect(() => {
    if (selectedSymbol) {
      derivService.unsubscribeTicks(selectedSymbol);
      setTicks([]);
      setIsLive(false);
      derivService.subscribeTicks(selectedSymbol);
    }
  }, [selectedSymbol]);

  // AI Analysis Trigger
  const runAiAnalysis = async () => {
    if (ticks.length < 10) {
      toast.error("Need more market data for analysis");
      return;
    }
    
    setIsAnalyzing(true);
    const result = await analyzeMarket(ticks.map(t => t.quote), selectedSymbol);
    setAiAnalysis(result);
    setIsAnalyzing(false);
    toast.success("AI Intelligence Updated");
  };

  // Execute Trade
  const executeTrade = (type: 'Rise' | 'Fall') => {
    if (stake > balance) {
      toast.error("Insufficient balance");
      return;
    }

    const currentPrice = ticks[ticks.length - 1]?.quote;
    const newTrade = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: selectedSymbol,
      type,
      stake,
      entryPrice: currentPrice,
      status: 'OPEN',
      timestamp: Date.now(),
    };

    setTrades(prev => [newTrade, ...prev]);
    setBalance(prev => prev - stake);
    
    toast.success(`${type} position opened at ${currentPrice.toFixed(2)}`);
    
    // Simulate trade resolution after 5 seconds
    setTimeout(() => {
      setTrades(prev => prev.map(t => {
        if (t.id === newTrade.id) {
          const exitPrice = ticks[ticks.length - 1]?.quote;
          const win = type === 'Rise' ? exitPrice > t.entryPrice : exitPrice < t.entryPrice;
          const profit = win ? stake * 0.95 : -stake;
          if (win) {
            setBalance(b => b + stake + stake * 0.95);
            toast.success(`Profit Realized: +$${(stake * 0.95).toFixed(2)}`);
          } else {
            toast.error(`Loss Realized: -$${stake.toFixed(2)}`);
          }
          return { ...t, status: win ? 'WON' : 'LOST', exitPrice, profit };
        }
        return t;
      }));
    }, 5000);
  };

  const filteredMarkets = useMemo(() => {
    return markets.filter(m => 
      m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [markets, searchQuery]);

  const currentPrice = ticks[ticks.length - 1]?.quote || 0;
  const prevPrice = ticks[ticks.length - 2]?.quote || 0;
  const priceChange = currentPrice - prevPrice;
  const isUp = priceChange >= 0;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      <Toaster position="top-right" theme="dark" richColors />
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-800/50 bg-black/40 backdrop-blur-2xl sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-white/20">
            <Zap className="text-black fill-black" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter italic">DERIV <span className="text-emerald-500">AI</span> TRADER</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Neural Network Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 px-5 py-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 ring-1 ring-white/5">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Available Balance</span>
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-emerald-500" />
                <span className="text-lg font-mono font-bold text-zinc-100">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8 bg-zinc-800" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Account Type</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] h-5 px-2">
                DEMO V2
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" className="rounded-xl hover:bg-zinc-800/50">
              <Bell size={18} className="text-zinc-400" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-xl hover:bg-zinc-800/50">
              <Settings2 size={18} className="text-zinc-400" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Trader" alt="Avatar" className="w-full h-full" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto w-full overflow-hidden">
        
        {/* Left Sidebar: Market Selection */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          <Card className="border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex-1 flex flex-col overflow-hidden ring-1 ring-white/5">
            <CardHeader className="p-4 pb-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={14} />
                <Input 
                  placeholder="Search assets..." 
                  className="pl-9 bg-zinc-950/50 border-zinc-800 h-10 text-sm focus:ring-emerald-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {filteredMarkets.length > 0 ? (
                    filteredMarkets.map((market) => (
                      <button
                        key={market.symbol}
                        onClick={() => setSelectedSymbol(market.symbol)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all group relative overflow-hidden",
                          selectedSymbol === market.symbol 
                            ? "bg-emerald-500/10 ring-1 ring-emerald-500/30" 
                            : "hover:bg-zinc-800/40"
                        )}
                      >
                        {selectedSymbol === market.symbol && (
                          <motion.div 
                            layoutId="active-market"
                            className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"
                          />
                        )}
                        <div className="flex flex-col items-start relative z-10">
                          <span className={cn(
                            "text-sm font-bold transition-colors",
                            selectedSymbol === market.symbol ? "text-emerald-400" : "text-zinc-300 group-hover:text-emerald-400"
                          )}>
                            {market.display_name}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-tighter">{market.market.replace('_', ' ')}</span>
                        </div>
                        <div className="flex flex-col items-end relative z-10">
                          <ChevronRight size={14} className={cn(
                            "transition-all",
                            selectedSymbol === market.symbol ? "text-emerald-500 translate-x-0" : "text-zinc-700 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                          )} />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4 opacity-50">
                        <Globe size={24} className="text-zinc-700" />
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">No assets found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Intelligence Card */}
          <Card className="border-emerald-500/20 bg-emerald-500/5 overflow-hidden relative group ring-1 ring-emerald-500/10">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Cpu size={60} className="text-emerald-500" />
            </div>
            <CardHeader className="p-5 pb-0">
              <CardTitle className="text-xs font-black flex items-center gap-2 uppercase tracking-[0.2em] text-emerald-500/80">
                <BrainCircuit size={16} />
                Neural Pulse Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {aiAnalysis ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={aiAnalysis.sentiment === 'Bullish' ? 'default' : aiAnalysis.sentiment === 'Bearish' ? 'destructive' : 'secondary'} className="rounded-lg px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                      {aiAnalysis.sentiment}
                    </Badge>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-0.5">Confidence</span>
                      <span className="text-sm font-mono font-black text-emerald-400">{aiAnalysis.score}%</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <p className="text-[11px] text-zinc-400 leading-relaxed italic font-medium">
                      "{aiAnalysis.reasoning}"
                    </p>
                  </div>
                  <Button 
                    onClick={runAiAnalysis} 
                    disabled={isAnalyzing}
                    variant="outline"
                    className="w-full h-9 text-[10px] font-bold uppercase tracking-widest gap-2 bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all"
                  >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={12} /> : <RefreshCw size={12} />}
                    Refresh Intel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                    Leverage Gemini AI to analyze the last 50 market ticks for predictive sentiment.
                  </p>
                  <Button 
                    onClick={runAiAnalysis} 
                    disabled={isAnalyzing || ticks.length < 10}
                    className="w-full h-10 text-[10px] font-bold uppercase tracking-widest gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isAnalyzing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
                    Initialize AI Pulse
                  </Button>
                  {ticks.length < 10 && (
                    <p className="text-[9px] text-zinc-600 text-center font-mono italic">
                      Collecting data: {ticks.length}/10 required
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center: Chart & Trade */}
        <div className="lg:col-span-6 flex flex-col gap-6 min-h-0">
          <Card className="border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex-1 flex flex-col overflow-hidden ring-1 ring-white/5">
            <CardHeader className="p-6 flex flex-row items-center justify-between border-b border-white/5">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                    {markets.find(m => m.symbol === selectedSymbol)?.display_name || selectedSymbol}
                  </h2>
                  <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-[0.2em] bg-zinc-950 border-zinc-800 text-zinc-500 px-2 h-5">
                    {selectedSymbol}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time Stream</span>
                  </div>
                  <Separator orientation="vertical" className="h-3 bg-zinc-800" />
                  <div className="flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Volatility Index</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentPrice}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "text-3xl font-mono font-black tracking-tighter transition-colors duration-300",
                      isUp ? "text-emerald-400" : "text-rose-500"
                    )}
                  >
                    ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </motion.div>
                </AnimatePresence>
                <div className={cn(
                  "flex items-center justify-end gap-1.5 text-xs font-bold font-mono",
                  isUp ? "text-emerald-500/80" : "text-rose-500/80"
                )}>
                  {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(priceChange).toFixed(4)} ({((priceChange / (currentPrice || 1)) * 100).toFixed(4)}%)
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative min-h-[300px]">
              {!isLive && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-md">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-emerald-500" size={24} />
                  </div>
                  <p className="mt-6 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Syncing with Deriv Cloud...</p>
                </div>
              )}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ticks} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="epoch" hide />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#666', fontWeight: 'bold', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `$${val.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="quote" 
                    stroke={isUp ? "#10b981" : "#f43f5e"} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trade Execution Panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Card className="md:col-span-5 border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm ring-1 ring-white/5">
              <CardHeader className="p-5 pb-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Risk Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Position Stake</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-500/70">MAX: ${balance.toFixed(0)}</span>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-bold group-focus-within:text-emerald-500 transition-colors">$</span>
                    <Input 
                      type="number" 
                      value={stake} 
                      onChange={(e) => setStake(Number(e.target.value))}
                      className="pl-8 bg-zinc-950/50 border-zinc-800 h-12 text-lg font-mono font-black focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 500].map(val => (
                    <Button 
                      key={val} 
                      variant="outline" 
                      size="xs" 
                      onClick={() => setStake(val)}
                      className={cn(
                        "h-8 text-[10px] font-mono font-bold transition-all border-zinc-800 bg-zinc-900/50",
                        stake === val ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "hover:border-zinc-700"
                      )}
                    >
                      {val}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-7 grid grid-cols-2 gap-4">
              <Button 
                onClick={() => executeTrade('Rise')}
                className="h-full flex flex-col gap-3 bg-emerald-500 hover:bg-emerald-400 text-black border-none transition-all group relative overflow-hidden shadow-xl shadow-emerald-500/10"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <TrendingUp className="group-hover:scale-125 transition-transform duration-300 relative z-10" size={32} />
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-xl font-black tracking-tighter uppercase italic">Rise</span>
                  <span className="text-[10px] font-bold opacity-60 tracking-widest">PAYOUT 95%</span>
                </div>
              </Button>
              <Button 
                onClick={() => executeTrade('Fall')}
                className="h-full flex flex-col gap-3 bg-rose-600 hover:bg-rose-500 text-white border-none transition-all group relative overflow-hidden shadow-xl shadow-rose-600/10"
              >
                <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <TrendingDown className="group-hover:scale-125 transition-transform duration-300 relative z-10" size={32} />
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-xl font-black tracking-tighter uppercase italic">Fall</span>
                  <span className="text-[10px] font-bold opacity-60 tracking-widest">PAYOUT 95%</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: History & Activity */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          <Card className="border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm flex-1 flex flex-col overflow-hidden ring-1 ring-white/5">
            <CardHeader className="p-5 border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <History size={14} className="text-emerald-500" />
                Trade Log
              </CardTitle>
              <Badge variant="outline" className="text-[9px] font-mono h-5 bg-zinc-950 border-zinc-800 text-zinc-500">
                {trades.length} TOTAL
              </Badge>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {trades.length > 0 ? (
                      trades.map((trade) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-3 relative overflow-hidden group"
                        >
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            trade.status === 'WON' ? "bg-emerald-500" : trade.status === 'LOST' ? "bg-rose-500" : "bg-zinc-700"
                          )} />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center",
                                trade.type === 'Rise' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                              )}>
                                {trade.type === 'Rise' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              </div>
                              <span className="text-xs font-black font-mono uppercase tracking-tighter">{trade.symbol}</span>
                            </div>
                            <Badge 
                              variant={trade.status === 'WON' ? 'default' : trade.status === 'LOST' ? 'destructive' : 'secondary'}
                              className="text-[8px] font-black h-4 px-1.5 rounded-md"
                            >
                              {trade.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-end relative z-10">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Stake</span>
                              <span className="text-xs font-mono font-bold text-zinc-300">${trade.stake}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Result</span>
                              {trade.profit !== undefined ? (
                                <span className={cn("text-xs font-mono font-black", trade.profit > 0 ? "text-emerald-400" : "text-rose-500")}>
                                  {trade.profit > 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs font-mono font-bold text-zinc-600 animate-pulse">PENDING</span>
                              )}
                            </div>
                          </div>
                          <div className="text-[8px] text-zinc-600 font-mono text-right uppercase tracking-widest pt-1 border-t border-white/5">
                            {new Date(trade.timestamp).toLocaleTimeString()}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                        <Layers size={48} className="text-zinc-500 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No active positions</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-10 border-t border-zinc-800/50 bg-black/60 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-6 text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-emerald-500/50" />
            <span>Deriv API V2.4.1</span>
          </div>
          <Separator orientation="vertical" className="h-3 bg-zinc-800" />
          <div className="flex items-center gap-2 text-emerald-500/80">
            <BrainCircuit size={12} />
            <span>Gemini Intelligence Active</span>
          </div>
          <Separator orientation="vertical" className="h-3 bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-emerald-500/50" />
            <span>Latency: 42ms</span>
          </div>
        </div>
        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          &copy; 2026 DERIV AI TRADER | COMPETITION BUILD
        </div>
      </footer>
    </div>
  );
}
