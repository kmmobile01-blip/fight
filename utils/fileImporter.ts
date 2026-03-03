import { Employee } from '../types';

export const parseEmployeeData = (buffer: ArrayBuffer, fileName: string): Promise<Employee[]> => {
    return new Promise((resolve, reject) => {
        const Papa = (window as any).Papa;
        if (!Papa) {
            reject(new Error('CSV Parser module (PapaParse) is not loaded.'));
            return;
        }

        const attemptParse = (encoding: string): { data: any[], headerIdx: number, success: boolean } => {
            const decoder = new TextDecoder(encoding);
            const text = decoder.decode(buffer);
            const res = Papa.parse(text, { header: false, skipEmptyLines: true, delimiter: "" });
            let hIdx = -1;
            if (res.data && res.data.length > 0) {
                res.data.some((row: any[], i: number) => {
                    const str = row.map((c: any) => String(c)).join('');
                    if (str.includes('氏名')) { hIdx = i; return true; }
                    return false;
                });
            }
            return { data: res.data, headerIdx: hIdx, success: hIdx !== -1 };
        };

        let result = attemptParse('shift-jis');
        if (!result.success) result = attemptParse('utf-8');

        if (!result.success) {
            reject(new Error("有効なヘッダー（「氏名」を含む列）が見つかりませんでした。"));
            return;
        }

        const { data, headerIdx } = result;
        const header = data[headerIdx];

        const getColIdx = (keywords: string[]) => header.findIndex((c: any) => {
            const str = String(c);
            return keywords.some(k => str.includes(k));
        });

        const idx = {
            id: getColIdx(['社員番号']),
            name: getColIdx(['氏名']),
            birth: getColIdx(['生年月日']),
            hire: getColIdx(['入社年月日', '採用年月日']),
            base: getColIdx(['基本給', '本給', '月例給']),
            family: getColIdx(['家族給', '家族手当']),
            childEdu: getColIdx(['子女教育', '教育手当']),
            instructor: getColIdx(['指導手当']),
            manager: getColIdx(['管理手当', '役職手当']),
            work: getColIdx(['業務手当', '精勤手当']),
            type: getColIdx(['給与体系', '賃金体系', '給与形態', '身分']),
            union: getColIdx(['組合員', '労働組合']),
            job: getColIdx(['職種', '職務'])
        };

        if (idx.name === -1) {
            reject(new Error("「氏名」列が特定できませんでした。"));
            return;
        }

        const today = new Date();

        const normalizeNumber = (val: any): number => {
            if (val === undefined || val === null) return 0;
            const str = String(val)
                .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                .replace(/,/g, '')
                .trim();
            const num = parseInt(str, 10);
            return isNaN(num) ? 0 : num;
        };

        const parsedEmployees = data.slice(headerIdx + 1).filter((r: any[]) => r[idx.name]).map((r: any[], i: number) => {
            const val = (colIdx: number) => {
                if (colIdx === -1) return 0;
                return normalizeNumber(r[colIdx]);
            };
            const str = (colIdx: number) => colIdx === -1 ? '' : String(r[colIdx] || '');
            const toDate = (s: string) => {
                if (!s) return new Date();
                const d = new Date(s);
                return isNaN(d.getTime()) ? new Date() : d;
            };

            const hireDate = toDate(str(idx.hire));
            const tenureYears = (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

            const rawType = str(idx.type);
            const rawUnion = str(idx.union);
            const rawJob = str(idx.job);

            let type = '正社員';
            if (rawType.includes('養成')) type = '正社員(養成)';
            else if (rawType.includes('パート')) type = 'パート運転士(月給制)';
            else if (rawType.includes('嘱託') || (rawUnion.includes('非組合員') && rawType !== 'パート')) type = '管理職';
            else if (rawJob.includes('養成') || rawJob.includes('研修')) type = '正社員(養成)';
            else if (tenureYears < 1.0 && type === '正社員') type = '正社員(新卒)';
            else if (rawType.includes('フレックス')) type = '再雇用';

            return {
                id: idx.id > -1 ? (normalizeNumber(r[idx.id]) || i + 1) : i + 1,
                name: str(idx.name),
                birthDate: toDate(str(idx.birth)),
                hireDate: hireDate,
                baseSalary: val(idx.base),
                familyAllowance: val(idx.family),
                childEduAllowance: val(idx.childEdu),
                instructorAllowance: val(idx.instructor),
                managerAllowance: val(idx.manager),
                workAllowance: val(idx.work),
                employmentType: type,
                unionType: rawUnion.includes('非組合員') ? '非組合員' : '組合員',
                job: idx.job > -1 ? rawJob : '運転士'
            };
        });

        if (parsedEmployees.length === 0) {
            reject(new Error("読み込み可能なデータ行が見つかりませんでした。"));
            return;
        }

        resolve(parsedEmployees);
    });
};