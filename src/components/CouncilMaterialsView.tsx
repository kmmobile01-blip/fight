
import React, { useEffect, useState } from 'react';
import { ClipboardIcon, FileTextIcon, BotIcon, RefreshCwIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, generateContentWithFallback } from '../utils/geminiHelper';

interface CouncilMaterialsViewProps {
    value: string;
    onChange: (val: string) => void;
    voiceEnabled: boolean;
    onReturnToTitle?: () => void;
}

export const CouncilMaterialsView: React.FC<CouncilMaterialsViewProps> = ({ value, onChange, voiceEnabled, onReturnToTitle }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Play "Seii o Misero" voice on mount
    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("誠意を見せろ");
        u.lang = 'ja-JP';
        u.pitch = 0.8; // Low and demanding
        u.rate = 1.1; 
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [voiceEnabled]);

    const insertTemplate = (type: 'financial' | 'market' | 'shortage' | 'retention') => {
        let text = "";
        switch(type) {
            case 'financial':
                text = `【決算・予算見通し】
・2025年度実績見込：営業収益 35億円、営業利益 ▲5,000万円（赤字）。
・燃料費の高騰（軽油価格 前年比+15%）により、利益率が大幅に悪化。
・2026年度予算：運賃改定を見込むも、人件費増により営業利益トントンを目標とする。
・内部留保の取り崩しは限界に近く、赤字補填の原資は枯渇しつつある。`;
                break;
            case 'market':
                text = `【2026年春闘方針（私鉄総連・連合）】
ベースアップ要求額：1万5600円（前年比+2200円）
賃上げ率目標：定昇維持分(2%)を含め7.2%相当
背景：
・深刻な人手不足による減便回避
・過去最高水準のベア（2001年以降最高）
・連合目標「中小6%以上」を上回る設定`;
                break;
            case 'shortage':
                text = `【運転士不足・労働環境】
・現在、定員に対して運転士が15名不足しており、休日出勤でダイヤを維持している状況。
・時間外労働の上限規制（2024年問題）への対応が急務。
・若手運転士の離職理由のトップは「他社との給与格差」および「拘束時間の長さ」。
・採用競争力の強化（初任給アップ）と、定着率向上のための処遇改善が待ったなしの状況。`;
                break;
            case 'retention':
                text = `【2026年度重点テーマ：人財定着と共創型労働環境】
■人財定着・運転士不足対策
・大型二種免許取得費用の全額公費負担制度の拡充。
・養成期間中の給与保障水準の引き上げ（生活不安の解消）。
・「人財定着手当」の新設：勤続3年、5年、10年の節目での加算額大幅増。

■改善基準告示への対応と共創
・拘束時間短縮に伴う「実質的な手取り減」を補填する「運行効率手当」の導入。
・「ダイヤ改善委員会」の設置：現場運転士がダイヤ編成に直接参画し、無理のない運行計画を共創する。

■新規手当の提案
・「生活防衛特別手当」：物価高騰に対する時限的な生活支援。
・「改善基準対応手当」：休息時間確保による時間外減をカバーし、年収水準を維持する。`;
                break;
        }
        
        const newValue = value ? value + "\n\n" + text : text;
        onChange(newValue);
    };

    const handleGenerateDraft = async () => {
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            alert("APIキーが設定されていません。");
            return;
        }

        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `
                あなたはバス会社の労務担当者です。
                以下の条件に基づき、春闘に向けた「労使協議会」で会社側が提示する資料（議事録形式）の草案を作成してください。
                
                【条件】
                ・業績は燃料費高騰により厳しい（赤字転落の危機）。
                ・しかし、運転士不足は深刻で、賃上げ（ベア）は避けられない。
                ・組合側は大幅な賃上げを要求している。
                ・会社側としては、賃上げの原資を確保するために「生産性向上」や「無駄の削減」を提案したい。
                ・文体は「・」を使った箇条書きで、簡潔かつ論理的に。
                ・項目例：【経営状況】【外部環境】【会社側の提案】【組合への要望】
                
                出力はテキストのみで、挨拶や前置きは不要です。
            `;

            const response = await generateContentWithFallback(ai, {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });

            const draft = response.text || "";
            const newValue = value ? value + "\n\n" + draft : draft;
            onChange(newValue);
        } catch (error) {
            console.error("Draft generation failed:", error);
            alert("草案の生成に失敗しました。");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 md:rounded-lg shadow-xl p-0 h-full flex flex-col transition-colors duration-300 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 dark:bg-gray-900 text-white p-4 md:p-6 border-b-4 border-red-600 flex justify-between items-center shadow-md shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3 tracking-wide">
                        <ClipboardIcon style={{width:24, height:24}} className="md:w-7 md:h-7" /> 
                        労使協議会 議事録・資料
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-300 mt-1 font-mono hidden md:block">
                        CONFIDENTIAL / LABOR-MANAGEMENT COUNCIL MATERIALS
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-red-900/50 px-2 py-1 md:px-3 md:py-1 rounded border border-red-500/30">
                        <BotIcon style={{color: '#fca5a5'}} className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-xs font-bold text-red-100 whitespace-nowrap">AI交渉モード 連動中</span>
                    </div>
                    {onReturnToTitle && (
                        <button 
                            onClick={onReturnToTitle}
                            className="bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded shadow font-bold transition-all text-xs md:text-sm flex items-center gap-1 whitespace-nowrap"
                        >
                            <span>🚪 終了</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-700 p-2 md:p-4 flex flex-wrap gap-2 md:gap-3 items-center shrink-0">
                <span className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 mr-1 md:mr-2 hidden sm:inline">テンプレート挿入:</span>
                <button 
                    onClick={() => insertTemplate('financial')}
                    className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 px-2 py-1.5 md:px-3 md:py-2 rounded shadow-sm border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors text-[10px] md:text-xs font-bold whitespace-nowrap"
                >
                    <FileTextIcon className="w-3 h-3 md:w-4 md:h-4" /> 決算
                </button>
                <button 
                    onClick={() => insertTemplate('market')}
                    className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 px-2 py-1.5 md:px-3 md:py-2 rounded shadow-sm border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/40 transition-colors text-[10px] md:text-xs font-bold whitespace-nowrap"
                >
                    <FileTextIcon className="w-3 h-3 md:w-4 md:h-4" /> 春闘方針
                </button>
                <button 
                    onClick={() => insertTemplate('shortage')}
                    className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 px-2 py-1.5 md:px-3 md:py-2 rounded shadow-sm border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors text-[10px] md:text-xs font-bold whitespace-nowrap"
                >
                    <FileTextIcon className="w-3 h-3 md:w-4 md:h-4" /> 人手不足
                </button>
                <button 
                    onClick={() => insertTemplate('retention')}
                    className="flex items-center gap-1 md:gap-2 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 px-2 py-1.5 md:px-3 md:py-2 rounded shadow-sm border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors text-[10px] md:text-xs font-bold whitespace-nowrap"
                >
                    <FileTextIcon className="w-3 h-3 md:w-4 md:h-4" /> 人財定着
                </button>
                
                <div className="w-px h-4 md:h-6 bg-gray-300 dark:bg-gray-700 mx-1 md:mx-2"></div>

                <button 
                    onClick={handleGenerateDraft}
                    disabled={isGenerating}
                    className={`flex items-center gap-1 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded shadow-sm border transition-all text-[10px] md:text-xs font-bold whitespace-nowrap ${
                        isGenerating 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent hover:shadow-md hover:scale-105'
                    }`}
                >
                    {isGenerating ? <RefreshCwIcon className="animate-spin w-3 h-3 md:w-4 md:h-4" /> : <BotIcon className="w-3 h-3 md:w-4 md:h-4" />}
                    {isGenerating ? '生成中...' : 'AI作成'}
                </button>

                <div className="flex-1"></div>
                <button 
                    onClick={() => onChange("")}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 text-[10px] md:text-xs font-bold underline whitespace-nowrap"
                >
                    クリア
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative bg-gray-50 dark:bg-gray-950 p-2 md:p-4 h-full overflow-hidden">
                <textarea 
                    className="w-full h-full border dark:border-gray-700 rounded-lg p-4 text-gray-800 dark:text-gray-200 leading-relaxed resize-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-400 dark:focus:border-red-700 bg-white dark:bg-gray-900 font-medium transition-all shadow-inner placeholder-gray-400 dark:placeholder-gray-600 text-sm md:text-base"
                    placeholder="【重要】ここに記述された内容は、AI団体交渉モードにおける『議論の前提事実』として強力に作用します。&#13;&#10;&#13;&#10;例：&#13;&#10;・今年度の燃料費高騰による赤字見込み額&#13;&#10;・近隣他社の賃上げ妥結状況&#13;&#10;・組合からの具体的要望事項（休憩施設の改善など）&#13;&#10;・運転士不足による減便のリスクについて"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 p-2 text-center border-t dark:border-gray-700 shrink-0">
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-red-600 dark:text-red-400">NOTE:</span> 入力されたテキストは、AIキャラクター（社長・委員長など）に共有され、交渉時の発言内容に反映されます。
                </p>
            </div>
        </div>
    );
};
