'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Camera } from 'lucide-react'

interface MermaidDiagramProps {
  diagram: string
  onImageGenerated?: (dataUrl: string) => void
}

export default function MermaidDiagram({ diagram, onImageGenerated }: MermaidDiagramProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState<string>('')
  const [isRendered, setIsRendered] = useState(false)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !diagram) return

      try {
        setRenderError('')
        
        // Mermaid図表の抽出（```mermaid ... ``` の部分のみ）
        const mermaidMatch = diagram.match(/```mermaid\n([\s\S]*?)\n```/)
        if (!mermaidMatch) {
          // Mermaid形式でない場合は、生のテキストを表示
          if (elementRef.current) {
            elementRef.current.innerHTML = `
              <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <div class="text-yellow-700 font-medium mb-2">⚠️ Mermaid図表形式が検出されませんでした</div>
                <div class="text-sm text-yellow-600 mb-3">
                  生成されたテキストをそのまま表示します。
                </div>
                <div class="bg-white p-3 rounded border text-sm max-h-96 overflow-auto">
                  <pre class="whitespace-pre-wrap">${diagram.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
              </div>
            `
          }
          return
        }

        const mermaidCode = mermaidMatch[1]
        
        // 動的にmermaidをインポートしてレンダリング
        const mermaid = (await import('mermaid')).default
        
        // 初期化
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
          }
        })
        
        // 一意のIDを生成
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // SVGを生成
        const { svg } = await mermaid.render(id, mermaidCode)
        
        // elementRefに挿入
        if (elementRef.current) {
          elementRef.current.innerHTML = svg
          
          // SVGのサイズを調整
          const svgElement = elementRef.current.querySelector('svg')
          if (svgElement) {
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
            svgElement.style.backgroundColor = 'white'
            svgElement.style.padding = '16px'
          }
          
          setIsRendered(true)
        }
      } catch (error) {
        console.error('Mermaid図表のレンダリングに失敗:', error)
        setRenderError(error instanceof Error ? error.message : '不明なエラー')
        
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div class="text-red-500 p-4 border border-red-300 rounded">
              <div class="font-medium mb-2">⚠️ 図表の生成に失敗しました</div>
              <details class="text-sm">
                <summary class="cursor-pointer">エラー詳細を表示</summary>
                <pre class="mt-2 p-2 bg-red-50 rounded text-xs">${error}</pre>
              </details>
              <div class="mt-3 text-sm">
                生成されたコード:
                <pre class="mt-1 p-2 bg-gray-100 rounded text-xs max-h-32 overflow-auto">${diagram.substring(0, 500)}...</pre>
              </div>
            </div>
          `
        }
      }
    }

    renderDiagram()
  }, [diagram])

  const exportAsPNG = async () => {
    if (!elementRef.current || !isRendered) return

    try {
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(elementRef.current, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const dataUrl = canvas.toDataURL('image/png')
      
      if (onImageGenerated) {
        onImageGenerated(dataUrl)
      }

      const link = document.createElement('a')
      link.download = 'azure-architecture.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('PNG出力に失敗:', error)
    }
  }

  const exportAsSVG = () => {
    if (!elementRef.current || !isRendered) return

    const svgElement = elementRef.current.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.download = 'azure-architecture.svg'
    link.href = url
    link.click()
    
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* 出力ボタン */}
      {isRendered && (
        <div className="flex space-x-2 justify-end">
          <button
            onClick={exportAsPNG}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Camera className="h-4 w-4" />
            <span>PNG出力</span>
          </button>
          <button
            onClick={exportAsSVG}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>SVG出力</span>
          </button>
        </div>
      )}
      
      {/* Mermaid図表表示エリア */}
      <div 
        ref={elementRef}
        className="bg-white border rounded-lg p-4 min-h-64 flex items-center justify-center overflow-auto"
        style={{ minHeight: '400px' }}
      >
        {!diagram && (
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>要件を入力してアーキテクチャ図を生成してください</p>
          </div>
        )}
      </div>
      
      {/* 図表の説明 */}
      <p className="text-xs text-gray-500 text-center">
        💡 生成された図表はPNGまたはSVG形式でダウンロードできます。パワーポイントにも直接貼り付け可能です。
      </p>
    </div>
  )
}
