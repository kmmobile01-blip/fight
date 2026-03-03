
import { Employee, SimulationConfig, SimulationResult, TypeSettings, RaisePlanYear, CustomAllowance, MonthlyAggregate, StatusChanger, BaseUpImpact, RecruitmentPlanYear, ImpactRateYear } from '../types';

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
        housingAid: { enabled: false, withFamily: 0, noFamily: 0 }, lumpSum: {}, lumpSumEnabled: true
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

const calculateBonus = (emp: Employee, targetMonth: number, targetYear: number, currentBase: number, currentStatus: string, config: SimulationConfig, getSettings: (status: string) => TypeSettings) => {
    const settings = getSettings(currentStatus);
    let bonusMonthVal = 0;
    let start: Date, end: Date;
    if (targetMonth === 6) { bonusMonthVal = settings.bonusMonths.summer; start = new Date(targetYear - 1, 10, 16); end = new Date(targetYear, 4, 15); } 
    else if (targetMonth === 11) { bonusMonthVal = settings.bonusMonths.winter; start = new Date(targetYear, 4, 16); end = new Date(targetYear, 10, 15); } 
    else if (targetMonth === 2) { bonusMonthVal = settings.bonusMonths.end; start = new Date(targetYear, 3, 1); end = new Date(targetYear + 1, 2, 31); } 
    else return 0;
    
    if (bonusMonthVal === 0) return 0;
    
    const fullDays = DateUtils.diffDays(start, end);
    let effectiveCoef = bonusMonthVal;
    
    // Determine retirement date logic for Bonus eligibility check
    const retAgeDate = DateUtils.addYears(emp.birthDate, config.extendedRetirementAge);
    const retDate = getNextAppointedDate(retAgeDate);
    
    if ((currentStatus === '再雇用' || currentStatus === '再雇用(嘱託)') && DateUtils.isAfter(retDate, start) && DateUtils.isBefore(retDate, end)) { 
        const extSettings = getSettings("正社員(延長)"); 
        if (targetMonth === 6) effectiveCoef = extSettings.bonusMonths.summer; 
        else if (targetMonth === 11) effectiveCoef = extSettings.bonusMonths.winter; 
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
        const newCoef = targetMonth === 6 ? newSet.bonusMonths.summer : newSet.bonusMonths.winter; 
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
    
    // Retirement Age (Teinen)
    // Rule: "The next May 15th or Nov 15th after reaching the retirement age"
    const retAge = config.extendedRetirementAge;
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
        if (config.convertCurrentReempToExtension && DateUtils.isBefore(date, retirementDate)) {
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
        if (config.reemploymentAge <= config.extendedRetirementAge) {
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

    // If the configured retirement age is higher than 60, AND we are past the 60yo retirement date...
    if (config.extendedRetirementAge > 60 && DateUtils.isAfter(date, date60Retirement)) {
        return '正社員(延長)';
    }

    return '正社員';
};


export const calculateFiscalYearDetails = (
    emp: Employee, 
    fiscalYear: number, 
    config: SimulationConfig, 
    raisePlan: Record<number, RaisePlanYear>, 
    customAllowances: CustomAllowance[], 
    baseUpAmount: number = 0, 
    teishoAmount: number = 0, 
    impactRates: ImpactRateYear = { socialInsuranceRate: 17.5, rippleRate: 0.42, rippleTargets: ['base'] }
) => {
    const monthlyDetails = []; 
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

    const socRate = impactRates.socialInsuranceRate / 100;
    const rippleRate = impactRates.rippleRate; 
    const rippleTargets = impactRates.rippleTargets || ['base', 'instructor', 'manager', 'work'];

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
        
        // 既得権維持ロジック: 現在のステータスがマスタと一致する場合、現在給与を維持する
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
             // Manager -> Shokutaku or Shokutaku -> Shokutaku(Over65)
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
                 let tempBase = 200000; 
                 if (config.cutLowerLimit && config.cutLowerLimit > 0) tempBase = Math.max(tempBase, config.cutLowerLimit);
                 currentBase = tempBase;
             }
        } else if (status === '正社員(延長)') {
            // Check if user was ALREADY extension in master
            if (emp.employmentType === '正社員(延長)') {
                currentBase = emp.currentBaseSalary || emp.baseSalary;
            } else {
                // Transitioned into Extension
                const s = config.employmentSettings["正社員(延長)"];
                if (s.calculationMethod === 'fixed' && s.fixedSalary) {
                     const originalBase = emp.currentBaseSalary || emp.baseSalary;
                     if (s.useCurrentIfLower === true) {
                         // Logic: "Fixed is the max cap. If current is lower, stay current. If current is higher, drop to fixed."
                         currentBase = Math.min(originalBase, s.fixedSalary);
                     } else {
                         // Default Fixed Logic: Everyone gets Fixed Amount
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
             // Default for Regular / Manager / Shokutaku (if not caught above)
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
        if (status !== '管理職' && status !== '再雇用(嘱託)' && status !== '嘱託') {
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
        if ([6, 11, 2].includes(tm)) { 
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
             if (rippleTargets.includes('base') && status !== '管理職' && status !== '再雇用(嘱託)' && status !== '嘱託') {
                 baseUpVariableCost += Math.floor(baseUpAmount * rippleRate);
             }
        }
        if (teishoAmount > 0) {
             teishoCost += teishoAmount;
             if (rippleTargets.includes('base') && status !== '管理職' && status !== '再雇用(嘱託)' && status !== '嘱託') {
                 teishoVariableCost += Math.floor(teishoAmount * rippleRate);
             }
        }

        let hou = 0; if (s.housingAid.enabled && [6, 11].includes(tm)) { hou = (fam > 0) ? s.housingAid.withFamily : s.housingAid.noFamily; if (DateUtils.isBefore(tDate, emp.hireDate)) hou = 0; }
        
        let lump = 0;
        if (tm === 2 && s.lumpSumEnabled !== false) {
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
    const summary: any[] = [];
    const individuals: any[] = [];

    // Clone employees to avoid mutating original state in React (though we mutate this clone)
    let currentEmployees = employees.map(e => ({ ...e, currentBaseSalary: e.baseSalary }));

    for (const year of years) {
        // Prepare summary object
        const yearResult = {
            year,
            totalCost: 0,
            breakdownSum: { base: 0, allow: 0, bonus: 0, house: 0, lump: 0, custom: 0, socialInsurance: 0, allowDetails: { family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0 } },
            monthlyAggregates: Array(12).fill(null).map((_, i) => ({ 
                month: i + 1, totalCost: 0, baseSalary: 0, allowances: 0, bonus: 0, housing: 0, lumpSum: 0, custom: 0, socialInsurance: 0,
                allowDetails: { family: 0, child: 0, instructor: 0, manager: 0, work: 0, custom: 0, variable: 0 },
                typeDetails: {} as any, count: 0, statusChangers: [] 
            })),
            headcount: {} as Record<string, number>,
            typeAggregates: {} as Record<string, any>,
            activeCount: 0,
            baseUpImpact: { total: 0, perCapita: 0, breakdown: {} as any },
            teishoImpact: { total: 0, perCapita: 0, breakdown: {} as any },
            avgSalary: 0,
            avgAge: 0,
            avgTenure: 0
        };

        const rPlan = raisePlan[year] || { averageAmount: 0, detailed: {}, yearlyRaise: 0, raiseRate: 0 };
        const recPlan = recruitmentPlan[year] || { newGrad: 0, newGradSalary: 0, driver: 0, driverSalary: 0 };
        const iRates = impactRates[year] || { socialInsuranceRate: 17.5, rippleRate: 0.42, rippleTargets: ['base'] };
        
        let yearActiveCount = 0;
        let yearTotalAge = 0;
        let yearTotalTenure = 0;

        currentEmployees.forEach(emp => {
            let thisYearBU = 0;
            let thisYearTeisho = 0;
            if (DateUtils.isBefore(emp.hireDate, new Date(year, 3, 1))) {
                const status = determineStatus(emp, new Date(year, 3, 1), config);
                thisYearTeisho = (!status.includes('パート') && !status.includes('嘱託') && status !== '管理職') ? (rPlan.yearlyRaise || 0) : 0;
            }

            const res = calculateFiscalYearDetails(emp, year, config, raisePlan, customAllowances, thisYearBU, thisYearTeisho, iRates);

            if (res.finalStatus !== '退職' && res.finalStatus !== '入社前') {
                yearResult.totalCost += res.total;
                yearActiveCount++;
                const endOfYearDate = new Date(year + 1, 2, 31);
                yearTotalAge += DateUtils.getAge(emp.birthDate, endOfYearDate);
                yearTotalTenure += DateUtils.getTenure(emp.hireDate, endOfYearDate);
            }
        });

        yearResult.activeCount = yearActiveCount;
        if(yearActiveCount > 0) {
            yearResult.avgSalary = Math.round(yearResult.totalCost / yearActiveCount);
            yearResult.avgAge = parseFloat((yearTotalAge / yearActiveCount).toFixed(1));
            yearResult.avgTenure = parseFloat((yearTotalTenure / yearActiveCount).toFixed(1));
        }

        summary.push(yearResult);
    }
// FIX: Added missing return statement. The function should return the generated summary and individuals arrays.
    return { summary, individuals };
}
