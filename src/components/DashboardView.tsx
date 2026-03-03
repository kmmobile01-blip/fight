
import React, { useEffect } from 'react';
import { SimulationResult, Employee, PersonaType, UnionPersonaType } from '../types';
import { SplashScreen } from './dashboard/SplashScreen';
import { KpiCards } from './dashboard/KpiCards';
import { TrendChart } from './dashboard/TrendChart';
import { AgePyramidChart } from './dashboard/DashboardCharts';
import { NegotiationTeamPanel } from './dashboard/NegotiationTeamPanel';

interface DashboardViewProps {
    resultA: SimulationResult;
    resultB: SimulationResult;
    resultC: SimulationResult;
    initialEmployees: Employee[];
    onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearData?: () => void;
    companyPersonas?: PersonaType[];
    onUpdateCompanyPersonas?: (p: PersonaType[]) => void;
    unionPersonas?: UnionPersonaType[];
    onUpdateUnionPersonas?: (p: UnionPersonaType[]) => void;
    
    showSplash: boolean;
    setShowSplash: (show: boolean) => void;
    onAppStart?: () => void;
    onNavigate: (id: string) => void; 
    voiceEnabled: boolean;
    isSeriousMode: boolean; // Added
    onToggleMode: () => void; // Added
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
    resultA, 
    resultB, 
    resultC,
    initialEmployees, 
    onFileUpload, 
    onClearData,
    companyPersonas,
    onUpdateCompanyPersonas,
    unionPersonas,
    onUpdateUnionPersonas,
    showSplash,
    setShowSplash,
    onAppStart,
    onNavigate,
    voiceEnabled,
    isSeriousMode,
    onToggleMode
}) => {

    const handleStart = onAppStart ? onAppStart : () => setShowSplash(false);

    useEffect(() => {
        if (!voiceEnabled || isSeriousMode) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("決起集会");
        u.lang = 'ja-JP';
        u.pitch = 1.0; 
        u.rate = 1.2;  
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [voiceEnabled, isSeriousMode]);

    if (showSplash) {
        return <SplashScreen onStart={handleStart} isSeriousMode={isSeriousMode} onToggleMode={onToggleMode} />;
    }

    const employeeCount = initialEmployees ? initialEmployees.length : 0;

    return (
        <div className="space-y-6">
            <KpiCards 
                employees={initialEmployees || []} 
                resultA={resultA} 
                resultB={resultB} 
                resultC={resultC}
                onNavigate={onNavigate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Cost Trend */}
                <div className="lg:col-span-1 h-full min-h-[400px]">
                    <TrendChart 
                        resultA={resultA} 
                        resultB={resultB} 
                        resultC={resultC}
                        employeeCount={employeeCount} 
                        onFileUpload={onFileUpload || (() => {})} 
                    />
                </div>

                {/* Right: Age Pyramid */}
                <div className="lg:col-span-1 h-full min-h-[400px]">
                    <AgePyramidChart 
                        resultA={resultA}
                        initialEmployees={initialEmployees || []}
                    />
                </div>
            </div>

            {/* Negotiation Team Panel - Only show in Ura Mode (Not Serious Mode) */}
            {!isSeriousMode && (
                <div className="mt-6">
                    <NegotiationTeamPanel 
                        employeeCount={employeeCount}
                        companyPersonas={companyPersonas || []}
                        onUpdateCompanyPersonas={onUpdateCompanyPersonas || (() => {})}
                        unionPersonas={unionPersonas || []}
                        onUpdateUnionPersonas={onUpdateUnionPersonas || (() => {})}
                        onClearData={onClearData}
                    />
                </div>
            )}
        </div>
    );
};
