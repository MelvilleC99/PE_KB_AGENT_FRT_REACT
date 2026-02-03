import { FullPageChat } from "@/components/chat/FullPageChat"

export function CustomerAgentPage() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-5xl h-[700px]">
        <FullPageChat agentType="customer" />
      </div>
    </div>
  )
}
