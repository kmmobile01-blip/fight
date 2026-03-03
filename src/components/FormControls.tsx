
import React from 'react';

export const StepperControl = ({
    label,
    value,
    min,
    max,
    step,
    unit,
    onChange,
    description,
    color = "blue",
    disabled = false
}: {
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
    onChange: (val: number) => void,
    description?: string,
    color?: string,
    disabled?: boolean
}) => {
    const colorClasses = {
        red: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30",
        blue: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
        green: "text-green-600 dark:text-green-400 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
        gray: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700",
        orange: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30",
        purple: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
    };
    const activeColor = disabled ? colorClasses.gray : (colorClasses as any)[color] || colorClasses.blue;
    const textColor = activeColor.split(' ')[0];

    const handleDec = () => {
        if (!disabled && value - step >= min) onChange(value - step);
    };
    const handleInc = () => {
        if (!disabled && value + step <= max) onChange(value + step);
    };

    return (
        <div className={`p-4 rounded-xl border dark:border-gray-700 shadow-sm mb-4 transition-all ${disabled ? 'bg-gray-100 dark:bg-gray-900 opacity-70' : 'bg-white dark:bg-gray-800'}`}>
            <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700 dark:text-gray-200 text-sm">{label} {disabled && <span className="text-red-500 text-xs font-normal">(固定)</span>}</label>
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handleDec}
                        disabled={disabled || value <= min}
                        className={`w-12 h-12 flex items-center justify-center rounded-full border-2 text-2xl font-bold transition-all touch-action-manipulation ${disabled || value <= min ? 'opacity-30 cursor-not-allowed' : activeColor}`}
                    >
                        -
                    </button>
                    <div className={`font-black text-3xl ${textColor}`}>
                        {parseFloat((value || 0).toFixed(2)).toLocaleString()}<span className="text-sm ml-1 text-gray-500 dark:text-gray-400">{unit}</span>
                    </div>
                    <button
                        onClick={handleInc}
                        disabled={disabled || value >= max}
                        className={`w-12 h-12 flex items-center justify-center rounded-full border-2 text-2xl font-bold transition-all touch-action-manipulation ${disabled || value >= max ? 'opacity-30 cursor-not-allowed' : activeColor}`}
                    >
                        +
                    </button>
                </div>
            </div>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{description}</p>}
        </div>
    );
};

export const NumberInputControl = ({
    label,
    value,
    min,
    max,
    unit,
    onChange,
    description,
    color = "blue",
    disabled = false
}: {
    label: string,
    value: number,
    min: number,
    max: number,
    unit: string,
    onChange: (val: number) => void,
    description?: string,
    color?: string,
    disabled?: boolean
}) => {
    const colorClasses = {
        red: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 focus:border-red-500 focus:ring-red-200",
        blue: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 focus:border-blue-500 focus:ring-blue-200",
        green: "text-green-600 dark:text-green-400 border-green-200 dark:border-green-900 focus:border-green-500 focus:ring-green-200",
        gray: "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 focus:border-gray-500 focus:ring-gray-200",
        orange: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900 focus:border-orange-500 focus:ring-orange-200",
        purple: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 focus:border-purple-500 focus:ring-purple-200",
    };
    const activeClass = disabled ? "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 border-gray-300 dark:border-gray-700" : `bg-white dark:bg-gray-800 ${(colorClasses as any)[color] || colorClasses.blue}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if(val === '') return; 
        let num = parseInt(val);
        if (isNaN(num)) return;
        if (num > max) num = max;
        onChange(num);
    };

    // Robust handling for undefined or null value
    const safeValue = (value === undefined || value === null) ? 0 : value;

    return (
        <div className={`p-4 rounded-xl border dark:border-gray-700 shadow-sm mb-4 transition-all ${disabled ? 'bg-gray-100 dark:bg-gray-900 opacity-80' : 'bg-white dark:bg-gray-800'}`}>
            <div className="flex flex-col gap-2">
                <label className="font-bold text-gray-700 dark:text-gray-200 text-sm">{label} {disabled && <span className="text-red-500 text-xs font-normal">(固定)</span>}</label>
                <div className="flex items-center gap-2 relative">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={safeValue.toString()}
                        onChange={handleChange}
                        disabled={disabled}
                        className={`w-full text-right font-black text-3xl border-2 rounded-lg p-3 outline-none transition-all ${activeClass}`}
                    />
                    <span className="absolute right-4 text-xl font-bold text-gray-400 pointer-events-none">{unit}</span>
                </div>
            </div>
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{description}</p>}
        </div>
    );
};

export const SmallInput = ({ label, value, onChange, unit, disabled, type="number", step=1, max }: any) => (
    <div className="flex items-center justify-between text-sm py-1">
        <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-1">
            <input 
                type={type} 
                step={step}
                max={max}
                value={value ?? ''} 
                onChange={e => onChange(e.target.value)} 
                disabled={disabled}
                className={`w-20 text-right border rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-300 outline-none dark:border-gray-600 dark:text-gray-100 ${disabled ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500' : 'bg-white dark:bg-gray-700'}`}
            />
            {unit && <span className="text-xs text-gray-400 w-4">{unit}</span>}
        </div>
    </div>
);
