/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, TrendingUp, TrendingDown, Minus, Target, ShieldAlert, 
  Activity, Info, Loader2, Building2, PieChart, Newspaper, 
  ThumbsUp, ThumbsDown, ArrowUpRight, ArrowDownRight, BarChart3, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeChart, TradingSetup } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TradingSetup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runAnalysis = async (base64: string, type: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzeChart(base64, type);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError('Analysis failed due to a temporary server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      await runAnalysis(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-mono text-sm font-bold tracking-widest uppercase">TradeVision AI v2.0</h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500 uppercase tracking-tighter">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live Market Data</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Engine: Gemini 3 Flash (High Speed)</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-12 flex flex-col items-center justify-center"
            >
              <div className="text-center mb-12 max-w-2xl">
                <h2 className="text-5xl font-bold mb-6 tracking-tight">Full Spectrum <span className="text-blue-500">Market Intelligence.</span></h2>
                <p className="text-neutral-400 text-lg leading-relaxed">
                  Upload a chart to get technical analysis, company profiles, financial health reports, and real-time news sentiment.
                </p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl aspect-video border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-neutral-500 group-hover:text-blue-500" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-lg">Drop your chart here</p>
                  <p className="text-neutral-500 text-sm">Supports PNG, JPG, WEBP</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Top Section: Chart & Signal */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden relative group h-full flex items-center justify-center min-h-[400px]">
                    <img src={image} alt="Stock Chart" className="w-full h-auto object-contain max-h-[600px]" />
                    {loading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        <p className="font-mono text-xs tracking-widest uppercase animate-pulse">Scanning Market & News...</p>
                      </div>
                    )}
                    <button 
                      onClick={reset}
                      className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 p-2 rounded-full backdrop-blur-md border border-white/10 transition-colors z-10"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  {result ? (
                    <>
                      {/* Signal Card */}
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-8 rounded-2xl border flex flex-col items-center text-center gap-4 ${
                          result.signal === 'BUY' ? 'bg-green-500/10 border-green-500/20' :
                          result.signal === 'SELL' ? 'bg-red-500/10 border-red-500/20' :
                          'bg-yellow-500/10 border-yellow-500/20'
                        }`}
                      >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          result.signal === 'BUY' ? 'bg-green-500 text-white' :
                          result.signal === 'SELL' ? 'bg-red-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {result.signal === 'BUY' ? <TrendingUp className="w-8 h-8" /> :
                           result.signal === 'SELL' ? <TrendingDown className="w-8 h-8" /> :
                           <Minus className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className="font-mono text-xs uppercase tracking-widest opacity-60 mb-1">Trading Signal</p>
                          <h2 className="text-4xl font-black tracking-tighter">{result.signal}</h2>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              result.signal === 'BUY' ? 'bg-green-500' :
                              result.signal === 'SELL' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${result.confidence}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Confidence: {result.confidence}%</p>
                      </motion.div>

                      {/* Price Setup */}
                      <div className="data-grid rounded-2xl overflow-hidden">
                        <div className="data-cell">
                          <span className="label">Entry</span>
                          <span className="value text-blue-400">{result.entryPrice}</span>
                        </div>
                        <div className="data-cell">
                          <span className="label">Target</span>
                          <span className="value text-green-400">{result.targetPrice}</span>
                        </div>
                        <div className="data-cell">
                          <span className="label">Stop Loss</span>
                          <span className="value text-red-400">{result.stopLoss}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-2xl bg-neutral-900/20 min-h-[300px]">
                      <Loader2 className="w-8 h-8 text-neutral-700 animate-spin mb-4" />
                      <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">Awaiting AI Processing...</p>
                    </div>
                  )}
                </div>
              </div>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {/* Company Info Card */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Company Profile</h3>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{result.companyInfo.name}</h4>
                      <p className="text-blue-500 font-mono text-sm">{result.companyInfo.ticker} • {result.companyInfo.sector}</p>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed line-clamp-4">
                      {result.companyInfo.description}
                    </p>
                  </div>

                  {/* Financials Card */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="w-4 h-4 text-blue-500" />
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Financial Health</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 uppercase">Revenue</p>
                        <p className="text-lg font-semibold">{result.financials.revenue}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 uppercase">Net Profit</p>
                        <p className="text-lg font-semibold">{result.financials.profit}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 uppercase">Margin</p>
                        <p className="text-lg font-semibold">{result.financials.margin}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 uppercase">Trend</p>
                        <div className="flex items-center gap-1">
                          {result.financials.trend === 'UP' ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : 
                           result.financials.trend === 'DOWN' ? <ArrowDownRight className="w-4 h-4 text-red-500" /> : 
                           <Minus className="w-4 h-4 text-yellow-500" />}
                          <p className={`text-lg font-semibold ${
                            result.financials.trend === 'UP' ? 'text-green-500' : 
                            result.financials.trend === 'DOWN' ? 'text-red-500' : 
                            'text-yellow-500'
                          }`}>{result.financials.trend}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trading Strategies Card */}
                  <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Trading Strategies</h3>
                    </div>
                    <div className="space-y-4">
                      {result.strategies.map((s, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-blue-400">{s.name}</h4>
                            <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded uppercase">{s.timing}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-tight">{s.description}</p>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                            <div>
                              <p className="text-[9px] text-neutral-500 uppercase">Target</p>
                              <p className="text-xs font-mono text-green-400">{s.target}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-neutral-500 uppercase">Stop Loss</p>
                              <p className="text-xs font-mono text-red-400">{s.stopLoss}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {result && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Analysis Detail */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-8 bg-neutral-900/50 border border-white/5 rounded-2xl p-8"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-500">Technical Breakdown</h3>
                    </div>
                    <div className="markdown-body prose prose-invert max-w-none">
                      <ReactMarkdown>{result.analysis}</ReactMarkdown>
                    </div>
                  </motion.div>

                  {/* Patterns & Indicators Sidebar */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-blue-500" />
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Patterns Identified</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.patterns.map((p, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-wider">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-4 h-4 text-blue-500" />
                        <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Key Indicators</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.indicators.map((ind, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-wider">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
            {image && (
              <button 
                onClick={() => {
                  const mimeType = image.split(';')[0].split(':')[1];
                  runAnalysis(image, mimeType);
                }}
                className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
              >
                Retry Analysis
              </button>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/5 p-12 text-center space-y-2">
        <p className="text-neutral-600 text-[10px] font-mono uppercase tracking-[0.2em]">
          &copy; 2026 TradeVision AI. For educational purposes only. Not financial advice.
        </p>
        <p className="text-blue-500/50 text-[10px] font-mono uppercase tracking-[0.2em]">
          Developed by Mohit Sharma
        </p>
      </footer>
    </div>
  );
}
