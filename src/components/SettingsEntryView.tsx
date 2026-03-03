
import React, { useState, useEffect } from 'react';
import { SimulationConfig } from '../types';
import { SettingsIcon, CalculatorIcon, UsersIcon, HandshakeIcon, CheckIcon, DatabaseIcon, UserClockIcon } from './Icons';
import { StepperControl, NumberInputControl, SmallInput } from './FormControls';

interface SettingsEntryViewProps {
    configA: SimulationConfig;
    configB: SimulationConfig;
    onConfigUpdate: (pattern: 'A' | 'B', field: keyof SimulationConfig, value: any) => void;
    onSettingsUpdate: (pattern: 'A' | 'B', type: string, field: string, subField: string | null, value: any) => void;
    voiceEnabled: boolean;
    onNavigate: (id: string) => void; // New prop
    onReturnToTitle?: () => void;
}

export const SettingsEntryView: React.FC<SettingsEntryViewProps> = ({ configA, configB, onConfigUpdate, onSettingsUpdate, voiceEnabled, onNavigate, onReturnToTitle }) => {
    // Default to 'A' (Extension Plan) as requested
    const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
    const config = activeTab === 'A' ? configA : configB;
    const color = activeTab === 'A' ? 'red' : 'gray';
    const isFixed = activeTab === 'B'; 

    const ext = config.employmentSettings?.["正社員(延長)"];

    // Defensive Check: データが存在しない場合のガード処理
    if (!ext) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 m-4">
                <SettingsIcon />
                <p className="mt-4 font-bold dark:text-gray-300">設定データを読み込めませんでした。</p>
                <p className="text-xs dark:text-gray-400">Error: '正社員(延長)' settings missing in configuration.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm font-bold dark:text-white"
                >
                    再読み込み
                </button>
            </div>
        );
    }

    const getExtCutRate = () => {
        const val = ext?.cutRate;
        return val !== undefined ? Math.round(val * 100) : 100;
    };

    const updateExt = (field: string, subField: string | null, value: any) => {
        onSettingsUpdate(activeTab, "正社員(延長)", field, subField, value);
    };

    const isFixedMode = ext.calculationMethod === 'fixed';

    // Play "Teinen Encho" voice on mount ONLY if voiceEnabled is true
    useEffect(() => {
        if (!voiceEnabled) return;

        // window check for SSR safety
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const synth = window.speechSynthesis;
            synth.cancel();

            const u = new SpeechSynthesisUtterance("定年延長");
            u.lang = 'ja-JP';
            u.pitch = 0.8; // Lower pitch for seriousness
            u.rate = 1.1;
            u.volume = 1.0;

            const voices = synth.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                                   voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                                   voices.find(v => v.lang.includes('ja'));
            if (preferredVoice) u.voice = preferredVoice;

            synth.speak(u);
        }
    }, [voiceEnabled]);

    return (
        <div className="flex flex-col bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
            <div className="p-6 bg-white dark:bg-gray-900 shadow-sm z-10 sticky top-0 transition-colors border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <SettingsIcon /> 制度設計・パラメーター設定
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onNavigate('param_table')}
                            className="hidden md:flex items-center gap-2 text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                        >
                            <DatabaseIcon style={{width: 14, height: 14}} />
                            全パラメータ一覧・比較表へ
                        </button>
                        {onReturnToTitle && (
                            <button 
                                onClick={onReturnToTitle}
                                className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-bold transition-all text-sm flex items-center gap-1"
                                title="タイトル画面へ戻る"
                            >
                                <span>🚪 終了</span>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('A')}
                        className={`flex-1 py-3 rounded-md font-bold text-sm transition-all ${
                            activeTab === 'A' 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        パターンA (定年延長案)
                    </button>
                    <button 
                        onClick={() => setActiveTab('B')}
                        className={`flex-1 py-3 rounded-md font-bold text-sm transition-all ${
                            activeTab === 'B' 
                            ? 'bg-gray-600 text-white shadow-md' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        パターンB (現行制度)
                    </button>
                </div>
                
                {/* Mobile Button */}
                <button 
                    onClick={() => onNavigate('param_table')}
                    className="md:hidden mt-3 w-full flex items-center justify-center gap-2 text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
                >
                    <DatabaseIcon style={{width: 14, height: 14}} />
                    全パラメータ一覧・比較表へ
                </button>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                
                {/* Special Pattern B Sync Setting - Available in both tabs for convenience */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl flex items-start gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full text-indigo-600 dark:text-indigo-200">
                        <HandshakeIcon />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">ベースアップ（ベア）設定の連動</h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={configB.syncBaseUpWithA || false} // Always read from configB
                                    onChange={(e) => onConfigUpdate('B', 'syncBaseUpWithA', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                            パターンAで設定した「平均ベア額」を、パターンBにも自動的に反映します。<br/>
                            <span className="font-bold">※ONにすると、パターンBの個別配分設定は無効化され、全員に平均額が一律適用されます（配分計算なし）。</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className={`font-bold mb-4 flex items-center gap-2 text-${color}-800 dark:text-${color}-300 border-b dark:border-gray-700 pb-2`}>
                            <UsersIcon /> 年齢・雇用期間設定
                        </h3>
                        
                        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm mb-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                <UserClockIcon /> 定年延長実施日
                            </label>
                            <input 
                                type="date" 
                                className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-lg p-3 text-lg font-bold bg-white dark:bg-gray-700 dark:text-gray-100 outline-none focus:border-blue-500"
                                value={config.extensionImplementationDate || '2027-04-01'}
                                onChange={(e) => onConfigUpdate(activeTab, 'extensionImplementationDate', e.target.value)}
                                disabled={isFixed}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                                この日付以降に定年年齢（例：60歳）に達する者から、新制度（延長）の対象となります。<br/>
                                ※日付より前に定年を迎えた者は、原則として旧制度（再雇用）が適用されます。
                            </p>
                        </div>

                        <StepperControl 
                            label="定年年齢 (正社員 終了)"
                            value={config.extendedRetirementAge}
                            min={55} max={70} step={1} unit="歳"
                            color={color}
                            onChange={(v) => onConfigUpdate(activeTab, 'extendedRetirementAge', v)}
                            description="この年齢に達した後、最初に到来する5月15日または11月15日をもって正社員定年となり、再雇用（または延長）へ移行します。"
                        />

                        <StepperControl 
                            label="再雇用 上限年齢"
                            value={config.reemploymentAge}
                            min={60} max={75} step={1} unit="歳"
                            color="green"
                            onChange={(v) => onConfigUpdate(activeTab, 'reemploymentAge', v)}
                            description="一般社員はこの年齢の誕生日をもってパート契約へ移行します。※嘱託（元管理職）はパートへ移行せず、契約上限年齢まで嘱託身分を維持します。"
                        />

                        <StepperControl 
                            label="パート雇用 上限年齢"
                            value={config.partTimeAgeLimit}
                            min={65} max={80} step={1} unit="歳"
                            color="gray"
                            onChange={(v) => onConfigUpdate(activeTab, 'partTimeAgeLimit', v)}
                            description="パート契約および管理職嘱託の上限年齢。この年齢に達した誕生日をもって契約終了（完全退職）となります。"
                        />

                        {/* Convert Existing Re-emp to Extension Toggle */}
                        <div className="mt-6 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                            <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">現・再雇用者の取扱い</h4>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="relative flex items-center pt-1">
                                    <input 
                                        type="checkbox" 
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-400 dark:border-gray-500 shadow-sm checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-300"
                                        checked={config.convertCurrentReempToExtension === true}
                                        onChange={(e) => onConfigUpdate(activeTab, 'convertCurrentReempToExtension', e.target.checked)}
                                        disabled={isFixed}
                                    />
                                    <CheckIcon style={{ 
                                        width: 14, 
                                        height: 14, 
                                        color: 'white', 
                                        position: 'absolute', 
                                        top: 7, 
                                        left: 3, 
                                        pointerEvents: 'none',
                                        opacity: config.convertCurrentReempToExtension ? 1 : 0 
                                    }} />
                                </div>
                                <div className="flex-1">
                                    <span className={`text-sm font-bold ${config.convertCurrentReempToExtension ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        既存の再雇用者を「延長社員」へ移行する
                                    </span>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                        チェックを入れると、現在「再雇用」として働いている65歳未満の従業員を、新制度（正社員・延長）の処遇対象として計算し直します。<br/>
                                        OFFの場合、既存の再雇用者は現行の再雇用契約のまま推移します。
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className={`font-bold mb-4 flex items-center gap-2 text-${color}-800 dark:text-${color}-300 border-b dark:border-gray-700 pb-2`}>
                            <CalculatorIcon /> 給与・再雇用条件設定
                        </h3>

                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-4 rounded-xl mb-4">
                            <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-2 border-b border-orange-200 dark:border-orange-800 pb-1">延長社員 (60歳〜)</h4>
                            
                            {/* Improved Calculation Method Toggle */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button 
                                    className={`relative py-3 rounded-lg font-bold text-sm transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                                        !isFixedMode 
                                        ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-200 dark:ring-orange-900' 
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                    }`}
                                    onClick={() => updateExt('calculationMethod', null, 'rate')}
                                    disabled={isFixed}
                                >
                                    {!isFixedMode && <div className="absolute top-2 right-2 text-white"><CheckIcon /></div>}
                                    <span>率計算 (カット率)</span>
                                    <span className="text-[10px] font-normal opacity-80">現役時 × ◯%</span>
                                </button>
                                <button 
                                    className={`relative py-3 rounded-lg font-bold text-sm transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                                        isFixedMode 
                                        ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-200 dark:ring-orange-900' 
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                    }`}
                                    onClick={() => updateExt('calculationMethod', null, 'fixed')}
                                    disabled={isFixed}
                                >
                                    {isFixedMode && <div className="absolute top-2 right-2 text-white"><CheckIcon /></div>}
                                    <span>固定額 (定額)</span>
                                    <span className="text-[10px] font-normal opacity-80">一律 ◯◯円</span>
                                </button>
                            </div>

                            <div className="mb-4">
                                {!isFixedMode ? (
                                    <div className="animate-fade-in-up space-y-4">
                                        <NumberInputControl 
                                            label="基本給支給率 (カット率)"
                                            value={getExtCutRate()}
                                            min={30} max={100} unit="%"
                                            color="orange"
                                            disabled={isFixed}
                                            onChange={(v) => {
                                                onConfigUpdate(activeTab, 'cutRate', v / 100);
                                                updateExt('cutRate', null, v / 100);
                                            }}
                                            description="定年延長期間中（60歳以降）の、現役時基本給に対する支給割合。"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <NumberInputControl 
                                                label="支給上限額 (キャップ)"
                                                value={ext?.upperLimit || 350000}
                                                min={200000} max={600000} unit="円"
                                                color="orange"
                                                disabled={isFixed}
                                                onChange={(v) => updateExt('upperLimit', null, v)}
                                                description="上限"
                                            />
                                            <NumberInputControl 
                                                label="支給下限額 (フロア)"
                                                value={ext?.lowerLimit || 224020}
                                                min={150000} max={300000} unit="円"
                                                color="orange"
                                                disabled={isFixed}
                                                onChange={(v) => updateExt('lowerLimit', null, v)}
                                                description="下限"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-fade-in-up">
                                        <NumberInputControl 
                                            label="基本給 設定額 (月額)"
                                            value={ext?.fixedSalary || 224020}
                                            min={150000} max={500000} unit="円"
                                            color="orange"
                                            disabled={isFixed} // Plan B is explicitly disabled by design for fixed salary
                                            onChange={(v) => updateExt('fixedSalary', null, v)}
                                            description="定年延長期間中（60歳以降）の基本給を一律の固定金額で設定します。"
                                        />
                                        
                                        {/* useCurrentIfLower Flag Control */}
                                        <div className="mt-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg p-3 shadow-sm">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative flex items-center pt-1">
                                                    <input 
                                                        type="checkbox" 
                                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 shadow-sm checked:bg-orange-500 checked:border-orange-500 focus:ring-2 focus:ring-orange-200"
                                                        checked={ext?.useCurrentIfLower === true}
                                                        onChange={e => updateExt('useCurrentIfLower', null, e.target.checked)}
                                                        disabled={isFixed}
                                                    />
                                                    <CheckIcon style={{ 
                                                        width: 14, 
                                                        height: 14, 
                                                        color: 'white', 
                                                        position: 'absolute', 
                                                        top: 7, 
                                                        left: 3, 
                                                        pointerEvents: 'none',
                                                        opacity: ext?.useCurrentIfLower ? 1 : 0 
                                                    }} />
                                                </div>
                                                <div className="flex-1">
                                                    <span className={`text-sm font-bold ${ext?.useCurrentIfLower ? 'text-orange-800 dark:text-orange-200' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        現行給与が低い場合は据え置く
                                                    </span>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                                        「現行給与（60歳到達時） &lt; 固定設定額」の場合、増額せずに現行給与のまま据え置きます。<br/>
                                                        ※コスト増を抑制するための設定です。
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
                                <NumberInputControl 
                                    label="再雇用 最低保証額 (固定)"
                                    value={224020}
                                    min={224020} max={224020} unit="円"
                                    color="gray"
                                    disabled={true}
                                    onChange={() => {}} 
                                    description="再雇用契約における最低賃金保証額（224,020円で固定）。"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl mb-4">
                            <NumberInputControl 
                                label="パート運転士 給与 (月額)"
                                value={config.partTimeSalary || 196000}
                                min={150000} max={300000} unit="円"
                                color="gray"
                                disabled={isFixed}
                                onChange={(v) => onConfigUpdate(activeTab, 'partTimeSalary', v)}
                                description="再雇用期間終了後にパート契約へ移行した場合の固定給与。"
                            />
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-4 rounded-xl">
                            <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-2 border-b border-purple-200 dark:border-purple-800 pb-1">管理職 嘱託移行設定</h4>
                            <NumberInputControl 
                                label="嘱託移行時給与 (65歳未満)"
                                value={config.managerShokutakuSalary || 480000}
                                min={200000} max={800000} unit="円"
                                color="purple"
                                disabled={isFixed}
                                onChange={(v) => onConfigUpdate(activeTab, 'managerShokutakuSalary', v)}
                                description="管理職が定年後に嘱託へ移行した際の月額給与。"
                            />
                            <NumberInputControl 
                                label="嘱託給与 (65歳以上)"
                                value={config.managerShokutakuOver65Salary || 287000}
                                min={200000} max={500000} unit="円"
                                color="purple"
                                disabled={isFixed}
                                onChange={(v) => onConfigUpdate(activeTab, 'managerShokutakuOver65Salary', v)}
                                description="嘱託社員が65歳に達した後の月額給与（パートへは移行しません）。"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-bold text-lg flex items-center gap-2 text-${color}-800 dark:text-${color}-300`}>
                            <CalculatorIcon /> 延長社員(60〜65歳) 詳細処遇設定
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">※ここで設定した値は「正社員(延長)」区分にのみ適用されます</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-xl border shadow-sm ${isFixed ? 'bg-gray-50' : 'bg-white'}`}>
                            <h4 className="font-bold text-gray-700 border-b pb-2 mb-3">賞与・住宅手当</h4>
                            <div className="space-y-2">
                                <div className="font-bold text-xs text-blue-600 mt-2">賞与支給月数</div>
                                <SmallInput label="夏 (6月)" value={ext?.bonusMonths?.summer} unit="ヶ月" disabled={isFixed} onChange={(v: string) => updateExt('bonusMonths', 'summer', parseFloat(v))} step={0.05} />
                                <SmallInput label="冬 (12月)" value={ext?.bonusMonths?.winter} unit="ヶ月" disabled={isFixed} onChange={(v: string) => updateExt('bonusMonths', 'winter', parseFloat(v))} step={0.05} />
                                <SmallInput label="期末 (3月)" value={ext?.bonusMonths?.end} unit="ヶ月" disabled={isFixed} onChange={(v: string) => updateExt('bonusMonths', 'end', parseFloat(v))} step={0.05} />
                                
                                <div className="border-t my-2"></div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-orange-600">住宅手当</span>
                                    <input type="checkbox" checked={ext?.housingAid?.enabled} disabled={isFixed} onChange={e => updateExt('housingAid', 'enabled', e.target.checked)} />
                                </div>
                                {ext?.housingAid?.enabled && (
                                    <>
                                        <SmallInput label="世帯あり" value={ext?.housingAid?.withFamily} unit="円" disabled={isFixed} onChange={(v: string) => updateExt('housingAid', 'withFamily', parseInt(v))} />
                                        <SmallInput label="単身" value={ext?.housingAid?.noFamily} unit="円" disabled={isFixed} onChange={(v: string) => updateExt('housingAid', 'noFamily', parseInt(v))} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border shadow-sm ${isFixed ? 'bg-gray-50' : 'bg-white'}`}>
                            <h4 className="font-bold text-gray-700 border-b pb-2 mb-3">各種手当 (支給有無)</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={ext?.allowances?.family} disabled={isFixed} onChange={e => updateExt('allowances', 'family', e.target.checked)} />
                                        家族手当
                                    </label>
                                    {ext?.allowances?.family && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-500">配偶者</span>
                                            <input type="number" className="w-16 text-right text-xs border rounded" value={ext?.allowanceAmounts?.family?.spouse} disabled={isFixed} onChange={e => updateExt('allowanceAmounts', 'family.spouse', parseInt(e.target.value))} />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={ext?.allowances?.child} disabled={isFixed} onChange={e => updateExt('allowances', 'child', e.target.checked)} />
                                        子女教育手当
                                    </label>
                                    {ext?.allowances?.child && (
                                        <input type="number" className="w-16 text-right text-xs border rounded" value={ext?.allowanceAmounts?.childEdu} disabled={isFixed} onChange={e => updateExt('allowanceAmounts', 'childEdu', parseInt(e.target.value))} />
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={ext?.allowances?.instructor} disabled={isFixed} onChange={e => updateExt('allowances', 'instructor', e.target.checked)} />
                                        指導手当
                                    </label>
                                    {ext?.allowances?.instructor && (
                                        <input type="number" className="w-16 text-right text-xs border rounded" value={ext?.allowanceAmounts?.instructor} disabled={isFixed} onChange={e => updateExt('allowanceAmounts', 'instructor', parseInt(e.target.value))} />
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={ext?.allowances?.work} disabled={isFixed} onChange={e => updateExt('allowances', 'work', e.target.checked)} />
                                        業務手当
                                    </label>
                                    {ext?.allowances?.work && (
                                        <input type="number" className="w-16 text-right text-xs border rounded" value={ext?.allowanceAmounts?.work?.type1} disabled={isFixed} onChange={e => updateExt('allowanceAmounts', 'work.type1', parseInt(e.target.value))} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border shadow-sm ${isFixed ? 'bg-gray-50' : 'bg-white'}`}>
                            <h4 className="font-bold text-gray-700 border-b pb-2 mb-3">制御設定 (キャップ/ベア)</h4>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-xs font-bold text-gray-600">給与支給上限額 (月額)</div>
                                        <input 
                                            type="checkbox" 
                                            checked={(ext?.upperLimit || 0) > 0} 
                                            onChange={e => updateExt('upperLimit', null, e.target.checked ? 350000 : 0)}
                                            disabled={isFixed}
                                            title="上限を設定する"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={(ext?.upperLimit || 0) > 0 ? ext?.upperLimit : ''} 
                                            onChange={e => updateExt('upperLimit', null, parseInt(e.target.value))}
                                            disabled={isFixed || !(ext?.upperLimit && ext.upperLimit > 0)}
                                            className={`flex-1 border rounded p-2 text-right font-bold ${isFixed || !(ext?.upperLimit && ext.upperLimit > 0) ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                                            placeholder={!(ext?.upperLimit && ext.upperLimit > 0) ? "設定なし" : ""}
                                        />
                                        <span className="text-sm">円</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">※基本給の計算結果がこれを超えた場合、上限額で頭打ちにします。</p>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-xs font-bold text-gray-600">ベア停止年齢</div>
                                        <input 
                                            type="checkbox" 
                                            checked={(ext?.bearStopAge || 0) > 0} 
                                            onChange={e => updateExt('bearStopAge', null, e.target.checked ? 60 : 0)}
                                            disabled={isFixed}
                                            title="ベア停止を設定する"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={(ext?.bearStopAge || 0) > 0 ? ext?.bearStopAge : ''} 
                                            onChange={e => updateExt('bearStopAge', null, parseInt(e.target.value))}
                                            disabled={isFixed || !(ext?.bearStopAge && ext.bearStopAge > 0)}
                                            className={`flex-1 border rounded p-2 text-right font-bold ${isFixed || !(ext?.bearStopAge && ext.bearStopAge > 0) ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                                            placeholder={!(ext?.bearStopAge && ext.bearStopAge > 0) ? "設定なし" : ""}
                                        />
                                        <span className="text-sm">歳</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">※この年齢に達すると、ベースアップの対象外とします。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
