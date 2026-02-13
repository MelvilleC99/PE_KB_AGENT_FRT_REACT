import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot } from "lucide-react"

const THINKING_WORDS = [
  "Pondering",
  "Ruminating",
  "Contemplating",
  "Mulling",
  "Unpacking",
  "Sifting",
]

const DOT_CYCLE = [".", "..", "..."]

export function ThinkingIndicator() {
  const [wordIndex, setWordIndex] = useState(0)
  const [dotIndex, setDotIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const nextWordRef = useRef(0)

  // Cycle dots: . → .. → ... every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % DOT_CYCLE.length)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Cycle words every 4s with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      nextWordRef.current = (wordIndex + 1) % THINKING_WORDS.length

      setTimeout(() => {
        setWordIndex(nextWordRef.current)
        setFading(false)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [wordIndex])

  return (
    <div className="flex gap-3">
      <AgentAvatar />
      <div className="bg-gray-100 rounded-lg px-4 py-3">
        <span
          className="text-sm text-gray-500 inline-flex items-baseline transition-opacity duration-300"
          style={{ opacity: fading ? 0 : 1 }}
        >
          {THINKING_WORDS[wordIndex]}
          <span className="inline-block w-[18px] text-left">{DOT_CYCLE[dotIndex]}</span>
        </span>
      </div>
    </div>
  )
}

/** Reusable agent avatar — crops james.png to show head/face */
export function AgentAvatar({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Avatar className={className}>
      <img
        src="/james.png"
        alt="Agent"
        className="h-[250%] w-full object-cover object-top"
        style={{ objectPosition: "50% 8%" }}
      />
      <AvatarFallback className="bg-gray-200">
        <Bot className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  )
}
