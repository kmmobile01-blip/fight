import React, { useMemo, useState } from 'react';
import { SimulationResult, Employee, SimulationConfig, RaisePlanYear, CustomAllowance, ImpactRateYear } from '../types';
import { TableToolbar } from './TableToolbar';
import { DateUtils, getNextAppointedDate, calculateFiscalYearDetails } from '../utils/simulationLogic';

interface RetirementExtensionMonthlyProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    employees: Employee[];
    configA: SimulationConfig;
    configB: SimulationConfig;
    raisePlanA: Record<number, RaisePlanYear>;
    raisePlanB: Record<number, RaisePlanYear>;
    customAllowances: CustomAllowance[];
    impactRatesA: Record<number, ImpactRateYear>;
    impactRatesB: Record<number, ImpactRateYear>;
}

export const RetirementExtensionMonthlyView: React.FC<RetirementExtensionMonthlyProps> = ({ 
    resultA, resultB, resultC, employees, configA, configB, raisePlanA, raisePlanB, customAllowances, impactRatesA, impactRatesB 
}) => {
    const [activePattern, setActivePattern] = useState<'A' | 'B' | 'C'>('A');
    
    // Target Years: 2026 - 2030
    const targetYears = [2026, 2027, 2028, 2029, 2030];

    const data = useMemo(() => {
        const rows: any[] = [];
        
        // Select Config & Plans based on Active Pattern
        const currentConfig = activePattern === 'A' ? configA : configB;
        const currentRaisePlan = activePattern === 'A' ? raisePlanA : (activePattern === 'B' ? raisePlanB : {}); // C uses empty (no raise)
        const currentImpactRates = activePattern === 'A' ? impactRatesA : impactRatesB;

        employees.forEach(emp => {
            const birthday60 = DateUtils.addYears(emp.birthDate, 60);
            const retirementDateOld = getNextAppointedDate(birthday60);
            
            // Filter: Extract employees who turn 60 (become Extension) between 2026-04-01 and 2031-03-31
            const periodStart = new Date(2026, 3, 1);
            const periodEnd = new Date(2031, 2, 31);
            
            // Check if 60th birthday falls within the period
            if (!DateUtils.isAfterOrEqual(birthday60, periodStart) || !DateUtils.isBefore(birthday60, periodEnd)) {
                return;
            }

            targetYears.forEach(year => {
                const yearStart = new Date(year, 3, 1);
                const yearEnd = new Date(year + 1, 2, 31);
                
                const birthday65 = DateUtils.addYears(emp.birthDate, 65);
                const retirementDateNew = getNextAppointedDate(birthday65); // A plan max date
                
                // Check if active in this year (After 60, Before 65/NewRetirement)
                // Actually, we should show them even if they are just "Re-employed" in B plan, 
                // but the user asked for "A案で年度末の状況".
                
                const isAfter60 = DateUtils.isAfterOrEqual(yearEnd, retirementDateOld);
                const isBeforeNewRetirement = DateUtils.isBefore(yearStart, retirementDateNew);
                
                if (isAfter60 && isBeforeNewRetirement) {
                    // Calculate Monthly Details for Active Pattern (for amounts)
                    const details = calculateFiscalYearDetails(
                        emp, year, currentConfig, currentRaisePlan, customAllowances, 0, 0, currentImpactRates[year]
                    );

                    // Calculate Status for A Pattern (March) - as requested
                    let statusA_March = '';
                    if (activePattern === 'A') {
                        statusA_March = details.monthlyDetails[11].status;
                    } else {
                        // Recalculate for A to get status
                        const detailsA = calculateFiscalYearDetails(
                            emp, year, configA, raisePlanA, customAllowances, 0, 0, impactRatesA[year]
                        );
                        statusA_March = detailsA.monthlyDetails[11].status;
                    }

                    const monthlyBase = details.monthlyDetails.map(m => m.baseSalary);
                    const totalBase = monthlyBase.reduce((a, b) => a + b, 0);
                    const baseApril = monthlyBase[0];
                    const baseMarch = monthlyBase[11];

                    rows.push({
                        id: emp.id,
                        name: emp.name,
                        year: year,
                        baseApril,
                        baseMarch,
                        retirementDate: retirementDateOld.toLocaleDateString(),
                        retirementDateObj: retirementDateOld, // Added for sorting
                        totalBase,
                        months: monthlyBase,
                        status: statusA_March // A案 年度末ステータス
                    });
                }
            });
        });
        
        return rows.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.retirementDateObj.getTime() - b.retirementDateObj.getTime();
        });
    }, [employees, configA, configB, raisePlanA, raisePlanB, customAllowances, impactRatesA, impactRatesB, activePattern]);

    // Create CSV Data with Japanese headers and flattened months
    const csvData = useMemo(() => {
        return data.map(row => {
            const m = row.months;
            return {
                "年度": row.year,
                "ID": row.id,
                "氏名": row.name,
                "定年退職日": row.retirementDate,
                "4月時点基本給": row.baseApril,
                "3月時点基本給": row.baseMarch,
                "年度基本給合計": row.totalBase,
                "4月": m[0], "5月": m[1], "6月": m[2], "7月": m[3], "8月": m[4], "9月": m[5],
                "10月": m[6], "11月": m[7], "12月": m[8], "1月": m[9], "2月": m[10], "3月": m[11]
            };
        });
    }, [data]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">定年延長者 影響額月割分析 (2026-2030)</h3>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setActivePattern('A')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${activePattern === 'A' ? 'bg-red-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>パターンA</button>
                    <button onClick={() => setActivePattern('B')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${activePattern === 'B' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>パターンB</button>
                    <button onClick={() => setActivePattern('C')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${activePattern === 'C' ? 'bg-gray-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>パターンC</button>
                </div>
            </div>
            
            <TableToolbar title={`定年延長者分析 (${activePattern}案)`} data={csvData} filename={`extension_monthly_${activePattern}`} />
            
            <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-xs text-center border-collapse whitespace-nowrap relative">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="border dark:border-gray-600 p-2">年度</th>
                            <th className="border dark:border-gray-600 p-2">ID</th>
                            <th className="border dark:border-gray-600 p-2 sticky left-0 bg-gray-100 dark:bg-gray-700 z-20">氏名</th>
                            <th className="border dark:border-gray-600 p-2">定年退職日<br/>(旧基準)</th>
                            <th className="border dark:border-gray-600 p-2">4月時点<br/>基本給</th>
                            <th className="border dark:border-gray-600 p-2">3月時点<br/>基本給</th>
                            <th className="border dark:border-gray-600 p-2 bg-blue-50 dark:bg-blue-900/40 font-bold text-blue-800 dark:text-blue-200">年度基本給<br/>合計</th>
                            {[4,5,6,7,8,9,10,11,12,1,2,3].map(m => (
                                <th key={m} className="border dark:border-gray-600 p-2 w-16">{m}月</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="dark:text-gray-300">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="border dark:border-gray-600 p-2 font-bold">{row.year}</td>
                                <td className="border dark:border-gray-600 p-2">{row.id}</td>
                                <td className="border dark:border-gray-600 p-2 text-left sticky left-0 bg-white dark:bg-gray-800 z-10 whitespace-nowrap">
                                    <span className="font-medium">{row.name}</span>
                                </td>
                                <td className="border dark:border-gray-600 p-2">{row.retirementDate}</td>
                                <td className="border dark:border-gray-600 p-2 text-right">{row.baseApril.toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 text-right">{row.baseMarch.toLocaleString()}</td>
                                <td className="border dark:border-gray-600 p-2 text-right font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">{row.totalBase.toLocaleString()}</td>
                                {row.months.map((v: number, idx: number) => (
                                    <td key={idx} className="border dark:border-gray-600 p-2 text-right">{v.toLocaleString()}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
