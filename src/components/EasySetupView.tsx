
import React, { useState } from 'react';
import { FlashIcon, TrendingUpIcon, HandshakeIcon } from './Icons';

interface EasySetupViewProps {
    onBulkUpdate: (pattern: 'A' | 'B', updates: { averageAmount?: number, yearlyRaise?: number }) => void;
    onReturnToTitle?: () => void;
}

export const EasySetupView: React.FC<EasySetupViewProps> = ({ onBulkUpdate, onReturnToTitle }) => {
    const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
    const [baseUp, setBaseUp] = useState<number | ''>(0);
    const [teisho, setTeisho] = useState<number | ''>(1600);

    const handleApply = () => {
        if (window.confirm(`${activeTab === 'A' ? 'パターンA (定年延長案)' : 'パターンB (現行制度)'} に対し、\n2026年度〜2035年度の数値を一括適用します。\n\n・平均ベア: ${baseUp}円\n・定期昇給: ${teisho}円\n\nよろしいですか？`)) {
            const b = baseUp === '' ? 0 : Number(baseUp);
            const t = teisho === '' ? 0 : Number(teisho);
            
            // Execute as a single transaction
            onBulkUpdate(activeTab, { 
                averageAmount: b,
                yearlyRaise: t
            });
            
            alert('一括適用しました。シミュレーションを実行して結果を確認してください。');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[85vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center shadow-md shrink-0">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <FlashIcon /> かんたんベア・定昇設定 (Easy Setup)
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                        向こう10年間（2026〜2035年度）の賃上げ計画を一括で設定できます。<br/>
                        詳細な年度別設定を行う前の、大まかなシナリオ作成にご利用ください。
                    </p>
                </div>
                {onReturnToTitle && (
                    <button 
                        onClick={onReturnToTitle}
                        className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-bold transition-all text-sm flex items-center gap-1"
                    >
                        <span>🚪 終了</span>
                    </button>
                )}
            </div>

            <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    
                    {/* Pattern Switcher */}
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex mb-8">
                        <button 
                            onClick={() => setActiveTab('A')}
                            className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'A' 
                                ? 'bg-red-600 text-white shadow-md transform scale-[1.02]' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-2xl">🅰️</span> パターンA (定年延長案)
                        </button>
                        <button 
                            onClick={() => setActiveTab('B')}
                            className={`flex-1 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                                activeTab === 'B' 
                                ? 'bg-gray-600 text-white shadow-md transform scale-[1.02]' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-2xl">🅱️</span> パターンB (現行制度)
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
                        
                        {/* Base Up Input */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                    <TrendingUpIcon />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800">ベースアップ (ベア)</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-4 pl-12">
                                全正社員の基本給を一律で底上げする金額（月額）を入力してください。<br/>
                                <span className="text-xs text-orange-500">※正社員系（新卒・養成含む）にのみ配分され、再雇用・パート等は対象外となります。</span>
                            </p>
                            <div className="flex items-center gap-4 pl-12">
                                <input 
                                    type="number" 
                                    className="w-full text-right text-3xl font-black border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none py-2 bg-transparent transition-colors"
                                    placeholder="0"
                                    value={baseUp}
                                    onChange={(e) => setBaseUp(e.target.value === '' ? '' : parseInt(e.target.value))}
                                />
                                <span className="text-xl font-bold text-gray-400">円 / 月</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Teisho Input */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                    <HandshakeIcon />
                                </div>
                                <h3 className="font-bold text-xl text-gray-800">定期昇給 (定昇)</h3>
                            </div>
                            <p className="text-gray-500 text-sm mb-4 pl-12">
                                年齢給や勤続給による自動昇給の平均額（月額）を入力してください。<br/>
                                <span className="text-xs text-orange-500">※パート職以外の全雇用区分に適用されます。</span>
                            </p>
                            <div className="flex items-center gap-4 pl-12">
                                <input 
                                    type="number" 
                                    className="w-full text-right text-3xl font-black border-b-2 border-gray-300 focus:border-green-600 focus:outline-none py-2 bg-transparent transition-colors"
                                    placeholder="0"
                                    value={teisho}
                                    onChange={(e) => setTeisho(e.target.value === '' ? '' : parseInt(e.target.value))}
                                />
                                <span className="text-xl font-bold text-gray-400">円 / 月</span>
                            </div>
                        </div>

                    </div>

                    {/* Action Button */}
                    <div className="mt-8">
                        <button 
                            onClick={handleApply}
                            className={`w-full py-5 rounded-xl font-black text-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3 ${
                                activeTab === 'A' 
                                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700' 
                                : 'bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:from-gray-800 hover:to-gray-700'
                            }`}
                        >
                            <span>⚡</span>
                            <span>設定を反映する (2026-2035)</span>
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">
                            ※「反映」を押すと、対象パターンの全年度の設定値が上書きされます。<br/>
                            個別に設定したい場合は、左メニューの「ベア・昇給計画 (詳細)」をご利用ください。
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};
