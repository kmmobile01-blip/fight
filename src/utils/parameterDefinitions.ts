
import { SimulationConfig, TypeSettings, RaisePlanYear, RecruitmentPlanYear, ImpactRateYear } from '../types';

export interface ParameterDef {
    id: string;
    category: string;
    path: string;
    name: string;
    description: string;
    type: 'number' | 'boolean' | 'string' | 'object';
    tags?: string[];
}

export const PARAMETER_CATALOG: ParameterDef[] = [
    // --- 1. 制度設計 (Config) ---
    { id: 'cfg_retire_age', category: '制度基本', path: 'config.extendedRetirementAge', name: '定年年齢', description: '正社員としての定年年齢。これを超えると再雇用/延長へ移行。', type: 'number' },
    { id: 'cfg_reemp_age', category: '制度基本', path: 'config.reemploymentAge', name: '再雇用上限年齢', description: '再雇用契約の上限。これを超えるとパートへ移行。', type: 'number' },
    { id: 'cfg_part_age', category: '制度基本', path: 'config.partTimeAgeLimit', name: 'パート上限年齢', description: '完全引退となる年齢。', type: 'number' },
    { id: 'cfg_cut_rate', category: '制度基本', path: 'config.cutRate', name: 'デフォルト給与支給率', description: '延長・再雇用時の基本給支給率（現役比）。', type: 'number' },
    { id: 'cfg_cut_lower', category: '制度基本', path: 'config.cutLowerLimit', name: '最低保証額', description: '給与カット後の下限額。', type: 'number' },
    { id: 'cfg_cut_upper', category: '制度基本', path: 'config.cutUpperLimit', name: '支給上限額', description: '給与カット後の上限キャップ。', type: 'number' },
    { id: 'cfg_part_sal', category: '制度基本', path: 'config.partTimeSalary', name: 'パート月給', description: 'パート運転士の固定月給。', type: 'number' },
    { id: 'cfg_mgr_shoku', category: '制度基本', path: 'config.managerShokutakuSalary', name: '管理職嘱託給(U65)', description: '65歳未満の元管理職嘱託の月給。', type: 'number' },
    { id: 'cfg_mgr_shoku65', category: '制度基本', path: 'config.managerShokutakuOver65Salary', name: '管理職嘱託給(O65)', description: '65歳以上の元管理職嘱託の月給。', type: 'number' },
    
    // --- 2. 雇用区分別設定 (Employment Settings) ---
    // 代表として「正社員(延長)」の設定を展開（他区分も構造は同じ）
    { id: 'emp_ext_calc', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].calculationMethod', name: '基本給決定方式', description: "'rate'(率) または 'fixed'(固定額)。", type: 'string' },
    { id: 'emp_ext_fix', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].fixedSalary', name: '固定基本給額', description: '固定額方式の場合の金額。', type: 'number' },
    { id: 'emp_ext_bon_s', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].bonusMonths.summer', name: '夏賞与月数', description: '夏期賞与の支給月数。', type: 'number' },
    { id: 'emp_ext_bon_w', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].bonusMonths.winter', name: '冬賞与月数', description: '冬期賞与の支給月数。', type: 'number' },
    { id: 'emp_ext_house', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].housingAid.enabled', name: '住宅手当支給', description: '住宅手当を支給するか否か。', type: 'boolean' },
    { id: 'emp_ext_allow_family', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowances.family', name: '家族手当 支給有無', description: '延長社員に家族手当を支給するか。', type: 'boolean' },
    { id: 'emp_ext_allow_child', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowances.child', name: '子女教育手当 支給有無', description: '延長社員に子女教育手当を支給するか。', type: 'boolean' },
    { id: 'emp_ext_allow_instructor', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowances.instructor', name: '指導手当 支給有無', description: '延長社員に指導手当を支給するか。', type: 'boolean' },
    { id: 'emp_ext_allow_manager', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowances.manager', name: '管理手当 支給有無', description: '延長社員に管理手当を支給するか。', type: 'boolean' },
    { id: 'emp_ext_allow_work', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowances.work', name: '業務手当 支給有無', description: '延長社員に業務手当を支給するか。', type: 'boolean' },
    { id: 'emp_ext_amt_family_spouse', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowanceAmounts.family.spouse', name: '家族手当(配偶者)額', description: '延長社員の家族手当（配偶者）の金額。', type: 'number' },
    { id: 'emp_ext_amt_child_edu', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowanceAmounts.childEdu', name: '子女教育手当額', description: '延長社員の子女教育手当の金額。', type: 'number' },
    { id: 'emp_ext_amt_instructor', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowanceAmounts.instructor', name: '指導手当額', description: '延長社員の指導手当の金額。', type: 'number' },
    { id: 'emp_ext_amt_manager', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowanceAmounts.manager.type1', name: '管理手当額', description: '延長社員の管理手当の金額（代表値）。', type: 'number' },
    { id: 'emp_ext_amt_work', category: '延長社員設定', path: 'employmentSettings["正社員(延長)"].allowanceAmounts.work.type1', name: '業務手当額', description: '延長社員の業務手当の金額（代表値）。', type: 'number' },

    // --- 3. 年度計画 (Plans) - Dynamic Keys ---
    { id: 'pln_raise_avg', category: '賃上げ計画', path: 'raisePlan[year].averageAmount', name: '平均ベア額', description: '該当年度の正社員平均ベースアップ額。', type: 'number' },
    { id: 'pln_raise_teisho', category: '賃上げ計画', path: 'raisePlan[year].yearlyRaise', name: '定期昇給額', description: '該当年度の定期昇給額。', type: 'number' },
    
    { id: 'pln_rec_new', category: '採用計画', path: 'recruitmentPlan[year].newGrad', name: '新卒採用数', description: '新卒運転士の採用人数。', type: 'number' },
    { id: 'pln_rec_new_sal', category: '採用計画', path: 'recruitmentPlan[year].newGradSalary', name: '新卒初任給', description: '新卒の初任給額。', type: 'number' },
    { id: 'pln_rec_mid', category: '採用計画', path: 'recruitmentPlan[year].driver', name: '中途採用数', description: '養成（中途）運転士の採用人数。', type: 'number' },

    { id: 'pln_imp_soc', category: '諸元設定', path: 'impactRates[year].socialInsuranceRate', name: '社会保険料率', description: '会社負担分の法定福利費概算レート(%)。', type: 'number' },
    { id: 'pln_imp_rip', category: '諸元設定', path: 'impactRates[year].rippleRate', name: '変動費ハネ率', description: '基本給増に対する変動手当（残業単価等）の連動係数。', type: 'number' },
];

export const generateCurrentParamsJson = (
    configA: SimulationConfig,
    raisePlanA: Record<number, RaisePlanYear>,
    recPlanA: Record<number, RecruitmentPlanYear>,
    impactA: Record<number, ImpactRateYear>
) => {
    // Flatten critical params for AI Context
    return {
        config: {
            retirementAge: configA.extendedRetirementAge,
            reemploymentAge: configA.reemploymentAge,
            cutRate: configA.cutRate,
            extensionSettings: configA.employmentSettings["正社員(延長)"],
            allowances: {
                family: configA.employmentSettings["正社員(延長)"].allowances.family,
                childEdu: configA.employmentSettings["正社員(延長)"].allowances.child,
                instructor: configA.employmentSettings["正社員(延長)"].allowances.instructor,
                manager: configA.employmentSettings["正社員(延長)"].allowances.manager,
                work: configA.employmentSettings["正社員(延長)"].allowances.work,
            }
        },
        plans: {
            // Sample first 5 years
            raise: Object.keys(raisePlanA).slice(0,5).map(y => ({ year: y, ...raisePlanA[parseInt(y)] })),
            recruitment: Object.keys(recPlanA).slice(0,5).map(y => ({ year: y, ...recPlanA[parseInt(y)] }))
        }
    };
};
