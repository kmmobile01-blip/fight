
import React, { Suspense } from 'react';
import { DashboardView } from './DashboardView';
import { HomeIcon } from './Icons';

// Lazy Load Views (Dynamic Imports) to reduce initial bundle size
const SettingsEntryView = React.lazy(() => import('./SettingsEntryView').then(m => ({ default: m.SettingsEntryView })));
const RaisePlanView = React.lazy(() => import('./PlanningRaise').then(m => ({ default: m.RaisePlanView })));
const RecruitmentPlanView = React.lazy(() => import('./PlanningRecruitment').then(m => ({ default: m.RecruitmentPlanView })));
const AllowanceSettingsView = React.lazy(() => import('./PlanningAllowance').then(m => ({ default: m.AllowanceSettingsView })));
const CustomAllowanceView = React.lazy(() => import('./PlanningAllowance').then(m => ({ default: m.CustomAllowanceView })));
const BonusSettingsView = React.lazy(() => import('./PlanningBonus').then(m => ({ default: m.BonusSettingsView })));
const LumpSumSettingsView = React.lazy(() => import('./PlanningBonus').then(m => ({ default: m.LumpSumSettingsView })));
const ImpactSettingsView = React.lazy(() => import('./PlanningConfig').then(m => ({ default: m.ImpactSettingsView })));
const HeadcountView = React.lazy(() => import('./AnalysisStats').then(m => ({ default: m.HeadcountView })));
const YearlyDetailView = React.lazy(() => import('./AnalysisStats').then(m => ({ default: m.YearlyDetailView })));
const EmployeeListView = React.lazy(() => import('./AnalysisEmployee').then(m => ({ default: m.EmployeeListView })));
const MasterCheckView = React.lazy(() => import('./AnalysisEmployee').then(m => ({ default: m.MasterCheckView })));
const BaseUpImpactView = React.lazy(() => import('./AnalysisImpact').then(m => ({ default: m.BaseUpImpactView })));
const StartingSalaryView = React.lazy(() => import('./AnalysisImpact').then(m => ({ default: m.StartingSalaryView })));
const TermEndImpactView = React.lazy(() => import('./AnalysisImpact').then(m => ({ default: m.TermEndImpactView })));
const FinancialPlanView = React.lazy(() => import('./FinancialPlanView').then(m => ({ default: m.FinancialPlanView })));
const CouncilMaterialsView = React.lazy(() => import('./CouncilMaterialsView').then(m => ({ default: m.CouncilMaterialsView })));
const CharacterGuideView = React.lazy(() => import('./CharacterGuideView').then(m => ({ default: m.CharacterGuideView })));
const AiAssistant = React.lazy(() => import('./AiAssistant').then(m => ({ default: m.AiAssistant })));
const SummaryView = React.lazy(() => import('./SummaryView').then(m => ({ default: m.SummaryView })));
const DocumentationView = React.lazy(() => import('./DocumentationView').then(m => ({ default: m.DocumentationView })));

// Additional Views for Sidebar
const VerificationView = React.lazy(() => import('./VerificationView').then(m => ({ default: m.VerificationView })));
const VerificationTotalView = React.lazy(() => import('./VerificationTotalView').then(m => ({ default: m.VerificationTotalView })));
const BreakEvenPointView = React.lazy(() => import('./BreakEvenPointView').then(m => ({ default: m.BreakEvenPointView })));
const RoiAnalysisView = React.lazy(() => import('./RoiAnalysisView').then(m => ({ default: m.RoiAnalysisView })));
const ApiKeySettingsView = React.lazy(() => import('./ApiKeySettingsView').then(m => ({ default: m.ApiKeySettingsView })));
const BoardReportView = React.lazy(() => import('./BoardReportView').then(m => ({ default: m.BoardReportView })));
const ParameterTableView = React.lazy(() => import('./ParameterTableView').then(m => ({ default: m.ParameterTableView })));
const AiSetupView = React.lazy(() => import('./AiSetupView').then(m => ({ default: m.AiSetupView })));
const OharaMikoChatView = React.lazy(() => import('./KyogokuHannaChatView').then(m => ({ default: m.OharaMikoChatView })));
const RetirementImpactView = React.lazy(() => import('./AnalysisRetirementImpact').then(m => ({ default: m.RetirementImpactView })));
const RetirementExtensionTargetView = React.lazy(() => import('./AnalysisRetirementExtensionTarget').then(m => ({ default: m.RetirementExtensionTargetView })));
const RetirementExtensionMonthlyView = React.lazy(() => import('./RetirementExtensionMonthlyView').then(m => ({ default: m.RetirementExtensionMonthlyView }))); // Added
const DataImportView = React.lazy(() => import('./DataImportView').then(m => ({ default: m.DataImportView })));
const EasySetupView = React.lazy(() => import('./EasySetupView').then(m => ({ default: m.EasySetupView })));

// Replaced ResetView with AdventureLogView
const AdventureLogView = React.lazy(() => import('./AdventureLogView').then(m => ({ default: m.AdventureLogView })));

// New Individual Detail Views
const IndividualDetailAView = React.lazy(() => import('./AnalysisEmployee').then(m => ({ default: m.IndividualDetailAView })));
const IndividualDetailMasterView = React.lazy(() => import('./AnalysisEmployee').then(m => ({ default: m.IndividualDetailMasterView })));
const IndividualDetailBView = React.lazy(() => import('./IndividualDetailBView').then(m => ({ default: m.IndividualDetailBView })));
const IndividualDetailCView = React.lazy(() => import('./IndividualDetailCView').then(m => ({ default: m.IndividualDetailCView })));

const NegotiationImpactView = React.lazy(() => import('./NegotiationImpactView').then(m => ({ default: m.NegotiationImpactView })));

interface MainContentProps {
    activeTab: string;
    sim: any; // Using dynamic type for the complex simulation hook return object
    showSplash: boolean;
    setShowSplash: (show: boolean) => void;
    onOpenModalA: () => void;
    onOpenModalB: () => void;
    onAppStart: () => void;
    voiceEnabled: boolean;
    onNavigate: (id: string) => void;
    onReturnToTitle: () => void;
    isSeriousMode: boolean; // Added
    onToggleMode: () => void; // Added for Splash Screen Toggle
}

export const MainContent: React.FC<MainContentProps> = ({ 
    activeTab, 
    sim, 
    showSplash, 
    setShowSplash,
    onOpenModalA,
    onOpenModalB,
    onAppStart,
    voiceEnabled,
    onNavigate,
    onReturnToTitle,
    isSeriousMode,
    onToggleMode
}) => {
    
    // Safely access results with defaults
    const defaultResult = { summary: [], individuals: [] };
    const resultA = sim.simulationResults.resultA || defaultResult;
    const resultB = sim.simulationResults.resultB || defaultResult;
    const resultC = sim.simulationResults.resultC || defaultResult;

    // Loading Placeholder
    const LoadingFallback = () => (
        <div className="flex flex-col justify-center items-center h-full min-h-[300px] text-gray-400 bg-white/50 rounded-lg animate-pulse border-2 border-dashed border-gray-200">
            <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-500 rounded-full mb-3"></div>
            <span className="text-sm font-bold">読み込み中...</span>
        </div>
    );

    return (
        <div className="relative h-full">
            {/* Return to Title Button - Visible on desktop tabs when splash is hidden */}
            {!showSplash && (
                <div className="mb-4 hidden md:flex justify-end print:hidden">
                    <button 
                        onClick={onReturnToTitle}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-all text-sm font-medium shadow-sm border border-gray-200 dark:border-gray-700 group"
                        title="タイトル画面に戻る"
                    >
                        <HomeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span>タイトル画面に戻る</span>
                    </button>
                </div>
            )}

            <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'negotiation_impact' && <NegotiationImpactView 
                resultA={resultA} 
                resultB={resultB} 
                resultC={resultC} 
                raisePlanA={sim.raisePlanA}
                raisePlanB={sim.raisePlanB}
                voiceEnabled={voiceEnabled}
            />}
            {activeTab === 'dashboard' && <DashboardView 
                resultA={resultA} 
                resultB={resultB}
                resultC={resultC}
                initialEmployees={sim.employees}
                onFileUpload={sim.handleFileUpload} 
                onClearData={sim.handleClearData} 
                companyPersonas={sim.companyPersonas}
                onUpdateCompanyPersonas={sim.setCompanyPersonas}
                unionPersonas={sim.unionPersonas}
                onUpdateUnionPersonas={sim.setUnionPersonas}
                showSplash={showSplash}
                setShowSplash={setShowSplash}
                onAppStart={onAppStart}
                voiceEnabled={voiceEnabled}
                onNavigate={onNavigate}
                isSeriousMode={isSeriousMode}
                onToggleMode={onToggleMode}
            />}
            
            {activeTab === 'adventure_log' && (
                <AdventureLogView 
                    configA={sim.configA}
                    configB={sim.configB}
                    raisePlanA={sim.raisePlanA}
                    raisePlanB={sim.raisePlanB}
                    recruitmentPlanA={sim.recruitmentPlanA}
                    recruitmentPlanB={sim.recruitmentPlanB}
                    impactRatesA={sim.impactRatesA}
                    impactRatesB={sim.impactRatesB}
                    customAllowances={sim.customAllowances}
                    financialData={sim.financialData}
                    negotiationMaterials={sim.negotiationMaterials}
                    sharedCosts={{
                        recruit: sim.sharedRecruitCost,
                        training: sim.sharedTrainingCost,
                        license: sim.sharedLicenseCost,
                        safety: sim.sharedSafetyValue
                    }}
                    onReset={() => { 
                        sim.handleResetParameters(); 
                        // Note: onNavigate back logic is handled inside View now
                    }} 
                    onLoad={sim.loadAllData}
                    onCancel={() => onNavigate('dashboard')}
                    voiceEnabled={voiceEnabled}
                    isSeriousMode={isSeriousMode}
                    onReturnToTitle={onReturnToTitle}
                />
            )}
            {activeTab === 'import' && <DataImportView onFileUpload={sim.handleFileUpload} onClearData={sim.handleClearData} employeeCount={sim.employees.length} voiceEnabled={voiceEnabled} onNavigate={onNavigate} />}
            {activeTab === 'apikey_settings' && <ApiKeySettingsView voiceEnabled={voiceEnabled} />}

            {/* Planning Views */}
            {activeTab === 'settings' && <SettingsEntryView 
                configA={sim.configA} 
                configB={sim.configB} 
                onConfigUpdate={sim.handleConfigRootChange}
                onSettingsUpdate={sim.handleEmploymentConfigChange}
                voiceEnabled={voiceEnabled}
                onNavigate={onNavigate}
                onReturnToTitle={onReturnToTitle}
            />}
            {activeTab === 'raise' && <RaisePlanView 
                planA={sim.raisePlanA} 
                planB={sim.raisePlanB} 
                configA={sim.configA}
                configB={sim.configB}
                onChange={sim.handleRaisePlanChange} 
                onYearUpdate={sim.handleYearRaiseUpdate}
                onConfigUpdate={sim.handleConfigRootChange} // Added
                employees={sim.employees} 
                voiceEnabled={voiceEnabled}
            />}
            {activeTab === 'recruitment' && <RecruitmentPlanView planA={sim.recruitmentPlanA} planB={sim.recruitmentPlanB} onChange={sim.handleRecruitmentChange} voiceEnabled={voiceEnabled} />}
            {activeTab === 'allowance_settings' && <AllowanceSettingsView configA={sim.configA} configB={sim.configB} onUpdate={sim.handleEmploymentConfigChange} voiceEnabled={voiceEnabled} />}
            {activeTab === 'bonus_settings' && <BonusSettingsView configA={sim.configA} configB={sim.configB} onUpdate={sim.handleEmploymentConfigChange} voiceEnabled={voiceEnabled} />}
            {activeTab === 'lump_sum' && <LumpSumSettingsView configA={sim.configA} configB={sim.configB} onUpdate={sim.handleEmploymentConfigChange} employees={sim.employees} impactRatesA={sim.impactRatesA} impactRatesB={sim.impactRatesB} voiceEnabled={voiceEnabled} />}
            {activeTab === 'custom_allowance' && <CustomAllowanceView allowances={sim.customAllowances} onAdd={() => sim.setCustomAllowances((p: any) => [...p, { id: Date.now(), name: '新規手当', amounts: {}, ageMin: '', ageMax: '', tenureMin: '', tenureMax: '' }])} onDelete={(id: number) => sim.setCustomAllowances((p: any) => p.filter((a: any) => a.id !== id))} onChange={(id: number, f: string, v: any) => sim.setCustomAllowances((prev: any) => prev.map((a: any) => a.id === id ? { ...a, [f]: v } : a))} voiceEnabled={voiceEnabled} />}
            {activeTab === 'impact_rates' && <ImpactSettingsView ratesA={sim.impactRatesA} ratesB={sim.impactRatesB} onChange={sim.handleImpactRateChange} voiceEnabled={voiceEnabled} />}
            {activeTab === 'easy_setup' && <EasySetupView onBulkUpdate={sim.handleBulkUpdate} onReturnToTitle={onReturnToTitle} />}
            {activeTab === 'param_table' && <ParameterTableView configA={sim.configA} configB={sim.configB} raisePlanA={sim.raisePlanA} raisePlanB={sim.raisePlanB} recruitmentPlanA={sim.recruitmentPlanA} recruitmentPlanB={sim.recruitmentPlanB} impactRatesA={sim.impactRatesA} impactRatesB={sim.impactRatesB} voiceEnabled={voiceEnabled} onReturnToTitle={onReturnToTitle} />}
            
            {/* Analysis Views */}
            {activeTab === 'summary' && <SummaryView resultA={resultA} resultB={resultB} resultC={resultC} voiceEnabled={voiceEnabled} />}
            {activeTab === 'yearly_detail' && <YearlyDetailView resultA={resultA} resultB={resultB} resultC={resultC} voiceEnabled={voiceEnabled} />}
            {activeTab === 'headcount' && <HeadcountView resultA={resultA} resultB={resultB} voiceEnabled={voiceEnabled} />}
            {activeTab === 'individual_A' && <IndividualDetailAView resultA={resultA} />}
            {activeTab === 'individual_B' && <IndividualDetailBView resultB={resultB} />}
            {activeTab === 'individual_C' && <IndividualDetailCView resultC={resultC} />}
            {activeTab === 'individual_master' && <IndividualDetailMasterView employees={sim.employees} />}
            {activeTab === 'employee_list' && <EmployeeListView resultA={resultA} initialEmployees={sim.employees} voiceEnabled={voiceEnabled} />}
            {activeTab === 'master_check' && <MasterCheckView employees={sim.employees} />}
            {activeTab === 'verification' && <VerificationView resultA={resultA} resultB={resultB} resultC={resultC} voiceEnabled={voiceEnabled} />}
            {activeTab === 'verification_total' && <VerificationTotalView resultA={resultA} resultB={resultB} resultC={resultC} voiceEnabled={voiceEnabled} />}
            
            {/* AI & Simulation Views */}
            {activeTab === 'bear_impact' && <BaseUpImpactView resultA={resultA} resultB={resultB} />}
            {activeTab === 'starting_salary' && <StartingSalaryView currentResult={resultA} resultC={resultC} employees={sim.employees} config={sim.configA} recruitmentPlan={sim.recruitmentPlanA} raisePlan={sim.raisePlanA} customAllowances={sim.customAllowances} impactRates={sim.impactRatesA} />}
            {activeTab === 'term_end_impact' && <TermEndImpactView resultA={resultA} impactRates={sim.impactRatesA} />}
            {activeTab === 'retirement_impact' && <RetirementImpactView resultA={resultA} resultB={resultB} configA={sim.configA} configB={sim.configB} />}
            {activeTab === 'retirement_extension_target' && <RetirementExtensionTargetView resultA={resultA} resultC={resultC} configA={sim.configA} configB={sim.configB} />}
            {activeTab === 'extension_monthly' && <RetirementExtensionMonthlyView 
                resultA={resultA}
                resultB={resultB}
                resultC={resultC}
                employees={sim.employees} 
                configA={sim.configA}
                configB={sim.configB}
                raisePlanA={sim.raisePlanA}
                raisePlanB={sim.raisePlanB}
                customAllowances={sim.customAllowances}
                impactRatesA={sim.impactRatesA}
                impactRatesB={sim.impactRatesB}
            />}
            {activeTab === 'financial_plan' && <FinancialPlanView data={sim.financialData} onChange={sim.handleFinancialPlanChange} onBatchUpdate={sim.setFinancialData} voiceEnabled={voiceEnabled} />}
            {activeTab === 'council_materials' && <CouncilMaterialsView value={sim.negotiationMaterials} onChange={sim.setNegotiationMaterials} voiceEnabled={voiceEnabled} onReturnToTitle={onReturnToTitle} />}
            {activeTab === 'dashboard_bep' && <BreakEvenPointView configA={sim.configA} recruitmentPlanA={sim.recruitmentPlanA} raisePlanA={sim.raisePlanA} impactRatesA={sim.impactRatesA} recruitCost={sim.sharedRecruitCost} setRecruitCost={sim.setSharedRecruitCost} trainingCost={sim.sharedTrainingCost} setTrainingCost={sim.setSharedTrainingCost} licenseCost={sim.sharedLicenseCost} setLicenseCost={sim.setSharedLicenseCost} safetyValue={sim.sharedSafetyValue} setSafetyValue={sim.setSharedSafetyValue} />}
            {activeTab === 'dashboard_roi' && <RoiAnalysisView resultA={resultA} configA={sim.configA} recruitmentPlanA={sim.recruitmentPlanA} raisePlanA={sim.raisePlanA} impactRatesA={sim.impactRatesA} recruitCost={sim.sharedRecruitCost} trainingCost={sim.sharedTrainingCost} licenseCost={sim.sharedLicenseCost} sharedSafetyValue={sim.sharedSafetyValue} />}
            
            {activeTab === 'analysis' && <AiAssistant mode="analysis" resultA={resultA} financialData={sim.financialData} isSeriousMode={isSeriousMode} configA={sim.configA} raisePlanA={sim.raisePlanA} customAllowances={sim.customAllowances} onReturnToTitle={onReturnToTitle} onNavigate={onNavigate} />}
            {activeTab === 'requirements' && <AiAssistant mode="requirements" resultA={resultA} financialData={sim.financialData} isSeriousMode={isSeriousMode} configA={sim.configA} raisePlanA={sim.raisePlanA} customAllowances={sim.customAllowances} onReturnToTitle={onReturnToTitle} onNavigate={onNavigate} />}
            {activeTab === 'negotiation' && <AiAssistant mode="negotiation" resultA={resultA} negotiationContext={sim.negotiationMaterials} onContextChange={(val: string) => sim.setNegotiationMaterials(val)} financialData={sim.financialData} companyPersonas={sim.companyPersonas} onUpdateCompanyPersonas={sim.setCompanyPersonas} unionPersonas={sim.unionPersonas} onUpdateUnionPersonas={sim.setUnionPersonas} isSeriousMode={isSeriousMode} configA={sim.configA} raisePlanA={sim.raisePlanA} customAllowances={sim.customAllowances} onReturnToTitle={onReturnToTitle} onNavigate={onNavigate} />}
            {activeTab === 'character_guide' && <CharacterGuideView onReturnToTitle={onReturnToTitle} />}
            {activeTab === 'ai_setup' && <AiSetupView employeeCount={sim.employees.length} onClearData={sim.handleClearData} companyPersonas={sim.companyPersonas} onUpdateCompanyPersonas={sim.setCompanyPersonas} unionPersonas={sim.unionPersonas} onUpdateUnionPersonas={sim.setUnionPersonas} />}
            {activeTab === 'board_report' && <BoardReportView resultA={resultA} resultB={resultB} resultC={resultC} configA={sim.configA} raisePlanA={sim.raisePlanA} recruitmentPlanA={sim.recruitmentPlanA} impactRatesA={sim.impactRatesA} applyAiProposal={sim.applyAiProposal} runCalculation={sim.runCalculation} isSeriousMode={isSeriousMode} onReturnToTitle={onReturnToTitle} />}
            {activeTab === 'consult_ohara' && <OharaMikoChatView configA={sim.configA} resultA={resultA} financialData={sim.financialData} voiceEnabled={voiceEnabled} isSeriousMode={isSeriousMode} onReturnToTitle={onReturnToTitle} />}
            
            {activeTab === 'docs' && <DocumentationView isSeriousMode={isSeriousMode} onReturnToTitle={onReturnToTitle} />}
        </Suspense>
        </div>
    );
};
