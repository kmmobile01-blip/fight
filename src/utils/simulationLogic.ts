
import { Employee, SimulationConfig, SimulationResult, TypeSettings, RaisePlanYear, CustomAllowance, MonthlyAggregate, StatusChanger, BaseUpImpact, RecruitmentPlanYear, ImpactRateYear, Breakdown, MonthlyDetail, YearResult } from '../types';

export const DateUtils = {
    addYears: (d: Date, n: number) => { const date = new Date(d); date.setFullYear(date.getFullYear() + n); return date; },
    addDays: (d: Date, n: number) => { const date = new Date(d); date.setDate(date.getDate() + n); return date; },
    getYear: (d: Date) => new Date(d).getFullYear(),
    getMonth: (d: Date) => new Date(d).getMonth(),
    getDate: (d: Date) => new Date(d).getDate(),
    isBefore: (d1: Date, d2: Date) => new Date(d1) < new Date(d2),
    isAfter: (d1: Date, d2: Date) => new Date(d1) > new Date(d2),
    // Check if d1 is after or equal to d2
    isAfterOrEqual: (d1: Date, d2: Date) => new Date(d1) >= new Date(d2),
    diffDays: (s: Date, e: Date) => {
        const start = new Date(s); start.setHours(0,0,0,0);
        const end = new Date(e); end.setHours(0,0,0,0);
        return start > end ? 0 : Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    },
    getAge: (birthDate: Date, targetDate: Date) => {
        let age = targetDate.getFullYear() - birthDate.getFullYear();
        const m = targetDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && targetDate.getDate() < birthDate.getDate())) age--;
        return age;
    },
    getTenure: (hireDate: Date, targetDate: Date) => {
        let tenure = targetDate.getFullYear() - hireDate.getFullYear();
        const m = targetDate.getMonth() - hireDate.getMonth();
        if (m < 0 || (m === 0 && targetDate.getDate() < hireDate.getDate())) tenure--;
        return Math.max(0, tenure);
    }
};

// "達したあと次に到来する5月15日または11月15日"
export const getNextAppointedDate = (afterDate: Date) => {
    const y = afterDate.getFullYear();
    const m15 = new Date(y, 4, 15); // May 15
    const n15 = new Date(y, 10, 15); // Nov 15
    
    // strictly > comparison
    if (m15.getTime() > afterDate.getTime()) return m15;
    if (n15.getTime() > afterDate.getTime()) return n15;
    
    // If neither, return May 15 of next year
    return new Date(y + 1, 4, 15);
};

export const getSalarySystem = (hireDate: Date) => {
    const d = new Date(hireDate);
    // Legacy 1: ~ 1999/3/31
    if (d <= new Date(1999, 2, 31)) return 'legacy1';
    // Legacy 2: 1999/4/1 ~ 2000/3/31
    if (d <= new Date(2000, 2, 31)) return 'legacy2';
    // Legacy 3: 2000/4/1 ~ 2011/9/30
    if (d <= new Date(2011, 8, 30)) return 'legacy3';
    // New: 2011/10/1 ~
    return 'new';
};

export const defaultEmploymentSettings: Record<string, TypeSettings> = {
    "正社員": { 
        bonusMonths: { summer: 2.0, winter: 2.0, end: 0.5 }, 
        allowances: { family: true, child: true, instructor: true, manager: true, work: true }, 
        allowanceAmounts: { family: { spouse: 6000, child: 2000, parent: 500 }, childEdu: 4000, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: true, withFamily: 26400, noFamily: 16800 }, lumpSum: {}, lumpSumEnabled: true
    },
    "正社員(新卒)": { 
        bonusMonths: { summer: 1.75, winter: 1.75, end: 0 }, 
        allowances: { family: false, child: false, instructor: false, manager: false, work: false }, 
        allowanceAmounts: { family: { spouse: 4800, child: 1600, parent: 400 }, childEdu: 3200, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {}, lumpSumEnabled: true
    },
    "正社員(養成)": { 
        bonusMonths: { summer: 1.25, winter: 1.25, end: 0 }, 
        allowances: { family: false, child: false, instructor: false, manager: false, work: false }, 
        allowanceAmounts: { family: { spouse: 4800, child: 1600, parent: 400 }, childEdu: 3200, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {}, lumpSumEnabled: true
    },
    "管理職": { 
        bonusMonths: { summer: 1.0, winter: 0, end: 0.5 }, 
        allowances: { family: false, child: false, instructor: false, manager: false, work: false }, 
        allowanceAmounts: { family: { spouse: 6000, child: 2000, parent: 500 }, childEdu: 4000, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {},
        cutRate: 0.7, lumpSumEnabled: true
    },
    "嘱託": { // Copy of 管理職
        bonusMonths: { summer: 1.0, winter: 0, end: 0.5 }, 
        allowances: { family: false, child: false, instructor: false, manager: false, work: false }, 
        allowanceAmounts: { family: { spouse: 6000, child: 2000, parent: 500 }, childEdu: 4000, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {},
        cutRate: 0.7, lumpSumEnabled: true
    },
    "正社員(延長)": { 
        bonusMonths: { summer: 2.0, winter: 2.0, end: 0.5 }, 
        allowances: { family: true, child: true, instructor: true, manager: true, work: true }, 
        allowanceAmounts: { family: { spouse: 6000, child: 2000, parent: 500 }, childEdu: 4000, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: true, withFamily: 26400, noFamily: 16800 }, 
        cutRate: 1.0, 
        lowerLimit: 224020, 
        upperLimit: 350000, 
        bearStopAge: 65, lumpSum: {}, lumpSumEnabled: true,
        calculationMethod: 'fixed', fixedSalary: 224020, useCurrentIfLower: false // Default settings
    },
    "再雇用": { 
        bonusMonths: { summer: 1.5, winter: 1.5, end: 0 }, 
        allowances: { family: false, child: false, instructor: false, manager: false, work: false }, 
        allowanceAmounts: { family: { spouse: 6000, child: 2000, parent: 500 }, childEdu: 4000, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {}, lumpSumEnabled: true,
        cutRate: 1.0, lowerLimit: 200000 // Ensure these are set for Plan B usage
    },
    "再雇用(嘱託)": { // New type for Ex-Managers
        bonusMonths: { summer: 1.0, winter: 1.0, end: 0.5 }, 
        allowances: { family: false, child: false, instructor: false, manager: false, work: false }, 
        allowanceAmounts: { family: { spouse: 0, child: 0, parent: 0 }, childEdu: 0, instructor: 0, manager: { type1: 0, type2: 0, type3: 0, type4: 0 }, work: { type1: 0, type2: 0 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {}, lumpSumEnabled: true
    },
    "パート運転士(月給制)": {
        bonusMonths: { summer: 0.75, winter: 0.75, end: 0 },
        allowances: { family: false, child: false, instructor: false, manager: false, work: false },
        allowanceAmounts: { family: { spouse: 6000, child: 2000, parent: 500 }, childEdu: 4000, instructor: 10000, manager: { type1: 15000, type2: 15000, type3: 10000, type4: 4000 }, work: { type1: 4000, type2: 3000 } },
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {}, lumpSumEnabled: true
    }
};

// Payment Months Definition
const MONTH_SUMMER_BONUS = 6; // July (Index 6)
const MONTH_WINTER_BONUS = 11; // December (Index 11)
const MONTH_TERM_END_BONUS = 2; // March (Index 2)

const calculateBonus = (emp: Employee, targetMonth: number, targetYear: number, currentBase: number, currentStatus: string, config: SimulationConfig, getSettings: (status: string) => TypeSettings) => {
    const settings = getSettings(currentStatus);
    let bonusMonthVal = 0;
    let start: Date, end: Date;
    
    if (targetMonth === MONTH_SUMMER_BONUS) { 
        bonusMonthVal = settings.bonusMonths.summer; 
        start = new Date(targetYear - 1, 10, 16); 
        end = new Date(targetYear, 4, 15); 
    } 
    else if (targetMonth === MONTH_WINTER_BONUS) { 
        bonusMonthVal = settings.bonusMonths.winter; 
        start = new Date(targetYear, 4, 16); 
        end = new Date(targetYear, 10, 15); 
    } 
    else if (targetMonth === MONTH_TERM_END_BONUS) { 
        bonusMonthVal = settings.bonusMonths.end; 
        start = new Date(targetYear, 3, 1); 
        end = new Date(targetYear + 1, 2, 31); 
    } 
    else return 0;
    
    // Check Implementation Date: Force Legacy Bonus if Pre-Implementation
    // User requested that parameter changes apply FROM the implementation date.
    // So if it's before that date, we use legacy defaults for "Re-employment".
    if (config.extensionImplementationDate) {
        if (DateUtils.isBefore(end, new Date(config.extensionImplementationDate))) {
            if (currentStatus === '再雇用') {
                // Force Legacy Bonus Months (Summer 1.5, Winter 1.5, End 0)
                if (targetMonth === MONTH_SUMMER_BONUS) bonusMonthVal = 1.5;
                else if (targetMonth === MONTH_WINTER_BONUS) bonusMonthVal = 1.5;
                else bonusMonthVal = 0;
            }
        }
    }

    if (bonusMonthVal === 0) return 0;
    
    const fullDays = DateUtils.diffDays(start, end);
    let effectiveCoef = bonusMonthVal;
    
    // Check Implementation Date for Bonus Upgrade Logic (Extension)
    let isExtensionActive = true;
    if (config.extensionImplementationDate) {
        if (DateUtils.isBefore(end, new Date(config.extensionImplementationDate))) {
            isExtensionActive = false;
        }
    }
    
    // If Plan B (Retirement Age <= 60), Extension Logic should basically be disabled for Bonus checks too
    if (config.extendedRetirementAge <= 60) {
        isExtensionActive = false;
    }

    // Determine retirement date logic for Bonus eligibility check
    const retAgeDate = DateUtils.addYears(emp.birthDate, config.extendedRetirementAge);
    const retDate = getNextAppointedDate(retAgeDate);
    
    // Apply extension coefficients ONLY if Extension Scheme is active
    if (isExtensionActive && (currentStatus === '再雇用' || currentStatus === '再雇用(嘱託)') && DateUtils.isAfter(retDate, start) && DateUtils.isBefore(retDate, end)) { 
        const extSettings = getSettings("正社員(延長)"); 
        if (targetMonth === MONTH_SUMMER_BONUS) effectiveCoef = extSettings.bonusMonths.summer; 
        else if (targetMonth === MONTH_WINTER_BONUS) effectiveCoef = extSettings.bonusMonths.winter; 
    }
    
    const hire = emp.hireDate; 
    const promote = DateUtils.addYears(hire, 1);
    
    if (DateUtils.isBefore(end, hire)) return 0;
    
    let finalBonus = 0; 
    const baseAmount = currentBase + (emp.familyAllowance || 0);
    
    if (DateUtils.isAfter(hire, start) && DateUtils.isBefore(hire, end)) { 
        const active = DateUtils.diffDays(hire, end); 
        finalBonus = Math.floor(baseAmount * effectiveCoef * (active / fullDays)); 
    } else if (DateUtils.isAfter(promote, start) && DateUtils.isBefore(promote, end)) { 
        const daysNew = DateUtils.diffDays(start, new Date(promote.getTime() - 86400000)); 
        const daysFull = DateUtils.diffDays(promote, end); 
        const isDriver = emp.job && emp.job.includes('運転士'); 
        const newSt = isDriver ? "正社員(養成)" : "正社員(新卒)"; 
        const newSet = getSettings(newSt); 
        const newCoef = targetMonth === MONTH_SUMMER_BONUS ? newSet.bonusMonths.summer : newSet.bonusMonths.winter; 
        const weightedCoef = (newCoef * (daysNew / fullDays)) + (effectiveCoef * (daysFull / fullDays)); 
        finalBonus = Math.floor(baseAmount * weightedCoef); 
    } else { 
        finalBonus = Math.floor(baseAmount * effectiveCoef); 
    }
    return finalBonus;
};

// FIX: Export 'determineStatus' function to be used in other modules.
export const determineStatus = (emp: Employee, date: Date, config: SimulationConfig) => {
    // 1. Definition of critical dates
    
    // Retirement Age Logic with Implementation Date Support
    // If the check date is BEFORE the implementation date, force 60 as retirement age (Old system)
    let effectiveRetirementAge = config.extendedRetirementAge;
    
    // Strict Guard for Plan B: If config says 60, ignore implementation date logic.
    if (config.extendedRetirementAge > 60 && config.extensionImplementationDate) {
        const implDate = new Date(config.extensionImplementationDate);
        
        // 1. Before implementation date, Old System applies (Retirement at 60)
        if (DateUtils.isBefore(date, implDate)) {
            effectiveRetirementAge = 60;
        } 
        // 2. After implementation date...
        else {
             // Check if this person ALREADY retired under the old system before implementation
             // (i.e. they reached 60 before implementation date)
             const age60Date = DateUtils.addYears(emp.birthDate, 60);
             const oldRetirementDate = getNextAppointedDate(age60Date);
             
             // If they retired before the new system started...
             if (DateUtils.isBefore(oldRetirementDate, implDate)) {
                 // ...and we are NOT converting existing re-emps...
                 if (!config.convertCurrentReempToExtension) {
                     // They stay on the Old System track (Retirement at 60 -> Re-employment)
                     effectiveRetirementAge = 60;
                 }
                 // If converting, we leave it as config.extendedRetirementAge (65), 
                 // so they effectively "un-retire" into Extension status if they are under 65.
             }
        }
    }

    // Retirement Age (Teinen)
    // Rule: "The next May 15th or Nov 15th after reaching the retirement age"
    const retAge = effectiveRetirementAge;
    const ageRetDate = DateUtils.addYears(emp.birthDate, retAge);
    const retirementDate = getNextAppointedDate(ageRetDate);

    // Re-employment Limit -> Part-time Transition
    // Rule: "On the birthday of the re-employment limit age"
    const reempLimitAge = config.reemploymentAge;
    const partTimeStartDate = DateUtils.addYears(emp.birthDate, reempLimitAge);

    // Part-time Limit -> Full Retirement (Contract End)
    // Rule: "On the birthday of the part-time limit age"
    const partLimitAge = config.partTimeAgeLimit;
    const contractEndDate = DateUtils.addYears(emp.birthDate, partLimitAge);

    const oneYearAnniversary = DateUtils.addYears(emp.hireDate, 1);

    // 2. Identify Original Attributes
    const isManager = emp.employmentType === '管理職' || emp.employmentType.includes('嘱託'); 
    
    // 3. Status Determination Logic

    // [A] Pre-hire
    if (DateUtils.isBefore(date, new Date(emp.hireDate.getFullYear(), emp.hireDate.getMonth(), 1))) {
        return '入社前';
    }

    // [B] Contract End (Full Retirement)
    if (DateUtils.isAfterOrEqual(date, contractEndDate)) {
        return '退職';
    }

    // [C] Already Part-time (from Master)
    if (emp.employmentType.includes('パート運転士')) {
        return 'パート運転士(月給制)';
    }

    // [D] Management Track
    if (isManager) {
        if (DateUtils.isAfter(date, retirementDate)) {
            return '再雇用(嘱託)';
        }
        if (emp.employmentType === '嘱託') return '嘱託';
        return '管理職';
    }

    // [E] Special Handling for Existing Re-employed Staff (NEW LOGIC)
    if (emp.employmentType === '再雇用') {
        // Only if flag is TRUE AND they are currently BEFORE the new retirement age (un-retired)
        // AND implementation date has passed (or no impl date set)
        const isImplPassed = !config.extensionImplementationDate || DateUtils.isAfterOrEqual(date, new Date(config.extensionImplementationDate));
        
        if (config.convertCurrentReempToExtension && isImplPassed && DateUtils.isBefore(date, retirementDate)) {
             return '正社員(延長)';
        }
        // Otherwise, they stay '再雇用' (default behavior) or move to Part-time if limit reached
        if (DateUtils.isAfterOrEqual(date, partTimeStartDate)) {
            return 'パート運転士(月給制)';
        }
        return '再雇用';
    }

    // [F] Regular Employee Track
    
    // Phase 1: Post-Retirement
    if (DateUtils.isAfter(date, retirementDate)) {
        
        // Special Rule: Skip Re-employment Phase if Limit Age <= Retirement Age
        if (config.reemploymentAge <= effectiveRetirementAge) {
             return 'パート運転士(月給制)';
        }

        // Standard Re-employment Check
        if (DateUtils.isAfterOrEqual(date, partTimeStartDate)) {
            return 'パート運転士(月給制)';
        }
        return '再雇用';
    }

    // --- PRE-RETIREMENT PHASE ---

    // Check Probation (First 1 Year)
    if (DateUtils.isBefore(date, oneYearAnniversary)) {
        if (emp.employmentType === '正社員(新卒)') return '正社員(新卒)';
        if (emp.employmentType === '正社員(養成)') return '正社員(養成)';
        return emp.employmentType;
    }

    // Regular Employee (After 1 year, Before Retirement)
    // Check for "Extension" Status (60 years old ~ Retirement Date)
    // Assuming standard retirement age base is 60.
    const age60Date = DateUtils.addYears(emp.birthDate, 60);
    const date60Retirement = getNextAppointedDate(age60Date);

    // If the effective retirement age is higher than 60, AND we are past the 60yo retirement date...
    if (effectiveRetirementAge > 60 && DateUtils.isAfter(date, date60Retirement)) {
        return '正社員(延長)';
    }

    return '正社員';
};

export interface FiscalYearDetails {
    total: number;
    breakdown: Breakdown;
    monthlyDetails: MonthlyDetail[];
    finalStatus: string;
    statusChangers: StatusChanger[];
    baseUpImpact: { base: number; bonus: number; variable: number; };
    teishoImpact: { base: number; bonus: number; variable: number; };
}

export const calculateFiscalYearDetails = (
    emp: Employee, 
    fiscalYear: number, 
    config: SimulationConfig, 
    raisePlan: Record<number, RaisePlanYear>, 
    customAllowances: CustomAllowance[], 
    baseUpAmount: number = 0, 
    teishoAmount: number = 0, 
    impactRates: ImpactRateYear = { socialInsuranceRate: 17.5, rippleRate: 0.42, rippleTargets: ['base'] }
): FiscalYearDetails => {
    const monthlyDetails: MonthlyDetail[] = []; 
    let currentBase = emp.currentBaseSalary || emp.baseSalary;
    
    const getSettings = (st: string) => { 
        if (config.employmentSettings[st]) return config.employmentSettings[st]; 
        if (st.includes('正社員')) return config.employmentSettings['正社員']; 
        if (st === '嘱託') return config.employmentSettings['管理職']; 
        return config.employmentSettings['再雇用']; 
    };
    const statusChangers: StatusChanger[] = [];
    
    const marchDate = new Date(fiscalYear, 2, 1);
    let prevStatus = determineStatus(emp, marchDate, config);
    
    let baseUpCost = 0; 
    let baseUpBonusCost = 0;
    let baseUpVariableCost = 0;

    let teishoCost = 0;
    let teishoBonusCost = 0;
    let teishoVariableCost = 0;

    const socRate = (impactRates?.socialInsuranceRate || 17.5) / 100;
    const rippleRate = (impactRates?.rippleRate || 0.42); 
    const rippleTargets = (impactRates?.rippleTargets) || ['base', 'instructor', 'manager', 'work'];

    for (let m = 0; m < 12; m++) {
        let tm = m + 3; if (tm > 11) tm -= 12; let ty = (m + 3 > 11) ? fiscalYear + 1 : fiscalYear; const tDate = new Date(ty, tm, 1);
        
        const status = determineStatus(emp, tDate, config);
        
        if (status !== prevStatus && status !== '入社前') {
            let specificDateStr = `${tm+1}月1日`;
            if (status === '正社員' && (prevStatus === '正社員(新卒)' || prevStatus === '正社員(養成)')) {
                const d = DateUtils.addDays(DateUtils.addYears(emp.hireDate, 1), 1); 
                specificDateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
            } 
            else if ((status === '正社員(延長)' || status === '再雇用' || status === '再雇用(嘱託)') && !status.includes('パート')) {
                const d = getNextAppointedDate(DateUtils.addYears(emp.birthDate, status === '正社員(延長)' ? 60 : config.extendedRetirementAge));
                const changeDate = DateUtils.addDays(d, 1); 
                specificDateStr = `${changeDate.getMonth() + 1}月${changeDate.getDate()}日`;
            } 
            else if (status === 'パート運転士(月給制)' || status === '退職') {
                 const birthday = new Date(ty, emp.birthDate.getMonth(), emp.birthDate.getDate());
                 specificDateStr = `${birthday.getMonth() + 1}月${birthday.getDate()}日`;
            } 
            statusChangers.push({ name: emp.name, prevStatus, newStatus: status, specificDate: specificDateStr });
        }
        prevStatus = status;

        if (status === '入社前' || status === '退職') {
             monthlyDetails.push({ month: tm+1, year: ty, status, baseSalary: 0, allowances: 0, bonus: 0, housing: 0, total: 0, lumpSum: 0, custom: 0, socialInsurance: 0, allowanceDetails: { family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0 } });
             continue;
        }

        // --- Base Salary Determination with Vested Rights Logic ---
        
        // Determine Pre-Implementation Flag for current month
        const implDate = config.extensionImplementationDate ? new Date(config.extensionImplementationDate) : null;
        const isPreImpl = implDate && DateUtils.isBefore(tDate, implDate);

        if (status === emp.employmentType) {
             currentBase = emp.currentBaseSalary || emp.baseSalary;
        } 
        else if (status === 'パート運転士(月給制)') {
            if (emp.employmentType === 'パート運転士(月給制)') {
                currentBase = emp.currentBaseSalary || emp.baseSalary;
            } else {
                currentBase = config.partTimeSalary || 196000;
            }
        } else if (status === '再雇用(嘱託)') {
             if (emp.employmentType === '再雇用(嘱託)') {
                 currentBase = emp.currentBaseSalary || emp.baseSalary;
             } else {
                 const age = DateUtils.getAge(emp.birthDate, tDate);
                 if (age >= 65) currentBase = config.managerShokutakuOver65Salary || 287000;
                 else currentBase = config.managerShokutakuSalary || 480000;
             }
        } else if (status === '再雇用') {
             if (emp.employmentType === '再雇用') {
                 currentBase = emp.currentBaseSalary || emp.baseSalary;
             } else {
                 // Check Implementation Date: Force Legacy Logic if Pre-Implementation
                 // If user customized Plan A settings, they shouldn't apply before the implementation date.
                 if (isPreImpl) {
                     // Enforce Legacy Base (200,000)
                     let tempBase = 200000;
                     if (config.cutLowerLimit && config.cutLowerLimit > 0) tempBase = Math.max(tempBase, config.cutLowerLimit);
                     currentBase = tempBase;
                 } else {
                     // Use Configured Settings (New Logic / Plan A)
                     const s = config.employmentSettings["再雇用"];
                     if (!s) {
                         let tempBase = 200000; 
                         if (config.cutLowerLimit && config.cutLowerLimit > 0) tempBase = Math.max(tempBase, config.cutLowerLimit);
                         currentBase = tempBase;
                     } else {
                         let targetBase = 0;
                         if (s.calculationMethod === 'fixed' && s.fixedSalary) {
                             targetBase = s.fixedSalary;
                         } else {
                             const rate = s.cutRate || 1.0;
                             targetBase = Math.floor((emp.currentBaseSalary || emp.baseSalary) * rate);
                         }
                         
                         if (s.lowerLimit) targetBase = Math.max(targetBase, s.lowerLimit);
                         if (config.cutLowerLimit) targetBase = Math.max(targetBase, config.cutLowerLimit);

                         currentBase = targetBase;
                     }
                 }
             }
        } else if (status === '正社員(延長)') {
            if (emp.employmentType === '正社員(延長)') {
                currentBase = emp.currentBaseSalary || emp.baseSalary;
            } else {
                const s = config.employmentSettings["正社員(延長)"];
                if (s.calculationMethod === 'fixed' && s.fixedSalary) {
                     const originalBase = emp.currentBaseSalary || emp.baseSalary;
                     if (s.useCurrentIfLower === true) {
                         currentBase = Math.min(originalBase, s.fixedSalary);
                     } else {
                         currentBase = s.fixedSalary;
                     }
                } else {
                     let extBase = Math.floor((emp.currentBaseSalary || emp.baseSalary) * (s.cutRate || config.cutRate)); 
                     if (config.cutLowerLimit && config.cutLowerLimit > 0) extBase = Math.max(extBase, config.cutLowerLimit); 
                     if (s.lowerLimit && s.lowerLimit! > 0) extBase = Math.max(extBase, s.lowerLimit!); 
                     if (s.upperLimit && s.upperLimit! > 0) extBase = Math.min(extBase, s.upperLimit!); 
                     currentBase = extBase;
                }
            }
        } else {
             currentBase = emp.currentBaseSalary || emp.baseSalary;
        }

        const s = getSettings(status);
        const fam = s.allowances.family ? (emp.familyAllowance||0) : 0; const chi = s.allowances.child ? (emp.childEduAllowance||0) : 0; const ins = s.allowances.instructor ? (emp.instructorAllowance||0) : 0; const man = s.allowances.manager ? (emp.managerAllowance||0) : 0; const wrk = s.allowances.work ? (emp.workAllowance||0) : 0;
        
        let custom = 0;
        let customRippleBase = 0; 

        if (customAllowances && customAllowances.length > 0) {
            const currentAge = DateUtils.getAge(emp.birthDate, tDate); 
            const currentTenure = DateUtils.getTenure(emp.hireDate, tDate);
            
            customAllowances.forEach(ca => { 
                const isEnabled = ca.enabled ? ca.enabled[status] : true; 
                if (!isEnabled) return;
                const typeAmount = ca.amounts[status] || 0;
                
                if (typeAmount > 0) {
                    let isMatch = true;
                    if (ca.ageMin !== '' && currentAge < parseInt(ca.ageMin as string)) isMatch = false; 
                    if (ca.ageMax !== '' && currentAge >= parseInt(ca.ageMax as string)) isMatch = false; 
                    if (ca.tenureMin !== '' && currentTenure < parseInt(ca.tenureMin as string)) isMatch = false; 
                    if (ca.tenureMax !== '' && currentTenure >= parseInt(ca.tenureMax as string)) isMatch = false; 
                    if (ca.hireDateMin) {
                        const minHireDate = new Date(ca.hireDateMin);
                        if (!isNaN(minHireDate.getTime()) && DateUtils.isBefore(emp.hireDate, minHireDate)) isMatch = false;
                    }

                    if (isMatch) {
                        custom += typeAmount;
                        if (ca.isRippleTarget !== false) customRippleBase += typeAmount;
                    } 
                }
            });
        }

        // Variable Allowance (Ripple)
        let variableAllowance = 0;
        // Updated exclusion check to catch all management/shokutaku types
        if (status !== '管理職' && !status.includes('嘱託')) {
            let rippleBase = 0;
            if (rippleTargets.includes('base')) rippleBase += currentBase;
            if (rippleTargets.includes('family')) rippleBase += fam;
            if (rippleTargets.includes('child')) rippleBase += chi;
            if (rippleTargets.includes('instructor')) rippleBase += ins;
            if (rippleTargets.includes('manager')) rippleBase += man;
            if (rippleTargets.includes('work')) rippleBase += wrk;
            rippleBase += customRippleBase;
            
            variableAllowance = Math.floor(rippleBase * rippleRate);
        }
        
        let bon = 0; 
        if ([MONTH_SUMMER_BONUS, MONTH_WINTER_BONUS, MONTH_TERM_END_BONUS].includes(tm)) { 
            bon = calculateBonus(emp, tm, ty, currentBase, status, config, getSettings); 
            if (baseUpAmount > 0) {
                 const bonusWith = calculateBonus(emp, tm, ty, currentBase + baseUpAmount, status, config, getSettings);
                 baseUpBonusCost += (bonusWith - bon);
            }
            if (teishoAmount > 0) {
                 const bonusWith = calculateBonus(emp, tm, ty, currentBase + teishoAmount, status, config, getSettings);
                 teishoBonusCost += (bonusWith - bon);
            }
        }
        if (baseUpAmount > 0) {
             baseUpCost += baseUpAmount;
             if (rippleTargets.includes('base') && status !== '管理職' && !status.includes('嘱託')) {
                 baseUpVariableCost += Math.floor(baseUpAmount * rippleRate);
             }
        }
        if (teishoAmount > 0) {
             teishoCost += teishoAmount;
             if (rippleTargets.includes('base') && status !== '管理職' && !status.includes('嘱託')) {
                 teishoVariableCost += Math.floor(teishoAmount * rippleRate);
             }
        }

        let hou = 0; 
        // Housing Allowance Timing: Payment coincides with Summer (June/July) and Winter (Dec) Bonuses
        if (s.housingAid.enabled && [MONTH_SUMMER_BONUS, MONTH_WINTER_BONUS].includes(tm)) { 
            hou = (fam > 0) ? s.housingAid.withFamily : s.housingAid.noFamily; 
            if (DateUtils.isBefore(tDate, emp.hireDate)) hou = 0; 
        }
        
        let lump = 0;
        if (tm === MONTH_TERM_END_BONUS && s.lumpSumEnabled !== false) {
            lump = s.lumpSum[fiscalYear] || 0;
        }
        
        const allw = fam + chi + ins + man + wrk + custom + variableAllowance; 
        const bonusTotal = bon + lump;
        const wageTotal = currentBase + allw + hou;
        const socIns = Math.floor((bonusTotal + wageTotal) * socRate);
        const tot = currentBase + allw + bon + hou + lump + socIns;

        monthlyDetails.push({ 
            month: tm+1, year: ty, status, 
            baseSalary: currentBase, 
            allowances: allw, 
            allowanceDetails: { family: fam, child: chi, instructor: ins, manager: man, work: wrk, custom: custom, variable: variableAllowance },
            bonus: bon, housing: hou, lumpSum: lump, custom: custom, socialInsurance: socIns, total: tot 
        });
    }
    const annualTotal = monthlyDetails.reduce((a, b) => a + b.total, 0); 
    const breakdown = monthlyDetails.reduce((acc, m) => { 
        acc.base += m.baseSalary; 
        acc.allow += m.allowances; 
        acc.bonus += m.bonus; 
        acc.house += m.housing; 
        acc.lump += m.lumpSum; 
        acc.custom += m.custom;
        acc.socialInsurance += m.socialInsurance;
        
        acc.allowDetails.family += m.allowanceDetails.family;
        acc.allowDetails.child += m.allowanceDetails.child;
        acc.allowDetails.instructor += m.allowanceDetails.instructor;
        acc.allowDetails.manager += m.allowanceDetails.manager;
        acc.allowDetails.work += m.allowanceDetails.work;
        acc.allowDetails.custom += m.allowanceDetails.custom;
        acc.allowDetails.variable += m.allowanceDetails.variable;
        
        return acc; 
    }, { base:0, allow:0, bonus:0, house:0, lump:0, custom:0, socialInsurance: 0, allowDetails: { family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0 } });
    
    return { 
        total: Math.floor(annualTotal), 
        breakdown, 
        monthlyDetails, 
        finalStatus: monthlyDetails[11].status, 
        statusChangers, 
        baseUpImpact: { base: baseUpCost, bonus: baseUpBonusCost, variable: baseUpVariableCost },
        teishoImpact: { base: teishoCost, bonus: teishoBonusCost, variable: teishoVariableCost } 
    };
};

export function runSimulation(
    employees: Employee[], 
    config: SimulationConfig, 
    recruitmentPlan: Record<number, RecruitmentPlanYear>, 
    raisePlan: Record<number, RaisePlanYear>, 
    customAllowances: CustomAllowance[], 
    impactRates: Record<number, ImpactRateYear>
): SimulationResult {
    const years = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
    const summary: YearResult[] = [];
    const individuals: any[] = [];

    // FIX: Use Deep Copy to prevent shared state mutations across different scenarios (A/B/C)
    const currentEmployees = JSON.parse(JSON.stringify(employees)).map((e: any) => ({
        ...e,
        hireDate: new Date(e.hireDate),
        birthDate: new Date(e.birthDate),
        currentBaseSalary: e.baseSalary
    }));

    for (const year of years) {
        const yearResult: YearResult = {
            year,
            totalCost: 0,
            breakdownSum: { base: 0, allow: 0, bonus: 0, house: 0, lump: 0, custom: 0, socialInsurance: 0, allowDetails: { family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0 } },
            monthlyAggregates: Array(12).fill(null).map((_, i) => ({ 
                month: i + 1, totalCost: 0, baseSalary: 0, allowances: 0, bonus: 0, housing: 0, lumpSum: 0, custom: 0, socialInsurance: 0,
                allowDetails: { family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0 },
                typeDetails: {} as any, count: 0, statusChangers: [] 
            })),
            monthlyHeadcount: [],
            headcount: {} as Record<string, number>,
            typeAggregates: {} as Record<string, any>,
            activeCount: 0,
            baseUpImpact: { total: 0, perCapita: 0, breakdown: {} as any },
            teishoImpact: { total: 0, perCapita: 0, breakdown: {} as any },
            avgSalary: 0,
            avgAge: 0,
            avgTenure: 0
        };

        const rPlan = raisePlan[year] || { 
            averageAmount: 0, 
            detailed: {
                seishain_l1: 0, seishain_l2: 0, seishain_l3: 0, seishain_new: 0,
                newgrad_l1: 0, newgrad_l2: 0, newgrad_l3: 0, newgrad_new: 0,
                trainee_l1: 0, trainee_l2: 0, trainee_l3: 0, trainee_new: 0,
                extended: 0, reemp: 0, parttime: 0, management: 0, shokutaku: 0, reemp_shokutaku: 0
            }, 
            yearlyRaise: 0,
            raiseRate: 0
        };
        const recPlan = recruitmentPlan[year] || { newGrad: 0, newGradSalary: 0, driver: 0, driverSalary: 0 };
        const iRates = impactRates[year] || { socialInsuranceRate: 17.5, rippleRate: 0.42, rippleTargets: ['base', 'instructor', 'manager', 'work'] };

        // 1. Add New Hires (Assume Oct 1st)
        for(let i=0; i<(recPlan.newGrad || 0); i++) {
            currentEmployees.push({
                id: 900000 + year * 100 + i,
                name: `新卒${year}-${i+1}`,
                birthDate: new Date(year - 22, 3, 2),
                hireDate: new Date(year, 9, 1),
                baseSalary: recPlan.newGradSalary,
                currentBaseSalary: recPlan.newGradSalary,
                familyAllowance: 0, childEduAllowance: 0, instructorAllowance: 0, managerAllowance: 0, workAllowance: 0,
                employmentType: '正社員(新卒)',
                unionType: '組合員',
                job: '運転士'
            });
        }
        for(let i=0; i<(recPlan.driver || 0); i++) {
            currentEmployees.push({
                id: 800000 + year * 100 + i,
                name: `中途${year}-${i+1}`,
                birthDate: new Date(year - 40, 3, 2),
                hireDate: new Date(year, 9, 1),
                baseSalary: recPlan.driverSalary,
                currentBaseSalary: recPlan.driverSalary,
                familyAllowance: 0, childEduAllowance: 0, instructorAllowance: 0, managerAllowance: 0, workAllowance: 0,
                employmentType: '正社員(養成)',
                unionType: '組合員',
                job: '運転士'
            });
        }

        // 2. Apply Raises (April 1st)
        
        currentEmployees.forEach(emp => {
            // Apply raise only if hired before April 1st of current year
            if (DateUtils.isBefore(emp.hireDate, new Date(year, 3, 1))) {
                const status = determineStatus(emp, new Date(year, 3, 1), config);
                let bu = 0;
                let teisho = 0;
                
                // Base Up Logic
                // --- STRICT CHECK: Ensure Managment/Shokutaku/ReempShokutaku ONLY use their explicit detail, never average ---
                const isExcludedType = status === '管理職' || status === '嘱託' || status === '再雇用(嘱託)';

                if (!isExcludedType) {
                    if (status === '正社員') {
                        const sys = getSalarySystem(emp.hireDate);
                        if (sys === 'legacy1') bu = rPlan.detailed.seishain_l1 || rPlan.averageAmount;
                        else if (sys === 'legacy2') bu = rPlan.detailed.seishain_l2 || rPlan.averageAmount;
                        else if (sys === 'legacy3') bu = rPlan.detailed.seishain_l3 || 0;
                        else bu = rPlan.detailed.seishain_new || rPlan.averageAmount;
                    } else if (status === '正社員(新卒)') {
                        bu = rPlan.detailed.newgrad_new || 0;
                    } else if (status === '正社員(養成)') {
                        bu = rPlan.detailed.trainee_new || 0;
                    } else if (status === '正社員(延長)') {
                        const s = config.employmentSettings["正社員(延長)"];
                        const age = DateUtils.getAge(emp.birthDate, new Date(year, 3, 1));
                        if (!s.bearStopAge || age < s.bearStopAge) {
                            bu = rPlan.detailed.extended || 0;
                        }
                    } else if (status === '再雇用') {
                        bu = rPlan.detailed.reemp || 0;
                    } else if (status === 'パート運転士(月給制)') {
                        bu = rPlan.detailed.parttime || 0;
                    }
                    
                    // Periodic Raise (Teisho) Logic - Exclude non-standard
                    if (!status.includes('パート') && !status.includes('再雇用')) {
                        // Check autoRaiseEnabled flag
                        if (config.autoRaiseEnabled !== false) {
                            teisho = rPlan.yearlyRaise || 0;
                        } else {
                            teisho = 0;
                        }
                    }
                } else {
                    // Excluded Types: Explicitly set from detailed plan or force 0.
                    // DO NOT use averageAmount fallback.
                    if (status === '管理職') bu = rPlan.detailed.management || 0;
                    else if (status === '嘱託') bu = rPlan.detailed.shokutaku || 0;
                    else if (status === '再雇用(嘱託)') bu = rPlan.detailed.reemp_shokutaku || 0;
                    
                    teisho = 0; // Force 0 Teisho for these types
                }

                const totalRaise = bu + teisho;
                
                // FIX: Prevent master overwrite for fixed-salary types
                // Including: Management, Shokutaku, Re-employment, Re-emp(Shokutaku), Part-time, Extension
                const isFixedMasterType = status === '管理職' || status === '嘱託' || status === '再雇用' || status === '再雇用(嘱託)' || status === 'パート運転士(月給制)' || status === '正社員(延長)';
                
                if (totalRaise > 0 && !isFixedMasterType) {
                    if (!emp.currentBaseSalary) emp.currentBaseSalary = emp.baseSalary;
                    emp.currentBaseSalary += totalRaise;
                }
            }
        });

        // 3. Monthly Calculation
        let yearTotalAge = 0;
        let yearTotalTenure = 0;
        let yearActiveCount = 0;

        currentEmployees.forEach(emp => {
            let thisYearBU = 0;
            let thisYearTeisho = 0;

            if (DateUtils.isBefore(emp.hireDate, new Date(year, 3, 1))) {
                 const status = determineStatus(emp, new Date(year, 3, 1), config);
                 
                 // --- STRICT EXCLUSION CHECK FIRST ---
                 const isExcludedType = status === '管理職' || status === '嘱託' || status === '再雇用(嘱託)';
                 
                 if (!isExcludedType) {
                     if (status === '正社員') {
                        const sys = getSalarySystem(emp.hireDate);
                        if (sys === 'legacy1') thisYearBU = rPlan.detailed.seishain_l1 || rPlan.averageAmount;
                        else if (sys === 'legacy2') thisYearBU = rPlan.detailed.seishain_l2 || rPlan.averageAmount;
                        else if (sys === 'legacy3') thisYearBU = rPlan.detailed.seishain_l3 || 0;
                        else thisYearBU = rPlan.detailed.seishain_new || rPlan.averageAmount;
                    } else if (status === '正社員(新卒)') thisYearBU = rPlan.detailed.newgrad_new || 0;
                    else if (status === '正社員(養成)') thisYearBU = rPlan.detailed.trainee_new || 0;
                    else if (status === '正社員(延長)') {
                        const s = config.employmentSettings["正社員(延長)"];
                        const age = DateUtils.getAge(emp.birthDate, new Date(year, 3, 1));
                        if (!s.bearStopAge || age < s.bearStopAge) {
                            thisYearBU = rPlan.detailed.extended || 0;
                        }
                    } else if (status === '再雇用') thisYearBU = rPlan.detailed.reemp || 0;
                    else if (status === 'パート運転士(月給制)') thisYearBU = rPlan.detailed.parttime || 0;
                    
                    // Exclude Teisho for non-standard
                    if (!status.includes('パート') && !status.includes('再雇用')) {
                        thisYearTeisho = rPlan.yearlyRaise || 0;
                    }
                 } else {
                     // Excluded types specific logic for reporting
                     if (status === '管理職') thisYearBU = rPlan.detailed.management || 0;
                     else if (status === '嘱託') thisYearBU = rPlan.detailed.shokutaku || 0;
                     else if (status === '再雇用(嘱託)') thisYearBU = rPlan.detailed.reemp_shokutaku || 0;
                     
                     thisYearTeisho = 0;
                 }
            }

            const res = calculateFiscalYearDetails(emp, year, config, raisePlan, customAllowances, thisYearBU, thisYearTeisho, iRates);

            if (res.finalStatus !== '退職' && res.finalStatus !== '入社前') {
                yearResult.totalCost += res.total;
                yearResult.breakdownSum.base += res.breakdown.base;
                yearResult.breakdownSum.allow += res.breakdown.allow;
                yearResult.breakdownSum.bonus += res.breakdown.bonus;
                yearResult.breakdownSum.house += res.breakdown.house;
                yearResult.breakdownSum.lump += res.breakdown.lump;
                yearResult.breakdownSum.custom += res.breakdown.custom;
                yearResult.breakdownSum.socialInsurance += res.breakdown.socialInsurance;
                
                yearResult.breakdownSum.allowDetails.family += res.breakdown.allowDetails.family;
                yearResult.breakdownSum.allowDetails.child += res.breakdown.allowDetails.child;
                yearResult.breakdownSum.allowDetails.instructor += res.breakdown.allowDetails.instructor;
                yearResult.breakdownSum.allowDetails.manager += res.breakdown.allowDetails.manager;
                yearResult.breakdownSum.allowDetails.work += res.breakdown.allowDetails.work;
                yearResult.breakdownSum.allowDetails.custom += res.breakdown.allowDetails.custom;
                yearResult.breakdownSum.allowDetails.variable += res.breakdown.allowDetails.variable;

                const endStatus = res.finalStatus;
                if (!yearResult.headcount[endStatus]) yearResult.headcount[endStatus] = 0;
                yearResult.headcount[endStatus]++;

                if (!yearResult.typeAggregates[endStatus]) yearResult.typeAggregates[endStatus] = { totalCost: 0, count: 0 };
                yearResult.typeAggregates[endStatus].totalCost += res.total;
                yearResult.typeAggregates[endStatus].count++;

                // Base Up Impact Aggregation
                yearResult.baseUpImpact.total += (res.baseUpImpact.base + res.baseUpImpact.bonus + res.baseUpImpact.variable);
                if (!yearResult.baseUpImpact.breakdown[endStatus]) yearResult.baseUpImpact.breakdown[endStatus] = { base:0, bonus:0, variable:0, count:0 };
                yearResult.baseUpImpact.breakdown[endStatus].base += res.baseUpImpact.base;
                yearResult.baseUpImpact.breakdown[endStatus].bonus += res.baseUpImpact.bonus;
                yearResult.baseUpImpact.breakdown[endStatus].variable += res.baseUpImpact.variable;
                yearResult.baseUpImpact.breakdown[endStatus].count++;

                // Teisho Impact Aggregation
                yearResult.teishoImpact.total += (res.teishoImpact.base + res.teishoImpact.bonus + res.teishoImpact.variable);
                if (!yearResult.teishoImpact.breakdown[endStatus]) yearResult.teishoImpact.breakdown[endStatus] = { base:0, bonus:0, variable:0, count:0 };
                yearResult.teishoImpact.breakdown[endStatus].base += res.teishoImpact.base;
                yearResult.teishoImpact.breakdown[endStatus].bonus += res.teishoImpact.bonus;
                yearResult.teishoImpact.breakdown[endStatus].variable += res.teishoImpact.variable;
                yearResult.teishoImpact.breakdown[endStatus].count++;

                const age = DateUtils.getAge(emp.birthDate, new Date(year, 11, 31));
                const tenure = DateUtils.getTenure(emp.hireDate, new Date(year, 11, 31));
                yearTotalAge += age;
                yearTotalTenure += tenure;
                yearActiveCount++;

                individuals.push({
                    id: emp.id,
                    name: emp.name,
                    year: year,
                    type: endStatus,
                    unionType: emp.unionType,
                    base: res.breakdown.base,
                    finalBase: res.monthlyDetails[11].baseSalary, // Add final base for list view
                    bonus: res.breakdown.bonus,
                    allowance: res.breakdown.allow,
                    allowanceDetail: res.breakdown.allowDetails,
                    housing: res.breakdown.house,
                    lumpSum: res.breakdown.lump,
                    socialInsurance: res.breakdown.socialInsurance,
                    total: res.total,
                    totalExclSoc: res.total - res.breakdown.socialInsurance,
                    hireDate: emp.hireDate,
                    birthDate: emp.birthDate,
                    job: emp.job,
                    baseUpImpact: res.baseUpImpact,
                    teishoImpact: res.teishoImpact
                });
            }

            res.monthlyDetails.forEach(m => {
                if (m.status !== '退職' && m.status !== '入社前') {
                    const idx = m.month - 1;
                    yearResult.monthlyAggregates[idx].totalCost += m.total;
                    yearResult.monthlyAggregates[idx].baseSalary += m.baseSalary;
                    yearResult.monthlyAggregates[idx].allowances += m.allowances;
                    yearResult.monthlyAggregates[idx].bonus += m.bonus;
                    yearResult.monthlyAggregates[idx].housing += m.housing;
                    yearResult.monthlyAggregates[idx].lumpSum += m.lumpSum;
                    yearResult.monthlyAggregates[idx].custom += m.custom;
                    yearResult.monthlyAggregates[idx].socialInsurance += m.socialInsurance;
                    
                    yearResult.monthlyAggregates[idx].allowDetails.family += m.allowanceDetails.family;
                    yearResult.monthlyAggregates[idx].allowDetails.child += m.allowanceDetails.child;
                    yearResult.monthlyAggregates[idx].allowDetails.instructor += m.allowanceDetails.instructor;
                    yearResult.monthlyAggregates[idx].allowDetails.manager += m.allowanceDetails.manager;
                    yearResult.monthlyAggregates[idx].allowDetails.work += m.allowanceDetails.work;
                    yearResult.monthlyAggregates[idx].allowDetails.custom += m.allowanceDetails.custom;
                    yearResult.monthlyAggregates[idx].allowDetails.variable += m.allowanceDetails.variable;

                    if (!yearResult.monthlyAggregates[idx].typeDetails[m.status]) yearResult.monthlyAggregates[idx].typeDetails[m.status] = { total: 0, count: 0 };
                    yearResult.monthlyAggregates[idx].typeDetails[m.status].total += m.total;
                    yearResult.monthlyAggregates[idx].typeDetails[m.status].count++;
                }
            });
        });

        yearResult.activeCount = yearActiveCount;
        if (yearActiveCount > 0) {
            yearResult.avgSalary = Math.round(yearResult.totalCost / yearActiveCount);
            yearResult.avgAge = parseFloat((yearTotalAge / yearActiveCount).toFixed(1));
            yearResult.avgTenure = parseFloat((yearTotalTenure / yearActiveCount).toFixed(1));
            yearResult.baseUpImpact.perCapita = Math.round(yearResult.baseUpImpact.total / yearActiveCount);
        }

        summary.push(yearResult);
    }

    return { summary, individuals };
}
