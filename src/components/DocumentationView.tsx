
import React, { useEffect } from 'react';

export const DocumentationView: React.FC<{ isSeriousMode: boolean, onReturnToTitle?: () => void }> = ({ isSeriousMode, onReturnToTitle }) => {

    // Voice Effect (Only in Ura Mode - Easter Egg)
    useEffect(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis || isSeriousMode) return;
        const synth = window.speechSynthesis;
        synth.cancel();

        const u = new SpeechSynthesisUtterance("スト権、確立！");
        u.lang = 'ja-JP';
        u.pitch = 1.2; 
        u.rate = 1.1;  
        u.volume = 1.0;

        const voices = synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('ja'));
        if (preferredVoice) u.voice = preferredVoice;

        synth.speak(u);
    }, [isSeriousMode]);

    return (
        <div className="bg-white text-black shadow-lg mx-auto w-full md:max-w-[210mm] p-8 md:p-[20mm] min-h-[297mm] print:shadow-none print:w-full font-serif text-justify leading-relaxed">
            {/* --- Cover Page --- */}
            <div className="flex flex-col items-center justify-center min-h-[900px] border-b-4 border-double border-black mb-12 page-break-after">
                <div className="w-full flex justify-between mb-20 text-black font-bold font-mono text-sm border-b border-gray-400 pb-2">
                    <span>CONFIDENTIAL</span>
                    <div className="flex items-center gap-4">
                        <span>Document ID: SF26-MANUAL-GEN (Rev 9.3)</span>
                        {onReturnToTitle && (
                            <button 
                                onClick={onReturnToTitle}
                                className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded shadow font-bold transition-all text-[10px] flex items-center gap-1 print:hidden"
                            >
                                <span>🚪 終了</span>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="text-center space-y-6">
                    <div className="text-xl font-bold tracking-widest text-gray-600">定年延長影響額試算システム</div>
                    <h1 className={`text-5xl md:text-6xl font-extrabold text-black mb-8 tracking-tighter leading-tight ${isSeriousMode ? 'font-serif' : 'font-sans'}`}>
                        {isSeriousMode ? "人事戦略シミュレーション\n操作マニュアル" : "SPRING\nFIGHTER\n'26"}
                    </h1>
                    <div className="text-2xl font-medium mt-8 border-t-2 border-b-2 border-black py-4 inline-block px-12">
                        システム仕様書 兼 操作マニュアル
                    </div>
                </div>

                <div className="text-lg text-black mt-32 text-center space-y-4 font-medium">
                    <p>対象バージョン：Ver 4.9.2</p>
                    <p>発行日：2026年3月12日</p>
                    <div className="mt-20">
                        <p className="font-bold text-black text-xl">人事戦略部 御中</p>
                        <p className="text-sm text-gray-500 mt-2">Developed by: AI Strategic Solutions Div.</p>
                    </div>
                </div>
            </div>

            <div className="page-break"></div>

            {/* --- Table of Contents --- */}
            <section className="mb-12 page-break-after">
                <h2 className="text-2xl font-bold border-b-4 border-black pb-2 mb-8 text-black">目次</h2>
                <ul className="space-y-4 ml-4 text-base font-bold text-black">
                    {!isSeriousMode && (
                        <li>🐵 サルでもわかる！「Spring Fighter」超入門
                            <ul className="ml-8 text-sm font-normal mt-2 space-y-1 text-gray-800">
                                <li>・これってなにする機械？</li>
                                <li>・なんで必要なの？</li>
                                <li>・3ステップで終わる使い方</li>
                            </ul>
                        </li>
                    )}
                    <li>第1章　はじめに
                        <ul className="ml-8 text-sm font-normal mt-2 space-y-1 text-gray-800">
                            <li>1.1 システムの目的と背景</li>
                            <li>1.2 3つのシナリオ（A案・B案・C案）の定義</li>
                        </ul>
                    </li>
                    <li>第2章　データ準備・読込
                        <ul className="ml-8 text-sm font-normal mt-2 space-y-1 text-gray-800">
                            <li>2.1 CSVファイル仕様（必須項目）</li>
                            <li>2.2 雇用区分の自動判定ロジック</li>
                        </ul>
                    </li>
                    <li>第3章　制度設計パラメータ詳細
                        <ul className="ml-8 text-sm font-normal mt-2 space-y-1 text-gray-800">
                            <li>3.1 定年・再雇用年齢の設定</li>
                            <li>3.2 延長社員の給与設計（カット率 vs 固定給）</li>
                            <li>3.3 ベースアップ・定期昇給の入力ルール</li>
                            <li>3.4 諸手当・賞与・退職金の設定</li>
                        </ul>
                    </li>
                    <li>第4章　シミュレーション実行と分析
                        <ul className="ml-8 text-sm font-normal mt-2 space-y-1 text-gray-800">
                            <li>4.1 計算ロジック（ハネ率・社保）</li>
                            <li>4.2 ダッシュボードの見方</li>
                            <li>4.3 個人別・年別詳細分析</li>
                        </ul>
                    </li>
                    <li>第5章　AI・財務支援機能
                        <ul className="ml-8 text-sm font-normal mt-2 space-y-1 text-gray-800">
                            <li>5.1 役員会資料作成・交渉シミュレーション</li>
                            <li>5.2 財務分析 (BEP / ROI)</li>
                        </ul>
                    </li>
                    <li>第6章　FAQ・トラブルシューティング</li>
                </ul>
            </section>

            <div className="page-break"></div>

            {/* --- Monkey Section (Only in Ura Mode) --- */}
            {!isSeriousMode && (
                <section className="mb-16 bg-yellow-50 p-8 rounded-2xl border-4 border-yellow-200">
                    <div className="flex items-center gap-4 mb-6 border-b-2 border-yellow-300 pb-2">
                        <span className="text-4xl">🐵</span>
                        <h2 className="text-3xl font-black text-yellow-900">サルでもわかる！「Spring Fighter」超入門</h2>
                    </div>
                    
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-yellow-800 mb-2">Q. これって、なにする機械？</h3>
                            <p className="text-base font-bold text-gray-800 bg-white p-4 rounded-lg shadow-sm">
                                A. <span className="text-red-600 text-lg">「給料のタイムマシン」</span>です。<br/>
                                今の社員さんたちが、10年後におじいちゃん・おばあちゃんになった時、会社全体で給料をいくら払うことになるのか、ボタン一つで計算してくれます。
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-yellow-800 mb-2">Q. なんでそんな計算が必要なの？</h3>
                            <p className="text-base font-bold text-gray-800 bg-white p-4 rounded-lg shadow-sm">
                                A. <span className="text-blue-600 text-lg">「会社が潰れないようにするため」</span>です。<br/>
                                「定年を60歳から65歳に延ばそう！」と言うのは簡単ですが、もし全員が高い給料のまま5年も長く残ったら、会社のお金がなくなってしまいます。<br/>
                                だから、「給料を7割に減らしたらどうなる？」「ボーナスを減らしたら？」といろいろ試して、<span className="underline decoration-wavy decoration-red-500">社員もハッピー、会社も安泰なライン</span>を探すのです。
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {!isSeriousMode && <div className="page-break"></div>}

            {/* --- Chapter 1 --- */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold border-l-8 border-black pl-4 mb-6 text-black bg-gray-100 py-2">第1章　はじめに</h2>
                
                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">1.1 システムの目的</h3>
                <p className="text-black mb-4 text-sm leading-relaxed">
                    本システムは、バス事業者における「定年延長」の制度設計を支援するためのシミュレーションツールです。
                    労働力不足が深刻化する中、シニアドライバーの確保は必須課題ですが、人件費の増大は経営リスクとなります。
                    本システムを使用することで、「人件費の総額」と「個人の手取り」のバランスを即座に可視化し、最適な賃金テーブルを設計することが可能です。
                </p>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">1.2 3つのシナリオ（A/B/C案）</h3>
                <p className="text-black mb-4 text-sm">
                    本システムでは、常に以下の3つのパターンを同時に計算・比較します。
                </p>
                <table className="w-full text-sm border-collapse border border-gray-800 mb-6">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-2 border border-gray-600 w-1/4">パターン名称</th>
                            <th className="p-2 border border-gray-600">定義・目的</th>
                            <th className="p-2 border border-gray-600">主な変動要因</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-2 border border-gray-400 font-bold bg-red-50 text-red-900">パターンA<br/>(改革案)</td>
                            <td className="p-2 border border-gray-400">
                                <strong>定年延長を実施し、かつベースアップも行う案。</strong><br/>
                                会社が目指すべき理想のターゲットモデルです。
                            </td>
                            <td className="p-2 border border-gray-400">
                                ・定年延長コスト (60-65歳)<br/>
                                ・賃上げコスト (ベア+定昇)
                            </td>
                        </tr>
                        <tr>
                            <td className="p-2 border border-gray-400 font-bold bg-blue-50 text-blue-900">パターンB<br/>(現行制度)</td>
                            <td className="p-2 border border-gray-400">
                                <strong>定年延長はせず、ベースアップのみ行う案。</strong><br/>
                                「もし定年延長しなかったら？」という比較対象です。<br/>
                                ※ベア額はA案と連動可能です。
                            </td>
                            <td className="p-2 border border-gray-400">
                                ・賃上げコストのみ<br/>
                                ・再雇用コスト (低廉)
                            </td>
                        </tr>
                        <tr>
                            <td className="p-2 border border-gray-400 font-bold bg-gray-100 text-gray-900">パターンC<br/>(凍結案)</td>
                            <td className="p-2 border border-gray-400">
                                <strong>何も変えない（昇給も停止する）案。</strong><br/>
                                純粋なコスト増減のベースライン（基準）となります。<br/>
                                自然減（退職）によるコスト減を確認するために使用します。
                            </td>
                            <td className="p-2 border border-gray-400">
                                ・変動なし
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <div className="page-break"></div>

            {/* --- Chapter 2 --- */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold border-l-8 border-black pl-4 mb-6 text-black bg-gray-100 py-2">第2章　データ準備・読込</h2>
                
                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">2.1 CSVファイル仕様</h3>
                <p className="text-black mb-4 text-sm">
                    人事給与システムから出力したCSVファイル（Shift-JIS推奨）をそのまま読み込めます。<br/>
                    ヘッダー行（1行目）に以下のキーワードが含まれている列を自動認識します。
                </p>
                
                <table className="w-full text-sm border-collapse border border-gray-400 mb-6">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border p-2 w-1/3">項目名</th>
                            <th className="border p-2">認識キーワード (部分一致)</th>
                            <th className="border p-2">備考</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className="border p-2 font-bold">社員番号 (必須)</td><td className="border p-2">社員番号, ID, Code</td><td className="border p-2">一意のID</td></tr>
                        <tr><td className="border p-2 font-bold">氏名 (必須)</td><td className="border p-2">氏名, 名前, Name</td><td className="border p-2"></td></tr>
                        <tr><td className="border p-2 font-bold">生年月日</td><td className="border p-2">生年月日, 誕生日</td><td className="border p-2">年齢計算の基準</td></tr>
                        <tr><td className="border p-2 font-bold">入社年月日</td><td className="border p-2">入社年月日, 採用年月日</td><td className="border p-2">勤続年数計算の基準</td></tr>
                        <tr><td className="border p-2 font-bold">基本給</td><td className="border p-2">基本給, 本給, 月例給</td><td className="border p-2">シミュレーションの基礎</td></tr>
                        <tr><td className="border p-2">雇用区分</td><td className="border p-2">給与体系, 身分, 職種区分</td><td className="border p-2">「正社員」「嘱託」等の判定に使用</td></tr>
                        <tr><td className="border p-2">組合区分</td><td className="border p-2">組合員, 労働組合</td><td className="border p-2">管理職判定の補助に使用</td></tr>
                        <tr><td className="border p-2">各種手当</td><td className="border p-2">家族手当, 住宅手当...</td><td className="border p-2">各名称を含む列を自動マッピング</td></tr>
                    </tbody>
                </table>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">2.2 雇用区分の自動判定ロジック</h3>
                <p className="text-black mb-4 text-sm">
                    読み込み時に、以下の優先順位で「初期ステータス」を判定します。
                </p>
                <div className="bg-gray-50 border border-gray-300 p-4 rounded text-sm font-mono space-y-2">
                    <p>1. 「職種」または「身分」に "パート" を含む &rarr; <strong>パート運転士(月給制)</strong></p>
                    <p>2. 「職種」または「身分」に "再雇用" を含む &rarr; <strong>再雇用</strong></p>
                    <p>3. 「職種」または「身分」に "嘱託" を含む &rarr; <strong>嘱託</strong> (60歳以上なら再雇用(嘱託))</p>
                    <p>4. 「職種」または「身分」に "養成" を含む &rarr; <strong>正社員(養成)</strong></p>
                    <p>5. 「職種」に "管理" を含む、または非組合員 &rarr; <strong>管理職</strong></p>
                    <p>6. 上記以外で、勤続1年未満 &rarr; <strong>正社員(新卒)</strong></p>
                    <p>7. それ以外 &rarr; <strong>正社員</strong></p>
                </div>
            </section>
            
            <div className="page-break"></div>

            {/* --- Chapter 3 --- */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold border-l-8 border-black pl-4 mb-6 text-black bg-gray-100 py-2">第3章　制度設計パラメータ詳細</h2>
                
                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">3.1 延長社員の給与設計</h3>
                <p className="text-black mb-4 text-sm">
                    定年延長後の「60歳〜65歳」区分の給与体系は、2つの方式から選択できます。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border p-4 rounded bg-white shadow-sm">
                        <h4 className="font-bold text-red-700 mb-2">① 率計算方式 (Cut Rate)</h4>
                        <p className="text-sm text-gray-700">
                            現役時（59歳時点）の基本給に対し、一定の掛率を乗じて算出します。<br/>
                            例：基本給40万円 × 70% ＝ 28万円<br/>
                            <span className="text-xs text-gray-500">メリット：現役時の貢献度が反映される</span>
                        </p>
                    </div>
                    <div className="border p-4 rounded bg-white shadow-sm">
                        <h4 className="font-bold text-blue-700 mb-2">② 固定給方式 (Fixed Amount)</h4>
                        <p className="text-sm text-gray-700">
                            全員一律の金額を設定します。<br/>
                            例：一律 224,020円<br/>
                            <span className="text-xs text-gray-500">メリット：制度がシンプルで説明しやすい</span><br/>
                            <strong>※「現行給与が低い場合は据え置く」オプションあり</strong>
                        </p>
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">3.2 ベースアップ入力ルール</h3>
                <p className="text-black mb-4 text-sm">
                    「ベア・昇給計画」画面にて、向こう10年間の賃上げ額を設定します。
                </p>
                <ul className="list-disc ml-6 space-y-2 text-sm text-black">
                    <li><strong>平均ベア:</strong> 入力すると、正社員系の各区分（新卒・養成・L1/L2/L3）に同額が自動入力されます。</li>
                    <li><strong>個別調整:</strong> 自動入力後、特定の区分（例：再雇用者のみ0円など）を個別に書き換えることが可能です。</li>
                    <li><strong>定期昇給:</strong> ベースアップとは別に、年齢給・勤続給として自動昇給する額（平均）を入力します。</li>
                </ul>
            </section>

            <div className="page-break"></div>

            {/* --- Chapter 4 --- */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold border-l-8 border-black pl-4 mb-6 text-black bg-gray-100 py-2">第4章　シミュレーション実行と分析</h2>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">4.1 計算ロジック詳細</h3>
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded border border-gray-300">
                        <h4 className="font-bold mb-1">賞与 (Bonus)</h4>
                        <p className="font-mono text-sm">
                            支給額 ＝ (基本給 ＋ 家族手当) × 支給月数 × 在籍期間按分率<br/>
                            <span className="text-xs text-gray-500">※支給月数は「夏・冬・期末」ごとに設定可能。</span>
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded border border-gray-300">
                        <h4 className="font-bold mb-1">法定福利費 (Social Insurance)</h4>
                        <p className="font-mono text-sm">
                            会社負担額 ＝ 総支給額 × 料率 (デフォルト 17.5%)<br/>
                            <span className="text-xs text-gray-500">※個別の標準報酬月額等級ではなく、総額に対する概算レートを使用します。</span>
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded border border-gray-300">
                        <h4 className="font-bold mb-1">変動費ハネ率 (Ripple Effect)</h4>
                        <p className="font-mono text-sm">
                            増加額 ＝ (基本給 ＋ 諸手当) × ハネ率係数 (デフォルト 0.42)<br/>
                            <span className="text-xs text-gray-500">※基本給UPに伴う、残業単価や深夜割増単価の上昇分を簡易的に算出します。</span>
                        </p>
                    </div>
                </div>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">4.2 分析画面の活用</h3>
                <ul className="list-disc ml-6 space-y-2 text-sm text-black">
                    <li><strong>ダッシュボード:</strong> 10年間の総人件費推移をグラフで確認。A案とB案の乖離（＝定年延長コスト）を把握します。</li>
                    <li><strong>年別明細分析:</strong> 年度ごとの「基本給」「賞与」「社保」の内訳を表示。どの費目がコスト増の要因かを特定します。</li>
                    <li><strong>個人別詳細分析:</strong> 特定の従業員（ID検索）の10年後の給与明細を確認。「手取りが減りすぎないか」等の検証に利用します。</li>
                </ul>
            </section>

            <div className="page-break"></div>

            {/* --- Chapter 5 --- */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold border-l-8 border-black pl-4 mb-6 text-black bg-gray-100 py-2">第5章　AI・財務支援機能</h2>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">5.1 AI 役員会資料作成</h3>
                <p className="text-black mb-4 text-sm">
                    シミュレーション結果（数値）と、労使協議会資料（テキスト）を基に、Google Gemini AIが役員会向けの提案書をドラフトします。
                </p>
                <div className="bg-blue-50 p-4 rounded text-sm border border-blue-200">
                    <strong>活用ポイント:</strong><br/>
                    「労使協議会資料」画面に、今年度の赤字額や他社の賃上げ状況を入力しておくと、AIがそれらを「根拠」として引用し、より説得力のある文章を作成します。
                </div>

                <h3 className="text-lg font-bold mb-3 mt-8 text-black border-b border-gray-400 pb-1">5.2 財務分析 (BEP / ROI)</h3>
                <p className="text-black mb-4 text-sm">
                    定年延長を「投資」と捉え、その回収期間を分析します。
                </p>
                <table className="w-full text-sm border-collapse border border-gray-400 mb-6">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border p-2 w-1/4">分析手法</th>
                            <th className="border p-2">概要</th>
                            <th className="border p-2">判定基準</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-2 font-bold">BEP分析<br/>(損益分岐点)</td>
                            <td className="border p-2">新人を採用した場合のコスト（採用費・教育費・リスク）と、ベテランを継続雇用した場合のコスト差を比較し、何ヶ月で元が取れるか計算します。</td>
                            <td className="border p-2">24ヶ月以内なら早期回収可能</td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold">ROI分析<br/>(投資対効果)</td>
                            <td className="border p-2">1名あたりの採用投資に対し、5年間の業務を通じてどれだけのキャッシュフロー（NPV）を生むかを算出します。</td>
                            <td className="border p-2">NPVがプラスなら投資価値あり</td>
                        </tr>
                    </tbody>
                </table>
            </section>

             <div className="mt-20 pt-8 border-t-2 border-black text-center text-sm font-bold text-gray-600">
                &copy; 2026 AI Strategic Solutions Div. / Confidential Documentation
            </div>
        </div>
    );
};
