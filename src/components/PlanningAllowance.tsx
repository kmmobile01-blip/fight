
import React, { useEffect } from 'react';
import { SimulationConfig, CustomAllowance } from '../types';
import { SettingsIcon, TrashIcon, PlusCircleIcon } from './Icons';

export const AllowanceSettingsView: React.FC<{
    configA: SimulationConfig;
    configB: SimulationConfig;
    onUpdate: (pattern: 'A' | 'B', type: string, field: string, subField: string | null, value: any) => void;
    voiceEnabled: boolean;
}> = ({ configA, configB, onUpdate, voiceEnabled }) => {
    const [activePattern, setActivePattern] = React.useState<'A' | 'B'>('A');
    const config = activePattern === 'A' ? configA : configB;
    const settings = config.employmentSettings;
    const types = ["正社員", "正社員(新卒)", "正社員(養成)", "正社員(延長)", "再雇用", "嘱託", "再雇用(嘱託)", "パート運転士(月給制)", "管理職"];

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance("同一労働同一賃金");
        u.lang = 'ja-JP';
        u.pitch = 1.0;
        u.rate = 1.1;
        u.volume = 1.0;
        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;
        synth.speak(u);
    }, [voiceEnabled]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    諸手当支給設定 ({activePattern === 'A' ? 'パターンA' : 'パターンB'})
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-2 rounded font-bold transition-all ${activePattern === 'A' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-2 rounded font-bold transition-all ${activePattern === 'B' ? 'bg-gray-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>パターンB</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 bg-white dark:bg-gray-800 sticky left-0 z-10 w-40"></th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-900 dark:text-orange-200" colSpan={3}>家族手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200">子女教育</th>
                            <th className="border dark:border-gray-600 p-2 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-200">指導手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200">管理手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100">業務手当</th>
                        </tr>
                        <tr>
                            <th className="border dark:border-gray-600 p-2 sticky left-0 z-10 bg-gray-100 dark:bg-gray-700">雇用区分</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">配偶者</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">子</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">親・他</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30 text-xs">一律</th>
                            <th className="border dark:border-gray-600 p-2 bg-green-50 dark:bg-green-900/30 text-xs">一律</th>
                            <th className="border dark:border-gray-600 p-2 bg-purple-50 dark:bg-purple-900/30 text-xs">Type1</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-600 text-xs">Type1</th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map(type => {
                            const s = settings[type];
                            if(!s) return null;
                            return (
                                <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-600 p-2 font-bold sticky left-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">{type}</td>
                                    
                                    {/* Family Allowance */}
                                    <td className="border dark:border-gray-600 p-2 bg-orange-50/30 dark:bg-orange-900/10">
                                        <div className="flex flex-col items-center">
                                            <input type="checkbox" checked={s.allowances.family} onChange={e => onUpdate(activePattern, type, 'allowances', 'family', e.target.checked)} className="mb-1"/>
                                            {s.allowances.family && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.family?.spouse || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'family.spouse', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-orange-50/30 dark:bg-orange-900/10">
                                        <div className="flex flex-col items-center">
                                            <span className="h-4"></span>
                                            {s.allowances.family && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.family?.child || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'family.child', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-orange-50/30 dark:bg-orange-900/10">
                                        <div className="flex flex-col items-center">
                                            <span className="h-4"></span>
                                            {s.allowances.family && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.family?.parent || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'family.parent', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>

                                    {/* Child Education */}
                                    <td className="border dark:border-gray-600 p-2 bg-blue-50/30 dark:bg-blue-900/10">
                                        <div className="flex flex-col items-center">
                                            <input type="checkbox" checked={s.allowances.child} onChange={e => onUpdate(activePattern, type, 'allowances', 'child', e.target.checked)} className="mb-1"/>
                                            {s.allowances.child && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.childEdu || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'childEdu', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>

                                    {/* Instructor */}
                                    <td className="border dark:border-gray-600 p-2 bg-green-50/30 dark:bg-green-900/10">
                                        <div className="flex flex-col items-center">
                                            <input type="checkbox" checked={s.allowances.instructor} onChange={e => onUpdate(activePattern, type, 'allowances', 'instructor', e.target.checked)} className="mb-1"/>
                                            {s.allowances.instructor && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.instructor || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'instructor', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>

                                    {/* Manager */}
                                    <td className="border dark:border-gray-600 p-2 bg-purple-50/30 dark:bg-purple-900/10">
                                        <div className="flex flex-col items-center">
                                            <input type="checkbox" checked={s.allowances.manager} onChange={e => onUpdate(activePattern, type, 'allowances', 'manager', e.target.checked)} className="mb-1"/>
                                            {s.allowances.manager && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.manager?.type1 || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'manager.type1', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>

                                    {/* Work */}
                                    <td className="border dark:border-gray-600 p-2 bg-gray-50/30 dark:bg-gray-700/30">
                                        <div className="flex flex-col items-center">
                                            <input type="checkbox" checked={s.allowances.work} onChange={e => onUpdate(activePattern, type, 'allowances', 'work', e.target.checked)} className="mb-1"/>
                                            {s.allowances.work && (
                                                <input type="number" className="w-16 text-right border dark:border-gray-500 rounded p-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100" value={s.allowanceAmounts?.work?.type1 || 0} onChange={e => onUpdate(activePattern, type, 'allowanceAmounts', 'work.type1', parseInt(e.target.value)||0)}/>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">※ チェックを入れると、データ読込時に該当手当を持っている従業員に対して、設定した単価または支給実績(ロジックによる)が適用されます。</p>
        </div>
    );
};

export const CustomAllowanceView: React.FC<{
    allowances: CustomAllowance[];
    onAdd: () => void;
    onDelete: (id: number) => void;
    onChange: (id: number, field: string, value: any) => void;
    voiceEnabled: boolean;
}> = ({ allowances, onAdd, onDelete, onChange, voiceEnabled }) => {
    const types = ["正社員", "正社員(延長)", "再雇用", "嘱託", "再雇用(嘱託)", "パート運転士(月給制)", "管理職"];
    
    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance("拘束時間短縮");
        u.lang = 'ja-JP';
        u.pitch = 1.0; 
        u.rate = 1.1; 
        u.volume = 1.0;
        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;
        synth.speak(u);
    }, [voiceEnabled]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <SettingsIcon /> 新設手当シミュレーション
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                新しい手当（例：若年層定着手当、シニア活躍手当など）をシミュレーションに追加できます。<br/>
                条件（年齢、勤続年数、入社日）に合致する対象者に、指定した金額を毎月支給します。
            </p>

            {allowances.map(a => (
                <div key={a.id} className="border dark:border-gray-600 rounded-lg p-4 mb-4 shadow-sm bg-gray-50 dark:bg-gray-900 relative transition-colors">
                    <button onClick={() => onDelete(a.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded"><TrashIcon /></button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">手当名称</label>
                            <input type="text" className="border dark:border-gray-600 rounded p-1 w-full bg-white dark:bg-gray-800 dark:text-gray-100" value={a.name} onChange={e => onChange(a.id, 'name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">年齢条件 (以上 ~ 未満)</label>
                                <div className="flex items-center gap-1">
                                    <input type="number" className="border dark:border-gray-600 rounded p-1 w-full text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Min" value={a.ageMin} onChange={e => onChange(a.id, 'ageMin', e.target.value)} />
                                    <span className="dark:text-gray-400">~</span>
                                    <input type="number" className="border dark:border-gray-600 rounded p-1 w-full text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Max" value={a.ageMax} onChange={e => onChange(a.id, 'ageMax', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">勤続条件 (以上 ~ 未満)</label>
                                <div className="flex items-center gap-1">
                                    <input type="number" className="border dark:border-gray-600 rounded p-1 w-full text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Min" value={a.tenureMin} onChange={e => onChange(a.id, 'tenureMin', e.target.value)} />
                                    <span className="dark:text-gray-400">~</span>
                                    <input type="number" className="border dark:border-gray-600 rounded p-1 w-full text-sm bg-white dark:bg-gray-800 dark:text-gray-100" placeholder="Max" value={a.tenureMax} onChange={e => onChange(a.id, 'tenureMax', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">入社日条件 (以降)</label>
                                <input 
                                    type="date" 
                                    className="border dark:border-gray-600 rounded p-1 w-full text-sm bg-white dark:bg-gray-800 dark:text-gray-100" 
                                    value={a.hireDateMin || ''} 
                                    onChange={e => onChange(a.id, 'hireDateMin', e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-2 rounded w-fit">
                            <input 
                                type="checkbox" 
                                checked={a.isRippleTarget !== false} 
                                onChange={e => onChange(a.id, 'isRippleTarget', e.target.checked)} 
                            />
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">この手当をハネ率計算の対象にする</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">支給額設定 (月額) - チェックを入れると有効化</label>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                            {types.map(t => {
                                const isEnabled = a.enabled ? a.enabled[t] : false;
                                return (
                                    <div key={t} className={`p-2 border rounded transition-colors ${isEnabled ? 'bg-white dark:bg-gray-800 border-blue-300' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input 
                                                type="checkbox" 
                                                checked={isEnabled} 
                                                onChange={e => onChange(a.id, 'enabled', { ...a.enabled, [t]: e.target.checked })} 
                                            />
                                            <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate" title={t}>{t}</div>
                                        </div>
                                        <input 
                                            type="number" 
                                            className={`w-full text-right border-b focus:outline-none focus:border-blue-500 text-sm bg-transparent ${!isEnabled ? 'text-gray-400 dark:text-gray-600' : 'dark:text-gray-100'}`}
                                            value={a.amounts[t] || 0} 
                                            disabled={!isEnabled}
                                            onChange={e => onChange(a.id, 'amounts', { ...a.amounts, [t]: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ))}

            <button onClick={onAdd} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 font-bold">
                <PlusCircleIcon /> 新しい手当を追加
            </button>
        </div>
    );
};
