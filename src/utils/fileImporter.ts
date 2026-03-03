
import { Employee, EmploymentType } from '../types';
import { DateUtils } from './simulationLogic';

// ヘッダー行を特定するためのキーワード群
const HEADER_KEYWORDS = ['氏名', '名前', '社員名', 'Name', 'name', '従業員氏名', '氏　名', '社員氏名', '姓名', '従業員名', '氏名（漢字）', '氏名(漢字)', '氏名（氏名）', '氏名(氏名)'];

export const parseEmployeeData = (buffer: ArrayBuffer, fileName: string): Promise<Employee[]> => {
    return new Promise((resolve, reject) => {
        let rawData: any[][] = [];

        // 1. ファイルタイプ判定と生データ抽出
        if (fileName.match(/\.(xlsx|xls)$/i)) {
            // Excel (.xlsx, .xls)
            const XLSX = (window as any).XLSX;
            if (!XLSX) {
                console.error("XLSX library not found on window object");
                reject(new Error('Excel解析ライブラリ(SheetJS)がロードされていません。数秒待ってから再試行するか、インターネット接続を確認してください。'));
                return;
            }
            try {
                const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
                // データが入っている最初のシートを探す
                let worksheet = null;
                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    if (data && data.length > 0) {
                        // ヘッダーキーワードが含まれているかチェック
                        const hasHeader = data.some((row: any, i: number) => {
                            if (i > 50) return false;
                            if (!row || !Array.isArray(row)) return false;
                            const line = row.map(c => String(c || "")).join('').replace(/\s+/g, '').toLowerCase();
                            return HEADER_KEYWORDS.some(k => line.includes(k.toLowerCase()));
                        });
                        if (hasHeader) {
                            worksheet = sheet;
                            rawData = data as any[][];
                            break;
                        }
                    }
                }
                
                // 見つからなければ最初のシート
                if (!worksheet) {
                    worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                }
            } catch (e: any) {
                reject(new Error(`Excelファイルの読み込みに失敗しました: ${e.message}`));
                return;
            }
        } else {
            // CSV / Text
            const Papa = (window as any).Papa;
            if (!Papa) {
                console.error("Papa library not found on window object");
                reject(new Error('CSV解析ライブラリ(PapaParse)がロードされていません。数秒待ってから再試行するか、インターネット接続を確認してください。'));
                return;
            }

            // エンコーディングを変えてパースを試みる関数
            const tryParse = (encoding: string): any[][] | null => {
                try {
                    const decoder = new TextDecoder(encoding);
                    const text = decoder.decode(buffer);
                    // delimiter: "" はCSV/TSVを自動判別
                    const res = Papa.parse(text, { header: false, skipEmptyLines: true, delimiter: "" });
                    
                    if (!res.data || !Array.isArray(res.data) || res.data.length === 0) return null;
                    
                    const rows = res.data as any[][];
                    // ヘッダーらしき行があるかチェック（最初の50行以内）
                    const hasHeader = rows.some((row, i) => {
                        if (i > 50) return false;
                        if (!row || !Array.isArray(row)) return false; 
                        const line = row.map(c => String(c || "")).join('').replace(/\s+/g, '');
                        return HEADER_KEYWORDS.some(k => line.includes(k));
                    });
                    
                    return hasHeader ? rows : null;
                } catch (e) {
                    return null;
                }
            };

            // 1. BOMチェック (UTF-8, UTF-16)
            const u8 = new Uint8Array(buffer);
            let detectedEncoding = null;
            if (u8.length >= 2 && u8[0] === 0xFF && u8[1] === 0xFE) detectedEncoding = 'utf-16le';
            else if (u8.length >= 3 && u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) detectedEncoding = 'utf-8';

            if (detectedEncoding) {
                rawData = tryParse(detectedEncoding) || [];
            }

            // 2. 日本語環境向けのフォールバック順序
            // Shift-JISを優先的に試す
            if (!rawData || rawData.length === 0) rawData = tryParse('shift-jis') || [];
            if (!rawData || rawData.length === 0) rawData = tryParse('utf-8') || [];
            if (!rawData || rawData.length === 0) rawData = tryParse('utf-16le') || [];
            
            // 3. 最終手段: 標準デコード
            if (!rawData || rawData.length === 0) {
                 const decoder = new TextDecoder('utf-8'); 
                 const text = decoder.decode(buffer);
                 const res = Papa.parse(text, { header: false, skipEmptyLines: true });
                 rawData = res.data as any[][];
            }
        }

        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
            reject(new Error("ファイルを解析できませんでした。データが含まれていないか、形式が不正です。"));
            return;
        }

        // 2. ヘッダー行の検索
        let headerIdx = -1;
        rawData.some((row, i) => {
            if (!row || !Array.isArray(row)) return false; 
            const lineStr = row.map(c => String(c || "")).join('').replace(/\s+/g, '').toLowerCase();
            if (HEADER_KEYWORDS.some(k => lineStr.includes(k.toLowerCase()))) {
                headerIdx = i;
                return true;
            }
            return false;
        });

        if (headerIdx === -1) {
            // エラー詳細用に先頭数行を表示
            const sample = rawData.slice(0, 3).map(r => Array.isArray(r) ? JSON.stringify(r) : String(r)).join('\n');
            reject(new Error(`有効なヘッダー行が見つかりませんでした。\n必須列: ${HEADER_KEYWORDS.join(', ')} のいずれかを含む行が必要です。\n\n[解析された先頭データ]\n${sample}`));
            return;
        }

        // 3. 列のマッピング
        const header = rawData[headerIdx].map(c => String(c || ""));
        
        const getColIdx = (searchWords: string[]) => {
            return header.findIndex(colName => {
                const normalizedCol = colName.replace(/\s+/g, '').toLowerCase();
                return searchWords.some(w => normalizedCol.includes(w.toLowerCase()));
            });
        };

        const idx = {
            id: getColIdx(['社員番号', 'ID', 'Code', 'コード', '従業員番号', 'No']),
            name: getColIdx(HEADER_KEYWORDS), 
            birth: getColIdx(['生年月日', '誕生日', '生年']),
            hire: getColIdx(['入社年月日', '採用年月日', '入社日', '入社']),
            base: getColIdx(['基本給', '本給', '月例給', '給料', '基本給月額']),
            family: getColIdx(['家族給', '家族手当', '扶養手当', '扶養']),
            childEdu: getColIdx(['子女教育', '教育手当', '子女']),
            instructor: getColIdx(['指導手当', '教習手当', '指導']),
            manager: getColIdx(['管理手当', '役職手当', '役職']),
            work: getColIdx(['業務手当', '精勤手当', '業務']),
            type: getColIdx(['給与体系', '賃金体系', '給与形態', '身分', '雇用区分', '職種区分', '社員区分', '区分']),
            union: getColIdx(['組合員', '労働組合', '組合区分', '組合']),
            job: getColIdx(['職種', '職務', '仕事', '担当'])
        };

        if (idx.name === -1) {
            reject(new Error("「氏名」列を特定できませんでした。ヘッダー名を確認してください。"));
            return;
        }

        const today = new Date();
        
        // 数値の正規化（全角→半角、カンマ除去）
        const normalizeNumber = (val: any): number => {
            if (val === undefined || val === null || val === '') return 0;
            const str = String(val)
                .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角数字変換
                .replace(/,/g, '') // カンマ除去
                .replace(/[^0-9.-]/g, '') // 数字、ドット、マイナス以外除去
                .trim();
            const num = parseInt(str, 10);
            return isNaN(num) ? 0 : num;
        };

        const employees: Employee[] = [];
        
        for (let i = headerIdx + 1; i < rawData.length; i++) {
            const row = rawData[i];
            
            // 空行スキップ
            if (!row || !Array.isArray(row) || row.length === 0) continue; 
            // 氏名がない行はスキップ
            const nameRaw = idx.name > -1 ? row[idx.name] : '';
            if (!nameRaw) continue;

            try {
                // 安全なデータ取得
                const val = (colIdx: number) => (colIdx > -1 && colIdx < row.length) ? normalizeNumber(row[colIdx]) : 0;
                const str = (colIdx: number) => (colIdx > -1 && colIdx < row.length) ? String(row[colIdx] || '').trim() : '';

                const name = str(idx.name);

                const toDate = (v: any) => {
                    if (!v) return null; 
                    // Excelシリアル値の処理
                    if (typeof v === 'number' && v > 10000) { 
                         // 1900/1/1からの日数 (Excel仕様のズレ補正含む簡易版)
                         const date = new Date((v - 25569) * 86400 * 1000);
                         return isNaN(date.getTime()) ? null : date;
                    }
                    
                    let s = String(v).trim();
                    // YYYYMMDD 形式の対応
                    if (/^\d{8}$/.test(s)) {
                        s = `${s.substring(0, 4)}/${s.substring(4, 6)}/${s.substring(6, 8)}`;
                    }
                    // 和暦（R05.04.01等）への簡易対応が必要な場合はここに追加
                    
                    const d = new Date(s);
                    return isNaN(d.getTime()) ? null : d;
                };

                const defaultBirth = new Date(today.getFullYear() - 40, 0, 1);
                const defaultHire = new Date(today.getFullYear() - 10, 3, 1);

                let birthDate = toDate(row[idx.birth]);
                if (!birthDate) birthDate = defaultBirth;

                let hireDate = toDate(row[idx.hire]);
                if (!hireDate) hireDate = defaultHire;
                
                const tenureYears = (today.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                const age = DateUtils.getAge(birthDate, today);
                
                // 雇用区分の判定ロジック
                let type: EmploymentType = '正社員'; // Default
                const rawTypeCode = str(idx.type);
                const rawUnionCode = str(idx.union);
                const rawTypeStr = str(idx.type);
                const rawJobStr = str(idx.job);

                if (rawTypeStr.includes('パート') || rawJobStr.includes('パート')) {
                    type = 'パート運転士(月給制)';
                } else if (rawTypeStr.includes('再雇用') || rawTypeCode === '2') {
                    if (rawTypeStr.includes('嘱託') || rawJobStr.includes('嘱託')) {
                         type = '再雇用(嘱託)';
                    } else {
                         type = '再雇用';
                    }
                } else if (rawTypeStr.includes('嘱託') || rawTypeCode === '10') {
                    if (age >= 60) type = '再雇用(嘱託)'; // 60歳以上嘱託は再雇用扱い
                    else type = '嘱託'; // 現役嘱託
                } else if (rawTypeStr.includes('養成') || rawJobStr.includes('養成') || rawTypeCode === '4') {
                    type = '正社員(養成)';
                } else if ((rawTypeStr.includes('管理') || (rawTypeCode === '1' && rawUnionCode === '5')) && tenureYears >= 1.0) {
                    // 組合コード5を管理職とする等の独自ルール + 勤続1年以上
                    type = '管理職';
                } else if (rawTypeStr.includes('延長')) {
                    type = '正社員(延長)';
                } else {
                    // 正社員系
                    if (tenureYears < 1.0) type = '正社員(新卒)'; // 仮判定
                    else type = '正社員';
                }

                employees.push({
                    id: idx.id > -1 ? (normalizeNumber(row[idx.id]) || i) : i,
                    name: name,
                    birthDate: birthDate,
                    hireDate: hireDate,
                    baseSalary: val(idx.base),
                    familyAllowance: val(idx.family),
                    childEduAllowance: val(idx.childEdu),
                    instructorAllowance: val(idx.instructor),
                    managerAllowance: val(idx.manager),
                    workAllowance: val(idx.work),
                    employmentType: type,
                    originalStatus: rawTypeStr,
                    originalUnion: rawUnionCode,
                    unionType: rawUnionCode.includes('非') ? '非組合員' : '組合員',
                    job: rawJobStr || '運転士'
                });
            } catch (rowError) {
                console.warn(`Row ${i} skipped due to parsing error:`, rowError);
                continue;
            }
        }

        if (employees.length === 0) {
            reject(new Error("読み込み可能な社員データが0件でした。"));
            return;
        }

        resolve(employees);
    });
};
