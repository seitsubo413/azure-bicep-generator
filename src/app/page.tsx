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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cloud className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Azure アーキテクチャ自動生成システム
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            AI駆動による高品質なAzureアーキテクチャの自動設計
          </p>
          
          {/* 統合された設定パネル */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* 出力タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileCode className="inline h-4 w-4 mr-1" />
                  出力タイプ
                </label>
                <select
                  value={outputType}
                  onChange={(e) => setOutputType(e.target.value as OutputType)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bicep">Bicep のみ</option>
                  <option value="architecture">構成図 のみ</option>
                  <option value="both">Bicep + 構成図</option>
                </select>
              </div>

              {/* 高度な評価システム */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Brain className="inline h-4 w-4 mr-1" />
                  高度な評価システム
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useAdvancedEvaluation}
                    onChange={(e) => setUseAdvancedEvaluation(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">4エージェント反復改善</span>
                </div>
              </div>

              {/* 目標スコア */}
              {useAdvancedEvaluation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    目標スコア
                  </label>
                  <select
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={60}>60点 (開発環境)</option>
                    <option value={70}>70点 (テスト環境)</option>
                    <option value={80}>80点 (ステージング)</option>
                    <option value={85}>85点 (本番環境)</option>
                    <option value={90}>90点 (ミッションクリティカル)</option>
                    <option value={95}>95点 (最高品質)</option>
                  </select>
                </div>
              )}

              {/* 最大イテレーション */}
              {useAdvancedEvaluation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Settings className="inline h-4 w-4 mr-1" />
                    最大イテレーション
                  </label>
                  <select
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1回</option>
                    <option value={3}>3回</option>
                    <option value={5}>5回 (推奨)</option>
                    <option value={7}>7回</option>
                    <option value={10}>10回</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 要件入力 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            <Lightbulb className="inline h-5 w-5 mr-2" />
            アプリケーション要件
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`詳細な要件を入力してください。例：

APIM + App Service + PostgreSQL構成
- 地域: Japan East
- 可用性: 99.9%以上、ゾーン冗長
- セキュリティ: Private Endpoint、マネージドID使用
- DR: Geo-冗長、RTO 4時間、RPO 1時間
- コンプライアンス: ISO27001、監査ログ必須`}
            className="w-full h-40 p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* 実行ボタン */}
        <div className="flex justify-center gap-4 mb-6">
          {useAdvancedEvaluation ? (
            <button
              onClick={handleAdvancedEvaluation}
              disabled={isAdvancedEvaluationLoading || !input.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
            >
              {isAdvancedEvaluationLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Brain className="h-5 w-5" />
              )}
              {isAdvancedEvaluationLoading ? '4エージェント評価中...' : '4エージェント反復改善実行'}
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              {isLoading ? '生成中...' : 'アーキテクチャ生成'}
            </button>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 高度な評価結果 */}
        {advancedEvaluationResult && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Brain className="h-6 w-6 mr-2 text-purple-600" />
              4エージェント反復改善結果
            </h2>
            
            {/* 最終スコア */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {advancedEvaluationResult.finalScore?.total || 0}
                </div>
                <div className="text-sm text-green-800">総合スコア</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-blue-600">
                  {advancedEvaluationResult.finalScore?.security || 0}
                </div>
                <div className="text-sm text-blue-800">セキュリティ</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-yellow-600">
                  {advancedEvaluationResult.finalScore?.performance || 0}
                </div>
                <div className="text-sm text-yellow-800">パフォーマンス</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-purple-600">
                  {advancedEvaluationResult.finalScore?.reliability || 0}
                </div>
                <div className="text-sm text-purple-800">信頼性</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-xl font-bold text-orange-600">
                  {advancedEvaluationResult.finalScore?.cost || 0}
                </div>
                <div className="text-sm text-orange-800">コスト最適化</div>
              </div>
            </div>

            {/* イテレーション履歴 */}
            {advancedEvaluationResult.iterationHistory && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">改善履歴</h3>
                <div className="space-y-2">
                  {advancedEvaluationResult.iterationHistory.map((iteration: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">イテレーション {iteration.iteration}</span>
                        <span className="text-sm font-semibold text-gray-600">
                          スコア: {iteration.totalScore}/100
                        </span>
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">詳細評価</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(advancedEvaluationResult.detailedEvaluations).map(([category, evaluation]: [string, any]) => (
                    <div key={category} className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 capitalize">{category}</h4>
                      <div className="text-sm space-y-1">
                        <div>スコア: {evaluation.score}/25</div>
                        {evaluation.issues && evaluation.issues.length > 0 && (
                          <div>
                            <div className="font-medium">指摘事項:</div>
                            <ul className="list-disc list-inside text-xs">
                              {evaluation.issues.map((issue: string, idx: number) => (
                                <li key={idx}>{issue}</li>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Bicep コード */}
            {generatedBicep && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    生成されたBicepコード
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      {copySuccess ? 'コピー済み!' : 'コピー'}
                    </button>
                    <button
                      onClick={downloadBicep}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      ダウンロード
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generatedBicep}</code>
                </pre>
              </div>
            )}

            {/* アーキテクチャ図 */}
            {generatedArchitecture && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  アーキテクチャ構成図
                </h2>
                <div className="border border-gray-200 rounded-lg p-4">
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
