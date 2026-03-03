
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children?: ReactNode;
    onReset: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: any): ErrorBoundaryState {
        return { 
            hasError: true, 
            error: error instanceof Error ? error : new Error(String(error)) 
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-red-50 text-red-900 z-[9999] flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-sm bg-opacity-95">
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-2xl w-full border-l-8 border-red-600 animate-bounce-in">
                        <h1 className="text-2xl md:text-3xl font-black mb-4 flex items-center gap-3">
                            <span className="text-4xl">💥</span> システムエラー発生
                        </h1>
                        <p className="mb-4 font-bold text-lg">データの形式に問題があるか、予期せぬ処理が発生しました。</p>
                        
                        <div className="bg-gray-100 p-4 rounded border border-gray-300 text-xs font-mono overflow-auto max-h-64 mb-6 shadow-inner">
                            <p className="font-bold text-red-700 mb-2 border-b border-gray-300 pb-1">エラー詳細:</p>
                            <p className="break-all whitespace-pre-wrap">{this.state.error?.toString()}</p>
                            {this.state.error?.stack && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">スタックトレースを表示</summary>
                                    <pre className="mt-2 opacity-75 overflow-x-auto">{this.state.error.stack}</pre>
                                </details>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-end">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-all shadow-md flex-1 sm:flex-none justify-center flex"
                            >
                                ページを再読み込み
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-lg transition-all transform hover:-translate-y-1 flex-1 sm:flex-none justify-center flex"
                            >
                                データをクリアして復帰
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
