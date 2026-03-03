
import React from 'react';
import { 
    SettingsIcon, PlusCircleIcon, TrendingUpIcon, 
    UserPlusIcon, ChartIcon, UsersIcon, FileTextIcon, 
    DatabaseIcon, MessageCircleIcon, BotIcon, CommitteeIcon,
    Icon, BookOpenIcon, HandshakeIcon, CalculatorIcon,
    HeartIcon, ContactListIcon, CloseIcon, ClipboardIcon, IdCardIcon, PrinterIcon, MenuIcon, PresentationIcon, TerminalIcon, UserClockIcon, ShieldCheckIcon, CheckIcon, RefreshCwIcon, LockIcon, FlashIcon
} from './Icons';
import { NavBtn } from './NavBtn';
import { BGMPlayer } from './BGMPlayer';

interface SidebarProps {
    activeTab: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onNavChange: (id: string) => void;
    onReturnToTitle: () => void;
    isSeriousMode: boolean;
    onToggleMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, isOpen, setIsOpen, onNavChange, onReturnToTitle, isSeriousMode, onToggleMode }) => {
    
    // Serious Mode Colors & Labels
    const headerGradient = isSeriousMode 
        ? "bg-gray-800 dark:bg-gray-900 border-b-4 border-gray-600 dark:border-gray-700"
        : "bg-gradient-to-r from-[#7f1d1d] to-[#450a0a] dark:from-[#450a0a] dark:to-[#220505] border-b-4 border-yellow-600 dark:border-yellow-700";
    
    const titleText = isSeriousMode ? "人事戦略シミュレーション" : "SPRING FIGHTER '26";
    const subTitleText = isSeriousMode ? "HR Strategy Simulation System" : "HR STRATEGY SYSTEM";
    const titleColor = isSeriousMode ? "text-gray-100" : "text-yellow-400";
    const titleFont = isSeriousMode ? "font-sans" : "font-black italic tracking-tighter";
    
    // Dynamic Labels based on Mode
    const labels = {
        adventure_log: isSeriousMode ? "設定データ管理" : "ぼうけんのしょ",
        consult_ohara: isSeriousMode ? "システム操作ガイド" : "ハラスメント窓口",
        apikey_settings: isSeriousMode ? "システム設定" : "ＡＰＩ設定",
        board_report: isSeriousMode ? "役員会資料作成" : "ＡＩ専務の役員会資料", // Changed label for Standard
        council_materials: isSeriousMode ? "前提条件入力" : "労使協議会資料",
        term_end_impact: isSeriousMode ? "一時金影響額" : "期末一時金額",
    };

    return (
        <>
            {/* Mobile Backdrop for Expanded State */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[80] md:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-[90] bg-[#fffaf0] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl transition-all duration-300 ease-in-out
                md:sticky md:top-0 md:h-screen md:shadow-lg md:z-auto
                ${isOpen ? 'w-[260px]' : 'w-[60px]'} 
                md:w-[240px]
            `}>
                {/* Header Section */}
                <div 
                    className={`
                        ${headerGradient} text-white text-center shadow-md relative flex flex-col justify-center items-center
                        ${isOpen ? 'p-4' : 'p-2 py-4'}
                        md:p-4
                    `}
                >
                    {/* Toggle Button (Mobile Only) */}
                    {!isOpen && (
                        <button onClick={(e) => { e.stopPropagation(); setIsOpen(true); }} className="md:hidden text-white mb-2">
                            <MenuIcon />
                        </button>
                    )}

                    {/* Full Logo (Visible when Open or Desktop) */}
                    <div className={`${isOpen ? 'block' : 'hidden'} md:block animate-fade-in`}>
                        <h1 className={`${titleFont} text-xl leading-tight ${titleColor}`} style={!isSeriousMode ? { fontFamily: '"Russo One", sans-serif' } : {}}>
                            {isSeriousMode ? (
                                <span>人事戦略<br/>シミュレーション</span>
                            ) : (
                                <span>SPRING<br/>FIGHTER '26</span>
                            )}
                        </h1>
                        <div className="text-[10px] opacity-70 tracking-widest mt-1">{subTitleText}</div>
                    </div>

                    {/* Collapsed Logo (Mobile Closed) */}
                    <div className={`${!isOpen ? 'block' : 'hidden'} md:hidden font-black ${titleColor} text-xs text-center leading-tight`}>
                        {isSeriousMode ? "HR\nSys" : "SF\n'26"}
                    </div>
                    
                    {/* Close Button (Mobile Open) */}
                    {isOpen && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                            className="absolute top-2 right-2 text-white/60 hover:text-white md:hidden"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {/* Back to Title Button */}
                    <button 
                        onClick={onReturnToTitle}
                        className={`w-full flex items-center gap-3 px-2 py-3 rounded mb-4 text-sm font-bold bg-gray-800 text-white hover:bg-gray-700 transition-all shadow-md
                            ${isOpen ? 'justify-start pl-4' : 'justify-center'} md:justify-start md:pl-4
                        `}
                        title="タイトル画面へ戻る"
                    >
                        <span className="text-lg">↩</span> 
                        <span className={`${isOpen ? 'block' : 'hidden'} md:block`}>タイトルへ</span>
                    </button>

                    {/* Group 1: Basics */}
                    <NavBtn id="docs" label="マニュアル" icon={<BookOpenIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="consult_ohara" label={labels.consult_ohara} icon={<TerminalIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="apikey_settings" label={labels.apikey_settings} icon={<Icon path="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="import" label="データ読込" icon={<DatabaseIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="adventure_log" label={labels.adventure_log} icon={<BookOpenIcon style={isSeriousMode ? {} : {color: '#d97706'}} />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    
                    <div className="my-2 border-t border-gray-300 dark:border-gray-700"></div>

                    {/* Group 2: Planning (Inputs) */}
                    <NavBtn id="settings" label="制度設計" icon={<SettingsIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="raise" label="ベア・昇給計画" icon={<TrendingUpIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="recruitment" label="採用計画" icon={<UserPlusIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="bonus_settings" label="賞与設定" icon={<Icon path="M12 2v20M2 12h20"/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="allowance_settings" label="手当設定" icon={<Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="custom_allowance" label="新設手当" icon={<PlusCircleIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="lump_sum" label="期末一時金" icon={<HeartIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="impact_rates" label="諸元設定" icon={<Icon path="M12 20V10M6 20V4M18 20v-4"/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="financial_plan" label="決算・予算" icon={<CalculatorIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="council_materials" label={labels.council_materials} icon={<ClipboardIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>

                    <div className="my-2 border-t border-gray-300 dark:border-gray-700"></div>

                    {/* Group 3: Verification */}
                    <NavBtn id="verification_total" label="数値検証全員" icon={<Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="verification" label="数値検証個人別" icon={<CheckIcon style={isSeriousMode ? {} : {color: '#10b981'}} />} active={activeTab} set={onNavChange} isOpen={isOpen}/>

                    <div className="my-2 border-t border-gray-300 dark:border-gray-700"></div>

                    {/* Group 4: Analysis (Outputs) */}
                    <NavBtn id="dashboard" label="ダッシュボード" icon={<ChartIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="summary" label="影響額シミュレーション" icon={<ChartIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="yearly_detail" label="年別明細" icon={<Icon path="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M21 3h-5M21 3l-6 6"/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="headcount" label="人員構成" icon={<UsersIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="employee_list" label="社員名簿" icon={<ContactListIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="individual_A" label="Ａ案個人別" icon={<FileTextIcon style={isSeriousMode ? {} : {color: '#ef4444'}}/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="individual_B" label="Ｂ案個人別" icon={<FileTextIcon style={isSeriousMode ? {} : {color: '#3b82f6'}}/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="individual_C" label="Ｃ案個人別" icon={<FileTextIcon style={isSeriousMode ? {} : {color: '#6b7280'}}/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="individual_master" label="初期マスタ明細" icon={<DatabaseIcon style={isSeriousMode ? {} : {color: '#888'}}/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="master_check" label="マスタ確認（表）" icon={<DatabaseIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="param_table" label="全パラメータ" icon={<DatabaseIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    
                    <div className="my-2 border-t border-gray-300 dark:border-gray-700"></div>
                    
                    {/* Group 5: Impact Analysis */}
                    <NavBtn id="retirement_impact" label="60歳以上抽出" icon={<UserClockIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="retirement_extension_target" label="定年延長抽出" icon={<UserClockIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="extension_monthly" label="延長者月割分析" icon={<CalculatorIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="starting_salary" label="初任給影響" icon={<TrendingUpIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="term_end_impact" label={labels.term_end_impact} icon={<HandshakeIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>

                    <div className="my-2 border-t border-gray-300 dark:border-gray-700"></div>

                    {/* Group 6: AI & Advanced - LIMITED IN SERIOUS MODE */}
                    <NavBtn id="analysis" label="労担レポ" icon={<BotIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    
                    {/* Always show Board Report in both modes */}
                    <NavBtn id="board_report" label={labels.board_report} icon={<PresentationIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>

                    {!isSeriousMode && (
                        <NavBtn id="requirements" label="春闘要求" icon={<CommitteeIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    )}

                    <NavBtn id="dashboard_bep" label="ＢＥＰ分析" icon={<TrendingUpIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    <NavBtn id="dashboard_roi" label="ＲＯＩ分析" icon={<ShieldCheckIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                    
                    {!isSeriousMode && (
                        <>
                            <NavBtn id="ai_setup" label="ＡＩチーム編成" icon={<UsersIcon />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                            <NavBtn id="negotiation" label="ＡＩ団体交渉" icon={<MessageCircleIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                            <NavBtn id="negotiation_impact" label="交渉インパクト分析" icon={<TrendingUpIcon style={{color: '#f87171'}} />} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                            <NavBtn id="character_guide" label="キャラ名鑑" icon={<IdCardIcon/>} active={activeTab} set={onNavChange} isOpen={isOpen}/>
                        </>
                    )}
                </nav>
                
                {/* Mode Switcher */}
                <div className={`p-3 border-t ${isSeriousMode ? 'border-gray-300 bg-gray-100' : 'border-gray-700 bg-gray-800'}`}>
                    <button 
                        onClick={onToggleMode}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            isSeriousMode 
                            ? 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50' 
                            : 'bg-red-900/50 text-red-200 border border-red-800 hover:bg-red-900/80 animate-pulse'
                        }`}
                        title={isSeriousMode ? "上級者モードへ切り替え" : "標準モードへ戻る"}
                    >
                        {isSeriousMode ? <LockIcon style={{width: 14}}/> : <FlashIcon style={{width: 14}}/>}
                        <span>{isSeriousMode ? "標準モード (Standard)" : "上級者モード (Advanced)"}</span>
                    </button>
                </div>
                
                {/* BGM Player - Only in Ura Mode (Not Serious Mode) */}
                <div className={`${isOpen && !isSeriousMode ? 'block' : 'hidden'} md:block`}>
                    {!isSeriousMode && <BGMPlayer />}
                </div>
            </aside>
        </>
    );
};
