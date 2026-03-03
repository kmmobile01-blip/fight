
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SimulationResult, RaisePlanYear, SimulationConfig, AiProposal, RecruitmentPlanYear, ImpactRateYear } from '../types';
import { PresentationIcon, PrinterIcon, BotIcon, SettingsIcon, CheckIcon, TrendingUpIcon, CloseIcon, FileTextIcon, DatabaseIcon, CalculatorIcon, LockIcon } from './Icons';
import { generateContentWithFallback, getGeminiApiKey } from '../utils/geminiHelper';
import { generateCurrentParamsJson } from '../utils/parameterDefinitions';

// --- 型定義 ---
interface BoardReportViewProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult; // Added for baseline comparison
    configA: SimulationConfig;
    raisePlanA: Record<number, RaisePlanYear>;
    recruitmentPlanA: Record<number, RecruitmentPlanYear>;
    impactRatesA: Record<number, ImpactRateYear>;
    applyAiProposal: (proposal: AiProposal) => void;
    runCalculation: () => Promise<boolean>;
    isSeriousMode?: boolean; // Added
    onReturnToTitle?: () => void;
}

interface TunableParam {
    id: string;
    label: string;
    currentValue: string | number;
    isModifiable: boolean;
    description: string;
}

// --- ヘルパー関数: 堅牢なJSON抽出 ---
const extractJsonBlock = (text: string): { reportPart: string, jsonPart: any | null } => {
    // セパレータでの分割を試みる
    const separatorStart = "---JSON_START---";
    const separatorEnd = "---JSON_END---";
    
    let reportContent = text;
    let jsonContent = "";

    const startIndex = text.indexOf(separatorStart);
    const endIndex = text.indexOf(separatorEnd);

    if (startIndex !== -1 && endIndex !== -1) {
        reportContent = text.substring(0, startIndex).trim();
        jsonContent = text.substring(startIndex + separatorStart.length, endIndex).trim();
    } else {
        // セパレータがない場合、従来のMarkdownコードブロックを探す
        const jsonMatch = text.match(/```json([\s\S]*?)```/);
        if (jsonMatch) {
            jsonContent = jsonMatch[1];
            reportContent = text.replace(jsonMatch[0], "").trim();
        }
    }

    // JSONパース試行
    let parsedJson = null;
    if (jsonContent) {
        try {
            // クリーニング
            let clean = jsonContent.replace(/```json/gi, '').replace(/```/g, '').trim();
            // 末尾のカンマなどを削除する正規表現 (簡易版)
            clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            parsedJson = JSON.parse(clean);
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
    }

    return { reportPart: reportContent, jsonPart: parsedJson };
};

export const BoardReportView: React.FC<BoardReportViewProps> = ({ 
    resultA, 
    resultB, 
    resultC,
    configA,
    raisePlanA,
    recruitmentPlanA,
    impactRatesA,
    applyAiProposal,
    runCalculation,
    isSeriousMode = true,
    onReturnToTitle
}) => {
    const [reportText, setReportText] = useState("");
    const [proposal, setProposal] = useState<AiProposal | null>(null);
    const [loading, setLoading] = useState(false);
    const [applied, setApplied] = useState(false);

    // --- AI制御用ステート (予算制約: 2030年度) ---
    // 1. 賃上げ要因 (B-C) 上限
    const [limitBC, setLimitBC] = useState<number>(50000); 
    // 2. 制度変更要因 (A-B) 上限
    const [limitAB, setLimitAB] = useState<number>(20000); 
    // 3. 実質総増加額 (A-C) 上限
    const [limitAC, setLimitAC] = useState<number>(70000); 

    const extSettings = configA.employmentSettings["正社員(延長)"];
    
    // 現在の平均ベア額を取得（2026年を代表値として表示）
    const currentBaseUp = raisePlanA[2026]?.averageAmount || 0;

    const [paramsList, setParamsList] = useState<TunableParam[]>([
        { id: 'baseUp', label: 'ベースアップ額 (年度別)', currentValue: `平均 ${currentBaseUp.toLocaleString()}円`, isModifiable: true, description: '各年度の昇給額。予算余剰時は増額、超過時は削減対象。' },
        { id: 'fixedSalary', label: '固定給設定額 (延長)', currentValue: `${(extSettings.fixedSalary || 0).toLocaleString()}円`, isModifiable: true, description: '固定給方式の場合の月額' },
        { id: 'bonus', label: '賞与支給月数 (延長)', currentValue: `${(extSettings.bonusMonths.summer + extSettings.bonusMonths.winter + extSettings.bonusMonths.end).toFixed(1)}ヶ月`, isModifiable: true, description: '夏・冬・期末の合計支給月数' },
        { id: 'housing', label: '住宅手当 (延長)', currentValue: extSettings.housingAid.enabled ? 'あり' : 'なし', isModifiable: true, description: '住宅手当の支給有無' },
        { id: 'family', label: '家族手当 (延長)', currentValue: extSettings.allowances.family ? 'あり' : 'なし', isModifiable: true, description: '家族手当の支給有無' },
        { id: 'child', label: '子女教育手当 (延長)', currentValue: extSettings.allowances.child ? 'あり' : 'なし', isModifiable: true, description: '子女教育手当の支給有無' },
        { id: 'other', label: 'その他手当 (延長)', currentValue: '現状通り', isModifiable: true, description: '指導・管理・業務手当等の支給有無' },
    ]);

    const toggleParamModifiable = (id: string) => {
        setParamsList(prev => prev.map(p => p.id === id ? { ...p, isModifiable: !p.isModifiable } : p));
    };
    
    // --- Combined Generation (Report + JSON) ---
    const generateAnalysis = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setReportText("");
        setProposal(null);
        setApplied(false);

        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            setReportText("【エラー】APIキーが見つかりません。");
            setLoading(false);
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // 単位: 千円
        const formatK = (n: number) => Math.round(n/1000).toLocaleString();

        // --- ポイント年度 (2026, 2028, 2030) の分析 ---
        const targetYears = [2026, 2028, 2030];
        let periodAnalysisText = "【中期財政計画 推移分析 (単位: 千円)】\n";

        targetYears.forEach(year => {
            const rA = resultA.summary.find(r => r.year === year);
            const rB = resultB.summary.find(r => r.year === year);
            const rC = resultC.summary.find(r => r.year === year);

            if (rA && rB && rC) {
                const totalA = rA.totalCost;
                const totalB = rB.totalCost;
                const totalC = rC.totalCost;

                const diffAB = totalA - totalB; // 制度変更
                const diffBC = totalB - totalC; // 賃上げ
                const diffAC = totalA - totalC; // 実質総増

                periodAnalysisText += `
■ ${year}年度
1. 実質総増加額 (A-C): ${formatK(diffAC)}
   - 経営負担総額
2. 制度変更要因 (A-B): ${formatK(diffAB)}
   - 定年延長実施コスト
3. 賃上げ要因 (B-C): ${formatK(diffBC)}
   - ベア・定昇コスト
`;
            }
        });

        // --- 2030年度 定年延長対象者抽出 ---
        const ext2030 = resultA.individuals.filter(i => 
            i.year === 2030 && i.type.includes('延長')
        ).map(i => i.name);

        const extNamesText = ext2030.length > 0 
            ? ext2030.join("、") 
            : "該当者なし";

        periodAnalysisText += `
【2030年度 定年延長適用予定者】
${extNamesText}
※上記従業員は、B案（現行）では「再雇用」となりますが、A案では「延長社員」として処遇されます。
`;

        // 予算判定用 (2030年度基準)
        const rA2030 = resultA.summary.find(r => r.year === 2030);
        const rB2030 = resultB.summary.find(r => r.year === 2030);
        const rC2030 = resultC.summary.find(r => r.year === 2030);
        
        const impactBC_2030 = (rB2030?.totalCost || 0) - (rC2030?.totalCost || 0);
        const impactAB_2030 = (rA2030?.totalCost || 0) - (rB2030?.totalCost || 0);
        const impactAC_2030 = (rA2030?.totalCost || 0) - (rC2030?.totalCost || 0);

        const currentParams = generateCurrentParamsJson(configA, raisePlanA, recruitmentPlanA, impactRatesA);
        
        const modifiableParamsText = paramsList
            .filter(p => p.isModifiable)
            .map(p => `- ${p.label} (現在: ${p.currentValue})`)
            .join("\n");

        const lockedParamsText = paramsList
            .filter(p => !p.isModifiable)
            .map(p => `- ${p.label} (現在: ${p.currentValue} ※変更禁止)`)
            .join("\n");

        const roleDescription = isSeriousMode 
            ? "あなたは人事戦略コンサルタントです。論理的かつ客観的な分析レポートを作成してください。"
            : "あなたは熟練の人事戦略コンサルタント（AI専務）です。少し辛口だが的確な助言を行うキャラクターです。";

        const prompt = `
            ${roleDescription}
            
            クライアント（バス会社）の役員会に提出する「定年延長・賃金制度改定に関する最終提案レポート」を作成し、
            さらに、その提案を実現するための「システム設定用JSONデータ」を作成してください。

            【2030年度（制度完成年度）の予算判定】
            
            1. **賃上げ要因 (B案 - C案)**: ${(impactBC_2030 / 1000).toLocaleString()} 千円
               (予算上限: ${(limitBC).toLocaleString()} 千円)
               判定: ${impactBC_2030/1000 <= limitBC ? "OK (予算内)" : "OVER (予算超過)"}

            2. **制度変更要因 (A案 - B案)**: ${(impactAB_2030 / 1000).toLocaleString()} 千円
               (予算上限: ${(limitAB).toLocaleString()} 千円)
               判定: ${impactAB_2030/1000 <= limitAB ? "OK (予算内)" : "OVER (予算超過)"}

            3. **実質総増加額 (A案 - C案)**: ${(impactAC_2030 / 1000).toLocaleString()} 千円
               (予算上限: ${(limitAC).toLocaleString()} 千円)
               判定: ${impactAC_2030/1000 <= limitAC ? "OK (予算内)" : "OVER (予算超過)"}

            ${periodAnalysisText}

            【ミッション】
            上記3つの予算条件（2030年度）を全て満たすように、パラメータを調整する提案を行ってください。
            
            【レポート構成（必須）】
            1. **総括**: 提案の要旨と予算達成状況。
            2. **中期財政影響 (2026-2030)**:
               - **2026年度（導入初年度）**: A-C（総額）、A-B（制度）、B-C（賃上）のコスト増について記述。
               - **2028年度（中間）**: 上記と同様に記述。
               - **2030年度（完成年度）**: 上記に加え、**「定年延長適用者（${extNamesText.substring(0, 50)}...）」**について具体的に言及し、彼らを延長することによるA-B差額の影響と、B-C差額（全社員へのベア影響）のバランスについて解説すること。
            3. **パラメータ変更提案**: 予算をクリアするために、どの項目（ベア、固定給、賞与等）をどう調整すべきか。

            - 予算超過の場合：変更可能なパラメータを削減して条件をクリアしてください。
            - 予算余裕の場合：積極的にベア額や延長者の固定給を増額し、従業員満足度を高めてください。

            [変更可能なパラメータ]
            ${modifiableParamsText || "(なし - 現状維持で分析せよ)"}

            [変更禁止 (Lock)]
            ${lockedParamsText}

            【前提データ (Current JSON)】
            ${JSON.stringify(currentParams)}

            ---

            【出力要件 1: レポート本文】
            - A4用紙 3〜5枚程度（2,000文字以上）の詳細レポート。
            - マークダウン記号（##, **）は使用せず、【 】や《 》で見出しを表現すること。

            【出力要件 2: 設定用JSONデータ】
            - レポートの最後（結論の後）に、以下の区切り文字で囲んでJSONデータを出力してください。
            - **必ず「proposal」キーの配下に記述してください。**

            ---JSON_START---
            {
                "proposal": {
                    "targetPattern": "A",
                    "raisePlanUpdates": [
                        { "year": 2026, "averageAmount": 0 },
                        { "year": 2027, "averageAmount": 1000 }
                    ],
                    "employmentSettingsUpdate": [
                        { 
                            "targetStatus": "正社員(延長)", 
                            "settings": { 
                                "calculationMethod": "fixed",
                                "fixedSalary": number,
                                "bonusMonths": { "summer": number, "winter": number, "end": number },
                                "housingAid": { "enabled": boolean },
                                "allowances": { 
                                    "family": boolean,
                                    "child": boolean,
                                    "instructor": boolean,
                                    "manager": boolean,
                                    "work": boolean
                                },
                                "useCurrentIfLower": boolean
                            } 
                        }
                    ]
                }
            }
            ---JSON_END---
            
            ※ JSONは提案内容（レポート内の数値）と完全に一致させてください。
            ※ raisePlanUpdatesは、変更が必要な年度のみ記述してください。2026〜2035の範囲です。
        `;

        try {
            const response = await generateContentWithFallback(ai, {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    maxOutputTokens: 8192,
                    temperature: 0.4,
                }
            });

            const rawText = response.text || "レポート生成に失敗しました。";
            
            // Extract Report and JSON
            const { reportPart, jsonPart } = extractJsonBlock(rawText);
            
            setReportText(reportPart);
            
            if (jsonPart && jsonPart.proposal) {
                 const p = jsonPart.proposal;
                // Convert raisePlanUpdates array to object for applyAiProposal
                if (p.raisePlanUpdates && Array.isArray(p.raisePlanUpdates)) {
                    p.raisePlan = {};
                    p.raisePlanUpdates.forEach((u: any) => {
                        if (u.year) {
                            p.raisePlan[u.year] = { averageAmount: u.averageAmount };
                        }
                    });
                    delete p.raisePlanUpdates; // cleanup
                }
                setProposal(p);
            } else {
                console.warn("Valid JSON block not found in response.");
            }

        } catch (e: any) {
            console.error(e);
            setReportText(`エラーが発生しました: ${e.message}\n\nAPIキーの設定や通信環境を確認してください。`);
        } finally {
            setLoading(false);
        }
    }, [resultA, resultB, resultC, configA, limitBC, limitAB, limitAC, paramsList, raisePlanA, recruitmentPlanA, impactRatesA, isSeriousMode]);

    const handleApplyProposal = async () => {
        if (!proposal) return;
        try {
            applyAiProposal(proposal);
            setApplied(true);
            setTimeout(async () => {
                const success = await runCalculation();
                if(success) alert("設定を適用し、再計算しました。");
            }, 500);
        } catch (e) {
            console.error(e);
            alert("適用中にエラーが発生しました。");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[85vh] flex flex-col transition-colors print:p-0 print:shadow-none print:min-h-0 print:bg-white">
            <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <PresentationIcon /> {isSeriousMode ? "役員会資料 自動作成 (AI分析)" : "役員会資料 自動作成 (AI専務)"}
                </h2>
                <div className="flex gap-2">
                    {reportText && (
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-700 dark:hover:bg-gray-600 font-bold transition-all text-sm">
                            <PrinterIcon /> 印刷 / PDF保存
                        </button>
                    )}
                    {onReturnToTitle && (
                        <button 
                            onClick={onReturnToTitle}
                            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded shadow font-bold transition-all text-sm flex items-center gap-1"
                        >
                            <span>🚪 終了</span>
                        </button>
                    )}
                </div>
            </div>

            {!reportText && !loading ? (
                <div className="flex flex-col lg:flex-row gap-8 h-full print:hidden">
                    {/* Left: Configuration Panel */}
                    <div className="w-full lg:w-1/3 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner flex flex-col gap-6 overflow-y-auto">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-bold text-lg border-b border-blue-200 dark:border-blue-800 pb-2">
                            <SettingsIcon /> 2030年度 予算条件設定
                        </div>

                        {/* Budget Constraints 3 Items */}
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-bold text-green-700 dark:text-green-300 mb-2">
                                    1. 賃上げ要因 (B-C) 上限
                                </label>
                                <div className="w-full bg-white dark:bg-gray-800 rounded flex items-center">
                                    <input 
                                        type="number" 
                                        value={limitBC}
                                        onChange={(e) => setLimitBC(parseInt(e.target.value)||0)}
                                        className="flex-1 border-2 border-green-100 dark:border-green-900 rounded px-3 py-2 text-right font-bold text-xl focus:border-green-400 dark:focus:border-green-500 outline-none w-full bg-white dark:bg-gray-700 dark:text-gray-100"
                                    />
                                    <span className="text-sm font-bold ml-2 whitespace-nowrap dark:text-gray-400">千円</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-2">
                                    2. 制度変更要因 (A-B) 上限
                                </label>
                                <div className="w-full bg-white dark:bg-gray-800 rounded flex items-center">
                                    <input 
                                        type="number" 
                                        value={limitAB}
                                        onChange={(e) => setLimitAB(parseInt(e.target.value)||0)}
                                        className="flex-1 border-2 border-indigo-100 dark:border-indigo-900 rounded px-3 py-2 text-right font-bold text-xl focus:border-indigo-400 dark:focus:border-indigo-500 outline-none w-full bg-white dark:bg-gray-700 dark:text-gray-100"
                                    />
                                    <span className="text-sm font-bold ml-2 whitespace-nowrap dark:text-gray-400">千円</span>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <label className="block text-sm font-bold text-red-600 dark:text-red-400 mb-2">
                                    3. 実質総増加額 (A-C) 上限
                                </label>
                                <div className="w-full bg-white dark:bg-gray-800 rounded flex items-center">
                                    <input 
                                        type="number" 
                                        value={limitAC}
                                        onChange={(e) => setLimitAC(parseInt(e.target.value)||0)}
                                        className="flex-1 border-2 border-red-100 dark:border-red-900 rounded px-3 py-2 text-right font-bold text-xl focus:border-red-400 dark:focus:border-red-500 outline-none w-full bg-white dark:bg-gray-700 dark:text-gray-100"
                                    />
                                    <span className="text-sm font-bold ml-2 whitespace-nowrap dark:text-gray-400">千円</span>
                                </div>
                            </div>
                        </div>

                        {/* Parameter Flags */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex-1 overflow-y-auto">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                4. AIによる変更を許可する項目
                            </label>
                            <div className="space-y-3">
                                {paramsList.map(p => (
                                    <div key={p.id} 
                                        className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${
                                            p.isModifiable ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-80'
                                        }`}
                                        onClick={() => toggleParamModifiable(p.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                                p.isModifiable ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white dark:bg-gray-700 border-gray-400 dark:border-gray-600'
                                            }`}>
                                                {p.isModifiable && <CheckIcon style={{width:12, height:12}} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.label}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{p.description}</div>
                                                <div className="text-[10px] font-mono text-gray-600 dark:text-gray-500 mt-0.5">現在: {p.currentValue}</div>
                                            </div>
                                        </div>
                                        {!p.isModifiable && <LockIcon style={{color:'#9ca3af', width:14}} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={generateAnalysis}
                            className="w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800"
                        >
                            <BotIcon />
                            <span>AI分析＆提案作成 (実行)</span>
                        </button>
                    </div>

                    {/* Right: Intro / Placeholder */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/50">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-400">
                            <FileTextIcon style={{width: 40, height: 40}} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
                            {isSeriousMode ? "AIアナリストが待機中..." : "AI専務が待機中..."}
                        </h3>
                        <p className="text-gray-400 dark:text-gray-500 max-w-md">
                            左側のパネルで「2030年度の予算上限（3つの指標）」を設定し、ボタンを押してください。<br/>
                            AIが予算の範囲内で労働条件（ベア・手当）を最大化する提案を行い、システム設定案を提示します。
                        </p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 print:hidden">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-6"></div>
                    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                        AIが最適解を計算中...
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        2030年度の予算条件 (計{(limitAC).toLocaleString()}千円) を満たす設計を模索し、設定データを作成しています...
                    </p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-0 relative print:block print:h-auto">
                    {/* Report Content (Plain Text Area) */}
                    <div className="flex-1 bg-white dark:bg-gray-900 p-12 rounded shadow-sm overflow-y-auto font-serif leading-loose text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 print:border-none print:shadow-none print:p-0 print:overflow-visible print:h-auto print:text-black print:leading-normal max-h-[70vh] print:max-h-none">
                        <div className="whitespace-pre-wrap text-justify print:text-base">
                            {reportText}
                        </div>
                    </div>

                    {/* Right Action Panel */}
                    <div className="w-full lg:w-96 flex flex-col gap-4 print:hidden shrink-0">
                        {proposal && (
                            <div 
                                className={`border-2 rounded-xl p-5 shadow-lg animate-slide-up sticky top-4 transition-all duration-500 overflow-hidden relative ${
                                    applied 
                                    ? 'border-green-500 ring-4 ring-green-200 dark:ring-green-900 shadow-xl' 
                                    : 'bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-800'
                                }`}
                                style={applied ? { 
                                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.1) 10px, rgba(5, 150, 105, 0.1) 10px, rgba(5, 150, 105, 0.1) 20px)' 
                                } : {}}
                            >
                                {applied && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">
                                        APPLIED
                                    </div>
                                )}

                                <h3 className={`font-bold flex items-center gap-2 mb-3 border-b pb-2 ${applied ? 'text-green-800 dark:text-green-200 border-green-300 dark:border-green-700' : 'text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800'}`}>
                                    {applied ? <CheckIcon /> : <SettingsIcon />} 
                                    {applied ? "システム更新完了" : "変更提案が検出されました"}
                                </h3>
                                
                                <div className="space-y-3 text-sm mb-4 relative z-0 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {/* Raise Plan Updates (Base Up) */}
                                    {proposal.raisePlan && Object.keys(proposal.raisePlan).length > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-800 shadow-sm">
                                            <div className="text-xs font-bold text-red-700 dark:text-red-200 mb-1 flex items-center gap-2">
                                                <TrendingUpIcon style={{width:12}}/> ベア(昇給) 調整提案
                                            </div>
                                            <div className="text-xs grid grid-cols-2 gap-1 dark:text-gray-300">
                                                {Object.entries(proposal.raisePlan).slice(0,5).map(([year, p]: any) => (
                                                    <div key={year} className="flex justify-between border-b border-red-100 dark:border-red-800 py-0.5">
                                                        <span>{year}年度:</span>
                                                        <span className="font-bold">{p.averageAmount?.toLocaleString()}円</span>
                                                    </div>
                                                ))}
                                                {Object.keys(proposal.raisePlan).length > 5 && (
                                                    <div className="col-span-2 text-center text-[9px] text-gray-500 dark:text-gray-400">...他{Object.keys(proposal.raisePlan).length - 5}件</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Employment Settings Updates */}
                                    {proposal.employmentSettingsUpdate && proposal.employmentSettingsUpdate.map((u, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded border border-gray-200 dark:border-gray-600 shadow-sm">
                                            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                                                <SettingsIcon style={{width:12}}/> {u.targetStatus} 設定
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-gray-500 dark:text-gray-400">基本給方式</div>
                                                <div className="font-bold text-right dark:text-gray-200">{u.settings?.calculationMethod === 'fixed' ? '固定給' : '率計算'}</div>
                                                
                                                <div className="text-gray-500 dark:text-gray-400">固定給額</div>
                                                <div className="font-bold text-right text-blue-700 dark:text-blue-300">{u.settings?.fixedSalary?.toLocaleString()}円</div>
                                                
                                                <div className="text-gray-500 dark:text-gray-400">賞与月数(計)</div>
                                                <div className="font-bold text-right dark:text-gray-200">
                                                    {((u.settings?.bonusMonths?.summer||0) + (u.settings?.bonusMonths?.winter||0) + (u.settings?.bonusMonths?.end||0)).toFixed(2)}ヶ月
                                                </div>
                                            </div>
                                            {/* Allowances Check */}
                                            <div className="mt-2 text-[10px] grid grid-cols-2 gap-1 border-t border-gray-200 dark:border-gray-600 pt-1">
                                                <div className={u.settings?.allowances?.family ? "text-blue-600 dark:text-blue-400" : "text-red-500 dark:text-red-400 font-bold"}>
                                                    家族手当: {u.settings?.allowances?.family ? "あり" : "廃止"}
                                                </div>
                                                <div className={u.settings?.housingAid?.enabled ? "text-blue-600 dark:text-blue-400" : "text-red-500 dark:text-red-400 font-bold"}>
                                                    住宅手当: {u.settings?.housingAid?.enabled ? "あり" : "廃止"}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!applied && (
                                    <div className="flex gap-2 flex-col">
                                        <button 
                                            onClick={handleApplyProposal}
                                            className="w-full py-3 rounded-lg font-bold text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        >
                                            <CheckIcon /> 承認してシミュレーション実行
                                        </button>
                                        <button 
                                            onClick={() => { setReportText(""); setProposal(null); }} 
                                            className="w-full py-2 rounded-lg font-bold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <CloseIcon /> キャンセル (最初から)
                                        </button>
                                    </div>
                                )}
                                
                                {applied && (
                                    <div className="mt-3 text-center">
                                        <p className="text-xs text-green-800 dark:text-green-200 font-bold mb-1">
                                            全パラメータを更新しました
                                        </p>
                                        <button 
                                            onClick={() => { setReportText(""); setProposal(null); }}
                                            className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-gray-800 dark:hover:text-gray-200"
                                        >
                                            画面を閉じる
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {!proposal && (
                             <div className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800 rounded-lg p-4 text-center text-sm text-yellow-800 dark:text-yellow-200">
                                 <p>レポートのみ生成されました。<br/>パラメータ変更の提案は含まれていません。</p>
                                 <button 
                                    onClick={() => { setReportText(""); }}
                                    className="mt-2 underline text-xs"
                                 >
                                    戻る
                                 </button>
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
