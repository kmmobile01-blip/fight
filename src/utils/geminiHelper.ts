
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";

export const getGeminiApiKey = (): string => {
    // 1. Check Local Storage (User Custom Key)
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey && localKey.trim().length > 0) {
        return localKey.trim();
    }
    
    // 2. Fallback to Environment Variable (System Default)
    return process.env.API_KEY || '';
};

/**
 * 堅牢なGemini API呼び出しヘルパー
 * 429(Rate Limit)や500/503/504(Server Error)などの一時的なエラーに対し、
 * 指数バックオフ戦略を用いてリトライを行います。
 */
export const generateContentWithRetry = async (
    ai: GoogleGenAI, 
    params: GenerateContentParameters, 
    maxRetries = 4,
    baseDelay = 1000
): Promise<GenerateContentResponse> => {
    let lastError: any;
    
    // 安全性設定のデフォルト
    const defaultSafetySettings = [
        { category: "HARM_CATEGORY_HATE_SPEECH" as HarmCategory, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as HarmCategory, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: "HARM_CATEGORY_HARASSMENT" as HarmCategory, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as HarmCategory, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: "HARM_CATEGORY_CIVIC_INTEGRITY" as HarmCategory, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const finalParams = {
        ...params,
        config: {
            ...params.config,
            safetySettings: params.config?.safetySettings || defaultSafetySettings
        }
    };
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await ai.models.generateContent(finalParams);
        } catch (e: any) {
            lastError = e;
            
            // エラー情報の抽出
            const status = e.status || (e.error && e.error.code) || 0;
            const message = e.message || "";
            
            // リトライ対象のステータスコード
            // 429: Too Many Requests (Quota)
            // 500: Internal Server Error
            // 503: Service Unavailable
            // 504: Gateway Timeout
            const isRetryable = status === 429 || status === 500 || status === 503 || status === 504 || 
                               message.includes("fetch failed") || message.includes("XHR error");

            if (isRetryable && attempt < maxRetries) {
                // 指数バックオフ (1s, 2s, 4s, 8s...) + ジッター(遊び)
                const delay = (baseDelay * Math.pow(2, attempt)) + (Math.random() * 1000);
                console.warn(`[Gemini Helper] Temporary error detected (Status: ${status}, Attempt: ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`, message);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            // リトライ対象外、または回数上限に達した場合は即座にスロー
            console.error("[Gemini Helper] Unrecoverable API Error:", e);
            throw e;
        }
    }
    throw lastError;
};

/**
 * モデルのフォールバック機能付きAPI呼び出し
 * 指定されたプライマリモデルで失敗した場合、セカンダリモデル（下位モデル）で再試行します。
 */
export const generateContentWithFallback = async (
    ai: GoogleGenAI,
    params: Omit<GenerateContentParameters, 'model'>,
    primaryModel: string = "gemini-3-flash-preview",
    secondaryModel: string = "gemini-flash-latest"
): Promise<GenerateContentResponse> => {
    try {
        // 1. プライマリモデルで試行 (リトライ機能付き)
        return await generateContentWithRetry(ai, { ...params, model: primaryModel } as GenerateContentParameters);
    } catch (e) {
        console.warn(`[Gemini Helper] Primary model (${primaryModel}) failed. Falling back to ${secondaryModel}...`, e);
        // 2. セカンダリモデルで試行 (リトライ機能付き)
        try {
            return await generateContentWithRetry(ai, { ...params, model: secondaryModel } as GenerateContentParameters);
        } catch (secondaryError) {
            console.error(`[Gemini Helper] Both models failed.`, secondaryError);
            throw secondaryError;
        }
    }
};
