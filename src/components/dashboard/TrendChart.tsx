
import React, { useMemo } from 'react';
import { DatabaseIcon } from '../Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SimulationResult } from '../../types';
import { TableToolbar } from '../TableToolbar';

interface TrendChartProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    employeeCount: number;
    onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({ resultA, resultB, resultC, employeeCount, onFileUpload }) => {
    
    const processedData = useMemo(() => {
        if (!resultA?.summary?.length) return [];
        
        return resultA.summary.map((rA, i) => {
            const rB = resultB.summary?.[i];
            const rC = resultC.summary?.[i];
            
            const totalA = Math.round(rA.totalCost / 1000); // A案総額 (千円)
            const totalB = rB ? Math.round(rB.totalCost / 1000) : 0; // B案総額 (千円)
            const totalC = rC ? Math.round(rC.totalCost / 1000) : 0; // C案総額 (千円)

            return { 
                year: rA.year,
                totalA: totalA,
                totalB: totalB,
                totalC: totalC,
                diff_A_B: totalA - totalB, // 制度変更要因
                diff_B_C: totalB - totalC  // 賃上げ要因
            };
        });
    }, [resultA, resultB, resultC]);

    const exportData = useMemo(() => {
        return processedData.map(d => {
            return {
                '年度': d.year,
                'A案(定年延長+ベア)(千円)': d.totalA,
                'B案(ベア・定昇のみ)(千円)': d.totalB,
                'C案(昇給停止)(千円)': d.totalC,
                '差額 A-B (制度変更要因)': d.diff_A_B,
                '差額 B-C (賃上げ要因)': d.diff_B_C,
            };
        });
    }, [processedData]);

    const formatKiloYen = (val: number) => (val || 0).toLocaleString();

    // Calculate Y-Axis domain to highlight differences
    const minValue = useMemo(() => {
        if (processedData.length === 0) return 0;
        return Math.min(
            ...processedData.map(d => Math.min(d.totalA, d.totalB, d.totalC))
        );
    }, [processedData]);

    const yAxisDomain = useMemo(() => {
        // Set min domain to 95% of the lowest value to show the tops of the bars clearly
        return [Math.floor(minValue * 0.95), 'auto'];
    }, [minValue]);

    if (employeeCount === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 min-h-[300px] transition-colors">
                <DatabaseIcon />
                <p className="text-gray-500 dark:text-gray-400 font-bold mb-2 mt-4">データが読み込まれていません</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">「データ読込」タブからCSVファイルをインポートしてください。</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 flex flex-col h-full transition-colors">
            <TableToolbar 
                title="人件費推移 3案比較シミュレーション (単位：千円)" 
                data={exportData} 
                filename="personnel_cost_trends"
            />
            <div className="flex flex-col gap-4 flex-1">
                {/* Graph: Reduced height from min-h-[400px] to h-[280px] */}
                <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b5563" strokeOpacity={0.3} />
                            <XAxis dataKey="year" tick={{fontSize: 11, fill: '#9ca3af'}} />
                            <YAxis 
                                tickFormatter={v => `${(v/1000).toFixed(0)}M`} 
                                tick={{fontSize: 11, fill: '#9ca3af'}} 
                                domain={yAxisDomain as any} 
                            />
                            <Tooltip 
                                formatter={(val: number) => `${val.toLocaleString()}千円`}
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                itemStyle={{ color: '#e5e7eb' }}
                            />
                            <Legend iconSize={10} wrapperStyle={{fontSize: '11px', color: '#9ca3af'}} />
                            
                            <Bar dataKey="totalA" name="A案 (定年延長＋ベア・定昇)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="totalB" name="B案 (ベア・定昇)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="totalC" name="C案 (昇給停止)" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-auto border dark:border-gray-700 rounded-lg shadow-inner bg-gray-50/50 dark:bg-gray-900/50 max-h-[200px]">
                    <table className="w-full text-xs text-right border-collapse whitespace-nowrap">
                        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 text-gray-700 dark:text-gray-200">
                            <tr>
                                <th className="border dark:border-gray-600 p-2 text-center font-bold">年度</th>
                                <th className="border dark:border-gray-600 p-2 text-red-700 dark:text-red-300">A案<br/>(定年延長)</th>
                                <th className="border dark:border-gray-600 p-2 text-blue-700 dark:text-blue-300">B案<br/>(賃上のみ)</th>
                                <th className="border dark:border-gray-600 p-2 text-gray-700 dark:text-gray-300">C案<br/>(昇給停止)</th>
                                <th className="border dark:border-gray-600 p-2 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-100 font-bold">差額 (A-B)<br/><span className="text-[9px] font-normal">(制度要因)</span></th>
                                <th className="border dark:border-gray-600 p-2 bg-green-100 dark:bg-green-900/40 dark:text-green-100 font-bold">差額 (B-C)<br/><span className="text-[9px] font-normal">(賃上要因)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map(d => (
                                <tr key={d.year} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="border dark:border-gray-700 p-2 font-bold text-center dark:text-gray-300">{d.year}</td>
                                    <td className="border dark:border-gray-700 p-2 font-mono font-bold text-red-700 dark:text-red-400">{formatKiloYen(d.totalA)}</td>
                                    <td className="border dark:border-gray-700 p-2 font-mono font-bold text-blue-700 dark:text-blue-400">{formatKiloYen(d.totalB)}</td>
                                    <td className="border dark:border-gray-700 p-2 font-mono text-gray-700 dark:text-gray-400">{formatKiloYen(d.totalC)}</td>
                                    <td className={`border dark:border-gray-700 p-2 font-mono font-bold bg-yellow-50/50 dark:bg-yellow-900/20 ${d.diff_A_B > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {(d.diff_A_B > 0 ? '+' : '') + formatKiloYen(d.diff_A_B)}
                                    </td>
                                    <td className={`border dark:border-gray-700 p-2 font-mono font-bold bg-green-50/50 dark:bg-green-900/20 ${d.diff_B_C > 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {(d.diff_B_C > 0 ? '+' : '') + formatKiloYen(d.diff_B_C)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
