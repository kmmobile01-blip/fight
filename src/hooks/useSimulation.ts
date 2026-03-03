
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { runSimulation } from '../utils/simulationLogic';
import { parseEmployeeData } from '../utils/fileImporter';
import { 
    createDefaultRaisePlan, createDefaultRecruitmentPlan, createDefaultImpactRates, 
    createDefaultFinancialPlan, createConfigA, createConfigB 
} from '../utils/initialState';
import { 
    Employee, SimulationConfig, RaisePlanYear, 
    RecruitmentPlanYear, CustomAllowance, ImpactRateYear, FinancialPlan, PersonaType, SimulationResult, UnionPersonaType,
    AiProposal
} from '../types';

export const useSimulation = () => {
    // --- Core Data State ---
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isStale, setIsStale] = useState(true);
    
    // --- Planning State ---
    const [raisePlanA, setRaisePlanA] = useState<Record<number, RaisePlanYear>>(createDefaultRaisePlan);
    const [raisePlanB, setRaisePlanB] = useState<Record<number, RaisePlanYear>>(createDefaultRaisePlan);
    const [recruitmentPlanA, setRecruitmentPlanA] = useState<Record<number, RecruitmentPlanYear>>(createDefaultRecruitmentPlan);
    const [recruitmentPlanB, setRecruitmentPlanB] = useState<Record<number, RecruitmentPlanYear>>(createDefaultRecruitmentPlan);
    const [impactRatesA, setImpactRatesA] = useState<Record<number, ImpactRateYear>>(createDefaultImpactRates);
    const [impactRatesB, setImpactRatesB] = useState<Record<number, ImpactRateYear>>(createDefaultImpactRates);
    const [customAllowances, setCustomAllowances] = useState<CustomAllowance[]>([]);
    
    // --- Financial & Config State ---
    const [financialData, setFinancialData] = useState<FinancialPlan[]>(createDefaultFinancialPlan);
    const [configA, setConfigA] = useState<SimulationConfig>(createConfigA);
    const [configB, setConfigB] = useState<SimulationConfig>(createConfigB);
    
    // --- Shared Analysis State (BEP/ROI) ---
    // Restore default values for BEP/ROI analysis
    const [sharedRecruitCost, setSharedRecruitCost] = useState(450000);
    const [sharedTrainingCost, setSharedTrainingCost] = useState(400000);
    const [sharedLicenseCost, setSharedLicenseCost] = useState(400000);
    const [sharedSafetyValue, setSharedSafetyValue] = useState(100000);
    
    // --- UI/Calc State ---
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [simulationError, setSimulationError] = useState<string | null>(null);
    const [simulationResults, setSimulationResults] = useState<{ resultA: SimulationResult | null, resultB: SimulationResult | null, resultC: SimulationResult | null }>({ resultA: null, resultB: null, resultC: null });

    // --- Negotiation State ---
    const [negotiationMaterials, setNegotiationMaterials] = useState<string>(`2026年度 労使協議会資料（春闘交渉方針）

【メインテーマ】
「人財定着」と「共創型労働環境」の構築
～持続可能な公共交通の維持と、社員の幸福度向上を両立させる～

１．経営状況と課題認識（会社側）
・2025年度決算見込み：物価高騰・燃料費負担増が続く中、インバウンド需要の回復により増収。
・2026年度予算方針：人財確保を最優先投資事項とし、攻めの経営へ転換。

２．人財定着に向けた具体的施策（会社側・組合側）
・運転士不足対策：大型二種免許取得費用の全額公費負担制度の拡充と、養成期間中の給与保障水準の引き上げ。
・改善基準告示への対応：拘束時間の短縮に伴う「実質的な手取り減」を補填する「運行効率手当」および「改善基準対応手当」の検討。
・共創型労働環境：現場の声をダイヤ編成に直接反映させる「ダイヤ改善委員会」の設置。

３．新規手当・制度の提案（組合側要求）
・「人財定着手当」：勤続3年、5年、10年の節目での加算額を大幅に増額。
・「生活防衛特別手当」：急激な物価上昇に対する時限的な生活補填。
・「改善基準対応手当」：休息時間の確保と引き換えに減少する時間外手当分を補填し、年収を維持。

４．定年延長と賃金体系（労使共同）
・正社員延長時の賃金水準：現行の60歳到達時比「〇〇％」の維持と、役割に応じた加算。
・再雇用制度の柔軟化：週3日勤務や短時間勤務など、多様な働き方の選択肢を共創。

５．春闘要求（金銭3項目）
・ベースアップ：月額 〇〇,〇〇〇円
・年間賞与：計 〇.〇ヶ月
・期末一時金：〇〇,〇〇〇円`);
    const [companyPersonas, setCompanyPersonas] = useState<PersonaType[]>(['normal', 'sanae', 'jack']);
    const [unionPersonas, setUnionPersonas] = useState<UnionPersonaType[]>(['kiyomi', 'gonda', 'baigaeshi']);

    // --- Persistence Effects ---
    // Load data on mount
    useEffect(() => {
        const saved = localStorage.getItem('SF26_SIM_DATA');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.employees) setEmployees(data.employees.map((e: any) => ({ ...e, birthDate: new Date(e.birthDate), hireDate: new Date(e.hireDate) })));
                if (data.configA) setConfigA(data.configA);
                if (data.configB) setConfigB(data.configB);
                if (data.raisePlanA) setRaisePlanA(data.raisePlanA);
                if (data.raisePlanB) setRaisePlanB(data.raisePlanB);
                if (data.recruitmentPlanA) setRecruitmentPlanA(data.recruitmentPlanA);
                if (data.recruitmentPlanB) setRecruitmentPlanB(data.recruitmentPlanB);
                if (data.impactRatesA) setImpactRatesA(data.impactRatesA);
                if (data.impactRatesB) setImpactRatesB(data.impactRatesB);
                if (data.customAllowances) setCustomAllowances(data.customAllowances);
                if (data.financialData) setFinancialData(data.financialData);
                if (data.negotiationMaterials) setNegotiationMaterials(data.negotiationMaterials);
                if (data.sharedRecruitCost !== undefined) setSharedRecruitCost(data.sharedRecruitCost);
                if (data.sharedTrainingCost !== undefined) setSharedTrainingCost(data.sharedTrainingCost);
                if (data.sharedLicenseCost !== undefined) setSharedLicenseCost(data.sharedLicenseCost);
                if (data.sharedSafetyValue !== undefined) setSharedSafetyValue(data.sharedSafetyValue);
                if (data.companyPersonas) setCompanyPersonas(data.companyPersonas);
                if (data.unionPersonas) setUnionPersonas(data.unionPersonas);
                setIsStale(true);
            } catch (e) {
                console.error("Failed to load saved data from localStorage", e);
            }
        }
    }, []);

    // Save data on change (Debounced to avoid blocking UI)
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(() => {
            try {
                const data = {
                    employees, configA, configB, raisePlanA, raisePlanB,
                    recruitmentPlanA, recruitmentPlanB, impactRatesA, impactRatesB,
                    customAllowances, financialData, negotiationMaterials,
                    sharedRecruitCost, sharedTrainingCost, sharedLicenseCost, sharedSafetyValue,
                    companyPersonas, unionPersonas
                };
                localStorage.setItem('SF26_SIM_DATA', JSON.stringify(data));
            } catch (e) {
                console.error("Failed to save data to localStorage", e);
            }
        }, 1000); // 1 second debounce
        
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [
        employees, configA, configB, raisePlanA, raisePlanB, 
        recruitmentPlanA, recruitmentPlanB, customAllowances, impactRatesA, impactRatesB,
        financialData, negotiationMaterials, sharedRecruitCost, sharedTrainingCost, 
        sharedLicenseCost, sharedSafetyValue, companyPersonas, unionPersonas
    ]);

    // --- Effects ---
    useEffect(() => {
        setIsStale(true);
    }, [
        employees, configA, configB, recruitmentPlanA, recruitmentPlanB, 
        raisePlanA, raisePlanB, customAllowances, impactRatesA, impactRatesB
    ]);

    // --- Synchronization Effect (Plan A -> Plan B) ---
    useEffect(() => {
        if (configB.syncBaseUpWithA) {
            setRaisePlanB(prevB => {
                const newPlanB = JSON.parse(JSON.stringify(prevB));
                let hasChanges = false;

                Object.keys(raisePlanA).forEach(key => {
                    const year = parseInt(key);
                    const pA = raisePlanA[year];
                    if (newPlanB[year]) {
                        const pB = newPlanB[year];
                        // FIX: Logic updated to copy entire DETAILED structure.
                        // Previously, it blindly applied averageAmount to all fields, causing B to be higher.
                        if (
                            pB.averageAmount !== pA.averageAmount ||
                            pB.yearlyRaise !== pA.yearlyRaise ||
                            JSON.stringify(pB.detailed) !== JSON.stringify(pA.detailed)
                        ) {
                            newPlanB[year].averageAmount = pA.averageAmount;
                            newPlanB[year].yearlyRaise = pA.yearlyRaise; 
                            // Deep copy detailed settings (preserves "0" for management/re-emp if A is 0)
                            newPlanB[year].detailed = JSON.parse(JSON.stringify(pA.detailed));
                            hasChanges = true;
                        }
                    }
                });
                return hasChanges ? newPlanB : prevB;
            });
        }
    }, [raisePlanA, configB.syncBaseUpWithA]);

    // --- Handlers ---

    const runCalculation = useCallback(() => {
        setIsLoading(true);
        setLoadingMessage("シミュレーション計算中 (3パターン)...");
        setSimulationError(null);
        
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                let success = true;
                try {
                    if (!employees || employees.length === 0) {
                        // If no employees, check if we can load from localStorage first
                        const saved = localStorage.getItem('SF26_SIM_DATA');
                        if (saved) {
                            const data = JSON.parse(saved);
                            if (data.employees && data.employees.length > 0) {
                                const loadedEmployees = data.employees.map((e: any) => ({ ...e, birthDate: new Date(e.birthDate), hireDate: new Date(e.hireDate) }));
                                setEmployees(loadedEmployees);
                                // Continue with loaded employees
                                performCalculation(loadedEmployees);
                                resolve(true);
                                return;
                            }
                        }
                        throw new Error("従業員データが読み込まれていません。メインメニューからCSVファイルをアップロードしてください。");
                    }
                    performCalculation(employees);
                } catch (err: any) {
                    console.error("Simulation Calculation Error:", err);
                    setSimulationError(`計算処理中にエラーが発生しました。\n詳細: ${err.message}`);
                    success = false;
                } finally {
                    setIsLoading(false);
                    setLoadingMessage("");
                    resolve(success);
                }
            }, 100);
        });

        function performCalculation(targetEmployees: Employee[]) {
            const start = performance.now();
            
            // Run A and B
            const rA = runSimulation(targetEmployees, configA, recruitmentPlanA, raisePlanA, customAllowances, impactRatesA);
            const rB = runSimulation(targetEmployees, configB, recruitmentPlanB, raisePlanB, customAllowances, impactRatesB);
            
            // Create and Run C (based on B, but with no Base Up AND no Teisho)
            const raisePlanC = JSON.parse(JSON.stringify(raisePlanB));
            Object.keys(raisePlanC).forEach(year => {
                raisePlanC[year].averageAmount = 0;
                raisePlanC[year].yearlyRaise = 0; // Set Teisho to 0
                Object.keys(raisePlanC[year].detailed).forEach(key => {
                    (raisePlanC[year].detailed as any)[key] = 0;
                });
            });

            const rC = runSimulation(targetEmployees, configB, recruitmentPlanB, raisePlanC, customAllowances, impactRatesB);
            
            setSimulationResults({ resultA: rA, resultB: rB, resultC: rC });
            setIsStale(false);
            const end = performance.now();
            console.log(`3-Pattern Simulation took ${end - start}ms`);
        }
    }, [employees, configA, configB, recruitmentPlanA, recruitmentPlanB, raisePlanA, raisePlanB, customAllowances, impactRatesA, impactRatesB]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        // Capture target to reset it later (React events are pooled/nullified)
        const target = e.target;

        setIsLoading(true);
        setLoadingMessage("データを読み込んでいます...");
        setSimulationError(null);

        // Allow UI to update loading state
        setTimeout(async () => {
            try {
                const buffer = await file.arrayBuffer();
                const parsedEmployees = await parseEmployeeData(buffer, file.name);
                
                // Set employees state
                setEmployees(parsedEmployees);
                setIsStale(true);
            } catch (err: any) {
                console.error("File Upload Error:", err);
                setSimulationError(`ファイル読み込み中にエラーが発生しました: ${err.message || String(err)}`);
            } finally {
                setIsLoading(false);
                // Reset file input to allow selecting the same file again
                if (target) {
                    try {
                        target.value = '';
                    } catch (e) {
                        // Ignore errors during reset
                    }
                }
            }
        }, 100);
    };

    const handleClearData = () => {
        if (window.confirm('データを削除して初期画面に戻りますか？')) {
            setEmployees([]);
            setIsStale(true);
            setSimulationResults({ resultA: null, resultB: null, resultC: null });
            setSimulationError(null);
            return true;
        }
        return false;
    };

    const handleResetParameters = () => {
        // Reset to initial states defined in utils/initialState.ts
        setRaisePlanA(createDefaultRaisePlan(true));
        setRaisePlanB(createDefaultRaisePlan(false));
        setRecruitmentPlanA(createDefaultRecruitmentPlan());
        setRecruitmentPlanB(createDefaultRecruitmentPlan());
        setImpactRatesA(createDefaultImpactRates());
        setImpactRatesB(createDefaultImpactRates());
        setCustomAllowances([]);
        setFinancialData(createDefaultFinancialPlan());
        setConfigA(createConfigA());
        setConfigB(createConfigB());
        
        // Also reset shared costs
        setSharedRecruitCost(450000);
        setSharedTrainingCost(400000);
        setSharedLicenseCost(400000);
        setSharedSafetyValue(100000);

        // FIX: Ensure results are cleared so the UI reflects the reset
        setSimulationResults({ resultA: null, resultB: null, resultC: null });
        setSimulationError(null);

        setIsStale(true);
    };

    // Bulk Load Data (For Adventure Log)
    const loadAllData = (data: any) => {
        try {
            if (data.raisePlanA) setRaisePlanA(data.raisePlanA);
            if (data.raisePlanB) setRaisePlanB(data.raisePlanB);
            if (data.recruitmentPlanA) setRecruitmentPlanA(data.recruitmentPlanA);
            if (data.recruitmentPlanB) setRecruitmentPlanB(data.recruitmentPlanB);
            if (data.impactRatesA) setImpactRatesA(data.impactRatesA);
            if (data.impactRatesB) setImpactRatesB(data.impactRatesB);
            if (data.customAllowances) setCustomAllowances(data.customAllowances);
            if (data.financialData) setFinancialData(data.financialData);
            if (data.configA) setConfigA(data.configA);
            if (data.configB) setConfigB(data.configB);
            if (data.negotiationMaterials) setNegotiationMaterials(data.negotiationMaterials);
            
            // Shared costs
            if (data.sharedRecruitCost !== undefined) setSharedRecruitCost(data.sharedRecruitCost);
            if (data.sharedTrainingCost !== undefined) setSharedTrainingCost(data.sharedTrainingCost);
            if (data.sharedLicenseCost !== undefined) setSharedLicenseCost(data.sharedLicenseCost);
            if (data.sharedSafetyValue !== undefined) setSharedSafetyValue(data.sharedSafetyValue);

            setIsStale(true);
            return true;
        } catch (e) {
            console.error("Failed to load data", e);
            return false;
        }
    };

    // Update Helpers (rest is same)
    const handleConfigRootChange = (pattern: 'A' | 'B', field: keyof SimulationConfig, value: any) => {
        (pattern === 'A' ? setConfigA : setConfigB)(prev => ({ ...prev, [field]: value }));
    };

    const handleEmploymentConfigChange = (pattern: 'A' | 'B', type: string, field: string, subField: string | null, value: any) => {
        (pattern === 'A' ? setConfigA : setConfigB)(prev => {
            const newSettings = { ...prev.employmentSettings };
            newSettings[type] = JSON.parse(JSON.stringify(newSettings[type]));
            if (subField) {
                if (subField.includes('.')) {
                    const parts = subField.split('.');
                    let current = (newSettings[type] as any)[field];
                    for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
                    current[parts[parts.length - 1]] = value;
                } else { (newSettings[type] as any)[field][subField] = value; }
            } else { (newSettings[type] as any)[field] = value; }
            return { ...prev, employmentSettings: newSettings };
        });
    };

    const handleRaisePlanChange = (pattern: 'A' | 'B', year: number, field: string, value: any) => {
        (pattern === 'A' ? setRaisePlanA : setRaisePlanB)(prev => {
            const next = { ...prev };
            const nextYear = { ...prev[year], detailed: { ...prev[year].detailed } };
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                (nextYear as any)[parent][child] = value;
            } else { (nextYear as any)[field] = value; }
            next[year] = nextYear;
            return next;
        });
    };

    // NEW: Handle Full Year Update (for bulk calculations or reset)
    const handleYearRaiseUpdate = (pattern: 'A' | 'B', year: number, newYearPlan: RaisePlanYear) => {
        (pattern === 'A' ? setRaisePlanA : setRaisePlanB)(prev => {
            const next = { ...prev };
            next[year] = newYearPlan;
            return next;
        });
    };

    const handleBatchRaiseChange = (pattern: 'A' | 'B', field: string, value: number) => {
        const createUpdatedPlan = (prevPlan: Record<number, RaisePlanYear>) => {
            const buffer = JSON.parse(JSON.stringify(prevPlan)); 
            Object.keys(buffer).forEach(key => {
                const year = parseInt(key);
                if (year >= 2026 && year <= 2035) {
                    if (field === 'averageAmount') {
                        buffer[year].averageAmount = value;
                        const det = buffer[year].detailed;
                        // Propagate average to all specific fields
                        for(const k in det) {
                            if(typeof det[k] === 'number') det[k] = value;
                        }
                    } else if (field.includes('.')) {
                        const [parent, child] = field.split('.');
                        if (parent === 'detailed') {
                            (buffer[year].detailed as any)[child] = value;
                        }
                    } else { 
                        (buffer[year] as any)[field] = value; 
                    }
                }
            });
            return buffer;
        };

        (pattern === 'A' ? setRaisePlanA : setRaisePlanB)(prev => createUpdatedPlan(prev));
    };

    const handleBulkRaiseUpdate = (pattern: 'A' | 'B', updates: { averageAmount?: number, yearlyRaise?: number }) => {
        const createUpdatedPlan = (prevPlan: Record<number, RaisePlanYear>) => {
            const buffer = JSON.parse(JSON.stringify(prevPlan)); 
            Object.keys(buffer).forEach(key => {
                const year = parseInt(key);
                if (year >= 2026 && year <= 2035) {
                    if (updates.averageAmount !== undefined) {
                        const val = updates.averageAmount;
                        buffer[year].averageAmount = val;
                        const det = buffer[year].detailed;
                        for(const k in det) {
                            if(typeof det[k as keyof typeof det] === 'number') {
                                (det as any)[k] = val;
                            }
                        }
                    }
                    if (updates.yearlyRaise !== undefined) {
                        buffer[year].yearlyRaise = updates.yearlyRaise;
                    }
                }
            });
            return buffer;
        };

        (pattern === 'A' ? setRaisePlanA : setRaisePlanB)(prev => createUpdatedPlan(prev));
    };

    const handleRecruitmentChange = (pattern: 'A' | 'B', year: number, field: string, value: any) => {
        (pattern === 'A' ? setRecruitmentPlanA : setRecruitmentPlanB)(prev => {
            const newState = { ...prev };
            newState[year] = { ...newState[year], [field]: value };
            return newState;
        });
    };

    const handleImpactRateChange = (pattern: 'A' | 'B', year: number, field: keyof ImpactRateYear, value: any) => {
        (pattern === 'A' ? setImpactRatesA : setImpactRatesB)(prev => {
            const newState = { ...prev };
            newState[year] = { ...newState[year], [field]: value };
            return newState;
        });
    };

    const handleFinancialPlanChange = (year: number, category: 'revenue'|'expense'|'profit'|'meta'|'details', field: string, value: any) => {
        setFinancialData(prev => prev.map(p => {
            if (p.year !== year) return p;
            const updated = { ...p };
            
            if (category === 'meta') {
                if (field === 'checked') updated.checked = value;
            } else if (category === 'details') {
                updated.details = { ...updated.details, [field]: value };
                const d = updated.details;
                updated.revenue.other = (d.unsou_zatsu || 0) + (d.chintai || 0) + 0; 
                updated.expense.personnel = (d.kyuryo||0) + (d.teate||0) + (d.shoyo||0) + (d.taishoku||0) + (d.houteifukuri||0) + (d.kouseifukuri||0) + (d.sonota_jinken||0);
                updated.expense.material = (d.nenryo||0) + (d.sonota_bukken||0) + (d.gyomu||0);
                const totalRev = updated.revenue.shared + updated.revenue.charter + updated.revenue.contract + updated.revenue.other;
                const totalExp = updated.expense.personnel + updated.expense.material + updated.expense.taxes + updated.expense.depreciation;
                const opProfit = totalRev - totalExp;
                updated.profit.ordinary = opProfit + (d.eigyo_gai_rev||0) - (d.eigyo_gai_exp||0);
                const preTax = updated.profit.ordinary + (d.tokubetsu_rev||0) - (d.tokubetsu_exp||0);
                updated.profit.net = preTax - (d.houjinzei||0) - (d.houjinzei_adj||0);
            } else if (category === 'profit') {
                (updated.profit as any)[field] = value;
            } else {
                (updated as any)[category][field] = value;
            }
            return updated;
        }));
    };

    const applyAiProposal = (proposal: AiProposal) => {
        const isA = proposal.targetPattern === 'A';
        const setConfig = isA ? setConfigA : setConfigB;
        const setRaise = isA ? setRaisePlanA : setRaisePlanB;
        const setRecruitment = isA ? setRecruitmentPlanA : setRecruitmentPlanB;
        const setImpact = isA ? setImpactRatesA : setImpactRatesB;

        if (proposal.config) {
            setConfig(prev => ({ ...prev, ...proposal.config }));
        }

        if (proposal.employmentSettingsUpdate) {
            setConfig(prev => {
                const newSettings = { ...prev.employmentSettings };
                proposal.employmentSettingsUpdate!.forEach(update => {
                    const target = update.targetStatus;
                    if (newSettings[target]) {
                        const targetSettings = newSettings[target];
                        const updateSettings = update.settings;
                        
                        const mergedAllowanceAmounts = { ...targetSettings.allowanceAmounts };
                        if (updateSettings.allowanceAmounts) {
                            if (updateSettings.allowanceAmounts.family) mergedAllowanceAmounts.family = { ...mergedAllowanceAmounts.family, ...updateSettings.allowanceAmounts.family };
                            if (updateSettings.allowanceAmounts.manager) mergedAllowanceAmounts.manager = { ...mergedAllowanceAmounts.manager, ...updateSettings.allowanceAmounts.manager };
                            if (updateSettings.allowanceAmounts.work) mergedAllowanceAmounts.work = { ...mergedAllowanceAmounts.work, ...updateSettings.allowanceAmounts.work };
                            if (updateSettings.allowanceAmounts.childEdu !== undefined) mergedAllowanceAmounts.childEdu = updateSettings.allowanceAmounts.childEdu;
                            if (updateSettings.allowanceAmounts.instructor !== undefined) mergedAllowanceAmounts.instructor = updateSettings.allowanceAmounts.instructor;
                        }

                        newSettings[target] = { 
                            ...targetSettings, 
                            ...updateSettings,
                            bonusMonths: { ...targetSettings.bonusMonths, ...updateSettings.bonusMonths },
                            allowances: { ...targetSettings.allowances, ...updateSettings.allowances },
                            housingAid: { ...targetSettings.housingAid, ...updateSettings.housingAid },
                            allowanceAmounts: mergedAllowanceAmounts
                        };
                    }
                });
                return { ...prev, employmentSettings: newSettings };
            });
        }

        if (proposal.raisePlan) {
            setRaise(prev => {
                const next = { ...prev };
                Object.entries(proposal.raisePlan!).forEach(([yearStr, p]) => {
                    const y = parseInt(yearStr);
                    if (next[y]) {
                        next[y] = { ...next[y], ...p };
                        if (p.detailed) next[y].detailed = { ...next[y].detailed, ...p.detailed };
                        if (p.averageAmount !== undefined) {
                            // Propagate avg if detailed is not fully specified
                            const avg = p.averageAmount;
                            const det = next[y].detailed;
                            for(const k in det) {
                                if((p.detailed as any)?.[k] === undefined && typeof (det as any)[k] === 'number') {
                                    (det as any)[k] = avg;
                                }
                            }
                        }
                    }
                });
                return next;
            });
        }

        if (proposal.recruitmentPlan) {
            setRecruitment(prev => {
                const next = { ...prev };
                Object.entries(proposal.recruitmentPlan!).forEach(([yearStr, p]) => {
                    const y = parseInt(yearStr);
                    if (next[y]) next[y] = { ...next[y], ...p };
                });
                return next;
            });
        }

        if (proposal.impactRates) {
            setImpact(prev => {
                const next = { ...prev };
                Object.entries(proposal.impactRates!).forEach(([yearStr, p]) => {
                    const y = parseInt(yearStr);
                    if (next[y]) next[y] = { ...next[y], ...p };
                });
                return next;
            });
        }

        if (proposal.customAllowances) {
            setCustomAllowances(proposal.customAllowances);
        }
    };

    return {
        // State
        employees, isStale, isLoading, loadingMessage, simulationError, simulationResults,
        configA, configB, raisePlanA, raisePlanB, recruitmentPlanA, recruitmentPlanB,
        impactRatesA, impactRatesB, customAllowances, financialData,
        negotiationMaterials, companyPersonas, unionPersonas,
        
        // Shared State
        sharedRecruitCost, setSharedRecruitCost,
        sharedTrainingCost, setSharedTrainingCost,
        sharedLicenseCost, setSharedLicenseCost,
        sharedSafetyValue, setSharedSafetyValue,

        // Setters
        setEmployees, setCustomAllowances, setNegotiationMaterials, 
        setCompanyPersonas, setUnionPersonas, setConfigA, setConfigB,
        setFinancialData,
        setSimulationError,
        setRaisePlanA, setRaisePlanB,

        // Handlers
        runCalculation,
        handleFileUpload,
        handleClearData,
        handleResetParameters, // Exported for Reset View
        loadAllData, // Exported for Adventure Log Import
        handleConfigRootChange,
        handleEmploymentConfigChange,
        handleRaisePlanChange,
        handleYearRaiseUpdate,
        handleBatchRaiseChange, 
        handleBulkRaiseUpdate,
        handleRecruitmentChange,
        handleImpactRateChange,
        handleFinancialPlanChange,
        applyAiProposal
    };
};
