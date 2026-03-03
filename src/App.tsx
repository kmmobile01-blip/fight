
import React, { useState, Suspense, useEffect, useRef } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { PlayCircleIcon, CloseIcon } from './components/Icons';
import { MobileHeader } from './components/layout/MobileHeader';
import { MainContent } from './components/MainContent';
import { BottomNav } from './components/layout/BottomNav';

// Lazy load modal to reduce initial chunk size
const SettingsModal = React.lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));

const AppContent = () => {
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('SF26_ACTIVE_TAB') || 'dashboard');
    const [showSplash, setShowSplash] = useState(() => {
        const saved = localStorage.getItem('SF26_SHOW_SPLASH');
        return saved === null ? true : saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('SF26_ACTIVE_TAB', activeTab);
    }, [activeTab]);

    useEffect(() => {
        localStorage.setItem('SF26_SHOW_SPLASH', showSplash.toString());
    }, [showSplash]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [modalA, setModalA] = useState(false);
    const [modalB, setModalB] = useState(false);
    
    // Mode State: Default to "Serious" (true). False = "Ura Mode" (Fun)
    const [isSeriousMode, setIsSeriousMode] = useState(() => {
        const saved = localStorage.getItem('SF26_SERIOUS_MODE');
        return saved === null ? true : saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('SF26_SERIOUS_MODE', isSeriousMode.toString());
    }, [isSeriousMode]);
    
    // Voice control state: Disabled on initial load, enabled after navigation
    // In Serious Mode, voice is forced to be disabled.
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    // Use custom hook for all business logic
    const sim = useSimulation();
    
    // Safely access length with optional chaining and fallback
    const currentEmployeeCount = sim.employees?.length || 0;

    const handleNavChange = (id: string) => {
        setActiveTab(id);
        setIsSidebarOpen(false); 
        
        // Stop any ongoing speech synthesis when navigating
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Voice logic for specific tabs
        if (!isSeriousMode) {
            setVoiceEnabled(true); 
            
            // Delay slightly to ensure cancel completes and browser is ready
            setTimeout(() => {
                if (id === 'import') {
                    const u = new SpeechSynthesisUtterance("バッジ着用指令");
                    u.lang = 'ja-JP';
                    u.pitch = 1.0;
                    u.rate = 1.0;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'consult_ohara') {
                    const u = new SpeechSynthesisUtterance("のーはらすめんとせんげん");
                    u.lang = 'ja-JP';
                    u.pitch = 1.1;
                    u.rate = 1.0;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'adventure_log') {
                    playCursedSound();
                }
                if (id === 'retirement_impact') {
                    const u = new SpeechSynthesisUtterance("高年齢雇用継続給付");
                    u.lang = 'ja-JP';
                    u.pitch = 0.9;
                    u.rate = 1.1;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'negotiation_impact') {
                    const u = new SpeechSynthesisUtterance("バッジを外せ！");
                    u.lang = 'ja-JP';
                    u.pitch = 1.2;
                    u.rate = 1.2;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'negotiation') {
                    playBattleStartSound();
                }
                if (id === 'individual_A') {
                    const u = new SpeechSynthesisUtterance("ええあんないか");
                    u.lang = 'ja-JP';
                    u.pitch = 0.8;
                    u.rate = 1.1;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'individual_B') {
                    const u = new SpeechSynthesisUtterance("びー。どうすか");
                    u.lang = 'ja-JP';
                    u.pitch = 1.0;
                    u.rate = 0.9;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'individual_C') {
                    const u = new SpeechSynthesisUtterance("しーこくのいんぼう");
                    u.lang = 'ja-JP';
                    u.pitch = 0.6;
                    u.rate = 0.8;
                    window.speechSynthesis.speak(u);
                }
                if (id === 'board_report') {
                    const u = new SpeechSynthesisUtterance("やくいんミーティングにじょうてい");
                    u.lang = 'ja-JP';
                    u.pitch = 0.8;
                    u.rate = 1.1;
                    window.speechSynthesis.speak(u);
                }
            }, 100);
        } else {
            setVoiceEnabled(false);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const playCursedSound = () => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const t = ctx.currentTime;

        // Dissonant Chord (Cursed Theme)
        const freqs = [110.00, 116.54, 123.47]; // A2, A#2, B2 (Cluster)
        
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            
            // Detune slightly for horror effect
            osc.detune.setValueAtTime((Math.random() - 0.5) * 20, t);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 2.5);
        });

        // Low rumble
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'square';
        bass.frequency.setValueAtTime(55.00, t); // A1
        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
        
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        bass.start(t);
        bass.stop(t + 3.0);
    };

    const playBattleStartSound = () => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        
        const t = ctx.currentTime;
        
        // Lead Synth (Fanfare)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Arcade-style intro
        osc.frequency.setValueAtTime(523.25, t); // C5
        gain.gain.setValueAtTime(0.1, t);
        
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        
        gain.gain.setValueAtTime(0.1, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        
        osc.start(t);
        osc.stop(t + 2.0);
        
        // Bass Impact
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'square';
        bass.frequency.setValueAtTime(130.81, t); // C3
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        
        bassGain.gain.setValueAtTime(0.3, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        
        bass.start(t);
        bass.stop(t + 1.0);
    };

    const handleReturnToTitle = () => {
        setActiveTab('dashboard');
        setShowSplash(true);
        setIsSidebarOpen(false);
        setVoiceEnabled(false); // Reset voice on return to title
    };

    const handleStartApp = () => {
        setShowSplash(false);
        setActiveTab('import');
        // Do not enable voice here immediately to keep the first screen silent
    };

    const handleRunCalculation = async () => {
        const success = await sim.runCalculation();
        if (success) {
            // Auto-navigate to summary if user is currently on any setup/input screen
            const setupPages = [
                'import', 'settings', 'raise', 'recruitment', 'allowance_settings', 
                'bonus_settings', 'lump_sum', 'custom_allowance', 'impact_rates', 
                'financial_plan', 'council_materials'
            ];
            if (setupPages.includes(activeTab)) {
                handleNavChange('summary');
            }
        }
    };

    const toggleMode = () => {
        if (isSeriousMode) {
            // Switching from Standard -> Advanced (Ura)
            // No confirmation dialog - Instant switch to ensure reliability
            setIsSeriousMode(false);
        } else {
            // Switching from Advanced -> Standard
            setIsSeriousMode(true);
            setVoiceEnabled(false); // Strictly disable voice
            window.speechSynthesis.cancel(); // Stop any playing audio
        }
    };

    const updateEmploymentSettings = (isA: boolean, newSettings: any) => { 
        const { autoRaiseEnabled, ...empSettings } = newSettings;
        if(isA) { 
            sim.setConfigA(prev => ({ 
                ...prev, 
                employmentSettings: empSettings,
                autoRaiseEnabled: autoRaiseEnabled !== undefined ? autoRaiseEnabled : prev.autoRaiseEnabled
            })); 
            setModalA(false); 
        } 
        else { 
            sim.setConfigB(prev => ({ 
                ...prev, 
                employmentSettings: empSettings,
                autoRaiseEnabled: autoRaiseEnabled !== undefined ? autoRaiseEnabled : prev.autoRaiseEnabled
            })); 
            setModalB(false); 
        } 
    };

    const getPageTitle = (tab: string) => {
        // Serious Mode Titles
        if (isSeriousMode) {
            switch(tab) {
                case 'dashboard': return 'ダッシュボード';
                case 'dashboard_bep': return '損益分岐点分析 (BEP)';
                case 'dashboard_roi': return '投資対効果分析 (ROI)';
                case 'import': return 'データ管理';
                case 'apikey_settings': return 'システム設定';
                case 'docs': return '操作マニュアル';
                case 'consult_ohara': return 'システム操作ガイド';
                case 'settings': return '制度設計パラメータ';
                case 'raise': return '昇給計画';
                case 'recruitment': return '採用計画';
                case 'allowance_settings': return '手当設定';
                case 'bonus_settings': return '賞与設定';
                case 'lump_sum': return '一時金設定';
                case 'custom_allowance': return '新規手当試算';
                case 'impact_rates': return '社会保険料・変動費設定';
                case 'financial_plan': return '予算計画';
                case 'council_materials': return '前提条件入力';
                case 'summary': return '影響額シミュレーション';
                case 'verification': return '詳細検証 (個人別)';
                case 'verification_total': return '詳細検証 (全体)';
                case 'yearly_detail': return '年度別推移表';
                case 'retirement_impact': return '60歳以上対象者リスト';
                case 'retirement_extension_target': return '定年延長対象者リスト (正社員延長)';
                case 'extension_monthly': return '定年延長者 影響額月割分析'; // Added
                case 'headcount': return '人員構成推移';
                case 'individual_A': return '支給明細 (A案)';
                case 'individual_B': return '支給明細 (B案)';
                case 'individual_C': return '支給明細 (C案)';
                case 'individual_master': return 'マスタ明細';
                case 'employee_list': return '社員名簿';
                case 'master_check': return 'データ確認';
                case 'board_report': return '役員会資料作成 (AI)'; // Standard name
                case 'bear_impact': return 'ベア影響額';
                case 'starting_salary': return '初任給影響額';
                case 'term_end_impact': return '一時金影響額';
                case 'analysis': return 'AI分析レポート';
                case 'param_table': return 'パラメータ一覧';
                case 'adventure_log': return '設定データ管理';
                default: return 'HR Strategy System';
            }
        }

        // Ura Mode Titles (Original)
        switch(tab) {
            case 'dashboard': return 'ダッシュボード';
            case 'dashboard_bep': return 'ダッシュボード2 (BEP)';
            case 'dashboard_roi': return 'ダッシュボード3 (ROI)';
            case 'import': return 'データ読込・管理';
            case 'apikey_settings': return 'APIキー設定';
            case 'docs': return 'システム操作説明書';
            case 'consult_ohara': return 'ハラスメント窓口 (大原神子)';
            case 'settings': return '制度設計（定年延長）';
            case 'raise': return 'ベア・昇給計画';
            case 'recruitment': return '採用計画';
            case 'allowance_settings': return '手当設定';
            case 'bonus_settings': return '賞与・住宅補助設定';
            case 'lump_sum': return '期末一時金設定';
            case 'custom_allowance': return '新設手当シミュレーション';
            case 'impact_rates': return '諸元設定（社保・ハネ率）';
            case 'financial_plan': return '決算・予算入力';
            case 'council_materials': return '労使協議会資料';
            case 'summary': return '影響額シミュレーション';
            case 'verification': return '数値検証 (個人別・項目別差異分析)';
            case 'verification_total': return '数値検証 (全員合計)';
            case 'yearly_detail': return '年別明細分析';
            case 'retirement_impact': return '60歳以上対象者リスト';
            case 'retirement_extension_target': return '定年延長対象者リスト (正社員延長)';
            case 'extension_monthly': return '定年延長者 影響額月割分析'; // Added
            case 'headcount': return '人員構成推移';
            case 'individual_A': return '【A案】個人別支給明細';
            case 'individual_B': return '【B案】個人別支給明細';
            case 'individual_C': return '【C案】個人別支給明細';
            case 'individual_master': return '初期マスタ明細 (全従業員)';
            case 'employee_list': return '社員名簿';
            case 'master_check': return '初期マスタ確認 (簡易)';
            case 'board_report': return 'AI専務の役員会資料';
            case 'bear_impact': return 'ベア影響額分析';
            case 'starting_salary': return '初任給改定影響';
            case 'term_end_impact': return '一時金影響額';
            case 'analysis': return 'AI 労担レポート';
            case 'requirements': return 'AI 春闘要求';
            case 'negotiation': return 'AI 団体交渉';
            case 'ai_setup': return 'AI チーム編成';
            case 'character_guide': return 'AI キャラ名鑑';
            case 'param_table': return '全パラメータ定義一覧';
            case 'adventure_log': return 'ぼうけんのしょ';
            default: return 'Spring Fighter 26';
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">
            {/* Loading Overlay */}
            {sim.isLoading && (
                <div className="fixed inset-0 bg-black/70 z-[100] flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h2 className="text-2xl font-bold font-serif mb-2">{sim.loadingMessage}</h2>
                    <p className="text-sm opacity-70">大規模計算を行っています。しばらくお待ちください...</p>
                </div>
            )}

            {/* Error Notification Modal */}
            {sim.simulationError && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-bounce-in border-l-8 border-red-600">
                        <div className="bg-red-50 dark:bg-red-900/30 p-4 border-b border-red-100 dark:border-red-800 flex justify-between items-center">
                            <h3 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                                <span className="text-2xl">⚠️</span> エラーが発生しました
                            </h3>
                            <button onClick={() => sim.setSimulationError(null)} className="text-red-400 hover:text-red-600 dark:hover:text-red-200"><CloseIcon/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300 font-medium mb-4 whitespace-pre-wrap">{sim.simulationError}</p>
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => sim.setSimulationError(null)}
                                    className="px-6 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 font-bold shadow transition-transform hover:scale-105"
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calculate Button (FAB) - Desktop Only or if BottomNav is absent */}
            {!showSplash && (
                <button 
                    onClick={handleRunCalculation}
                    className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[60] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
                        sim.isStale 
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-4 ring-red-300 dark:ring-red-900' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white opacity-90'
                    }`}
                >
                    <div className={`p-1 bg-white/20 rounded-full ${sim.isLoading ? 'animate-spin' : ''}`}>
                        <PlayCircleIcon />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-black text-lg leading-none">{sim.isStale ? '計算実行' : '再計算'}</span>
                        <span className="text-[10px] opacity-80 font-bold">{sim.isStale ? 'データが変更されました' : '最新の状態です'}</span>
                    </div>
                </button>
            )}

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block h-screen sticky top-0">
                {!showSplash && (
                    <Sidebar 
                        activeTab={activeTab} 
                        isOpen={isSidebarOpen} 
                        setIsOpen={setIsSidebarOpen} 
                        onNavChange={handleNavChange} 
                        onReturnToTitle={handleReturnToTitle} 
                        isSeriousMode={isSeriousMode}
                        onToggleMode={toggleMode}
                    />
                )}
            </div>

            {/* Main Content Wrapper */}
            <main className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 relative min-w-0 transition-all duration-300`}>
                
                {!showSplash && <MobileHeader title={getPageTitle(activeTab)} onOpenSidebar={() => setIsSidebarOpen(true)} onReturnToTitle={handleReturnToTitle} />}

                <div className={`flex-1 relative print:p-0 bg-gray-50 dark:bg-gray-950 ${!showSplash ? (activeTab === 'council_materials' ? 'p-0 pb-20 md:p-0 md:pb-0' : 'p-4 md:p-8 pb-24 md:pb-8') : 'p-0'}`}>
                    <MainContent 
                        activeTab={activeTab} 
                        sim={sim} 
                        showSplash={showSplash} 
                        setShowSplash={setShowSplash}
                        onAppStart={handleStartApp}
                        onOpenModalA={() => setModalA(true)}
                        onOpenModalB={() => setModalB(true)}
                        voiceEnabled={voiceEnabled && !isSeriousMode} // Strictly control voice based on mode
                        onNavigate={handleNavChange}
                        onReturnToTitle={handleReturnToTitle}
                        isSeriousMode={isSeriousMode}
                        onToggleMode={toggleMode} // Pass toggleMode down
                    />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            {!showSplash && (
                <div className="md:hidden">
                    <BottomNav activeTab={activeTab} setActiveTab={handleNavChange} onReturnToTitle={handleReturnToTitle} />
                </div>
            )}

            <Suspense fallback={null}>
                {(modalA || modalB) && (
                    <>
                        <SettingsModal isOpen={modalA} onClose={() => setModalA(false)} config={sim.configA} onSave={(s) => updateEmploymentSettings(true, s)} title="パターンA (定年延長案)"/>
                        <SettingsModal isOpen={modalB} onClose={() => setModalB(false)} config={sim.configB} onSave={(s) => updateEmploymentSettings(false, s)} title="パターンB (現行制度)"/>
                    </>
                )}
            </Suspense>
        </div>
    );
};

const App = () => {
    return (
        <ErrorBoundary onReset={() => window.location.reload()}>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;
