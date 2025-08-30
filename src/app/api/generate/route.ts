import { NextRequest, NextResponse } from 'next/server'

const BICEP_GENERATION_PROMPT = `あなたは Azure Bicep テンプレートの専門家です。
ユーザーから提供される自然言語の要件を分析し、高品質で実用的な Bicep テンプレートを生成してください。

以下の原則に従ってください：

1. **ベストプラクティス**:
   - 適切なリソース命名規則を使用
   - uniqueString() を使用して一意性を確保
   - パラメータと変数を適切に使用
   - セキュリティを考慮した設定

2. **構造**:
   - 明確なパラメータ定義
   - 適切な変数設定
   - リソース間の依存関係を正しく設定
   - 有用なアウトプットを提供

3. **コメント**:
   - 各リソースセクションに日本語コメントを追加
   - 重要な設定について説明を記載

4. **出力**:
   - 完全に動作する Bicep テンプレートのみを返す
   - 説明文や追加テキストは含めない
   - エラーのない、すぐに使える形式で提供

要件: {requirements}

上記の要件に基づいて、完全な Bicep テンプレートを生成してください：`

const ARCHITECTURE_GENERATION_PROMPT = `あなたはAzureアーキテクチャ図の専門家です。
ユーザーの要件に基づいて、Mermaid形式でアーキテクチャ図を生成してください。

以下の原則に従ってください：

1. **明確性**: 各コンポーネントとその関係を明確に表現
2. **Azure サービス**: 実際のAzureサービス名を使用
3. **フロー**: データフローやネットワーク接続を示す
4. **ベストプラクティス**: Azureのアーキテクチャパターンに準拠

要件: {requirements}

上記の要件に基づいて、Mermaid形式のアーキテクチャ図を生成してください：`

export async function POST(request: NextRequest) {
  try {
    const { requirements, outputType } = await request.json()

    if (!requirements?.trim()) {
      return NextResponse.json(
        { error: '要件が提供されていません' },
        { status: 400 }
      )
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT!
    const apiKey = process.env.AZURE_OPENAI_API_KEY!
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME!

    const results: any = {}

    // Bicep生成
    if (outputType === 'bicep' || outputType === 'both') {
      const bicepPrompt = BICEP_GENERATION_PROMPT.replace('{requirements}', requirements)
      
      const bicepResponse = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'あなたは Azure Bicep テンプレートの専門家です。高品質で実用的な Bicep テンプレートを生成してください。' },
            { role: 'user', content: bicepPrompt }
          ],
          max_tokens: 4000,
          temperature: 0.1,
        }),
      })

      if (bicepResponse.ok) {
        const bicepData = await bicepResponse.json()
        results.bicep = bicepData.choices[0]?.message?.content?.trim()
      }
    }

    // アーキテクチャ図生成
    if (outputType === 'architecture' || outputType === 'both') {
      const archPrompt = ARCHITECTURE_GENERATION_PROMPT.replace('{requirements}', requirements)
      
      const archResponse = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'あなたはAzureアーキテクチャ図の専門家です。Mermaid形式でアーキテクチャ図を生成してください。' },
            { role: 'user', content: archPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.2,
        }),
      })

      if (archResponse.ok) {
        const archData = await archResponse.json()
        results.architecture = archData.choices[0]?.message?.content?.trim()
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('生成API エラー:', error)
    return NextResponse.json(
      { error: '生成中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
