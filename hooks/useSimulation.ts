
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
    
    // --- UI/Calc State ---
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [simulationError, setSimulationError] = useState<string | null>(null);
    const [simulationResults, setSimulationResults] = useState<{ resultA: SimulationResult | null, resultB: SimulationResult | null, resultC: SimulationResult | null }>({ resultA: null, resultB: null, resultC: null });

    // --- Negotiation State ---
    const [negotiationMaterials, setNegotiationMaterials] = useState<string>(`労使協議会議題
１．２０２５年度決算見込み（会社側）
２．２０２６年度予算（会社側）
３．定年延長協議（組合側）
４．運転士不足対策（組合側）
５．運転士新規採用計画（会社側）
６．改善基準告示対応（組合側）
７．新規手当提案（組合側）
８．春闘要求（ベア、賞与支給月数、期末一時金他）（組合側）
９．その他（会社側・組合側）`);
    const [companyPersonas, setCompanyPersonas] = useState<PersonaType[]>(['normal', 'sanae', 'jack']);
    const [unionPersonas, setUnionPersonas] = useState<UnionPersonaType[]>(['kiyomi', 'gonda', 'baigaeshi']);

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
                        if (newPlanB[year].averageAmount !== pA.averageAmount) {
                            newPlanB[year].averageAmount = pA.averageAmount;
                            // Also sync detailed fields for consistency if averageAmount is the driver
                             const detailedFields = Object.keys(newPlanB[year].detailed);
                            detailedFields.forEach(field => {
                                (newPlanB[year].detailed as any)[field] = pA.averageAmount;
                            });
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
                    if (employees.length === 0) {
                        throw new Error("従業員データが読み込まれていません。");
                    }
                    const start = performance.now();
                    
                    // Run A and B
                    const rA = runSimulation(employees, configA, recruitmentPlanA, raisePlanA, customAllowances, impactRatesA);
                    const rB = runSimulation(employees, configB, recruitmentPlanB, raisePlanB, customAllowances, impactRatesB);
                    
                    // Create and Run C (based on B, but with no Base Up AND no Teisho)
                    const raisePlanC = JSON.parse(JSON.stringify(raisePlanB));
                    Object.keys(raisePlanC).forEach(year => {
                        raisePlanC[year].averageAmount = 0;
                        raisePlanC[year].yearlyRaise = 0; // Set Teisho to 0
                        Object.keys(raisePlanC[year].detailed).forEach(key => {
                            (raisePlanC[year].detailed as any)[key] = 0;
                        });
                    });

                    const rC = runSimulation(employees, configB, recruitmentPlanB, raisePlanC, customAllowances, impactRatesB);
                    
                    setSimulationResults({ resultA: rA, resultB: rB, resultC: rC });
                    setIsStale(false);
                    const end = performance.now();
                    console.log(`3-Pattern Simulation took ${end - start}ms`);
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
    }, [employees, configA, configB, recruitmentPlanA, recruitmentPlanB, raisePlanA, raisePlanB, customAllowances, impactRatesA, impactRatesB]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

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
                                
                alert(`${parsedEmployees.length}件のデータを読み込みました。右下の「計算実行」ボタンを押してシミュレーションを開始してください。`);
                
            } catch (err: any) {
                console.error(err);
                setSimulationError(`ファイル読み込み中にエラーが発生しました: ${err.message}`);
            } finally {
                setIsLoading(false);
                // Reset file input if needed is handled by component
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
        handleConfigRootChange,
        handleEmploymentConfigChange,
        handleRaisePlanChange,
        handleBatchRaiseChange, 
        handleBulkRaiseUpdate,
        handleRecruitmentChange,
        handleImpactRateChange,
        handleFinancialPlanChange,
        applyAiProposal
    };
};
