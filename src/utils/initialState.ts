
import { RaisePlanYear, RecruitmentPlanYear, ImpactRateYear, FinancialPlan, SimulationConfig } from '../types';
import { defaultEmploymentSettings } from './simulationLogic';

// Modified: Always default to 0 for Base Up, regardless of plan
export const createDefaultRaisePlan = (isPlanA: boolean = false): Record<number, RaisePlanYear> => {
    const p: Record<number, RaisePlanYear> = {}; 
    for(let y=2026; y<=2035; y++) {
        // Default Base Up is now 0 for both patterns as per user request
        const defaultBaseUp = 0;

        p[y] = { 
            averageAmount: defaultBaseUp, 
            detailed: {
                seishain_l1: defaultBaseUp, seishain_l2: defaultBaseUp, seishain_l3: defaultBaseUp, seishain_new: defaultBaseUp,
                newgrad_l1: defaultBaseUp, newgrad_l2: defaultBaseUp, newgrad_l3: defaultBaseUp, newgrad_new: defaultBaseUp,
                trainee_l1: defaultBaseUp, trainee_l2: defaultBaseUp, trainee_l3: defaultBaseUp, trainee_new: defaultBaseUp,
                extended: defaultBaseUp, // Auto-set extended to average initially
                reemp: 0,
                parttime: 0,
                management: 0,
                shokutaku: 0,
                reemp_shokutaku: 0 // Added
            },
            yearlyRaise: 1600, 
            raiseRate: 0.0
        }; 
    }
    return p;
};

export const createDefaultRecruitmentPlan = (): Record<number, RecruitmentPlanYear> => { 
    const p: Record<number, RecruitmentPlanYear> = {}; 
    for(let y=2026; y<=2035; y++) p[y] = { newGrad: 0, newGradSalary: 212000, driver: 0, driverSalary: 212000 }; 
    return p; 
};

export const createDefaultImpactRates = (): Record<number, ImpactRateYear> => {
    const p: Record<number, ImpactRateYear> = {};
    for(let y=2026; y<=2035; y++) p[y] = { 
        socialInsuranceRate: 17.5, 
        rippleRate: 0.42, // Changed from 0.5 to 0.42 per request
        // Default targets per user request: Base, Instructor, Manager, Work. (Family/Child excluded)
        rippleTargets: ['base', 'instructor', 'manager', 'work'] 
    }; 
    return p;
};

export const createDefaultFinancialPlan = (): FinancialPlan[] => {
    const createPlan = (
        year: number,
        revShared: number, revCharter: number, revContract: number,
        revZatsu: number, revChintai: number, revSonota: number,
        expKyuryo: number, expTeate: number, expShoyo: number, expTaishoku: number, expHoutei: number, expKousei: number, expSonotaJin: number,
        expBukken: number, expNenryo: number, expSonotaBuk: number, expGyomu: number,
        expTaxes: number, expDep: number,
        plEigyoGaiRev: number, plEigyoGaiExp: number,
        plTokubetsuRev: number, plTokubetsuExp: number,
        plHoujin: number, plHoujinAdj: number
    ): FinancialPlan => {
        const revOther = revZatsu + revChintai + revSonota;
        const expPersonnel = expKyuryo + expTeate + expShoyo + expTaishoku + expHoutei + expKousei + expSonotaJin;
        const expMaterial = expNenryo + expSonotaBuk + expGyomu;
        
        const totalRev = revShared + revCharter + revContract + revOther;
        const totalExp = expPersonnel + expMaterial + expTaxes + expDep;
        const opProfit = totalRev - totalExp;
        
        const ordProfit = opProfit + plEigyoGaiRev - plEigyoGaiExp;
        const preTaxProfit = ordProfit + plTokubetsuRev - plTokubetsuExp;
        const netProfit = preTaxProfit - plHoujin - plHoujinAdj;

        return {
            year,
            checked: year >= 2024 && year <= 2030,
            revenue: { shared: revShared, charter: revCharter, contract: revContract, other: revOther },
            expense: { personnel: expPersonnel, material: expMaterial, taxes: expTaxes, depreciation: expDep },
            profit: { ordinary: ordProfit, net: netProfit },
            details: {
                unsou_zatsu: revZatsu, chintai: revChintai,
                kyuryo: expKyuryo, teate: expTeate, shoyo: expShoyo, taishoku: expTaishoku, houteifukuri: expHoutei, kouseifukuri: expKousei, sonota_jinken: expSonotaJin,
                bukken: expNenryo + expSonotaBuk, 
                nenryo: expNenryo, sonota_bukken: expSonotaBuk, gyomu: expGyomu,
                eigyo_gai_rev: plEigyoGaiRev, eigyo_gai_exp: plEigyoGaiExp,
                tokubetsu_rev: plTokubetsuRev, tokubetsu_exp: plTokubetsuExp,
                houjinzei: plHoujin, houjinzei_adj: plHoujinAdj
            }
        };
    };

    const plans: FinancialPlan[] = [];
    plans.push(createPlan(2024, 2090000, 180000, 700000, 15000, 50000, 0, 800000, 350000, 250000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 70000, 200, 1, 1, 180000, 7000));
    plans.push(createPlan(2025, 2050000, 180000, 700000, 15000, 70000, 0, 850000, 350000, 270000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 30000, 200, 2, 2, 180000, -8000));
    plans.push(createPlan(2026, 2050000, 200000, 700000, 15000, 70000, 0, 850000, 350000, 270000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 30000, 200, 3, 3, 180000, 10));
    plans.push(createPlan(2027, 2050000, 200000, 700000, 15000, 70000, 0, 850000, 350000, 270000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 30000, 200, 4, 4, 180000, 10));
    plans.push(createPlan(2028, 2050000, 200000, 700000, 15000, 70000, 0, 850000, 350000, 270000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 30000, 200, 5, 5, 180000, -50));
    plans.push(createPlan(2029, 2050000, 200000, 700000, 15000, 70000, 0, 850000, 350000, 270000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 30000, 200, 6, 6, 180000, 20));
    plans.push(createPlan(2030, 2050000, 200000, 700000, 15000, 70000, 0, 850000, 350000, 270000, 70000, 240000, 18000, 60000, 330000, 150000, 180000, 200000, 40000, 200000, 30000, 200, 7, 7, 180000, 600));
    
    return plans;
};

export const createConfigA = (): SimulationConfig => {
    const settings = JSON.parse(JSON.stringify(defaultEmploymentSettings));
    
    // Initialize lumpSum for years 2025-2035 for all types
    for (const type in settings) {
        if (settings[type]) {
            const setting = settings[type] as any;
            setting.lumpSum = {};
            for (let y = 2025; y <= 2035; y++) {
                setting.lumpSum[y] = 0;
            }
        }
    }

    if(settings["正社員(延長)"]) {
        settings["正社員(延長)"].lowerLimit = 224020;
        settings["正社員(延長)"].upperLimit = 350000; 
        settings["正社員(延長)"].cutRate = 1.0; 
        settings["正社員(延長)"].calculationMethod = 'fixed';
        settings["正社員(延長)"].fixedSalary = 224020;
        // Modified: Changed to false (unchecked) by default per request
        settings["正社員(延長)"].useCurrentIfLower = false; 
        
        // Updated Bonus Defaults: 2.0 / 2.0 / 0.5
        settings["正社員(延長)"].bonusMonths = { summer: 2.0, winter: 2.0, end: 0.5 };
    }
    return { 
        label: 'パターンA', 
        extendedRetirementAge: 65, 
        reemploymentAge: 65, 
        partTimeAgeLimit: 73, 
        cutRate: 1.0, 
        cutLowerLimit: 224020, 
        cutUpperLimit: 0, 
        partTimeSalary: 196000,
        managerShokutakuSalary: 480000,
        managerShokutakuOver65Salary: 287000,
        convertCurrentReempToExtension: false, 
        autoRaiseEnabled: false, // Default: No Auto Raise
        extensionImplementationDate: '2027-04-01', // Default implementation date changed to 2027
        employmentSettings: settings 
    };
};

export const createConfigB = (): SimulationConfig => {
    const settings = JSON.parse(JSON.stringify(defaultEmploymentSettings));

    // Initialize lumpSum for years 2025-2035 for all types
    for (const type in settings) {
        if (settings[type]) {
            const setting = settings[type] as any;
            setting.lumpSum = {};
            for (let y = 2025; y <= 2035; y++) {
                setting.lumpSum[y] = 0;
            }
        }
    }

    // Set Default Re-employment Settings for Plan B
    if(settings["再雇用"]) {
        // Ensure default is "fixed" 200,000 to match old hardcoded logic but editable
        settings["再雇用"].calculationMethod = 'fixed';
        settings["再雇用"].fixedSalary = 200000;
        settings["再雇用"].lowerLimit = 200000; 
    }

    if(settings["正社員(延長)"]) {
        // Plan B: Fixed Amount 224,020 (as requested)
        settings["正社員(延長)"].calculationMethod = 'fixed';
        settings["正社員(延長)"].fixedSalary = 224020;
        settings["正社員(延長)"].lowerLimit = 224020;
        settings["正社員(延長)"].upperLimit = 350000; 
        settings["正社員(延長)"].useCurrentIfLower = false;
    }
    return { 
        label: 'パターンB', 
        extendedRetirementAge: 60, 
        reemploymentAge: 65, 
        partTimeAgeLimit: 73, 
        cutRate: 1.0, 
        cutLowerLimit: 224020, 
        cutUpperLimit: 0, 
        partTimeSalary: 196000,
        managerShokutakuSalary: 480000,
        managerShokutakuOver65Salary: 287000,
        convertCurrentReempToExtension: false,
        syncBaseUpWithA: true, // Default to true as requested
        autoRaiseEnabled: false, // Default: No Auto Raise
        extensionImplementationDate: '2027-04-01', // Changed to 2027
        employmentSettings: settings
    };
};
