
import React, { useMemo } from 'react';
import { SimulationResult, Employee } from '../../types';
import { DateUtils } from '../../utils/simulationLogic';
import { CheckIcon } from '../Icons';

interface KpiCardsProps {
    employees: Employee[];
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    onNavigate: (id: string) => void;
}

const formatVal = (val: any) => {
    if (typeof val === 'number') return val.toLocaleString();
    return val;
};

const KpiTable: React.FC<{ title: string; data: any[]; unit: string }> = ({ title, data, unit }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 text-base">{title}</h4>
        <table className="w-full text-sm">
            <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400">
                    <th className="text-left font-semibold py-1">シナリオ</th>
                    <th className="text-right font-semibold py-1">初期値</th>
                    <th className="text-right font-semibold py-1">2026</th>
                    <th className="text-right font-semibold py-1">2028</th>
                    <th className="text-right font-semibold py-1">2030</th>
                </tr>
            </thead>
            <tbody>
                {data.map(d => (
                    <tr key={d.plan} className={`border-t dark:border-gray-700 font-bold ${d.color}`}>
                        <td className="py-2">{d.plan}</td>
                        <td className="py-2 text-right font-mono text-gray-600 dark:text-gray-300">{formatVal(d.initial)}{unit}</td>
                        <td className="py-2 text-right font-mono">{formatVal(d.y2026)}{unit}</td>
                        <td className="py-2 text-right font-mono">{formatVal(d.y2028)}{unit}</td>
                        <td className="py-2 text-right font-mono">{formatVal(d.y2030)}{unit}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const KpiCards: React.FC<KpiCardsProps> = ({ employees, resultA, resultB, resultC, onNavigate }) => {
    
    const kpiData = useMemo(() => {
        // Defensive check to prevent crash if employees is undefined
        if (!employees) return null;

        const plans = [
            { label: 'A案', result: resultA, color: 'text-red-600 dark:text-red-400' },
            { label: 'B案', result: resultB, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'C案', result: resultC, color: 'text-gray-600 dark:text-gray-400' },
        ];
        
        // Calculate Initial Values once
        const now = new Date();
        const initialHeadcount = employees.length;
        const initialTotalAge = employees.reduce((sum, e) => sum + DateUtils.getAge(e.birthDate, now), 0);
        const initialTotalTenure = employees.reduce((sum, e) => sum + DateUtils.getTenure(e.hireDate, now), 0);
        const initialSeniorCount = employees.filter(e => DateUtils.getAge(e.birthDate, now) >= 60).length;

        const initialValues = {
            headcount: initialHeadcount,
            avgAge: initialHeadcount > 0 ? (initialTotalAge / initialHeadcount) : 0,
            avgTenure: initialHeadcount > 0 ? (initialTotalTenure / initialHeadcount) : 0,
            seniorRate: initialHeadcount > 0 ? (initialSeniorCount / initialHeadcount * 100) : 0,
        };

        const processed = plans.map(p => {
            const getYearValue = (year: number, key: 'headcount' | 'avgAge' | 'avgTenure' | 'seniorRate') => {
                const summary = p.result?.summary?.find(s => s.year === year);
                if (!summary) return '-';
                
                if (key === 'headcount') return summary.activeCount;
                if (key === 'avgAge') return summary.avgAge.toFixed(1);
                if (key === 'avgTenure') return summary.avgTenure.toFixed(1);
                if (key === 'seniorRate') {
                    const seniorCount = p.result.individuals
                        .filter(i => i.year === year && DateUtils.getAge(new Date(i.birthDate), new Date(year, 11, 31)) >= 60)
                        .length;
                    return summary.activeCount > 0 ? ((seniorCount / summary.activeCount) * 100).toFixed(1) : '0.0';
                }
                return '-';
            };

            return {
                plan: p.label,
                color: p.color,
                headcount: { initial: initialValues.headcount, y2026: getYearValue(2026, 'headcount'), y2028: getYearValue(2028, 'headcount'), y2030: getYearValue(2030, 'headcount') },
                avgAge: { initial: initialValues.avgAge.toFixed(1), y2026: getYearValue(2026, 'avgAge'), y2028: getYearValue(2028, 'avgAge'), y2030: getYearValue(2030, 'avgAge') },
                avgTenure: { initial: initialValues.avgTenure.toFixed(1), y2026: getYearValue(2026, 'avgTenure'), y2028: getYearValue(2028, 'avgTenure'), y2030: getYearValue(2030, 'avgTenure') },
                seniorRate: { initial: initialValues.seniorRate.toFixed(1), y2026: getYearValue(2026, 'seniorRate'), y2028: getYearValue(2028, 'seniorRate'), y2030: getYearValue(2030, 'seniorRate') },
            };
        });

        return {
            headcount: processed.map(d => ({ plan: d.plan, color: d.color, ...d.headcount })),
            avgAge: processed.map(d => ({ plan: d.plan, color: d.color, ...d.avgAge })),
            avgTenure: processed.map(d => ({ plan: d.plan, color: d.color, ...d.avgTenure })),
            seniorRate: processed.map(d => ({ plan: d.plan, color: d.color, ...d.seniorRate })),
        };
    }, [employees, resultA, resultB, resultC]);
    
    if (!employees || employees.length === 0 || !kpiData) {
         return null; // Don't show anything if no data
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg">主要KPI 比較サマリー</h3>
                <button 
                    onClick={() => onNavigate('verification')}
                    className="flex items-center gap-2 text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors animate-pulse"
                >
                    <CheckIcon style={{width: 14, height: 14}}/> 詳細な数値検証へ移動
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <KpiTable title="① 従業員総数" data={kpiData.headcount} unit="名" />
                <KpiTable title="② 平均年齢" data={kpiData.avgAge} unit="歳" />
                <KpiTable title="③ 平均勤続年数" data={kpiData.avgTenure} unit="年" />
                <KpiTable title="④ 60歳以上率" data={kpiData.seniorRate} unit="%" />
            </div>
        </div>
    );
};
