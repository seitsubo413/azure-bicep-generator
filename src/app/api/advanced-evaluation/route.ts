import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { requirements, targetScore = 85 } = await request.json()

    if (!requirements?.trim()) {
      return NextResponse.json(
        { error: '要件が提供されていません' },
        { status: 400 }
      )
    }

    console.log('🚀 順次改善システム開始', `(目標: ${targetScore}点)`)

    // 環境変数
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    const deployment = "gpt4o-deployment"

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Azure OpenAI の設定が不完全です' },
        { status: 500 }
      )
    }

    // 1. 初期Bicep生成
    let currentBicep = await generateInitialBicep(requirements, endpoint, apiKey, deployment)
    let currentArchitecture = await generateArchitecture(requirements, endpoint, apiKey, deployment)

    // 2. 各エージェントによる評価のみ
    console.log('🔄 4エージェント評価開始')

    // 2.1 セキュリティエージェント評価
    console.log('🔒 セキュリティエージェント評価中...')
    const securityEvaluation = await evaluateWithAgent(currentBicep, currentArchitecture, getSecurityPrompt(), endpoint, apiKey, deployment, "セキュリティ")
    
    console.log('⏳ レート制限対応のため10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // 2.2 パフォーマンスエージェント評価
    console.log('⚡ パフォーマンスエージェント評価中...')
    const performanceEvaluation = await evaluateWithAgent(currentBicep, currentArchitecture, getPerformancePrompt(), endpoint, apiKey, deployment, "パフォーマンス")
    
    console.log('⏳ レート制限対応のため10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // 2.3 信頼性エージェント評価
    console.log('🛡️ 信頼性エージェント評価中...')
    const reliabilityEvaluation = await evaluateWithAgent(currentBicep, currentArchitecture, getReliabilityPrompt(), endpoint, apiKey, deployment, "信頼性")
    
    console.log('⏳ レート制限対応のため10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // 2.4 コスト最適化エージェント評価
    console.log('💰 コスト最適化エージェント評価中...')
    const costEvaluation = await evaluateWithAgent(currentBicep, currentArchitecture, getCostPrompt(), endpoint, apiKey, deployment, "コスト最適化")

    // 3. 評価結果まとめ
    const evaluationResults = [
      {
        agent: 'セキュリティ',
        score: securityEvaluation.score,
        issues: securityEvaluation.issues
      },
      {
        agent: 'パフォーマンス',
        score: performanceEvaluation.score,
        issues: performanceEvaluation.issues
      },
      {
        agent: '信頼性',
        score: reliabilityEvaluation.score,
        issues: reliabilityEvaluation.issues
      },
      {
        agent: 'コスト最適化',
        score: costEvaluation.score,
        issues: costEvaluation.issues
      }
    ]

    // 初期スコア計算
    const initialScore = {
      security: securityEvaluation.score,
      performance: performanceEvaluation.score,
      reliability: reliabilityEvaluation.score,
      cost: costEvaluation.score,
      total: securityEvaluation.score + performanceEvaluation.score + reliabilityEvaluation.score + costEvaluation.score
    }

    // 4. 統合改善エージェント（MVP A+B）
    console.log('� 統合改善エージェント実行中...')
    const integrationResult = await integratedImprovementAgent(
      currentBicep, 
      currentArchitecture,
      evaluationResults,
      endpoint, 
      apiKey, 
      deployment
    )

    // 5. 最終スコア計算（改善後）
    console.log('📊 改善後スコア計算中...')
    const improvedScore = integrationResult.improvedBicep ? 
      await calculateFinalScore(integrationResult.improvedBicep, currentArchitecture, endpoint, apiKey, deployment) :
      initialScore

    console.log(`🎯 改善前スコア: ${initialScore.total}点`)
    console.log(`🎯 改善後スコア: ${improvedScore.total}点 (${improvedScore.total - initialScore.total > 0 ? '+' : ''}${improvedScore.total - initialScore.total}点)`)

    // 6. 最終アーキテクチャ図生成（レート制限対策）
    console.log('⏳ Mermaid生成前に10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    const finalMermaid = await generateMermaidFromBicep(
      integrationResult.improvedBicep || currentBicep, 
      endpoint, 
      apiKey, 
      deployment
    )

    return NextResponse.json({
      success: true,
      finalBicep: integrationResult.improvedBicep || currentBicep,
      finalArchitecture: finalMermaid,
      initialScore,
      finalScore: improvedScore,
      improvement: integrationResult,
      evaluationResults,
      detailedEvaluations: {
        security: securityEvaluation,
        performance: performanceEvaluation,
        reliability: reliabilityEvaluation,
        cost: costEvaluation
      },
      targetScore,
      // 改善提案（全エージェントの課題を統合）
      improvementSuggestions: {
        allIssues: [
          ...securityEvaluation.issues.map((issue: any) => ({ ...issue, category: 'セキュリティ' })),
          ...performanceEvaluation.issues.map((issue: any) => ({ ...issue, category: 'パフォーマンス' })),
          ...reliabilityEvaluation.issues.map((issue: any) => ({ ...issue, category: '信頼性' })),
          ...costEvaluation.issues.map((issue: any) => ({ ...issue, category: 'コスト最適化' }))
        ],
        summary: integrationResult.summary || "統合改善エージェントによる分析が完了しました。"
      }
    })

  } catch (error) {
    console.error('エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// 新しいimproveWithAgent関数
async function improveWithAgent(
  bicep: string, 
  architecture: string, 
  agentPrompt: string, 
  endpoint: string, 
  apiKey: string, 
  deployment: string, 
  agentName: string
) {
  try {
    // 1. 初回エージェントによる評価
    const initialEvaluation = await evaluateWithAgent(bicep, architecture, agentPrompt, endpoint, apiKey, deployment, agentName)
    
    // 2. 改善提案の抽出
    const improvements = initialEvaluation.issues.map((issue: any) => issue.improvement || issue.description).join('\n')
    
    // 3. Bicep改善（改善提案がある場合のみ）
    let improvedBicep = bicep
    let finalEvaluation = initialEvaluation
    
    if (improvements.trim()) {
      console.log(`🔧 ${agentName}エージェントによるBicep改善中...`)
      improvedBicep = await improveBicep(bicep, improvements, endpoint, apiKey, deployment)
      
      // 4. 改善後の再評価
      console.log(`📊 ${agentName}エージェント改善後評価中...`)
      finalEvaluation = await evaluateWithAgent(improvedBicep, architecture, agentPrompt, endpoint, apiKey, deployment, agentName)
    }
    
    return {
      improvedBicep,
      evaluation: finalEvaluation,
      improvements,
      initialScore: initialEvaluation.score,
      finalScore: finalEvaluation.score
    }
  } catch (error) {
    console.error(`${agentName}エージェントエラー:`, error)
    throw error
  }
}

// 既存の関数群（変更なし）
async function generateInitialBicep(requirements: string, endpoint: string, apiKey: string, deployment: string) {
  const messages = [
    {
      role: "system",
      content: `あなたはAzure Bicepの専門家です。与えられた要件に基づいて、本番環境対応の高品質なBicepテンプレートを生成してください。

重要なガイドライン:
1. Azure Well-Architected Framework に準拠
2. セキュリティベストプラクティスの適用
3. 適切なリソース名規則の使用
4. パラメータ化と再利用性の考慮
5. 最新のAPIバージョンの使用

生成するBicepコードのみを返してください。説明は不要です。`
    },
    {
      role: "user", 
      content: `要件: ${requirements}`
    }
  ]

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages,
      max_tokens: 4000,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`初期Bicep生成失敗: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function generateArchitecture(requirements: string, endpoint: string, apiKey: string, deployment: string) {
  const messages = [
    {
      role: "system",
      content: `あなたはAzureアーキテクチャの専門家です。与えられた要件に基づいて、Mermaid形式のアーキテクチャ図を生成してください。

出力形式:
- Mermaid flowchart syntax を使用
- Azureサービス間の関係を明確に表現
- 適切なラベルと接続線の使用
- 読みやすいレイアウト

Mermaidコードのみを返してください。説明は不要です。`
    },
    {
      role: "user", 
      content: `要件: ${requirements}`
    }
  ]

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages,
      max_tokens: 2000,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`アーキテクチャ生成失敗: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function evaluateWithAgent(bicep: string, architecture: string, agentPrompt: string, endpoint: string, apiKey: string, deployment: string, agentName: string) {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const messages = [
        {
          role: "system",
          content: agentPrompt
        },
        {
          role: "user", 
          content: `以下のBicepテンプレートとアーキテクチャを評価してください。

Bicepテンプレート:
${bicep}

アーキテクチャ:
${architecture}

JSON形式で以下の構造で回答してください:
{
  "score": <0-25の数値>,
  "issues": [
    {
      "category": "<問題のカテゴリ>",
      "severity": "<high/medium/low>",
      "description": "<問題の説明>",
      "improvement": "<具体的な改善提案>"
    }
  ]
}`
        }
      ]

      const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages,
          max_tokens: 2000,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        if (response.status === 429) {
          retryCount++
          console.log(`${agentName} レート制限エラー (試行 ${retryCount}/${maxRetries}), 30秒待機中...`)
          await new Promise(resolve => setTimeout(resolve, 30000))
          continue
        }
        throw new Error(`${agentName}エージェント評価失敗: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      
      // ```json で囲まれた形式を処理
      const jsonContent = extractJsonFromContent(content)
      
      let result
      try {
        result = JSON.parse(jsonContent)
      } catch (parseError) {
        console.error(`${agentName} JSON解析エラー:`, parseError)
        console.error(`受信したコンテンツ:`, content)
        
        // フォールバック: デフォルト値を返す
        return {
          score: 0,
          issues: [{
            category: "JSON解析エラー",
            severity: "high",
            description: "AIからの応答をJSON形式で解析できませんでした",
            improvement: "API応答形式を確認してください"
          }]
        }
      }
      
      return {
        score: Math.min(Math.max(result.score || 0, 0), 25),
        issues: result.issues || []
      }
    } catch (error) {
      retryCount++
      if (retryCount >= maxRetries) {
        console.error(`${agentName}エージェント最大試行回数到達:`, error)
        return { score: 0, issues: [] }
      }
      console.log(`${agentName}エージェントエラー、再試行中... (${retryCount}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  }

  return { score: 0, issues: [] }
}

async function improveBicep(currentBicep: string, improvements: string, endpoint: string, apiKey: string, deployment: string) {
  const messages = [
    {
      role: "system",
      content: `あなたはAzure Bicepの専門家です。提供されたBicepテンプレートを指定された改善提案に基づいて改良してください。

重要なガイドライン:
1. 既存の機能を維持しながら改善を適用
2. Azure Well-Architected Framework に準拠
3. 最新のAPIバージョンとベストプラクティスを使用
4. 改善されたBicepコードのみを返してください

改善されたBicepコードのみを返してください。説明は不要です。`
    },
    {
      role: "user", 
      content: `現在のBicepテンプレート:
${currentBicep}

改善提案:
${improvements}`
    }
  ]

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages,
      max_tokens: 4000,
      temperature: 0.2
    })
  })

  if (!response.ok) {
    throw new Error(`Bicep改善失敗: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function generateMermaidFromBicep(bicep: string, endpoint: string, apiKey: string, deployment: string) {
  const messages = [
    {
      role: "system",
      content: `あなたはAzureアーキテクチャの専門家です。提供されたBicepテンプレートを分析し、Mermaid形式のアーキテクチャ図を生成してください。

出力形式:
- Mermaid flowchart syntax を使用
- Bicepで定義されたリソース間の関係を正確に表現
- 適切なラベルと接続線の使用
- 読みやすいレイアウト

Mermaidコードのみを返してください。説明は不要です。`
    },
    {
      role: "user", 
      content: `Bicepテンプレート:
${bicep}`
    }
  ]

  const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      messages,
      max_tokens: 2000,
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`Mermaid生成失敗: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// エージェントプロンプト関数群
function getSecurityPrompt(): string {
  return `あなたはAzureセキュリティの専門家です。Azure Well-Architected Framework のセキュリティピラーに基づいて、Bicepテンプレートとアーキテクチャを厳格に評価してください。

評価観点:
- Identity and Access Management (IAM)
- ネットワークセキュリティ
- データ保護と暗号化
- アプリケーションセキュリティ
- インフラセキュリティ
- DevSecOps

25点満点で評価し、具体的な改善提案を含めてください。`
}

function getPerformancePrompt(): string {
  return `あなたはAzureパフォーマンス最適化の専門家です。Azure Well-Architected Framework のパフォーマンス効率ピラーに基づいて、Bicepテンプレートとアーキテクチャを評価してください。

評価観点:
- リソースのスケーラビリティ
- 応答性とスループット
- リソース効率性
- モニタリングと診断
- 自動スケーリング設定
- 地理的分散

25点満点で評価し、具体的な改善提案を含めてください。`
}

function getReliabilityPrompt(): string {
  return `あなたはAzure信頼性の専門家です。Azure Well-Architected Framework の信頼性ピラーに基づいて、Bicepテンプレートとアーキテクチャを評価してください。

評価観点:
- 高可用性設計
- 障害復旧能力
- データバックアップ戦略
- 冗長性とフェイルオーバー
- 監視とアラート
- SLA要件への準拠

25点満点で評価し、具体的な改善提案を含めてください。`
}

function getCostPrompt(): string {
  return `あなたはAzureコスト最適化の専門家です。Azure Well-Architected Framework のコスト最適化ピラーに基づいて、Bicepテンプレートとアーキテクチャを評価してください。

評価観点:
- リソースサイジングの適切性
- 予約インスタンスの活用
- 自動スケーリングによるコスト効率
- 不要なリソースの特定
- コスト監視と予算管理
- ライセンス最適化

25点満点で評価し、具体的な改善提案を含めてください。`
}

// JSON抽出用ヘルパー関数
function extractJsonFromContent(content: string): string {
  try {
    // ```json で囲まれている場合の処理
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      return jsonMatch[1].trim()
    }
    
    // ``` で囲まれている場合の処理
    const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/)
    if (codeMatch) {
      return codeMatch[1].trim()
    }
    
    // そのまま返す
    return content.trim()
  } catch (error) {
    console.error('JSON抽出エラー:', error)
    return content
  }
}

// 統合改善エージェント（MVP A+B）
async function integratedImprovementAgent(
  bicep: string,
  architecture: string,
  evaluationResults: any[],
  endpoint: string,
  apiKey: string,
  deployment: string
) {
  try {
    // 優先度重み（Security ≥ Reliability ≥ Performance ≥ Cost）
    const weights = {
      security: 0.4,
      reliability: 0.3,
      performance: 0.2,
      cost: 0.1
    }

    // 正規化されたスコア計算（0-1スケール）
    const normalizedScores = evaluationResults.reduce((acc, result) => {
      const agentKey = result.agent === 'セキュリティ' ? 'security' :
                      result.agent === '信頼性' ? 'reliability' :
                      result.agent === 'パフォーマンス' ? 'performance' : 'cost'
      acc[agentKey] = result.score / 25 // 25点満点を1.0に正規化
      return acc
    }, {} as any)

    // 目的関数 J = Σ(w_i * S_i) - λ * penalties
    const currentObjective = Object.keys(weights).reduce((sum, key) => {
      return sum + weights[key as keyof typeof weights] * normalizedScores[key]
    }, 0)

    console.log(`📊 現在の目的関数値: ${currentObjective.toFixed(3)}`)

    // 全エージェントの課題を統合
    const allIssues = evaluationResults.flatMap(result => 
      result.issues.map((issue: any) => ({
        ...issue,
        agent: result.agent,
        priority: weights[
          result.agent === 'セキュリティ' ? 'security' :
          result.agent === '信頼性' ? 'reliability' :
          result.agent === 'パフォーマンス' ? 'performance' : 'cost'
        ]
      }))
    )

    // 重要度でソート（優先度 × 深刻度）
    const prioritizedIssues = allIssues
      .filter(issue => issue.severity === 'high' || issue.severity === 'medium')
      .sort((a, b) => {
        const scoreA = a.priority * (a.severity === 'high' ? 1.0 : 0.6)
        const scoreB = b.priority * (b.severity === 'high' ? 1.0 : 0.6)
        return scoreB - scoreA
      })
      .slice(0, 5) // 上位5つの課題に集中

    if (prioritizedIssues.length === 0) {
      return {
        improvedBicep: null,
        summary: "重要な改善課題は検出されませんでした。現在のBicepテンプレートは適切に設計されています。",
        appliedImprovements: [],
        objectiveImprovement: 0
      }
    }

    // 統合改善プロンプトの生成
    const improvementPrompt = `あなたはAzure Well-Architected Framework の専門家です。以下の評価結果とBicepテンプレートを分析し、全体最適化の観点で改善してください。

優先度順序: Security → Reliability → Performance → Cost

重要な改善課題（優先度順）:
${prioritizedIssues.map((issue, index) => 
`${index + 1}. [${issue.agent}] ${issue.description}
   改善案: ${issue.improvement || '具体的な改善方法を提案してください'}
   重要度: ${issue.severity}`
).join('\n')}

制約事項:
- 上位優先度の改善は下位優先度を大幅に悪化させてはいけません
- セキュリティの基本要件（暗号化、Private Endpoint等）は必須
- コスト最適化はセキュリティ・信頼性を犠牲にしてはいけません

現在のBicepテンプレート:
${bicep}

改善されたBicepテンプレートのみを返してください。説明は不要です。`

    // Azure OpenAI API呼び出し
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-01`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: improvementPrompt
          },
          {
            role: "user",
            content: `統合改善を実行してください。優先度と制約を厳守してください。`
          }
        ],
        max_tokens: 4000,
        temperature: 0.2
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.log('統合改善エージェント レート制限エラー、30秒待機中...')
        await new Promise(resolve => setTimeout(resolve, 30000))
        return integratedImprovementAgent(bicep, architecture, evaluationResults, endpoint, apiKey, deployment)
      }
      throw new Error(`統合改善エージェント失敗: ${response.status}`)
    }

    const data = await response.json()
    const improvedBicep = data.choices[0].message.content

    return {
      improvedBicep,
      summary: `統合改善エージェントが ${prioritizedIssues.length} 件の重要課題を分析し、全体最適化を実行しました。`,
      appliedImprovements: prioritizedIssues,
      objectiveImprovement: "改善後の目的関数値は再評価で計算されます"
    }

  } catch (error) {
    console.error('統合改善エージェントエラー:', error)
    return {
      improvedBicep: null,
      summary: "統合改善エージェントでエラーが発生しました。元のBicepテンプレートを使用します。",
      appliedImprovements: [],
      objectiveImprovement: 0,
      error: error instanceof Error ? error.message : '不明なエラー'
    }
  }
}

// 最終スコア計算関数
async function calculateFinalScore(bicep: string, architecture: string, endpoint: string, apiKey: string, deployment: string) {
  try {
    console.log('📊 改善後の4エージェント評価中...')
    
    // セキュリティ評価
    const securityEval = await evaluateWithAgent(bicep, architecture, getSecurityPrompt(), endpoint, apiKey, deployment, "セキュリティ")
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // パフォーマンス評価
    const performanceEval = await evaluateWithAgent(bicep, architecture, getPerformancePrompt(), endpoint, apiKey, deployment, "パフォーマンス")
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // 信頼性評価
    const reliabilityEval = await evaluateWithAgent(bicep, architecture, getReliabilityPrompt(), endpoint, apiKey, deployment, "信頼性")
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // コスト最適化評価
    const costEval = await evaluateWithAgent(bicep, architecture, getCostPrompt(), endpoint, apiKey, deployment, "コスト最適化")

    return {
      security: securityEval.score,
      performance: performanceEval.score,
      reliability: reliabilityEval.score,
      cost: costEval.score,
      total: securityEval.score + performanceEval.score + reliabilityEval.score + costEval.score
    }
  } catch (error) {
    console.error('最終スコア計算エラー:', error)
    // エラー時は改善前スコアをそのまま返す
    throw error
  }
}
