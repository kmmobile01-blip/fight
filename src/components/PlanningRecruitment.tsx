
import React, { useEffect } from 'react';
import { RecruitmentPlanYear } from '../types';

export const RecruitmentPlanView: React.FC<{ 
    planA: Record<number, RecruitmentPlanYear>; 
    planB: Record<number, RecruitmentPlanYear>; 
    onChange: (pattern: 'A' | 'B', year: number, field: string, value: any) => void;
    voiceEnabled: boolean;
}> = ({ planA, planB, onChange, voiceEnabled }) => {
    const [activePattern, setActivePattern] = React.useState<'A' | 'B'>('A');
    
    const plan = activePattern === 'A' ? (planA || {}) : (planB || {});
    
    // Theme colors
    const colorClass = activePattern === 'A' ? 'text-green-800 dark:text-green-400 border-green-800 dark:border-green-600' : 'text-gray-800 dark:text-gray-300 border-gray-800 dark:border-gray-600';
    const buttonClassA = activePattern === 'A' ? 'bg-green-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
    const buttonClassB = activePattern === 'B' ? 'bg-gray-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';

    const sortedYears = Object.keys(plan).map(Number).sort((a, b) => a - b);

    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("運転士確保");
        u.lang = 'ja-JP';
        u.pitch = 1.0;
        u.rate = 1.2;
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [voiceEnabled]);

    if (sortedYears.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                <p>データが読み込まれていません。</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                 <h3 className={`font-bold text-lg ${colorClass} border-l-4 pl-2`}>
                    採用計画 ({activePattern === 'A' ? 'パターンA: 定年延長案' : 'パターンB: 現行制度'})
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-2 rounded font-bold transition-all ${buttonClassA}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-2 rounded font-bold transition-all ${buttonClassB}`}>パターンB</button>
                </div>
            </div>
            <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 w-24">年度</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30">新卒採用数</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/30">新卒基本給 (初任給)</th>
                            <th className="border dark:border-gray-600 p-2 bg-green-50 dark:bg-green-900/30">養成(中途)採用数</th>
                            <th className="border dark:border-gray-600 p-2 bg-green-50 dark:bg-green-900/30">中途基本給 (初任給)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedYears.map(year => {
                            const p = plan[year];
                            if (!p) return null;

                            return (
                                <tr key={year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-600 p-2 font-bold text-center dark:text-gray-300">{year}</td>
                                    <td className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/20 text-center">
                                        <input 
                                            type="number" 
                                            className="w-24 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100"
                                            value={p.newGrad ?? 0} 
                                            onChange={e => onChange(activePattern, year, 'newGrad', parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                        /> <span className="dark:text-gray-400">名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/20 text-center">
                                        <input 
                                            type="number" 
                                            className="w-32 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100"
                                            value={p.newGradSalary ?? 0} 
                                            onChange={e => onChange(activePattern, year, 'newGradSalary', parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                        /> <span className="dark:text-gray-400">円</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-green-50 dark:bg-green-900/20 text-center">
                                        <input 
                                            type="number" 
                                            className="w-24 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100"
                                            value={p.driver ?? 0} 
                                            onChange={e => onChange(activePattern, year, 'driver', parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                        /> <span className="dark:text-gray-400">名</span>
                                    </td>
                                    <td className="border dark:border-gray-600 p-2 bg-green-50 dark:bg-green-900/20 text-center">
                                        <input 
                                            type="number" 
                                            className="w-32 text-right border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-gray-800 dark:text-gray-100"
                                            value={p.driverSalary ?? 0} 
                                            onChange={e => onChange(activePattern, year, 'driverSalary', parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                        /> <span className="dark:text-gray-400">円</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded p-4 text-sm text-gray-700 dark:text-gray-300">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                    💡 シミュレーション前提条件 (注記)
                </h4>
                <ul className="list-disc ml-5 space-y-1">
                    <li><strong>新卒採用:</strong> 入社時年齢 <span className="font-bold">25歳</span> と仮定してシミュレーションされます。</li>
                    <li><strong>養成(中途)採用:</strong> 入社時年齢 <span className="font-bold">40歳</span> と仮定してシミュレーションされます。</li>
                    <li>※ 採用者は全員、各年度の <span className="font-bold">10月1日入社</span> として扱われます。</li>
                    <li>※ ここで設定した初任給は、その年度以降に入社する対象者のスタート基本給となります。</li>
                </ul>
            </div>
        </div>
    );
};
