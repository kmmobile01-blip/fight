
import React, { useMemo, useState } from 'react';
import { ChartIcon, UsersIcon } from '../Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SimulationResult, Employee } from '../../types';
import { DateUtils } from '../../utils/simulationLogic';
import { TableToolbar } from '../TableToolbar';

// --- Age Pyramid Chart ---

interface AgePyramidChartProps {
    resultA: SimulationResult;
    initialEmployees: Employee[];
}

export const AgePyramidChart: React.FC<AgePyramidChartProps> = ({ resultA, initialEmployees }) => {
    // Default to 2030 for comparison as requested
    const [comparisonYear, setComparisonYear] = useState<number>(2030);

    const ageData = useMemo(() => {
        const ageGroups = ['~19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70+'];
        
        // Initialize counts
        const initialCounts = Object.fromEntries(ageGroups.map(g => [g, 0]));
        const targetCounts = Object.fromEntries(ageGroups.map(g => [g, 0]));

        // Helper to determine group
        const getGroup = (age: number) => {
            if (age < 20) return '~19';
            if (age < 25) return '20-24';
            if (age < 30) return '25-29';
            if (age < 35) return '30-34';
            if (age < 40) return '35-39';
            if (age < 45) return '40-44';
            if (age < 50) return '45-49';
            if (age < 55) return '50-54';
            if (age < 60) return '55-59';
            if (age < 65) return '60-64';
            if (age < 70) return '65-69';
            return '70+';
        };

        // 1. Calculate Initial Counts (Baseline)
        const initialDate = new Date(); // Use current date for initial
        if (initialEmployees) {
            initialEmployees.forEach(e => {
                const age = DateUtils.getAge(new Date(e.birthDate), initialDate);
                initialCounts[getGroup(age)]++;
            });
        }

        // 2. Calculate Target Year Counts (Simulation A)
        const targetDate = new Date(comparisonYear, 11, 31);
        if (resultA && resultA.individuals) {
            const targetEmployees = resultA.individuals.filter(i => i.year === comparisonYear);
            targetEmployees.forEach(e => {
                // Determine age at the end of the target year
                const age = DateUtils.getAge(new Date(e.birthDate), targetDate);
                targetCounts[getGroup(age)]++;
            });
        }

        // Merge Data
        return ageGroups.map(group => ({
            ageGroup: group,
            initial: initialCounts[group],
            target: targetCounts[group]
        }));
    }, [comparisonYear, initialEmployees, resultA]);
    
    const exportData = ageData.map(d => ({ 
        '年齢層': d.ageGroup, 
        '初期(名)': d.initial, 
        [`${comparisonYear}年度(名)`]: d.target 
    }));

    if (!initialEmployees || initialEmployees.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 h-full flex flex-col transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-lg">
                        <UsersIcon /> 年齢構成ピラミッド (変化比較)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        初期状態(グレー) と 将来予測(オレンジ) の比較
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">比較年度:</span>
                        <select
                            value={comparisonYear}
                            onChange={e => setComparisonYear(Number(e.target.value))}
                            className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 dark:text-white cursor-pointer"
                        >
                            {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(y => (
                                <option key={y} value={y}>{y}年度</option>
                            ))}
                        </select>
                    </div>
                    <TableToolbar 
                        title="" 
                        data={exportData} 
                        filename={`age_pyramid_compare_${comparisonYear}`} 
                    />
                </div>
            </div>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                        <XAxis type="number" tick={{fontSize: 11, fill: '#9ca3af'}} domain={[0, 'auto']} allowDecimals={false} />
                        <YAxis type="category" dataKey="ageGroup" tick={{fontSize: 11, fill: '#9ca3af'}} width={40} />
                        <Tooltip 
                            formatter={(val: number, name: string, props: any) => {
                                return [`${val}名`, props.dataKey === 'initial' ? '初期データ' : `${comparisonYear}年度`];
                            }}
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                            itemStyle={{ color: '#fbbf24' }}
                            cursor={{fill: 'transparent'}}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="initial" name="初期データ" fill="#9ca3af" radius={[0, 4, 4, 0]} barSize={12} />
                        <Bar dataKey="target" name={`${comparisonYear}年度 (A案)`} fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-400 mt-2">
                ※ 5歳区切りの人員分布変化。再雇用・パートも含まれます。
            </div>
        </div>
    );
};
