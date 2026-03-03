
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SimulationResult, FinancialPlan, PersonaType, UnionPersonaType, AiProposal, SimulationConfig, RaisePlanYear } from '../types';
import { MessageCircleIcon, PauseCircleIcon, PlayCircleIcon, HandshakeIcon, BookOpenIcon, SwordIcon, SendIcon, BotIcon, DownloadIcon, SearchIcon, UserIcon, UsersIcon, TrendingUpIcon } from './Icons';
import { NEGOTIATION_MASTER_INSTRUCTION, VICTORY_CONDITIONS, getPersonaConfig } from '../utils/aiConstants';
import { SYSTEM_SPECS } from '../utils/systemSpecs';
import { GameResult, GameResultModal } from './ai/GameResultModal';
import { ChatMessage, ChatMessageData } from './ai/ChatMessage';
import { ReportGenerator } from './ai/ReportGenerator';
import { generateContentWithFallback, getGeminiApiKey } from '../utils/geminiHelper';
import { PersonaSelector } from './ai/PersonaSelector';

interface AiAssistantProps {
    mode: 'negotiation' | 'analysis' | 'requirements';
    resultA: SimulationResult;
    negotiationContext?: string;
    onContextChange?: (val: string) => void;
    financialData?: FinancialPlan[];
    companyPersonas?: PersonaType[];
    unionPersonas?: UnionPersonaType[];
    onUpdateCompanyPersonas?: (p: PersonaType[]) => void;
    onUpdateUnionPersonas?: (p: UnionPersonaType[]) => void;
    
    // Added for precise judgment
    configA?: SimulationConfig;
    raisePlanA?: Record<number, RaisePlanYear>;
    customAllowances?: any[];
    onReturnToTitle?: () => void;
    onNavigate?: (id: string) => void;

    // Legacy props fallback
    persona?: PersonaType; 
    unionPersona?: UnionPersonaType;
    isSeriousMode?: boolean;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ 
    mode, resultA, negotiationContext = "", financialData, 
    companyPersonas = ['normal'], unionPersonas = ['kiyomi'],
    onUpdateCompanyPersonas, onUpdateUnionPersonas,
    configA, raisePlanA, customAllowances, onReturnToTitle,
    onNavigate,
    persona, unionPersona, isSeriousMode = false
}) => {
    const activeCompanyPersonas = companyPersonas && companyPersonas.length > 0 ? companyPersonas : [persona || 'normal'];
    const activeUnionPersonas = unionPersonas && unionPersonas.length > 0 ? unionPersonas : [unionPersona || 'kiyomi'];

    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessageData[]>([]);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [negotiationStatus, setNegotiationStatus] = useState<'idle' | 'running' | 'agreed' | 'continued' | 'strike' | 'stopped'>('idle');
    const [round, setRound] = useState(1); 
    const [turnCount, setTurnCount] = useState(0); 
    
    // Battle Mode State: false | 'company' | 'union'
    const [battleModeRole, setBattleModeRole] = useState<'company' | 'union' | false>(false);
    const [battleInput, setBattleInput] = useState("");
    const [isSetupPhase, setIsSetupPhase] = useState(true);
    const [generatedReport, setGeneratedReport] = useState("");

    const MAX_TURNS = 50;
    // Modified: Extended to 12 rounds for more detailed discussion
    const MAX_ROUNDS = 12;

    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);
    const negotiationStatusRef = useRef(negotiationStatus);
    const isProcessingRef = useRef(false); // Add lock to prevent concurrent steps

    useEffect(() => {
        negotiationStatusRef.current = negotiationStatus;
    }, [negotiationStatus]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    // ... (Report Generation Logic remains same) ...

    // ... (useEffect hooks remain same) ...

    useEffect(() => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setMessages([]);
        setNegotiationStatus('idle');
        negotiationStatusRef.current = 'idle'; 
        setRound(1);
        setTurnCount(0);
        setGameResult(null);
        setLoading(false);
        setGeneratedReport("");
        setBattleModeRole(false);
        setBattleInput("");
        setIsSetupPhase(true);
    }, [mode]);

    // Disable Battle Mode in Serious Mode
    useEffect(() => {
        if (isSeriousMode && battleModeRole) {
            setBattleModeRole(false);
        }
    }, [isSeriousMode]);

    const handleStop = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        if (isMountedRef.current) {
            setNegotiationStatus('stopped');
            negotiationStatusRef.current = 'stopped';
            setLoading(false);
            setMessages(prev => [...prev, { role: 'moderator', text: "🛑 ユーザー操作により交渉を中断しました。" }]);
        }
    };

    const toggleBattleMode = () => {
        if (negotiationStatus === 'running') {
            if (!window.confirm("交渉を中断してモードを切り替えますか？")) return;
            handleStop();
        }
        
        if (battleModeRole) {
            setBattleModeRole(false);
        } else {
            // Show role selection dialog (simple prompt for now, or custom modal)
            // For simplicity, we can use window.confirm or a small state to show buttons.
            // But here, let's just default to 'union' if we can't show UI, 
            // OR we can change this function to accept a role.
            // Let's implement a small UI in the render to choose role instead of toggling immediately.
            // For now, let's assume the UI calls startBattleMode(role).
        }
        
        setMessages([]);
        setRound(1);
        setTurnCount(0);
        setNegotiationStatus('idle');
        negotiationStatusRef.current = 'idle';
        setGameResult(null);
    };

    const startBattleMode = (role: 'company' | 'union') => {
        if (negotiationStatus === 'running') {
            if (!window.confirm("交渉を中断してモードを切り替えますか？")) return;
            handleStop();
        }
        setBattleModeRole(role);
        setMessages([]);
        setRound(1);
        setTurnCount(0);
        setNegotiationStatus('idle');
        negotiationStatusRef.current = 'idle';
        setGameResult(null);
    };

    const handleSaveLog = () => {
        if (messages.length === 0) {
            alert("保存するログがありません。");
            return;
        }
        const now = new Date();
        const dateStr = now.toLocaleString('ja-JP');
        
        let logContent = `【2026年度 春闘交渉シミュレーション 記録】\n`;
        logContent += `実施日時: ${dateStr}\n`;
        logContent += `交渉ステータス: ${negotiationStatus === 'agreed' ? '妥結' : negotiationStatus === 'strike' ? '決裂' : '進行中'}\n`;
        logContent += `==================================================\n\n`;

        logContent += messages.map(m => {
            if (m.role === 'moderator') {
                return `>>> ${m.text}\n`;
            }
            const role = m.role === 'company' ? '会社側' : m.role === 'union' ? '組合側' : '司会';
            const roundInfo = m.round ? `[第${m.round}ラウンド] ` : '';
            const tactic = m.tactic ? `[戦術: ${m.tactic}]` : '';
            return `${roundInfo}${role}: ${m.name || ''} ${tactic}\n${m.text}\n----------------------------------\n`;
        }).join('\n');

        if (gameResult) {
            logContent += `\n==================================================\n`;
            logContent += `【最終判定結果】\n`;
            logContent += `評価: ${gameResult.level} - ${gameResult.title}\n`;
            logContent += `概要: ${gameResult.description}\n`;
            logContent += `解説:\n${gameResult.reason}\n`;
        }

        // Add BOM for UTF-8 to prevent mojibake in Excel/Windows Notepad
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, logContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `春闘交渉ログ_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getContextData = () => {
        if (!resultA || !resultA.summary || resultA.summary.length === 0) {
            return { simulation: "シミュレーションデータがありません。", financial: "", userContext: "", budgetLimit: 0, targetBaseUpAnnual: 0, targetBaseUpMonthly: 0, targetLumpSum: 0, customAllowancesStr: "" };
        }
        const firstYear = resultA.summary[0];
        const summary = resultA.summary.map(r => ({
            year: r.year,
            totalCost: r.totalCost,
            headcount: r.headcount,
            avgSalary: r.avgSalary,
            baseUpPerCapitaAnnual: r.baseUpImpact.perCapita, // Annual total
            lumpSumTotal: r.breakdownSum.lump,
            activeCount: r.activeCount,
            baseUpImpact: r.baseUpImpact,
            breakdownSum: r.breakdownSum
        }));
        
        // --- Precise Target Calculation (Pattern A, 2026, Seishain) ---
        let targetBaseUpMonthly = 0;
        let targetBonusMonths = 0;
        let targetLumpSum = 0;

        // 1. Base Up (2026 Seishain Average)
        if (raisePlanA && raisePlanA[2026]) {
            // Using the average amount set in the 2026 raise plan
            targetBaseUpMonthly = raisePlanA[2026].averageAmount || 0;
        } else {
            const year2026 = summary.find(s => s.year === 2026);
            targetBaseUpMonthly = year2026 ? Math.round((year2026.baseUpImpact.perCapita || 0) / 12) : 0;
        }

        // 2. Bonus (2026 Seishain)
        if (configA && configA.employmentSettings['正社員']) {
            const bm = configA.employmentSettings['正社員'].bonusMonths;
            // Annual bonus months (Summer + Winter)
            targetBonusMonths = (bm.summer || 0) + (bm.winter || 0);
        }

        // 3. Lump Sum (2025 Seishain)
        if (configA && configA.employmentSettings['正社員'] && configA.employmentSettings['正社員'].lumpSum) {
            targetLumpSum = configA.employmentSettings['正社員'].lumpSum[2025] || 0;
        } else {
            const year2025 = summary.find(s => s.year === 2025);
            const headcount = year2025?.activeCount || 1;
            targetLumpSum = year2025 ? Math.round((year2025.breakdownSum.lump || 0) / headcount) : 0;
        }

        // 3. Custom Allowances
        let customAllowancesStr = "（なし）";
        if (customAllowances && customAllowances.length > 0) {
            customAllowancesStr = customAllowances.map((a: any) => {
                const amount = a.amounts['正社員'] || 0;
                return `${a.name}: ${amount.toLocaleString()}円 (支給要件: ${a.ageMin}歳〜${a.ageMax}歳)`;
            }).join(", ");
        }

        let finDataStr = "（※ 決算・予算データが未入力です）";
        if (financialData && financialData.length > 0) {
            // 2025年度と2026年度を必ず含める（checkedに関わらず引用対象とする）
            const targetYears = [2025, 2026];
            const activeFinancials = financialData.filter(f => targetYears.includes(f.year));
            if (activeFinancials.length > 0) {
                finDataStr = activeFinancials.map(f => {
                    const rev = f.revenue.shared + f.revenue.charter + f.revenue.contract + f.revenue.other;
                    return `年度:${f.year}, 営業収益計(売上):${rev.toLocaleString()}千円, 人件費:${f.expense.personnel.toLocaleString()}千円, 経常損益:${f.profit.ordinary.toLocaleString()}千円`;
                }).join("\n");
            }
        }

        const simDataStr = summary.filter(s => s.year === 2025 || s.year === 2026).map(s => {
            return `年度:${s.year}, 総人件費:${s.totalCost.toLocaleString()}円, 従業員数:${s.headcount}名, 平均年収:${s.avgSalary.toLocaleString()}円, ベア影響(一人当り年額):${s.baseUpImpact.perCapita.toLocaleString()}円, 賞与合計:${s.breakdownSum.bonus.toLocaleString()}円, 期末一時金合計:${s.breakdownSum.lump.toLocaleString()}円`;
        }).join("\n");

        return {
            // 2025年度と2026年度のみに限定
            simulation: simDataStr,
            financial: finDataStr,
            userContext: negotiationContext || "（特になし）",
            budgetLimit: firstYear.totalCost * 1.02,
            targetBaseUpMonthly,
            targetBonusMonths,
            targetLumpSum,
            customAllowancesStr
        };
    };

    const getRoundTheme = (r: number) => {
        switch(r) {
            case 1: return { 
                title: "第1回：2026年度春闘方針と「共創型」ビジョンの共有", 
                instruction: "【状況】メインテーマ『人財の定着と京都の誇りを守る「共創型」労働環境の構築』を掲げ、交渉を開始します。組合側は物価高騰と「京都特有の負荷」を理由に、大幅な処遇改善を要求してください。会社側は「労使協議会資料」の経営状況を引用しつつ、人財確保の重要性を認め、共に未来を創る姿勢を示してください。" 
            };
            case 2: return { 
                title: "第2回：賃金体系の抜本的見直し（ベアと初任給）", 
                instruction: "【状況】賃金ピラーの議論です。組合側はインフレ率を上回るベアと、競合他社を凌駕する初任給設定を要求してください。会社側は、財務データ(2025/2026)に基づき、固定費増の許容範囲を慎重に検討しつつ、若手層への重点配分などの代替案を提示してください。" 
            };
            case 3: return { 
                title: "第3回：収益還元と「オーバーツーリズム手当」の新設", 
                instruction: "【状況】観光需要回復による収益の分配が焦点です。組合側は激しい渋滞やインバウンド対応の肉体的・精神的負荷を「オーバーツーリズム手当」として新設するよう求めてください。会社側は、一時金（ボーナス）への「インフレ手当」加算で対応できないか打診し、歩み寄りを探ってください。" 
            };
            case 4: return { 
                title: "第4回：2024年問題の克服と「勤務間インターバル」の拡大", 
                instruction: "【状況】柱の2つ目、労働時間の議論です。組合側は休息時間の確保のため、勤務間インターバルの11時間以上の義務化を求めてください。会社側は法令遵守を前提としつつ、ダイヤ改正やシフト調整の難しさを説明し、現実的な導入スケジュールを議論してください。" 
            };
            case 5: return { 
                title: "第5回：中抜き勤務の解消と「拘束時間」の適正化", 
                instruction: "【状況】京都特有の渋滞による長時間拘束が問題です。組合側は「中抜き勤務」の原則廃止、または待機時間の手当化を求めてください。会社側は、運行効率の低下を懸念しつつ、デジタルタコグラフ等のデータを活用した適正な管理と、負担軽減策を提示してください。" 
            };
            case 6: return { 
                title: "第6回：計画的休暇付与と「リフレッシュ休暇」の拡充", 
                instruction: "【状況】「ゆとり」の創出に向けた休暇の議論です。組合側は、繁忙期後の連続休暇取得の権利化を求めてください。会社側は、要員不足の中での休暇確保の難しさを訴えつつ、計画付与制度の強化や、有給取得率向上のためのインセンティブ案を提示してください。" 
            };
            case 7: return { 
                title: "第7回：運転士不足への攻めと「キャリアパス」の明確化", 
                instruction: "【状況】柱の3つ目、将来性の議論です。組合側は「一生運転して終わり」ではない、指導員や管理者への昇進ルートと、それに伴う昇給カーブの可視化を求めてください。会社側は、社内公募制度の拡充や、技能に応じた「マイスター制度」の新設を提案してください。" 
            };
            case 8: return { 
                title: "第8回：リスキリング支援と「多様な働き方」の受容", 
                instruction: "【状況】インバウンド対応力向上と人財確保の議論です。組合側は語学学習や大型二種免許取得費用の全額会社負担を求めてください。会社側は、短時間正社員制度や、シニア・女性運転士が活躍できる柔軟なシフト制度の導入を提示し、多様な人財が定着する環境を議論してください。" 
            };
            case 9: return { 
                title: "第9回：メンタルヘルスと「24時間相談窓口」の設置", 
                instruction: "【状況】柱の4つ目、安全の基盤となる心のケアです。組合側は、過酷な労働環境によるストレスを訴え、外部専門家による24時間相談窓口の設置と、定期的なストレスチェックの強化を求めてください。会社側は、従業員の健康を最優先する姿勢を示し、具体的な予算措置を検討してください。" 
            };
            case 10: return { 
                title: "第10回：カスハラ対策と「従業員の誇り」を守る約束", 
                instruction: "【状況】インバウンド客や一部利用者によるカスタマーハラスメントが深刻です。組合側は、会社が組織として毅然と対応するマニュアル作成と、被害者への法的・精神的支援を求めてください。会社側は「お客様は神様ではない」という強いメッセージを対外的に発信することを約束してください。" 
            };
            case 11: return { 
                title: "第11回：地域・自治体への働きかけと「労使共同宣言」", 
                instruction: "【状況】企業努力だけでは限界がある渋滞・観光公害対策です。労使が手を取り合い、自治体や観光庁へインフラ整備や観光客分散を求める「労使共同宣言」の採択を議論してください。これまでの全10回の議論を総括し、最終的な妥結条件（ベア・賞与・一時金・定性条件）の最終調整に入ってください。" 
            };
            case 12: return { 
                title: "第12回：最終決着：京都の未来を創る「共創型」妥結へ", 
                instruction: "【状況】運命の最終回です。これまでの議論（賃金、ゆとり、キャリア、安全）を踏まえ、必ず結論を出してください。組合側は「京都の公共交通を守る」決断を、会社側は「人財こそが最大の資産」という経営判断を下してください。円満な妥結か、決裂か。歴史的な春闘の幕引きを行ってください。" 
            };
            default: return { title: "交渉終了", instruction: "交渉は終了しました。これまでの議論を総括してください。" };
        }
    };
    
    const judgeNegotiationResult = async (historyOverride?: ChatMessageData[]) => {
        setLoading(true);
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            setMessages(prev => [...prev, { role: 'moderator', text: "⚠️ APIキーが設定されていません。" }]);
            setLoading(false);
            return;
        }

        const context = getContextData();
        const ai = new GoogleGenAI({ apiKey });
        const targetMessages = historyOverride || messages;
        const conversationLog = targetMessages.map(m => `${m.name || m.role}: ${m.text}`).join("\n");
        const prompt = `
            あなたはプロの団体交渉審判員です。
            これまでの交渉ログと、事前に設定された「予算ターゲット」および「勝敗判定ルール」に基づき、今回の交渉結果を判定してください。
            
            【予算ターゲット (会社側の防衛ライン - A案)】
            1. **最重要: 年額換算の総人件費影響額 (A案シミュレーション結果の総人件費) が予算内に収まっていること**
            2. ベア原資: 月額 10,000円 以内 (A案想定)
            3. 賞与（ボーナス）: 年間 4.5ヶ月 維持
            4. 期末一時金: 200,000円 以内
            
            【勝敗判定ルール】
            ・会社側の勝利条件: **年額換算の影響額を最重視**し、上記項目が予算ターゲット以内に収まっていること。
            ・組合側の勝利条件: ベア要求額の「70%以上」を会社側から引き出した場合、またはターゲットを上回る好条件を勝ち取った場合。
            ・定性条件の考慮: 「人財定着」や「共創型労働環境」への具体的施策での合意状況も加点・減点対象とする。
            ・**判定の視点: 常に「会社側が勝ったか負けたか」を主眼に置いてください。**
            ・**重要：勝因・敗因の分析: 解説（reason）の中で、今回の勝敗を決定づけた「具体的な発言」をログから引用し、なぜその発言が重要だったのかを詳しく説明してください。**
            ・**交渉決裂（ストライキ）の場合: 条件に関わらず「両者敗北」とし、最低評価を下してください。**
            
            【判定の重要事項】
            ・**決算数値および判定数値の推測、類推、創作は一切禁止です。** ログにない数値を勝手に作り出して判定の根拠にしないでください。
            ・**サンプル値（例: 4.77など）は過去のダミーデータであり、一切無視してください。**
            ・必ず提供された「2025年度」および「2026年度」の決算表内の数値、および上記の「予算ターゲット」のみを根拠に判定してください。
            ・**期末一時金は賞与（ボーナス）とは別に支給される独立した一時金として扱ってください。**
            
            ${VICTORY_CONDITIONS}
            
            【交渉ログ】
            ${conversationLog}
            
            【判定指示】
            JSON形式のみを出力: { "level": "Lv.X", "title": "...", "description": "...", "reason": "...", "isPlayerWin": boolean, "qualitativeAgreements": ["...", "..."] }
            ※ qualitativeAgreements には、金銭以外で合意に至った具体的な条件（働き方改革、福利厚生、安全対策など）をリストアップしてください。
        `;

        try {
            const response = await generateContentWithFallback(ai, {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: { responseMimeType: "application/json" }
            });
            const result = JSON.parse(response.text || "{}") as GameResult;
            if (isMountedRef.current) {
                setGameResult(result);
                setNegotiationStatus('stopped');
                setMessages(prev => [...prev, { role: 'moderator', text: "🔔 判定結果が出ました！" }]);
            }
        } catch (e: any) {
            console.error(e);
            if (isMountedRef.current) setMessages(prev => [...prev, { role: 'moderator', text: "⚠️ 判定中にエラーが発生しました。" }]);
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    const runNegotiationStep = async (history: ChatMessageData[], nextRole: 'company' | 'union', turn: number, isBattleResponse = false) => {
        if (!isMountedRef.current || (negotiationStatusRef.current !== 'running' && !isBattleResponse)) return;
        if (isProcessingRef.current && !isBattleResponse) return; // Prevent concurrent steps

        isProcessingRef.current = true;
        // --- Battle Mode Check ---
        if (battleModeRole && nextRole === battleModeRole && !isBattleResponse) {
            isProcessingRef.current = false;
            setLoading(false);
            // User turn, wait for input
            return;
        }

        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            isProcessingRef.current = false;
            setMessages(prev => [...prev, { role: 'moderator', text: "⚠️ APIキーが設定されていません。設定画面からAPIキーを確認してください。" }]);
            setNegotiationStatus('stopped');
            setLoading(false);
            return;
        }

        if(!isBattleResponse) setLoading(true);
        const context = getContextData();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        const ai = new GoogleGenAI({ apiKey });

        // Use FULL history instead of slicing, to maintain context and consistency
        // Map history to string format
        const conversationLog = history.map(m => {
            const roleLabel = m.role === 'company' ? '会社側' : m.role === 'union' ? '組合側' : '司会';
            return `[${roleLabel}] ${m.name || ''}: ${m.text}`;
        }).join("\n\n");

        const currentRound = round;
        const roundTheme = getRoundTheme(currentRound);
        const teamIndex = Math.floor(turn / 2);
        
        const speakerPersonaId = nextRole === 'company' 
            ? activeCompanyPersonas[teamIndex % activeCompanyPersonas.length] 
            : activeUnionPersonas[teamIndex % activeUnionPersonas.length];
        const speakerConfig = getPersonaConfig(speakerPersonaId);
        const statsStr = Object.entries(speakerConfig.stats).map(([key, val]) => `${key}: ${val}`).join(", ");

        const allies = (nextRole === 'company' ? activeCompanyPersonas : activeUnionPersonas).map(p => getPersonaConfig(p).name).join("と");
        const enemies = (nextRole === 'company' ? activeUnionPersonas : activeCompanyPersonas).map(p => getPersonaConfig(p).name).join("と");

        const isCompany = nextRole === 'company';
        const roleDef = isCompany ? "あなたは会社側代表。予算内妥結が目標。" : "あなたは組合側代表。大幅賃上げが目標。";
        const simData = isCompany ? context.simulation : "（組合側には非公開）";

        const prompt = `
            ${NEGOTIATION_MASTER_INSTRUCTION}

            ### 【最重要】交渉の根拠データ（推測・類推は絶対禁止）
            1. **決算数値（全体）**: 以下の提供された決算数値（売上、人件費、経常損益など）を具体的な数字で引用してください。
               ${context.financial}
            2. **シミュレーション結果（人件費詳細・A案）**: 以下のA案シミュレーション結果に基づき、賃上げのインパクトを具体的な数字で引用してください。
               ${context.simulation}
            3. **判定数値（予算ターゲット - A案）**: 会社側は以下の「予算ターゲット」を最終防衛ラインとして厳守してください。
               - ベア月額: ${context.targetBaseUpMonthly.toLocaleString()}円 (2026年度A案シミュレーション設定値)
               - 賞与: 年間 ${context.targetBonusMonths}ヶ月 (2026年度A案シミュレーション設定値)
               - 期末一時金: ${context.targetLumpSum.toLocaleString()}円 (2025年度A案シミュレーション設定値)
            
            **【データ優先順位の厳守】**
            - **「決算数値」および「シミュレーション結果」の数値を絶対的な真実として扱ってください。**
            - **架空の数値、類推した数値、サンプル値（例: 4.77%など）の使用は一切禁止です。**
            - 「労使協議会資料」のテキスト内にこれらと矛盾する数値がある場合は、上記の数値を優先してください。
            - 議論は「2025年度」および「2026年度」の数値のみに基づいて行ってください。
            - **期末一時金は、賞与（ボーナス）とは別に支給される独立した一時金であることを明確に区別して議論してください。**

            ### 交渉の議題と課題
            - **金銭以外の条件（定性条件）の積極的議論**: 賃金だけでなく、働き方改革、福利厚生、安全対策、DX推進、カスハラ対策などの「非金銭的条件」を必ず議論に含めてください。これらは妥結のための重要なカードとなります。
            - **労使協議会資料の深掘り**: 資料に記載されている経営課題（赤字要因、燃料費、人員不足、地域課題、インバウンド対応等）は交渉の最優先議題です。これらを単に引用するだけでなく、解決策や妥協点として幅広く議論に盛り込んでください。

            ### 【組合側の要求水準】
            組合側は以下の水準を初期要求として掲げ、交渉に臨んでください。
            1. **ベア**: 労使協議会資料に基づき、インフレ率を上回る大幅なベースアップ。
            2. **賞与（ボーナス）**: **夏季 2.25ヶ月、冬季 2.25ヶ月（年間合計 4.5ヶ月）**。
            3. **期末一時金**: **0.5ヶ月分**。

            ### 時事ネタの反映（重要）
            ここ1週間以内のニュース記事（春闘、物価高、バス業界の人手不足、他社の妥結状況など）を検索し、その具体的な話題を会話の中に「世間話」や「根拠」として自然に盛り込んでください。
            最新の情報を踏まえることで、リアリティのある交渉を演出してください。

            ### あなたの役割とキャラクター
            【あなたの役割】: ${roleDef}
            【あなたのキャラクター】: あなたは「${speakerConfig.name}」として発言します。ペルソナ: ${speakerConfig.systemInstruction}
            【あなたの能力値】: ${statsStr}

            ### 交渉の状況
            【現在の交渉参加者】
            ・あなたのチーム (${isCompany ? '会社側' : '組合側'}): ${allies}
            ・相手チーム (${!isCompany ? '会社側' : '組合側'}): ${enemies}
            ${battleModeRole ? '【補足】相手チームには人間(あなた)が組合代表として参加しています。' : ''}
            
            【現在のラウンド】: R${currentRound}/${MAX_ROUNDS}: ${roundTheme.title}
            【このラウンドの指示】: ${roundTheme.instruction}

            ### 参考データ
            【システム仕様(基礎知識)】: ${SYSTEM_SPECS}
            
            【重要：労使協議会資料（ユーザー入力コンテキスト）】
            ${context.userContext}
            ※この資料は交渉の「前提事実」です。ここに書かれた具体的なエピソードや数値を引用して議論してください。

            【交渉用データ】
            ・財務: ${context.financial} (※単位: 千円)
            ・試算: ${simData}
            ※「売上」と問われたら「営業収益計」の数値を回答すること。
            
            ### 全会話ログ (文脈維持用)
            ${conversationLog}
            
            ### 重要：回答ルール (堂々巡り防止)
            1. **一貫性の維持と繰り返し禁止**: 過去の会話ログを熟読し、矛盾を避けるだけでなく、**同じ主張や根拠を何度も繰り返すことを厳禁とします。** 常に新しい論点や具体的な提案を出してください。
            2. **妥結への歩み寄り**: 議論を平行線にせず、ラウンドが進むにつれて、相手の主張を一部認める、代替案を出す、金額を具体的に譲歩するなどして、必ず「妥結（合意）」に向かって議論を収束させてください。
            3. **金額の明示**: 概念的な話だけでなく、「ベア〇〇円」「一時金〇〇ヶ月」といった具体的な数字を出して交渉してください。
            4. **冒頭の戦術**: 冒頭に【戦術:〇〇】を記述してください。
            5. **出力制限**: マークダウン記号（*, **）は出力しないでください。100〜150文字程度で完結させてください。
            6. **議論の徹底と遅延**: 現在のラウンドは ${currentRound}/${MAX_ROUNDS} です。
               - **第10ラウンドまでは、安易な妥協や早期の結論（【交渉成立】/【交渉決裂】）を禁止します。** 徹底的に議論を戦わせ、相手の主張の矛盾を突き、粘り強く交渉してください。
               - 簡単に合意せず、一度は持ち帰る、あるいは条件を突き返すなどして、交渉を長引かせてください。
            7. **最終局面**: 第11ラウンド以降、かつターン数が上限(${MAX_TURNS})に近づいた場合のみ、決着をつけることを意識してください。

            ### 終了判定フラグ (早期決着)
            ・双方が合意に至った（妥結した）場合は、発言の最後に **【交渉成立】** と出力してください。
            ・交渉が決裂し、ストライキが確定した場合は、発言の最後に **【交渉決裂】** と出力してください。
            ・まだ議論が続く場合は、これらのタグを出力しないでください。
        `;

        try {
            const response = await generateContentWithFallback(ai, { 
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: { 
                    maxOutputTokens: 8192,
                    temperature: 0.7,
                    tools: [{ googleSearch: {} }] // Enable Google Search
                } 
            });
            const rawText = response.text || "";
            
            if (!rawText && !isBattleResponse) {
                throw new Error("AIからの応答が空でした。再試行してください。");
            }
            let tactic = "", displayText = rawText;
            const tacticMatch = rawText.match(/【戦術:\s*(.*?)】/);
            if (tacticMatch) { tactic = tacticMatch[1]; displayText = rawText.replace(tacticMatch[0], "").trim(); }

            displayText = displayText.replace(/\*/g, '');

            let finishType: 'agreed' | 'strike' | null = null;
            if (rawText.includes("【交渉成立】")) {
                finishType = 'agreed';
                displayText = displayText.replace("【交渉成立】", "").trim();
            } else if (rawText.includes("【交渉決裂】")) {
                finishType = 'strike';
                displayText = displayText.replace("【交渉決裂】", "").trim();
            }

            // Extract Grounding Sources
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            const sources: {title: string, uri: string}[] = [];
            if (groundingMetadata?.groundingChunks) {
                groundingMetadata.groundingChunks.forEach((chunk: any) => {
                    if (chunk.web) {
                        sources.push({
                            title: chunk.web.title,
                            uri: chunk.web.uri
                        });
                    }
                });
            }

            if (isMountedRef.current && (negotiationStatusRef.current === 'running' || isBattleResponse)) {
                const newMsg: ChatMessageData = { 
                    role: nextRole, 
                    personaId: speakerPersonaId, 
                    name: speakerConfig.name, 
                    text: displayText, 
                    round, 
                    tactic,
                    sources: sources.length > 0 ? sources : undefined // Add sources to message data
                };
                
                const newHistory = [...history, newMsg];
                setMessages(prev => [...prev, newMsg]);
                
                // --- Early Termination Check ---
                if (finishType) {
                    isProcessingRef.current = false;
                    setNegotiationStatus(finishType);
                    negotiationStatusRef.current = finishType;
                    
                    const endMsgText = finishType === 'agreed' 
                        ? "🎊 交渉成立！ただちに判定に移ります..." 
                        : "💔 交渉決裂...ただちに判定に移ります...";
                    
                    const endMsg: ChatMessageData = { role: 'moderator', text: endMsgText };
                    setMessages(prev => [...prev, endMsg]);
                    
                    // Trigger judgment automatically
                    setTimeout(() => {
                        if (isMountedRef.current) {
                            judgeNegotiationResult([...newHistory, endMsg]);
                        }
                    }, 1500);
                    return; // Stop the loop
                }

                const nextTurn = turn + 1;
                setTurnCount(nextTurn);

                if (isBattleResponse) {
                    isProcessingRef.current = false;
                    setLoading(false); 
                    return;
                }

                if (nextTurn >= MAX_TURNS) {
                     isProcessingRef.current = false;
                     setNegotiationStatus('continued');
                     setMessages(prev => [...prev, { role: 'moderator', text: `📢 第${round}ラウンドの議論を終了し、次のフェーズへ移行します。` }]);
                     setLoading(false);

                     // Automated mode: Auto-proceed to next round if not the last round
                     if (!battleModeRole && round < MAX_ROUNDS) {
                         setMessages(prev => [...prev, { role: 'moderator', text: "⏭️ 次のラウンドへ自動移行中..." }]);
                         setTimeout(() => {
                             if (isMountedRef.current) startNextRound();
                         }, 2000);
                     } else if (round >= MAX_ROUNDS) {
                         // Last round time up: Force judgment in both modes to prevent "stuck" feeling
                         setMessages(prev => [...prev, { role: 'moderator', text: "🏁 全ての交渉ラウンドが終了しました。最終判定を行います..." }]);
                         setTimeout(() => {
                             if (isMountedRef.current) judgeNegotiationResult();
                         }, 2000);
                     }
                } else {
                    isProcessingRef.current = false;
                    setTimeout(() => {
                        if(isMountedRef.current) runNegotiationStep(newHistory, nextRole === 'company' ? 'union' : 'company', nextTurn);
                    }, 2000);
                }
            } else {
                isProcessingRef.current = false;
            }
        } catch (error: any) {
             isProcessingRef.current = false;
             console.error("Negotiation Step Error:", error);
             if (isMountedRef.current) {
                 const errorMsg = error.message || "Unknown error";
                 setMessages(prev => [...prev, { role: 'moderator', text: `⚠️ 通信エラーが発生しました: ${errorMsg}` }]);
                 setNegotiationStatus('stopped');
                 setLoading(false);
             }
        }
    };

    const startNextRound = () => {
        // Play "Round One, Fight!" voice on start
        if (negotiationStatus === 'idle' && !isSeriousMode) {
             const u = new SpeechSynthesisUtterance("ラウンドワン、ファイト！");
             u.lang = 'ja-JP';
             u.pitch = 0.8;
             u.rate = 1.3;
             window.speechSynthesis.speak(u);
        }

        if (round >= MAX_ROUNDS && negotiationStatus === 'continued') {
            setNegotiationStatus('agreed'); 
            setMessages(prev => [...prev, { role: 'moderator', text: "👏👏👏 交渉終了。お疲れ様でした。" }]);
            return;
        }
        if (negotiationStatus === 'continued') setRound(r => r + 1);
        setTurnCount(0);
        setNegotiationStatus('running');
        negotiationStatusRef.current = 'running';
        
        const currentRound = negotiationStatus === 'continued' ? round + 1 : round;
        const theme = getRoundTheme(currentRound);

        const newModeratorMessages: ChatMessageData[] = [
            { role: 'moderator', text: `=== ${theme.title} ===` },
            { role: 'moderator', text: `👨‍🏫 シナリオ指示: ${theme.instruction.replace(/【状況】/, '')}` }
        ];

        setMessages(prev => [...prev, ...newModeratorMessages]);
        
        isProcessingRef.current = false; // Reset lock for new round
        // Pass the FULL current message history including the new moderator messages
        if (isMountedRef.current) runNegotiationStep([...messages, ...newModeratorMessages], 'company', 0);
    };

    const handleBattleSend = async () => {
        if (!battleInput.trim() || loading) return;

        const userText = battleInput.trim();
        setBattleInput("");
        setLoading(true);

        const myRole = battleModeRole || 'union';
        const myName = myRole === 'company' ? 'あなた (会社代表)' : 'あなた (組合代表)';
        const enemyRole = myRole === 'company' ? 'union' : 'company';

        const newUserMessage: ChatMessageData = { role: myRole, text: userText, name: myName };
        const newHistory = [...messages, newUserMessage];
        setMessages(newHistory);
        
        // Pass full history including user input
        await runNegotiationStep(newHistory, enemyRole, turnCount + 1, true);
    };

    const generateReport = async () => {
        setLoading(true);
        const apiKey = getGeminiApiKey();
        if (!apiKey) {
            alert("APIキーが設定されていません。");
            setLoading(false);
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const context = getContextData();
        
        const prompt = mode === 'requirements' 
            ? `労使協議会資料の分析に基づき、組合側の要求書案を作成してください。\n資料: ${context.userContext}\n財務データ(2025/2026): ${context.financial}`
            : `シミュレーション結果および財務データに基づき、経営陣への報告書を作成してください。\nシミュレーションデータ: ${context.simulation}\n財務データ(2025/2026): ${context.financial}`;

        try {
            const response = await generateContentWithFallback(ai, {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });
            setGeneratedReport(response.text || "");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const roundTheme = getRoundTheme(round);

    if (mode === 'negotiation') {
        const companyNames = activeCompanyPersonas.map(p => getPersonaConfig(p).name).join("・");
        const unionNames = activeUnionPersonas.map(p => getPersonaConfig(p).name).join("・");

        if (isSetupPhase && messages.length === 0) {
            return (
                <div className="flex flex-col flex-1 min-h-0 md:h-[85vh] bg-gray-100 dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700 relative transition-colors">
                    <PersonaSelector 
                        companyPersonas={activeCompanyPersonas}
                        onUpdateCompanyPersonas={onUpdateCompanyPersonas || (() => {})}
                        unionPersonas={activeUnionPersonas}
                        onUpdateUnionPersonas={onUpdateUnionPersonas || (() => {})}
                        onStart={() => setIsSetupPhase(false)}
                    />
                </div>
            );
        }

        return (
            <div className="flex flex-col flex-1 min-h-0 md:h-[85vh] bg-gray-100 dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700 relative transition-colors">
                {gameResult && <GameResultModal result={gameResult} onClose={() => setGameResult(null)} onSaveLog={handleSaveLog} />}

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-3 md:p-4 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-md z-10">
                    <div className="flex items-center gap-3">
                        <MessageCircleIcon />
                        <div>
                            <h2 className="font-bold text-base md:text-lg leading-tight">2026年度 春闘交渉シナリオ</h2>
                            <div className="text-[9px] md:text-[10px] text-yellow-400 font-bold opacity-90 mb-0.5">
                                メインテーマ：人財の定着と京都の誇りを守る「共創型」労働環境の構築
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-200 flex items-center gap-2 font-medium">
                                <span>Round: {round}/{MAX_ROUNDS}</span>
                                <span className="px-1.5 py-0.5 bg-gray-600 rounded text-[9px] md:text-[10px] uppercase font-bold">{negotiationStatus}</span>
                                <span className="text-yellow-300 ml-2 hidden md:inline">テーマ: {roundTheme.title}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                        {/* Battle Mode Toggle - Hidden in Serious Mode */}
                        {!isSeriousMode && !battleModeRole && (
                            <div className="flex flex-col items-center -space-y-1">
                                <span className="text-sm md:text-base font-black text-white animate-pulse drop-shadow-md tracking-wider" style={{ fontFamily: '"Russo One", sans-serif', textShadow: '2px 0 0 #dc2626, -2px 0 0 #dc2626, 0 2px 0 #dc2626, 0 -2px 0 #dc2626, 1px 1px 0 #dc2626, -1px -1px 0 #dc2626, 1px -1px 0 #dc2626, -1px 1px 0 #dc2626' }}>おれにまかせろ</span>
                                <div className="flex gap-2 mt-1">
                                    <button 
                                        onClick={() => startBattleMode('company')} 
                                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[10px] md:text-xs bg-blue-700 text-white border-2 border-blue-400 hover:bg-blue-600 hover:scale-110 shadow-xl flex items-center gap-1 transition-all"
                                        title="会社側として参加"
                                    >
                                        <SwordIcon style={{width:14}} /> 会社参戦
                                    </button>
                                    <button 
                                        onClick={() => startBattleMode('union')} 
                                        className="px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-[10px] md:text-xs bg-red-600 text-white border-2 border-red-400 hover:bg-red-500 hover:scale-110 shadow-xl flex items-center gap-1 transition-all"
                                        title="組合側として参加"
                                    >
                                        <SwordIcon style={{width:14}} /> 組合参戦
                                    </button>
                                </div>
                            </div>
                        )}
                        {!isSeriousMode && battleModeRole && (
                             <button 
                                onClick={toggleBattleMode} 
                                className="px-3 md:px-4 py-1.5 md:py-2 rounded-full font-black text-xs md:text-sm bg-gray-700 text-white border-2 border-gray-500 hover:bg-gray-600 shadow-lg flex items-center gap-2"
                                title="モード切替"
                            >
                                <BotIcon style={{width:14}} /> AIに任せる
                            </button>
                        )}

                        {negotiationStatus !== 'idle' && (
                            <button 
                                onClick={() => judgeNegotiationResult()} 
                                className="bg-indigo-600 hover:bg-indigo-500 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold flex items-center gap-1 transition-colors shadow-lg border border-indigo-400 hover:scale-105"
                                title="現在の状況で判定を行う"
                            >
                                <HandshakeIcon style={{width:14}} /> 判定
                            </button>
                        )}
                        {!battleModeRole && (
                            negotiationStatus === 'running' ? (
                                <button onClick={handleStop} className="bg-red-500 hover:bg-red-600 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold flex items-center gap-1 transition-colors">
                                    <PauseCircleIcon style={{width:14}} /> 中断
                                </button>
                            ) : (
                                <button 
                                    onClick={startNextRound} 
                                    disabled={negotiationStatus === 'strike' || negotiationStatus === 'agreed'}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded font-bold shadow transition-all flex items-center gap-1 md:gap-2 text-xs md:text-sm ${
                                        negotiationStatus === 'strike' || negotiationStatus === 'agreed' ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 animate-pulse'
                                    }`}
                                >
                                    <PlayCircleIcon style={{width:14}} />
                                    {negotiationStatus === 'idle' ? '開始' : '次Rへ'}
                                </button>
                            )
                        )}
                        <button onClick={handleSaveLog} className="bg-gray-600 hover:bg-gray-500 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold flex items-center gap-1 transition-colors" title="交渉ログ保存">
                            <DownloadIcon style={{width:14}} /> ログ保存
                        </button>
                        <button 
                            onClick={() => {
                                if (confirm('交渉をリセットしてメンバー編成に戻りますか？')) {
                                    if (abortControllerRef.current) abortControllerRef.current.abort();
                                    setMessages([]);
                                    setNegotiationStatus('idle');
                                    setRound(1);
                                    setTurnCount(0);
                                    setGameResult(null);
                                    setLoading(false);
                                    setIsSetupPhase(true);
                                }
                            }} 
                            className="bg-gray-700 hover:bg-gray-600 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold flex items-center gap-1 transition-colors border border-gray-500" 
                            title="メンバー編成からやり直す"
                        >
                            <UsersIcon style={{width:14}} /> 編成
                        </button>
                        {onNavigate && (
                            <button 
                                onClick={() => onNavigate('negotiation_impact')}
                                className="bg-red-600 hover:bg-red-500 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold flex items-center gap-1 transition-colors shadow-lg border border-red-400 animate-pulse"
                                title="交渉の財務インパクトを分析"
                            >
                                <TrendingUpIcon style={{width:14}} /> インパクト分析
                            </button>
                        )}
                        {onReturnToTitle && (
                            <button 
                                onClick={onReturnToTitle}
                                className="bg-red-700 hover:bg-red-600 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-bold flex items-center gap-1 transition-colors shadow-lg border border-red-500"
                                title="タイトル画面へ戻る"
                            >
                                <span>🚪 終了</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 bg-gray-200 dark:bg-gray-900">
                    {messages.length === 0 && !battleModeRole && (
                        <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-xl text-center shadow-sm max-w-lg mx-auto mt-10 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">対戦カード ({activeCompanyPersonas.length} on {activeUnionPersonas.length})</h3>
                            <div className="flex justify-center items-center gap-8 mb-4">
                                <div className="text-center">
                                    <div className="text-4xl mb-1">🕴️</div>
                                    <div className="font-bold text-blue-800 dark:text-blue-400 text-sm whitespace-pre-wrap">{companyNames.replace(/・/g, '\n')}</div>
                                </div>
                                <div className="text-xl font-black text-gray-400">VS</div>
                                <div className="text-center">
                                    <div className="text-4xl mb-1">🗣️</div>
                                    <div className="font-bold text-red-800 dark:text-red-400 text-sm whitespace-pre-wrap">{unionNames.replace(/・/g, '\n')}</div>
                                </div>
                            </div>
                            <div className="text-left bg-blue-50 dark:bg-blue-900/20 p-4 rounded text-sm text-gray-800 dark:text-gray-300 border border-blue-200 dark:border-blue-800">
                                <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-300"><BookOpenIcon /> 自動交渉モード (学習用)</h4>
                                <p className="mb-2 text-gray-700 dark:text-gray-300">AI同士が自動で団体交渉を進めます。各キャラクターの交渉戦術を観察しましょう。</p>
                            </div>
                        </div>
                    )}
                    {messages.length === 0 && battleModeRole && (
                         <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-xl text-center shadow-sm max-w-lg mx-auto mt-10 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">対戦カード</h3>
                             <div className="flex justify-center items-center gap-8 mb-4">
                                <div className="text-center">
                                    <div className="text-4xl mb-1">👤</div>
                                    <div className={`font-bold text-sm ${battleModeRole === 'company' ? 'text-blue-800 dark:text-blue-400' : 'text-red-800 dark:text-red-400'}`}>あなた ({battleModeRole === 'company' ? '会社側' : '組合側'})</div>
                                </div>
                                <div className="text-xl font-black text-gray-400">VS</div>
                                <div className="text-center">
                                    <div className="text-4xl mb-1">{battleModeRole === 'company' ? '🗣️' : '🕴️'}</div>
                                    <div className={`font-bold text-sm whitespace-pre-wrap ${battleModeRole === 'company' ? 'text-red-800 dark:text-red-400' : 'text-blue-800 dark:text-blue-400'}`}>
                                        {battleModeRole === 'company' ? unionNames.replace(/・/g, '\n') : companyNames.replace(/・/g, '\n')}
                                    </div>
                                </div>
                            </div>
                            <div className="text-left bg-purple-50 dark:bg-purple-900/20 p-4 rounded text-sm text-gray-800 dark:text-gray-300 border border-purple-200 dark:border-purple-800">
                                <h4 className="font-bold mb-2 flex items-center gap-2 text-purple-900 dark:text-purple-300"><SwordIcon /> 手動交渉モード (実践用)</h4>
                                <p className="mb-2 text-gray-700 dark:text-gray-300">あなたが{battleModeRole === 'company' ? '会社側' : '組合側'}代表として、AI{battleModeRole === 'company' ? '組合' : '経営陣'}と直接交渉します。下の入力欄から発言してください。</p>
                            </div>
                        </div>
                    )}
                    {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
                    {loading && (
                        <div className="flex justify-start w-full animate-pulse">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 rounded-full bg-red-800 border-2 border-red-400 flex items-center justify-center">
                                    <BotIcon />
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 text-xs font-bold tracking-widest">
                                    AIが返答を考えています...
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {/* Input for Battle Mode */}
                {battleModeRole && (
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 border-t dark:border-gray-700">
                        <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-bold">
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">現在の交渉テーマ</span>
                            <span>{roundTheme.title}</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-emerald-600 dark:text-emerald-400">💡 ヒント: 金銭だけでなく、働き方や福利厚生についても提案してみましょう。</span>
                        </div>
                        <div className="flex gap-2 max-w-4xl mx-auto">
                            <textarea
                                value={battleInput}
                                onChange={(e) => setBattleInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBattleSend(); } }}
                                placeholder={`${battleModeRole === 'company' ? '会社側' : '組合側'}代表として発言...`}
                                className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all resize-none min-h-[50px] max-h-32 text-sm"
                                disabled={loading}
                            />
                            <button
                                onClick={handleBattleSend}
                                disabled={loading || !battleInput.trim()}
                                className={`rounded-lg w-24 flex items-center justify-center transition-all shrink-0 font-bold border-b-4 active:border-b-0 active:translate-y-1 ${
                                    loading || !battleInput.trim() 
                                    ? 'bg-gray-400 border-gray-600 text-gray-200 cursor-not-allowed' 
                                    : battleModeRole === 'company' ? 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500' : 'bg-red-600 border-red-800 text-white hover:bg-red-500'
                                }`}
                            >
                                <SendIcon /> 送信
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <ReportGenerator 
            mode={mode as 'requirements' | 'analysis'}
            reportText={generatedReport}
            loading={loading}
            onGenerate={generateReport}
            onReset={() => setGeneratedReport("")}
            onReturnToTitle={onReturnToTitle}
        />
    );
};
