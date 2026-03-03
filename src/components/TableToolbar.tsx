
import React from 'react';
import { DownloadIcon, PrinterIcon } from './Icons';

interface TableToolbarProps {
    title: string;
    data: any[];
    headers?: string[]; // Optional: keys to include/order
    filename?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ title, data, headers, filename = "download" }) => {
    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        if (!data || data.length === 0) {
            alert("出力するデータがありません。");
            return;
        }

        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            // Fallback to CSV if XLSX is not loaded
            const Papa = (window as any).Papa;
            if (!Papa) {
                alert("エクスポートライブラリが読み込まれていません。");
                return;
            }
            const csv = Papa.unparse(data);
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
            const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.csv`;
            link.click();
            return;
        }

        // Native Excel Export (Solves Mojibake completely)
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Auto-width adjustment (Simple estimation)
        if (data.length > 0) {
            const keys = Object.keys(data[0]);
            const wscols = keys.map(k => ({ wch: Math.max(k.length * 2, 15) }));
            ws['!cols'] = wscols;
        }

        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return (
        <div className="flex justify-between items-center mb-4 print:hidden">
            <h3 className="font-bold text-lg text-gray-800">{title}</h3>
            <div className="flex gap-2">
                <button 
                    onClick={handleDownload}
                    disabled={!data || data.length === 0}
                    className={`flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded shadow text-sm font-bold transition-all ${
                        (!data || data.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
                    }`}
                >
                    <DownloadIcon /> Excel出力(.xlsx)
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1.5 rounded shadow hover:bg-gray-700 text-sm font-bold transition-all"
                >
                    <PrinterIcon /> 印刷
                </button>
            </div>
        </div>
    );
};