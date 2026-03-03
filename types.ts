
export type EmploymentType = 
  | "正社員" 
  | "正社員(延長)" 
  | "正社員(新卒)" 
  | "正社員(養成)" 
  | "管理職" 
  | "嘱託" 
  | "再雇用" 
  | "再雇用(嘱託)" 
  | "パート運転士(月給制)"
  | "退職"
  | "入社前";

export type PersonaType = 'normal' | 'donald' | 'vladimir' | 'sanae' | 'jack' | 'amari' | 'sato' | 'shinchan' | 'toru' | 'inamori' | 'hiiragino_miko' | 'vega';
export type UnionPersonaType = 'kiyomi' | 'kasshiro' | 'baigaeshi' | 'hiroyuki' | 'aibo' | 'gonda' | 'rational' | 'wakui' | 'zenkouwan' | 'masako';

export interface Employee {
  id: number;
  name: string;
  birthDate: Date;
  hireDate: Date;
  baseSalary: number;
  currentBaseSalary?: number; // For simulation
  familyAllowance: number;
  childEduAllowance: number;
  instructorAllowance: number;
  managerAllowance: number;
  workAllowance: number;
  employmentType: string;
  originalStatus?: string; // Raw "給与体系" from CSV
  originalUnion?: string; // Raw "組合員区分" from CSV
  unionType: string;
  job: string;
}

export interface AllowanceSettings {
  family: boolean;
  child: boolean;
  instructor: boolean;
  manager: boolean;
  work: boolean;
}

export interface FamilyAllowanceAmounts {
  spouse: number;
  child: number;
  parent: number;
}

export interface ManagerAllowanceAmounts {
  type1: number;
  type2: number;
  type3: number;
  type4: number;
}

export interface AllowanceAmounts {
  family: FamilyAllowanceAmounts;
  childEdu: number;
  instructor: number;
  manager: ManagerAllowanceAmounts;
  work: { type1: number; type2: number };
}

export interface BonusMonths {
  summer: number;
  winter: number;
  end: number;
}

export interface HousingAid {
  enabled: boolean;
  withFamily: number;
  noFamily: number;
}

export interface TypeSettings {
  bonusMonths: BonusMonths;
  allowances: AllowanceSettings;
  allowanceAmounts: AllowanceAmounts;
  housingAid: HousingAid;
  // FIX: Changed lumpSum from 'number' to 'Record<number, number>' to support year-specific values, matching its usage across the application.
  lumpSum: Record<number, number>;
  lumpSumEnabled?: boolean; // Added for explicit eligibility control
  cutRate?: number;
  lowerLimit?: number;
  upperLimit?: number;
  bearStopAge?: number;
  
  // ▼▼▼ 追加プロパティ ▼▼▼
  calculationMethod?: 'rate' | 'fixed'; // 基本給決定方式
  fixedSalary?: number; // 固定給設定用
  useCurrentIfLower?: boolean; // 固定額より現行給与が低い場合は維持するフラグ
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
}

export interface SimulationConfig {
  label: string;
  extendedRetirementAge: number;
  reemploymentAge: number;
  partTimeAgeLimit: number;
  cutRate: number;
  cutLowerLimit: number; // 最低保証 (224,020)
  cutUpperLimit: number;
  
  // Specific Salary Settings
  partTimeSalary: number; // パート運転士給与 (196,000)
  managerShokutakuSalary: number; // 管理職->嘱託 (<65) (480,000)
  managerShokutakuOver65Salary: number; // 管理職->嘱託 (>=65) (287,000)

  // ▼▼▼ 追加プロパティ ▼▼▼
  syncBaseUpWithA?: boolean; // ベア設定の連動ON/OFF
  convertCurrentReempToExtension?: boolean; // 現・再雇用者を延長社員へ移行するか (default: false)
  // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

  employmentSettings: Record<string, TypeSettings>;
}

export interface MonthlyDetail {
  month: number;
  year: number;
  status: EmploymentType | string;
  baseSalary: number;
  allowances: number;
  allowanceDetails: {
      family: number;
      child: number;
      instructor: number;
      manager: number;
      work: number;
      custom: number;
      variable: number; // Added
  };
  bonus: number;
  housing: number;
  lumpSum: number;
  socialInsurance: number;
  custom: number;
  total: number;
}

export interface Breakdown {
  base: number;
  allow: number;
  bonus: number;
  house: number;
  lump: number;
  custom: number;
  socialInsurance: number;
  allowDetails: {
      family: number;
      child: number;
      instructor: number;
      manager: number;
      work: number;
      custom: number;
      variable: number; // Added
  };
}

export interface StatusChanger {
    name: string;
    prevStatus: string;
    newStatus: string;
    specificDate: string;
}

export interface MonthlyAggregate {
  month: number;
  totalCost: number;
  baseSalary: number;
  bonus: number;
  allowances: number;
  housing: number;
  lumpSum: number;
  custom: number;
  socialInsurance: number;
  allowDetails: {
      family: number;
      child: number;
      instructor: number;
      manager: number;
      work: number;
      custom: number;
      variable: number; // Added
  };
  typeDetails: Record<string, { total: number; count: number; }>;
  statusChangers: StatusChanger[];
}

export interface BaseUpImpactBreakdown {
    base: number;
    bonus: number;
    variable: number; // Variable Allowance Increase based on Ripple Rate
    count: number;
}

export interface BaseUpImpact {
    total: number;
    perCapita: number;
    breakdown: Record<string, BaseUpImpactBreakdown>;
}

export interface YearResult {
  year: number;
  totalCost: number;
  breakdownSum: Breakdown;
  monthlyAggregates: MonthlyAggregate[];
  monthlyHeadcount: any[];
  typeAggregates: Record<string, any>;
  headcount: Record<string, number>;
  avgSalary: number;
  avgAge: number; // Added
  avgTenure: number; // Added
  activeCount: number;
  baseUpImpact: BaseUpImpact;
  teishoImpact: BaseUpImpact; // Reuse structure for Teisho
}

export interface IndividualResult {
    id: number;
    name: string;
    year: number;
    type: string;
    unionType: string;
    base: number;
    finalBase: number; 
    bonus: number;
    allowance: number;
    allowanceDetail: Breakdown['allowDetails'];
    housing: number;
    lumpSum: number;
    socialInsurance: number;
    total: number;
    totalExclSoc: number;
    hireDate: Date;
    birthDate: Date;
    job: string;
    baseUpImpact: { base: number; bonus: number; variable: number; };
    teishoImpact: { base: number; bonus: number; variable: number; };
}

export interface SimulationResult {
  summary: YearResult[];
  individuals: IndividualResult[];
}

export interface RaisePlanYear {
    averageAmount: number;
    detailed: {
        seishain_l1: number; seishain_l2: number; seishain_l3: number; seishain_new: number;
        newgrad_l1: number; newgrad_l2: number; newgrad_l3: number; newgrad_new: number;
        trainee_l1: number; trainee_l2: number; trainee_l3: number; trainee_new: number;
        extended: number;
        reemp: number;
        parttime: number; // Added
        management: number; // Added for individual management setting
        shokutaku: number; // Added for Shokutaku separate setting
    };
    yearlyRaise: number;
    raiseRate: number;
}

export interface RecruitmentPlanYear {
    newGrad: number;
    newGradSalary: number;
    driver: number;
    driverSalary: number;
}

export interface CustomAllowance {
    id: number;
    name: string;
    amounts: Record<string, number>; // Per-type amounts
    enabled: Record<string, boolean>; // Per-type enabled status
    isRippleTarget?: boolean; // Whether this allowance is subject to ripple rate
    ageMin: string | number;
    ageMax: string | number;
    tenureMin: string | number;
    tenureMax: string | number;
    hireDateMin?: string; // YYYY-MM-DD
}

export interface ImpactRateYear {
    socialInsuranceRate: number; // e.g., 17.5 (%)
    rippleRate: number; // e.g., 0.9 (Coefficient)
    rippleTargets: string[]; // e.g., ['base', 'family']
}

export interface FinancialPlan {
    year: number;
    checked: boolean; // Added for AI context selection
    
    // Aggregated Fields (Calculated from details if available, or manual input)
    revenue: {
        shared: number; // 乗合
        charter: number; // 貸切
        contract: number; // 受託
        other: number; // その他 (運送雑 + 賃貸 + その他)
    };
    expense: {
        personnel: number; // 人件費計
        material: number; // 物件費計
        taxes: number; // 諸税
        depreciation: number; // 減価償却費
    };
    profit: {
        // operating is calculated
        ordinary: number; // 経常
        net: number; // 当期純
    };

    // Granular Details
    details: {
        unsou_zatsu: number; // 運送雑収入
        chintai: number; // 賃貸収入
        
        kyuryo: number; // 給料
        teate: number; // 手当
        shoyo: number; // 賞与
        taishoku: number; // 退職金
        houteifukuri: number; // 法定福利費
        kouseifukuri: number; // 厚生福利費
        sonota_jinken: number; // その他人件費
        
        bukken: number; // 物件費(内訳)
        nenryo: number; // 燃料油脂費
        sonota_bukken: number; // その他物件費
        gyomu: number; // 業務経費
        
        eigyo_gai_rev: number; // 営業外収益
        eigyo_gai_exp: number; // 営業外費用
        tokubetsu_rev: number; // 特別利益
        tokubetsu_exp: number; // 特別損失
        houjinzei: number; // 法人税等
        houjinzei_adj: number; // 法人税等調整額
    };
}

export interface FinancialYear {
    sales: number;
    operatingProfit: number;
    ordinaryProfit: number;
    netProfit: number;
}

// AI Proposal Interface for Batch Updates
export interface AiProposal {
    targetPattern: 'A' | 'B';
    config?: Partial<SimulationConfig>;
    employmentSettingsUpdate?: {
        targetStatus: string; // e.g., "正社員(延長)"
        settings: Partial<TypeSettings>;
    }[];
    raisePlan?: Record<number, Partial<RaisePlanYear>>;
    recruitmentPlan?: Record<number, Partial<RecruitmentPlanYear>>;
    impactRates?: Record<number, Partial<ImpactRateYear>>;
    customAllowances?: CustomAllowance[];
}
