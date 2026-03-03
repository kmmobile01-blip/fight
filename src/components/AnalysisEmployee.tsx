
import React, { useState, useMemo, useEffect } from 'react';
import { SimulationResult, IndividualResult, Employee } from '../types';
import { TableToolbar } from './TableToolbar';
import { DateUtils } from '../utils/simulationLogic';

// --- IndividualView Removed as requested ---

export const IndividualDetailAView: React.FC<{ resultA: SimulationResult }> = ({ resultA }) => {
    const [selectedYear, setSelectedYear] = useState<number>(
        (resultA && resultA.summary && resultA.summary.length > 0) ? resultA.summary[0].year : 2026
    );
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (resultA && resultA.summary && resultA.summary.length > 0) {
            if (!resultA.summary.find(r => r.year === selectedYear)) {
                setSelectedYear(resultA.summary[0].year);
            }
        }
    }, [resultA]);

    const employees: IndividualResult[] = useMemo(() => {
        if (!resultA || !resultA.individuals) return [];
        return resultA.individuals
            .filter(i => i.year === selectedYear && (i.name.includes(searchTerm) || String(i.id).includes(searchTerm)))
            .sort((a, b) => b.total - a.total);
    }, [resultA, selectedYear, searchTerm]);

    const exportData = employees.map(h => {
        const fixedAllowance = (h.allowance || 0) - (h.allowanceDetail?.variable || 0);
        return {
            "ID": h.id,
            "氏名": h.name,
            "年度": h.year,
            "総支給(社保込)": h.total,
            "総支給(社保除)": h.totalExclSoc,
            "基本給": h.base,
            "賞与(一時金込)": (h.bonus || 0) + (h.lumpSum || 0),
            "固定手当計": fixedAllowance,
            "家族手当": h.allowanceDetail?.family || 0,
            "子女教育手当": h.allowanceDetail?.child || 0,
            "指導手当": h.allowanceDetail?.instructor || 0,
            "管理手当": h.allowanceDetail?.manager || 0,
            "業務手当": h.allowanceDetail?.work || 0,
            "新設手当": h.allowanceDetail?.custom || 0,
            "変動手当": h.allowanceDetail?.variable || 0,
            "社会保険料": h.socialInsurance,
        };
    });

    return (
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <label className="font-bold text-gray-700 dark:text-gray-300">対象年度:</label>
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(parseInt(e.target.value))}
                            className="border dark:border-gray-600 p-2 rounded font-bold text-lg bg-white dark:bg-gray-800 dark:text-gray-100"
                        >
                            {resultA && resultA.summary && resultA.summary.length > 0 ? (
                                resultA.summary.map(r => <option key={r.year} value={r.year}>{r.year}年度</option>)
                            ) : (
                                <option value={2026}>データなし</option>
                            )}
                        </select>
                        <input 
                            type="text" 
                            placeholder="氏名・ID検索..." 
                            className="border dark:border-gray-600 rounded p-2 w-64 bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <TableToolbar 
                        title={`${selectedYear}年度 個人別明細[A案] (${employees.length}名)`} 
                        data={exportData} 
                        filename={`individual_detail_A_${selectedYear}`} 
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-sm text-right border-collapse whitespace-nowrap min-w-max">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 text-center text-xs w-16">ID</th>
                            <th className="border dark:border-gray-600 p-2 text-left text-xs">氏名</th>
                            <th className="border dark:border-gray-600 p-2 text-blue-700 dark:text-blue-300">総支給(込)</th>
                            <th className="border dark:border-gray-600 p-2 text-green-700 dark:text-green-300">総支給(抜)</th>
                            <th className="border dark:border-gray-600 p-2">基本給</th>
                            <th className="border dark:border-gray-600 p-2">賞与(一時金込)</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800">固定手当計</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">家族手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">子女教育</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">指導手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">業務手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">管理手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-800 text-xs">新設手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">変動手当</th>
                            <th className="border dark:border-gray-600 p-2 text-pink-700 dark:text-pink-300">社保(概算)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((h) => {
                             const fixedAllowance = (h.allowance || 0) - (h.allowanceDetail?.variable || 0);
                             const totalBonus = (h.bonus || 0) + (h.lumpSum || 0);
                             return (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 transition-colors">
                                    <td className="p-2 text-center text-gray-500 dark:text-gray-400">{h.id}</td>
                                    <td className="p-2 text-left font-medium dark:text-gray-200">{h.name}</td>
                                    <td className="p-2 font-bold text-blue-700 dark:text-blue-400">{(h.total || 0).toLocaleString()}</td>
                                    <td className="p-2 font-bold text-green-700 dark:text-green-400">{(h.totalExclSoc || 0).toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{(h.base || 0).toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{(totalBonus || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50 dark:bg-gray-800 relative group cursor-help underline decoration-dotted dark:text-gray-300">
                                        {(fixedAllowance || 0).toLocaleString()}
                                        <div className="absolute hidden group-hover:block bg-black text-white text-xs p-2 rounded z-20 top-full right-0 min-w-[150px] text-left shadow-lg">
                                            家族: {(h.allowanceDetail?.family || 0).toLocaleString()}<br/>
                                            教育: {(h.allowanceDetail?.child || 0).toLocaleString()}<br/>
                                            指導: {(h.allowanceDetail?.instructor || 0).toLocaleString()}<br/>
                                            管理: {(h.allowanceDetail?.manager || 0).toLocaleString()}<br/>
                                            業務: {(h.allowanceDetail?.work || 0).toLocaleString()}<br/>
                                            新設: {(h.allowanceDetail?.custom || 0).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.family || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.child || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.instructor || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.work || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.manager || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-gray-50/50 dark:bg-gray-800/50 dark:text-gray-400 text-xs">{(h.allowanceDetail?.custom || 0).toLocaleString()}</td>
                                    <td className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 font-bold">{(h.allowanceDetail?.variable || 0).toLocaleString()}</td>
                                    <td className="p-2 text-pink-700 dark:text-pink-400">{(h.socialInsurance || 0).toLocaleString()}</td>
                                </tr>
                             );
                        })}
                    </tbody>
                </table>
                {employees.length === 0 && (
                    <div className="text-center p-10 text-gray-400 dark:text-gray-500">
                        該当するデータがありません。計算が実行されているか確認してください。
                    </div>
                )}
            </div>
        </div>
    );
};

export const IndividualDetailMasterView: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEmployees = useMemo(() => {
        return employees.filter(e => 
            e.name.includes(searchTerm) || String(e.id).includes(searchTerm)
        ).sort((a, b) => (b.baseSalary || 0) - (a.baseSalary || 0));
    }, [employees, searchTerm]);

    const exportData = filteredEmployees.map(e => ({
        "ID": e.id,
        "氏名": e.name,
        "雇用区分": e.employmentType,
        "基本給": e.baseSalary,
        "家族手当": e.familyAllowance,
        "子女教育": e.childEduAllowance,
        "指導手当": e.instructorAllowance,
        "業務手当": e.workAllowance,
        "管理手当": e.managerAllowance,
        "入社日": new Date(e.hireDate).toLocaleDateString(),
        "生年月日": new Date(e.birthDate).toLocaleDateString(),
    }));

    return (
        <div className="flex flex-col h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">初期マスタデータ (読込値)</span>
                        <input 
                            type="text" 
                            placeholder="氏名・ID検索..." 
                            className="border dark:border-gray-600 rounded p-2 w-64 bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <TableToolbar 
                        title={`初期マスタ明細 (${filteredEmployees.length}名)`} 
                        data={exportData} 
                        filename="individual_detail_master_initial" 
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-sm text-right border-collapse whitespace-nowrap min-w-max">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="border dark:border-gray-600 p-2 text-center text-xs w-16">ID</th>
                            <th className="border dark:border-gray-600 p-2 text-left text-xs">氏名</th>
                            <th className="border dark:border-gray-600 p-2 text-center text-xs">雇用区分</th>
                            <th className="border dark:border-gray-600 p-2 text-blue-700 dark:text-blue-300">基本給</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">家族手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">子女教育</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">指導手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">業務手当</th>
                            <th className="border dark:border-gray-600 p-2 bg-orange-50 dark:bg-orange-900/30 text-xs">管理手当</th>
                            <th className="border dark:border-gray-600 p-2 text-gray-500 dark:text-gray-400 text-xs text-center">入社日</th>
                            <th className="border dark:border-gray-600 p-2 text-gray-500 dark:text-gray-400 text-xs text-center">生年月日</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 transition-colors">
                                <td className="p-2 text-center text-gray-500 dark:text-gray-400">{e.id}</td>
                                <td className="p-2 text-left font-medium dark:text-gray-200">{e.name}</td>
                                <td className="p-2 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        e.employmentType.includes('正社員') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' :
                                        e.employmentType.includes('管理職') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {e.employmentType}
                                    </span>
                                </td>
                                <td className="p-2 font-bold text-blue-700 dark:text-blue-300">{(e.baseSalary || 0).toLocaleString()}</td>
                                <td className="p-2 dark:text-gray-300">{(e.familyAllowance || 0).toLocaleString()}</td>
                                <td className="p-2 dark:text-gray-300">{(e.childEduAllowance || 0).toLocaleString()}</td>
                                <td className="p-2 dark:text-gray-300">{(e.instructorAllowance || 0).toLocaleString()}</td>
                                <td className="p-2 dark:text-gray-300">{(e.workAllowance || 0).toLocaleString()}</td>
                                <td className="p-2 dark:text-gray-300">{(e.managerAllowance || 0).toLocaleString()}</td>
                                <td className="p-2 text-center text-gray-500 dark:text-gray-400">{new Date(e.hireDate).toLocaleDateString()}</td>
                                <td className="p-2 text-center text-gray-500 dark:text-gray-400">{new Date(e.birthDate).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredEmployees.length === 0 && (
                    <div className="text-center p-10 text-gray-400 dark:text-gray-500">
                        データがありません。ファイルを読み込んでください。
                    </div>
                )}
            </div>
        </div>
    );
};

export const EmployeeListView: React.FC<{ resultA: SimulationResult; initialEmployees: Employee[]; voiceEnabled: boolean }> = ({ resultA, initialEmployees, voiceEnabled }) => {
    const [selectedYear, setSelectedYear] = useState<number | 'initial'>('initial');
    
    useEffect(() => {
        if (!voiceEnabled) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("通勤手当増額");
        u.lang = 'ja-JP';
        // Updated to match VerificationView
        u.pitch = 0.9;
        u.rate = 1.1; 
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja')) ||
                               voices.find(v => v.name.includes('Microsoft') && v.lang.includes('ja')) ||
                               voices.find(v => v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [voiceEnabled]);

    const employeesToDisplay = useMemo(() => {
        let list;
        let targetDate: Date;

        if (selectedYear === 'initial') {
            // Initial Data View
            targetDate = new Date(); // Use current date for "Initial" snapshot logic
            list = initialEmployees.map(e => ({
                id: e.id,
                name: e.name,
                type: e.employmentType,
                monthlyBase: e.baseSalary,
                hireDate: e.hireDate,
                birthDate: e.birthDate,
                age: DateUtils.getAge(e.birthDate, targetDate),
                tenure: DateUtils.getTenure(e.hireDate, targetDate),
            }));
        } else {
            // Simulated Year End View
            targetDate = new Date(selectedYear + 1, 2, 31);
            if (!resultA || !resultA.individuals) {
                return [];
            }
            list = resultA.individuals
                .filter(i => i.year === selectedYear && i.type !== '退職' && i.type !== '入社前')
                .map(simulated => {
                    return {
                        id: simulated.id,
                        name: simulated.name,
                        type: simulated.type,
                        monthlyBase: simulated.finalBase, // Use final base salary from simulation (not annual sum)
                        hireDate: simulated.hireDate,
                        birthDate: new Date(simulated.birthDate),
                        age: DateUtils.getAge(new Date(simulated.birthDate), targetDate),
                        tenure: DateUtils.getTenure(new Date(simulated.hireDate), targetDate),
                    };
                });
        }
        // Sort by ID ASC
        return (list as any[]).sort((a, b) => (a.id || 0) - (b.id || 0));
    }, [resultA, initialEmployees, selectedYear]);
    
    const exportData = employeesToDisplay.map(e => ({
        "ID": e.id,
        "氏名": e.name,
        "雇用区分": e.type,
        "生年月日": new Date(e.birthDate).toLocaleDateString(),
        "入社年月日": new Date(e.hireDate).toLocaleDateString(),
        "基本給": e.monthlyBase,
        "年齢": e.age,
        "勤続年数": e.tenure,
        "基準年月": selectedYear === 'initial' ? '初期データ' : `${selectedYear}年度末`
    }));

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col h-[80vh] transition-colors">
            <div className="p-4 border-b dark:border-gray-700 flex flex-col gap-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-sm ${selectedYear === 'initial' ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {selectedYear === 'initial' ? '初期データ(読込時)' : `${selectedYear}年度末時点`}
                        </span>
                        社員名簿 (ID順)
                    </h3>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400">表示対象:</label>
                        <select 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(e.target.value === 'initial' ? 'initial' : parseInt(e.target.value))}
                            className="border dark:border-gray-600 p-1 rounded font-bold bg-white dark:bg-gray-800 dark:text-gray-200"
                        >
                            <option value="initial">初期データ (読込時)</option>
                            {resultA && resultA.summary && resultA.summary.map(r => <option key={r.year} value={r.year}>{r.year}年度末</option>)}
                        </select>
                    </div>
                </div>
                <TableToolbar title="" data={exportData} filename={`employee_list_${selectedYear}`} />
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left whitespace-nowrap min-w-max">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 border-b dark:border-gray-600 w-20">ID</th>
                            <th className="p-3 border-b dark:border-gray-600">氏名</th>
                            <th className="p-3 border-b dark:border-gray-600">雇用区分</th>
                            <th className="p-3 border-b dark:border-gray-600">生年月日</th>
                            <th className="p-3 border-b dark:border-gray-600">入社日</th>
                            <th className="p-3 border-b dark:border-gray-600 text-right">基本給 (月額)</th>
                            <th className="p-3 border-b dark:border-gray-600 text-right">年齢</th>
                            <th className="p-3 border-b dark:border-gray-600 text-right">勤続年数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeesToDisplay.map((e: any) => (
                            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-700 transition-colors">
                                <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{e.id}</td>
                                <td className="p-3 font-medium dark:text-gray-200">{e.name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        e.type.includes('正社員') ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200' :
                                        e.type.includes('管理職') ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200' :
                                        e.type.includes('再雇用') ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' :
                                        e.type.includes('延長') ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {e.type}
                                    </span>
                                </td>
                                <td className="p-3 dark:text-gray-300">{new Date(e.birthDate).toLocaleDateString()}</td>
                                <td className="p-3 dark:text-gray-300">{new Date(e.hireDate).toLocaleDateString()}</td>
                                <td className="p-3 text-right font-bold text-gray-700 dark:text-gray-200">{(e.monthlyBase || 0).toLocaleString()}</td>
                                <td className="p-3 text-right dark:text-gray-300">{e.age}歳</td>
                                <td className="p-3 text-right dark:text-gray-300">{e.tenure}年</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const MasterCheckView: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    // 2026/4/1 fixed target date for calculation
    const targetDate = new Date(2026, 3, 1);

    const exportData = employees.map(e => ({
        "ID": e.id,
        "氏名": e.name,
        "生年月日": e.birthDate.toLocaleDateString(),
        "入社年月日": e.hireDate.toLocaleDateString(),
        "基本給": e.baseSalary,
        "家族手当": e.familyAllowance,
        "子女教育": e.childEduAllowance,
        "指導手当": e.instructorAllowance,
        "業務手当": e.workAllowance,
        "管理手当": e.managerAllowance,
        "雇用形態": e.employmentType
    }));
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-[80vh] flex flex-col transition-colors">
             <TableToolbar title="マスタデータ確認" data={exportData} filename="master_data" />
             <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 dark:text-gray-200">
                        <tr>
                            <th className="border dark:border-gray-600 p-2">ID</th>
                            <th className="border dark:border-gray-600 p-2">氏名</th>
                            <th className="border dark:border-gray-600 p-2">年齢 (2026/4/1)</th>
                            <th className="border dark:border-gray-600 p-2">勤続 (2026/4/1)</th>
                            <th className="border dark:border-gray-600 p-2">生年月日</th>
                            <th className="border dark:border-gray-600 p-2">入社年月日</th>
                            <th className="border dark:border-gray-600 p-2 text-right">基本給</th>
                            <th className="border dark:border-gray-600 p-2 text-right">家族手当</th>
                            <th className="border dark:border-gray-600 p-2 text-right">子女教育</th>
                            <th className="border dark:border-gray-600 p-2 text-right">指導手当</th>
                            <th className="border dark:border-gray-600 p-2 text-right">業務手当</th>
                            <th className="border dark:border-gray-600 p-2 text-right">管理手当</th>
                            <th className="border dark:border-gray-600 p-2">雇用形態</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(e => {
                            const age = DateUtils.getAge(e.birthDate, targetDate);
                            const tenure = DateUtils.getTenure(e.hireDate, targetDate);
                            return (
                                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b dark:border-gray-600 transition-colors">
                                    <td className="p-2 dark:text-gray-300">{e.id}</td>
                                    <td className="p-2 dark:text-gray-300">{e.name}</td>
                                    <td className="p-2 text-center bg-gray-50 dark:bg-gray-800 dark:text-gray-300">{age}</td>
                                    <td className="p-2 text-center bg-gray-50 dark:bg-gray-800 dark:text-gray-300">{tenure}</td>
                                    <td className="p-2 dark:text-gray-300">{e.birthDate.toLocaleDateString()}</td>
                                    <td className="p-2 dark:text-gray-300">{e.hireDate.toLocaleDateString()}</td>
                                    <td className="p-2 text-right dark:text-gray-300">{(e.baseSalary || 0).toLocaleString()}</td>
                                    <td className="p-2 text-right dark:text-gray-300">{(e.familyAllowance || 0).toLocaleString()}</td>
                                    <td className="p-2 text-right dark:text-gray-300">{(e.childEduAllowance || 0).toLocaleString()}</td>
                                    <td className="p-2 text-right dark:text-gray-300">{(e.instructorAllowance || 0).toLocaleString()}</td>
                                    <td className="p-2 text-right dark:text-gray-300">{(e.workAllowance || 0).toLocaleString()}</td>
                                    <td className="p-2 text-right dark:text-gray-300">{(e.managerAllowance || 0).toLocaleString()}</td>
                                    <td className="p-2 dark:text-gray-300">{e.employmentType}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
        </div>
    );
};
