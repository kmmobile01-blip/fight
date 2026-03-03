
import React from 'react';
import { 
    SettingsIcon, PlusCircleIcon, TrendingUpIcon, 
    UserPlusIcon, ChartIcon, UsersIcon, FileTextIcon, 
    DatabaseIcon, MessageCircleIcon, BotIcon, CommitteeIcon,
    Icon, BookOpenIcon, HandshakeIcon, CalculatorIcon,
    HeartIcon, ContactListIcon, ClipboardIcon, IdCardIcon, PresentationIcon, TerminalIcon, UserClockIcon, ShieldCheckIcon, CheckIcon, RefreshCwIcon,
    HomeIcon
} from '../Icons';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (id: string) => void;
    onReturnToTitle: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onReturnToTitle }) => {
    
    const navItems = [
        { id: 'docs', label: 'マニュアル', icon: <BookOpenIcon/> },
        { id: 'consult_ohara', label: 'ハラスメント窓口', icon: <TerminalIcon /> },
        { id: 'apikey_settings', label: 'ＡＰＩ設定', icon: <Icon path="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /> },
        { id: 'import', label: 'データ読込', icon: <DatabaseIcon /> },
        { id: 'adventure_log', label: 'ぼうけんのしょ', icon: <BookOpenIcon style={{color: '#d97706'}} /> },
        { id: 'settings', label: '制度設計', icon: <SettingsIcon/> },
        { id: 'raise', label: 'ベア・昇給計画', icon: <TrendingUpIcon/> },
        { id: 'recruitment', label: '採用計画', icon: <UserPlusIcon/> },
        { id: 'bonus_settings', label: '賞与設定', icon: <Icon path="M12 2v20M2 12h20"/> },
        { id: 'allowance_settings', label: '手当設定', icon: <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/> },
        { id: 'custom_allowance', label: '新設手当', icon: <PlusCircleIcon/> },
        { id: 'lump_sum', label: '期末一時金', icon: <HeartIcon/> },
        { id: 'impact_rates', label: '諸元設定', icon: <Icon path="M12 20V10M6 20V4M18 20v-4"/> },
        { id: 'financial_plan', label: '決算・予算', icon: <CalculatorIcon /> },
        { id: 'council_materials', label: '労使協議会資料', icon: <ClipboardIcon /> },
        { id: 'verification_total', label: '数値検証全員', icon: <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /> },
        { id: 'verification', label: '数値検証個人別', icon: <CheckIcon style={{color: '#10b981'}} /> },
        { id: 'dashboard', label: 'ダッシュボード', icon: <ChartIcon /> },
        { id: 'summary', label: '影響額試算', icon: <ChartIcon/> },
        { id: 'yearly_detail', label: '年別明細', icon: <Icon path="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M21 3h-5M21 3l-6 6"/> },
        { id: 'headcount', label: '人員構成', icon: <UsersIcon/> },
        { id: 'employee_list', label: '社員名簿', icon: <ContactListIcon/> },
        { id: 'individual_A', label: 'Ａ案個人別', icon: <FileTextIcon style={{color: '#ef4444'}}/> },
        { id: 'individual_B', label: 'Ｂ案個人別', icon: <FileTextIcon style={{color: '#3b82f6'}}/> },
        { id: 'individual_C', label: 'Ｃ案個人別', icon: <FileTextIcon style={{color: '#6b7280'}}/> },
        { id: 'individual_master', label: '初期マスタ明細', icon: <DatabaseIcon style={{color: '#888'}}/> },
        { id: 'master_check', label: 'マスタ確認（表）', icon: <DatabaseIcon/> },
        { id: 'param_table', label: '全パラメータ', icon: <DatabaseIcon /> },
        { id: 'retirement_impact', label: '定年延長影響', icon: <UserClockIcon/> },
        { id: 'starting_salary', label: '初任給影響', icon: <TrendingUpIcon/> },
        { id: 'term_end_impact', label: '一時金影響', icon: <HandshakeIcon /> },
        { id: 'analysis', label: '労担レポ', icon: <BotIcon/> },
        { id: 'requirements', label: '春闘要求', icon: <CommitteeIcon/> },
        { id: 'board_report', label: 'ＡＩ専務の役員会資料', icon: <PresentationIcon /> },
        { id: 'dashboard_bep', label: 'ＢＥＰ分析', icon: <TrendingUpIcon /> },
        { id: 'dashboard_roi', label: 'ＲＯＩ分析', icon: <ShieldCheckIcon /> },
        { id: 'ai_setup', label: 'ＡＩチーム編成', icon: <UsersIcon /> },
        { id: 'negotiation', label: 'ＡＩ団体交渉', icon: <MessageCircleIcon/> },
        { id: 'character_guide', label: 'キャラ名鑑', icon: <IdCardIcon/> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-300 dark:border-gray-700 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe flex flex-col transition-colors duration-300">
            <div className="flex overflow-x-auto no-scrollbar py-2 px-2 items-center gap-1 w-full bg-white dark:bg-gray-950">
                
                {/* Title Return Button */}
                <button 
                    onClick={onReturnToTitle}
                    className="flex flex-col items-center justify-center min-w-[4rem] px-2 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border-r border-gray-300 dark:border-gray-700 mr-1 shrink-0 bg-gray-50 dark:bg-gray-900"
                >
                    <HomeIcon className="w-5 h-5" />
                    <span className="text-[10px] font-black mt-1 whitespace-nowrap">タイトル</span>
                </button>

                {/* Navigation Items */}
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center min-w-[4.8rem] px-1 py-3 rounded-lg transition-all shrink-0 snap-start
                            ${activeTab === item.id 
                                ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold border-b-4 border-red-600 dark:border-red-500' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
                            }`}
                    >
                        <span className={`${activeTab === item.id ? 'scale-110' : ''} transition-transform duration-200`}>
                            {/* Make icons slightly larger/bolder by implicit context or style */}
                            <span style={{ transform: 'scale(1.1)' }}>{item.icon}</span>
                        </span>
                        <span className={`text-[10px] mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center leading-none ${activeTab === item.id ? 'font-black' : 'font-bold'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
            
            {/* Scrollbar Hiding Styles */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
