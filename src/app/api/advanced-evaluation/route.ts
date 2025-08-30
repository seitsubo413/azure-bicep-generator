import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { requirements, targetScore = 85, maxIterations = 3 } = await request.json()

    if (!requirements?.trim()) {
      return NextResponse.json(
        { error: '要件が提供されていません' },
        { status: 400 }
      )
    }

    console.log('🚀 反復改善システム開始', `(目標: ${targetScore}点, 最大: ${maxIterations}回)`)

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

    const iterationHistory = []
    let iteration = 1

    while (iteration <= maxIterations) {
      console.log(`🔄 改善イテレーション ${iteration}/${maxIterations} 開始`)

      // 2. 4エージェント評価（順次実行でレート制限回避）
      const evaluations = await evaluateWithAllAgentsSequential(currentBicep, currentArchitecture, endpoint, apiKey, deployment)

      // 3. スコア計算
      const totalScore = evaluations.security.score + evaluations.performance.score + evaluations.reliability.score + evaluations.cost.score

      console.log(`📊 現在のスコア: ${totalScore}点 (目標: ${targetScore}点)`)

      // イテレーション履歴に記録
      iterationHistory.push({
        iteration,
        totalScore,
        securityScore: evaluations.security.score,
        performanceScore: evaluations.performance.score,
        reliabilityScore: evaluations.reliability.score,
        costScore: evaluations.cost.score,
        changes: iteration === 1 ? '初期生成' : '前回からの改善適用'
      })

      // 4. 目標スコア達成判定
      if (totalScore >= targetScore) {
        console.log('🎉 目標スコア達成！')
        const finalMermaid = await generateMermaidFromBicep(currentBicep, endpoint, apiKey, deployment)
        
        return NextResponse.json({
          success: true,
          finalBicep: currentBicep,
          finalArchitecture: finalMermaid,
          finalScore: {
            total: totalScore,
            security: evaluations.security.score,
            performance: evaluations.performance.score,
            reliability: evaluations.reliability.score,
            cost: evaluations.cost.score
          },
          iterationHistory,
          detailedEvaluations: evaluations,
          targetScore,
          maxIterations,
          completedIterations: iteration
        })
      }

      // 5. 最大イテレーション達成判定
      if (iteration >= maxIterations) {
        console.log('⏰ 最大イテレーション数に到達')
        break
      }

      // 6. Bicep改善
      const improvements = [
        ...evaluations.security.issues.map((issue: any) => `セキュリティ: ${issue.improvement || issue.description}`),
        ...evaluations.performance.issues.map((issue: any) => `パフォーマンス: ${issue.improvement || issue.description}`),
        ...evaluations.reliability.issues.map((issue: any) => `信頼性: ${issue.improvement || issue.description}`),
        ...evaluations.cost.issues.map((issue: any) => `コスト: ${issue.improvement || issue.description}`)
      ].join('\n')

      if (improvements.trim()) {
        console.log('🔧 Bicep改善中...')
        currentBicep = await improveBicep(currentBicep, improvements, endpoint, apiKey, deployment)
      }

      // イテレーション終了時にレート制限回避のため30秒待機
      if (iteration < maxIterations) {
        console.log('⏳ 次のイテレーションまで30秒待機中（レート制限回避）...')
        await new Promise(resolve => setTimeout(resolve, 30000))
      }

      iteration++
    }

    // 最大イテレーション達成時の処理
    const finalMermaid = await generateMermaidFromBicep(currentBicep, endpoint, apiKey, deployment)
    const finalEvaluations = await evaluateWithAllAgentsSequential(currentBicep, currentArchitecture, endpoint, apiKey, deployment)
    const finalTotalScore = finalEvaluations.security.score + finalEvaluations.performance.score + finalEvaluations.reliability.score + finalEvaluations.cost.score

    return NextResponse.json({
      success: true,
      finalBicep: currentBicep,
      finalArchitecture: finalMermaid,
      finalScore: {
        total: finalTotalScore,
        security: finalEvaluations.security.score,
        performance: finalEvaluations.performance.score,
        reliability: finalEvaluations.reliability.score,
        cost: finalEvaluations.cost.score
      },
      iterationHistory,
      detailedEvaluations: finalEvaluations,
      targetScore,
      maxIterations,
      completedIterations: iteration - 1
    })

  } catch (error) {
    console.error('反復改善システムエラー:', error)
    return NextResponse.json(
      { error: `反復改善システムエラー: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    )
  }
}

async function generateInitialBicep(requirements: string, endpoint: string, apiKey: string, deployment: string): Promise<string> {
  try {
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'あなたはAzure Bicepテンプレートの専門家です。要件に基づいて高品質なBicepテンプレートを生成してください。'
          },
          {
            role: 'user',
            content: `以下の要件に基づいてBicepテンプレートを生成してください：\n\n${requirements}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Bicep生成エラー'
  } catch (error) {
    console.error('初期Bicep生成エラー:', error)
    return 'Bicep生成エラー'
  }
}

async function generateArchitecture(requirements: string, endpoint: string, apiKey: string, deployment: string): Promise<string> {
  try {
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'あなたはAzureアーキテクチャ図の専門家です。Mermaid形式でアーキテクチャ図を生成してください。'
          },
          {
            role: 'user',
            content: `以下の要件に基づいてMermaid形式のアーキテクチャ図を生成してください：\n\n${requirements}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'flowchart TD\n    A[アーキテクチャ図生成エラー]'
  } catch (error) {
    console.error('アーキテクチャ生成エラー:', error)
    return 'flowchart TD\n    A[アーキテクチャ図生成エラー]'
  }
}

async function evaluateWithAllAgentsSequential(bicep: string, architecture: string, endpoint: string, apiKey: string, deployment: string) {
  try {
    console.log('📊 セキュリティエージェント実行中...')
    const securityEval = await evaluateWithAgent(bicep, architecture, getSecurityPrompt(), endpoint, apiKey, deployment, "セキュリティ")
    
    // エージェント間の待機時間（レート制限対策）
    console.log('⏳ 10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('📊 パフォーマンスエージェント実行中...')
    const performanceEval = await evaluateWithAgent(bicep, architecture, getPerformancePrompt(), endpoint, apiKey, deployment, "パフォーマンス")
    
    console.log('⏳ 10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('📊 信頼性エージェント実行中...')
    const reliabilityEval = await evaluateWithAgent(bicep, architecture, getReliabilityPrompt(), endpoint, apiKey, deployment, "信頼性")
    
    console.log('⏳ 10秒待機中...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('📊 コスト最適化エージェント実行中...')
    const costEval = await evaluateWithAgent(bicep, architecture, getCostPrompt(), endpoint, apiKey, deployment, "コスト最適化")

    return {
      security: securityEval,
      performance: performanceEval,
      reliability: reliabilityEval,
      cost: costEval
    }
  } catch (error) {
    console.error('エージェント評価エラー:', error)
    // フォールバック評価を返す
    return {
      security: { score: 15, issues: [], strengths: [] },
      performance: { score: 15, issues: [], strengths: [] },
      reliability: { score: 15, issues: [], strengths: [] },
      cost: { score: 15, issues: [], strengths: [] }
    }
  }
}

async function evaluateWithAgent(bicep: string, architecture: string, prompt: string, endpoint: string, apiKey: string, deployment: string, agentName: string) {
  const maxRetries = 3
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: prompt },
            {
              role: 'user',
              content: `以下を評価してください：

## Bicepテンプレート
${bicep}

## アーキテクチャ説明
${architecture || 'なし'}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.2,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        
        // レート制限エラーの場合は長めに待機
        if (response.status === 429) {
          console.warn(`${agentName} レート制限エラー (試行 ${attempt}/${maxRetries}), 30秒待機中...`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 30000))
            continue
          }
        }
        
        console.error(`${agentName} API エラー (${response.status}):`, errorText)
        
        // フォールバック評価を返す
        return {
          score: 15,
          issues: [{ category: "API エラー", description: `${agentName}評価でAPI呼び出しが失敗しました`, severity: "medium", improvement: "評価システムの調整が必要です" }],
          strengths: ["基本構成は適切"]
        }
      }

      const data = await response.json()
      const responseText = data.choices?.[0]?.message?.content || '{}'
      
      try {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || [null, responseText]
        return JSON.parse(jsonMatch[1])
      } catch {
        return {
          score: 15,
          issues: [{ category: "評価エラー", description: "評価結果の解析に失敗", severity: "medium", improvement: "システム調整が必要" }],
          strengths: ["基本構成は適切"]
        }
      }
    } catch {
      if (attempt >= maxRetries) {
        return {
          score: 15,
          issues: [{ category: "システムエラー", description: `${agentName}評価でエラー発生`, severity: "medium", improvement: "システム確認が必要" }],
          strengths: ["基本構成は適切"]
        }
      }
    }
  }
}

async function improveBicep(currentBicep: string, improvements: string, endpoint: string, apiKey: string, deployment: string): Promise<string> {
  try {
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `以下の改善提案を基に、Bicepテンプレートを修正してください：

## 改善提案
${improvements}

## 現在のBicepテンプレート
${currentBicep}

修正されたBicepテンプレートのみを返してください。`
          },
          { role: 'user', content: '改善されたBicepテンプレートを生成してください。' }
        ],
        max_tokens: 3000,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || currentBicep
  } catch {
    return currentBicep
  }
}

async function generateMermaidFromBicep(bicep: string, endpoint: string, apiKey: string, deployment: string): Promise<string> {
  try {
    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'あなたはMermaid図の専門家です。Bicepテンプレートからアーキテクチャ図を生成してください。'
          },
          {
            role: 'user',
            content: `以下のBicepテンプレートからMermaid形式のアーキテクチャ図を生成してください：\n\n${bicep}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      }),
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'flowchart TD\n    A[アーキテクチャ図生成エラー]'
  } catch {
    return 'flowchart TD\n    A[アーキテクチャ図生成エラー]'
  }
}

function getSecurityPrompt(): string {
  return `あなたはAzureセキュリティ専門の評価エージェントです。

## 🛡️ セキュリティ評価基準 (25点満点)

### ネットワークセキュリティ (8点)
- Private Endpoint使用 (3点)
- NSG/ASGによる最小権限 (2点)  
- VNet分離・サブネット設計 (2点)
- パブリックアクセス無効化 (1点)

### アクセス制御 (8点)
- マネージドID使用 (3点)
- RBAC適切な設定 (2点)
- Key Vault統合 (2点)
- 認証・認可の実装 (1点)

### データ保護 (6点)
- 保存時暗号化 (2点)
- 転送時暗号化 (2点)
- 機密情報の適切な管理 (2点)

### コンプライアンス (3点)
- 診断ログ設定 (2点)
- ポリシー準拠 (1点)

評価は以下のJSON形式で返してください：
{
  "score": 評価点数(0-25),
  "issues": [
    {
      "category": "該当カテゴリ",
      "description": "具体的な問題点",
      "severity": "high|medium|low",
      "improvement": "改善提案"
    }
  ],
  "strengths": ["良い点1", "良い点2"]
}`
}

function getPerformancePrompt(): string {
  return `あなたはAzureパフォーマンス専門の評価エージェントです。

## ⚡ パフォーマンス評価基準 (25点満点)

### スケーラビリティ (10点)
- オートスケール設定 (4点)
- 負荷分散の実装 (3点)
- 水平スケール対応 (3点)

### レスポンス最適化 (8点)
- CDN/Front Door使用 (3点)
- キャッシュ戦略 (3点)
- 静的コンテンツ最適化 (2点)

### リソース効率 (4点)
- 適切なSKU選択 (2点)
- 配置最適化 (2点)

### モニタリング (3点)
- Application Insights (2点)
- パフォーマンスアラート (1点)

評価は以下のJSON形式で返してください：
{
  "score": 評価点数(0-25),
  "issues": [
    {
      "category": "該当カテゴリ",
      "description": "具体的な問題点",
      "severity": "high|medium|low",
      "improvement": "改善提案"
    }
  ],
  "strengths": ["良い点1", "良い点2"]
}`
}

function getReliabilityPrompt(): string {
  return `あなたはAzure信頼性専門の評価エージェントです。

## 🔧 信頼性評価基準 (25点満点)

### 高可用性 (10点)
- 可用性ゾーン使用 (4点)
- 冗長構成 (3点)
- 単一障害点排除 (3点)

### 災害復旧 (8点)
- 地理的冗長 (4点)
- バックアップ戦略 (2点)
- 復旧手順 (2点)

### モニタリング (4点)
- 包括的監視 (2点)
- ログ収集 (2点)

### 運用安定性 (3点)
- 段階的デプロイ (2点)
- ロールバック機能 (1点)

評価は以下のJSON形式で返してください：
{
  "score": 評価点数(0-25),
  "issues": [
    {
      "category": "該当カテゴリ",
      "description": "具体的な問題点",
      "severity": "high|medium|low",
      "improvement": "改善提案"
    }
  ],
  "strengths": ["良い点1", "良い点2"]
}`
}

function getCostPrompt(): string {
  return `あなたはAzureコスト最適化専門の評価エージェントです。

## 💰 コスト最適化評価基準 (25点満点)

### リソース最適化 (10点)
- 適切なSKU選択 (4点)
- 未使用リソース排除 (3点)
- リソースサイズ最適化 (3点)

### スケール効率 (8点)
- オートスケール活用 (4点)
- 予約インスタンス (2点)
- スポットインスタンス (2点)

### モニタリング制御 (4点)
- コスト監視 (2点)
- 予算アラート (2点)

### 設計効率 (3点)
- サーバーレス活用 (2点)
- 共有リソース使用 (1点)

評価は以下のJSON形式で返してください：
{
  "score": 評価点数(0-25),
  "issues": [
    {
      "category": "該当カテゴリ",
      "description": "具体的な問題点",
      "severity": "high|medium|low",
      "improvement": "改善提案"
    }
  ],
  "strengths": ["良い点1", "良い点2"]
}`
}
