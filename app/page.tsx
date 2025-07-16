"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Copy, Sun, Moon, Monitor, Check, AlertCircle, ChevronDownIcon, Sparkles, Info } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type FormatType = "auto" | "base64" | "url" | "hex" | "text"

export default function Base64Decoder() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [detectedFormat, setDetectedFormat] = useState<string>("")
  const [selectedFormat, setSelectedFormat] = useState<FormatType>("auto")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<"simple" | "advanced">("simple")
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Auto-detect format
  const detectFormat = useCallback((text: string): { format: string; confidence: string } => {
    if (!text.trim()) return { format: "Unknown", confidence: "0%" }

    // Base64 detection
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (base64Regex.test(text.replace(/\s/g, "")) && text.length % 4 === 0) {
      return { format: "Base64", confidence: "95%" }
    }

    // URL encoding detection
    if (text.includes("%") && /^[A-Za-z0-9%._~:/?#[\]@!$&'()*+,;=-]*$/.test(text)) {
      return { format: "URL Encoded", confidence: "85%" }
    }

    // Hex detection
    if (/^[0-9A-Fa-f\s]+$/.test(text) && text.replace(/\s/g, "").length % 2 === 0) {
      return { format: "Hexadecimal", confidence: "80%" }
    }

    return { format: "Plain Text", confidence: "90%" }
  }, [])

  // Convert based on detected or selected format
  const convert = useCallback(
    (text: string, format: FormatType) => {
      if (!text.trim()) {
        setOutput("")
        setError("")
        setDetectedFormat("")
        return
      }

      try {
        let result = ""
        let actualFormat = format

        if (format === "auto") {
          const detection = detectFormat(text)
          setDetectedFormat(`${detection.format} (${detection.confidence} confidence)`)

          // Auto-convert based on detection
          if (detection.format === "Base64") {
            result = decodeURIComponent(escape(atob(text.replace(/\s/g, ""))))
            actualFormat = "base64"
          } else if (detection.format === "URL Encoded") {
            result = decodeURIComponent(text)
            actualFormat = "url"
          } else if (detection.format === "Hexadecimal") {
            result =
              text
                .replace(/\s/g, "")
                .match(/.{2}/g)
                ?.map((byte) => String.fromCharCode(Number.parseInt(byte, 16)))
                .join("") || ""
            actualFormat = "hex"
          } else {
            result = btoa(unescape(encodeURIComponent(text)))
            actualFormat = "text"
          }
        } else {
          // Manual format selection
          switch (format) {
            case "base64":
              result = decodeURIComponent(escape(atob(text.replace(/\s/g, ""))))
              setDetectedFormat("Base64 (manual)")
              break
            case "url":
              result = decodeURIComponent(text)
              setDetectedFormat("URL Encoded (manual)")
              break
            case "hex":
              result =
                text
                  .replace(/\s/g, "")
                  .match(/.{2}/g)
                  ?.map((byte) => String.fromCharCode(Number.parseInt(byte, 16)))
                  .join("") || ""
              setDetectedFormat("Hexadecimal (manual)")
              break
            case "text":
              result = btoa(unescape(encodeURIComponent(text)))
              setDetectedFormat("Plain Text → Base64 (manual)")
              break
          }
        }

        setOutput(result)
        setError("")
      } catch (err) {
        setError("Invalid format or corrupted data")
        setOutput("")
        setDetectedFormat("Error in detection")
      }
    },
    [detectFormat],
  )

  useEffect(() => {
    convert(input, selectedFormat)
  }, [input, selectedFormat, convert])

  const handleCopy = async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      toast({
        description: "📋 Copied to clipboard!",
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      })
    }
  }

  const handleExplain = () => {
    toast({
      description: "🤖 AI Explain feature requires API integration",
      duration: 3000,
    })
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const cycleTheme = () => {
    const themes = ["light", "dark", "system"]
    const currentIndex = themes.indexOf(theme || "system")
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const formatLabels = {
    auto: "🅰️ Auto Detect",
    base64: "Base64",
    url: "URL Encoded",
    hex: "Hexadecimal",
    text: "Plain Text",
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">B64</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Base64 Toolkit</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={mode === "simple" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("simple")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Simple
            </Button>
            <Button
              variant={mode === "advanced" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("advanced")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Advanced
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              className="hover:bg-accent transition-colors duration-200"
            >
              {getThemeIcon()}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {mode === "advanced" && (
            <div className="flex items-center justify-center">
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">Format:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 bg-transparent"
                      >
                        {formatLabels[selectedFormat]}
                        <ChevronDownIcon className="-me-1 opacity-60 ml-2" size={16} aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={selectedFormat}
                        onValueChange={(value) => setSelectedFormat(value as FormatType)}
                      >
                        <DropdownMenuRadioItem value="auto">🅰️ Auto Detect</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="base64">Base64</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="url">URL Encoded</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="hex">Hexadecimal</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="text">Plain Text</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            </div>
          )}

          {/* Input Section */}
          <Card className="p-6 space-y-4 hover:shadow-md transition-shadow duration-300 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {mode === "simple" ? "📋 Paste anything here" : "Input"}
              </label>
              <span className="text-xs text-muted-foreground">{input.length} characters</span>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "simple" ? "Paste your text, Base64, URL, or hex here..." : "Enter your data..."}
              className="min-h-[120px] resize-none transition-all duration-200 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
              autoFocus
            />
          </Card>

          {/* Results Section */}
          {(output || error) && (
            <Card className="p-6 space-y-4 bg-yellow-50 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-800">
              <div className="space-y-3">
                {/* Detection Info */}
                {detectedFormat && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <span className="text-muted-foreground">Format detected:</span>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      {detectedFormat}
                    </Badge>
                  </div>
                )}

                {/* Result */}
                {output && !error && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-medium">✅ Result:</span>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {output.length > 100 ? `${output.substring(0, 100)}...` : output}
                      </code>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={handleCopy} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExplain}
                        className="border-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 bg-transparent"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />🔍 Explain (AI)
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Help Text */}
          <Card className="p-4 bg-muted/30">
            <div className="text-center space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {mode === "simple" ? "💡 Just paste and go!" : "🔧 Technical Mode"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {mode === "simple"
                  ? "Auto-detects Base64, URL encoding, hex, or plain text. Perfect for quick conversions without thinking."
                  : "Choose your input format manually for precise control over the conversion process."}
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built with Next.js • TypeMonkey-inspired design • Fast & secure client-side conversion
          </p>
        </div>
      </footer>
    </div>
  )
}
