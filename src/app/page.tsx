'use client'

import { useState } from 'react'
import { Wand2, Download, Copy, Loader2, Cloud, FileCode, Lightbulb, Image, Code, Settings, Brain, TrendingUp } from 'lucide-react'
import MermaidDiagram from './components/MermaidDiagram'

type OutputType = 'bicep' | 'architecture' | 'both'

export default function Home() {
  const [input, setInput] = useState('')
  const [outputType, setOutputType] = useState<OutputType>('bicep')
  const [generatedBicep, setGeneratedBicep] = useState('')
  const [generatedArchitecture, setGeneratedArchitecture] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  
  // 統合された評価システム設定
  const [useAdvancedEvaluation, setUseAdvancedEvaluation] = useState(false)
  const [targetScore, setTargetScore] = useState(85)
  const [maxIterations, setMaxIterations] = useState(5)
  const [advancedEvaluationResult, setAdvancedEvaluationResult] = useState<any>(null)
  const [isAdvancedEvaluationLoading, setIsAdvancedEvaluationLoading] = useState(false)

  // 基本生成機能
  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('要件を入力してください')
      return
    }

    setIsLoading(true)
    setError('')
    setGeneratedBicep('')
    setGeneratedArchitecture('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirements: input,
          outputType: outputType,
        }),
      })

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.bicep) {
        setGeneratedBicep(data.bicep)
      }
      
      if (data.architecture) {
        setGeneratedArchitecture(data.architecture)
      }
    } catch (error) {
      console.error('生成エラー:', error)
      setError(error instanceof Error ? error.message : '生成中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 高度な反復改善システム
  const handleAdvancedEvaluation = async () => {
    if (!input.trim()) {
      setError('要件を入力してください')
      return
    }

    setIsAdvancedEvaluationLoading(true)
    setError('')
    setAdvancedEvaluationResult(null)

    try {
      const response = await fetch('/api/advanced-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirements: input,
          targetScore: targetScore,
          maxIterations: maxIterations,
        }),
      })

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`)
      }

      const data = await response.json()
      setAdvancedEvaluationResult(data)
      
      // 生成されたBicepとアーキテクチャも表示
      if (data.finalBicep) {
        setGeneratedBicep(data.finalBicep)
      }
      if (data.finalArchitecture) {
        setGeneratedArchitecture(data.finalArchitecture)
      }
    } catch (error) {
      console.error('高度な評価エラー:', error)
      setError(error instanceof Error ? error.message : '高度な評価中にエラーが発生しました')
    } finally {
      setIsAdvancedEvaluationLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedBicep)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('コピーに失敗しました:', err)
    }
  }

  const downloadBicep = () => {
    const blob = new Blob([generatedBicep], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'main.bicep'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Azure アーキテクチャ自動生成
                </h1>
                <p className="text-sm text-gray-500 font-medium">AI駆動による高品質なAzureアーキテクチャの自動設計</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5 rounded-full border border-emerald-200/50">
                <Brain className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-full border border-blue-200/50">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">4-Agent System</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* メイン設定カード */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 px-8 py-6 border-b border-gray-200/30">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">アーキテクチャ設計設定</h2>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* 左側: 要件入力 */}
              <div className="xl:col-span-2">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">要件仕様</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                </div>
                
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Azure アーキテクチャの要件を詳細に記述してください...

🏗️ 推奨記述例:
APIM + App Service + PostgreSQL構成
- 地域: Japan East
- 可用性: 99.9%以上、ゾーン冗長
- セキュリティ: Private Endpoint、マネージドID使用
- DR: Geo-冗長、RTO 4時間、RPO 1時間
- コンプライアンス: ISO27001、監査ログ必須
- スケール: 最大1000同時接続
- パフォーマンス: レスポンス時間500ms以下"
                    className="w-full h-64 p-6 border-2 border-gray-200/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 placeholder-gray-400 transition-all duration-200"
                  />
                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-md">
                    {input.length} 文字
                  </div>
                </div>
              </div>

              {/* 右側: 設定パネル */}
              <div className="space-y-6">
                {/* 評価システム選択 */}
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-6 border border-blue-200/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900">評価システム</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white/50 transition-all duration-200">
                      <input
                        type="checkbox"
                        checked={useAdvancedEvaluation}
                        onChange={(e) => setUseAdvancedEvaluation(e.target.checked)}
                        className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            4エージェント反復改善
                          </span>
                          <div className="px-2 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                            PRO
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Azure WAF準拠の高品質・本番環境向け評価
                        </p>
                      </div>
                    </label>

                    {useAdvancedEvaluation && (
                      <div className="space-y-4 pl-9 border-l-2 border-blue-300/50">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700">目標スコア</label>
                            <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 text-sm font-bold rounded-full border border-emerald-200">
                              {targetScore}点
                            </div>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="95"
                            value={targetScore}
                            onChange={(e) => setTargetScore(Number(e.target.value))}
                            className="w-full h-2 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>開発・テスト</span>
                            <span>本番環境</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-gray-700">最大イテレーション</label>
                            <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-sm font-bold rounded-full border border-purple-200">
                              {maxIterations}回
                            </div>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={maxIterations}
                            onChange={(e) => setMaxIterations(Number(e.target.value))}
                            className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1回</span>
                            <span>5回</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 出力タイプ選択（基本生成時のみ） */}
                {!useAdvancedEvaluation && (
                  <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-2xl p-6 border border-purple-200/30 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 mb-5">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-bold text-gray-900">出力タイプ</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { value: 'bicep', label: 'Bicep コード', icon: Code, desc: 'Infrastructure as Code' },
                        { value: 'architecture', label: '構成図', icon: Image, desc: 'Mermaid形式の図表' },
                        { value: 'both', label: '両方', icon: Lightbulb, desc: 'コード + 図表' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-start space-x-4 cursor-pointer group p-3 rounded-xl hover:bg-white/50 transition-all duration-200">
                          <input
                            type="radio"
                            name="outputType"
                            value={option.value}
                            checked={outputType === option.value}
                            onChange={(e) => setOutputType(e.target.value as OutputType)}
                            className="mt-1 w-5 h-5 text-purple-600 border-2 border-gray-300 focus:ring-purple-500 focus:ring-2"
                          />
                          <div className="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-purple-100 group-hover:to-pink-100 rounded-lg flex items-center justify-center transition-all duration-200">
                            <option.icon className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {option.label}
                            </span>
                            <p className="text-sm text-gray-600">{option.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 実行ボタン */}
                <button
                  onClick={useAdvancedEvaluation ? handleAdvancedEvaluation : handleGenerate}
                  disabled={isLoading || isAdvancedEvaluationLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl"
                >
                  <div className="flex items-center justify-center space-x-3">
                    {(isLoading || isAdvancedEvaluationLoading) ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Wand2 className="w-6 h-6" />
                    )}
                    <span className="text-lg">
                      {useAdvancedEvaluation ? '🚀 4エージェント反復改善実行' : '⚡ アーキテクチャ生成'}
                    </span>
                  </div>
                  {useAdvancedEvaluation && (
                    <div className="text-sm opacity-90 mt-1">
                      高品質・本番環境向け評価システム
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">!</span>
              </div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 高度な評価結果 */}
        {advancedEvaluationResult && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4エージェント反復改善結果</h2>
            </div>
            
            {/* 最終スコア */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200/50 text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {advancedEvaluationResult.finalScore?.total || 0}
                </div>
                <div className="text-sm font-medium text-emerald-800">総合スコア</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200/50 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {advancedEvaluationResult.finalScore?.security || 0}
                </div>
                <div className="text-sm font-medium text-blue-800">セキュリティ</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-200/50 text-center">
                <div className="text-2xl font-bold text-amber-600 mb-2">
                  {advancedEvaluationResult.finalScore?.performance || 0}
                </div>
                <div className="text-sm font-medium text-amber-800">パフォーマンス</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200/50 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {advancedEvaluationResult.finalScore?.reliability || 0}
                </div>
                <div className="text-sm font-medium text-purple-800">信頼性</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200/50 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {advancedEvaluationResult.finalScore?.cost || 0}
                </div>
                <div className="text-sm font-medium text-orange-800">コスト最適化</div>
              </div>
            </div>

            {/* イテレーション履歴 */}
            {advancedEvaluationResult.iterationHistory && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">改善履歴</h3>
                <div className="space-y-3">
                  {advancedEvaluationResult.iterationHistory.map((iteration: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200/50">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">イテレーション {iteration.iteration}</span>
                        <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-bold rounded-full">
                          スコア: {iteration.totalScore}/100
                        </div>
                      </div>
                      {iteration.changes && (
                        <div className="mt-2 text-sm text-gray-600">
                          主な変更: {iteration.changes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 詳細評価結果 */}
            {advancedEvaluationResult.detailedEvaluations && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">詳細評価</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(advancedEvaluationResult.detailedEvaluations).map(([category, evaluation]: [string, any]) => (
                    <div key={category} className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200/50">
                      <h4 className="font-bold text-gray-900 mb-3 capitalize">{category}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">スコア:</span>
                          <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
                            {evaluation.score}/25
                          </div>
                        </div>
                        {evaluation.issues && evaluation.issues.length > 0 && (
                          <div>
                            <div className="font-medium text-gray-800 mb-2">指摘事項:</div>
                            <ul className="space-y-2">
                              {evaluation.issues.map((issue: any, idx: number) => (
                                <li key={idx} className="bg-white/50 p-3 rounded-lg">
                                  <div className="font-medium text-gray-800">{issue.category}:</div>
                                  <div className="text-sm text-gray-600 mt-1">{issue.description}</div>
                                  {issue.improvement && (
                                    <div className="text-sm text-blue-600 mt-2 font-medium">
                                      💡 改善案: {issue.improvement}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 生成結果 */}
        {(generatedBicep || generatedArchitecture) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bicep コード */}
            {generatedBicep && (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-gray-600 rounded-lg flex items-center justify-center">
                        <Code className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">生成されたBicepコード</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-slate-600 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-slate-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <Copy className="h-4 w-4" />
                        {copySuccess ? 'コピー済み!' : 'コピー'}
                      </button>
                      <button
                        onClick={downloadBicep}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <Download className="h-4 w-4" />
                        ダウンロード
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <pre className="bg-gradient-to-br from-gray-900 to-slate-900 text-green-400 p-6 rounded-2xl overflow-x-auto text-sm font-mono shadow-inner">
                    <code>{generatedBicep}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* アーキテクチャ図 */}
            {generatedArchitecture && (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">アーキテクチャ構成図</h3>
                  </div>
                </div>
                <div className="p-6">
                  <MermaidDiagram diagram={generatedArchitecture} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
