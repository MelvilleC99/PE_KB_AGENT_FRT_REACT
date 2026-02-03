
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KB_TEMPLATES } from "@/lib/template-loader"

interface TemplateSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function TemplateSelector({ value, onValueChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Template Type</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a template type">
            {value && (
              <div className="text-left">
                <div className="font-medium">{KB_TEMPLATES.find(t => t.id === value)?.name}</div>
                <div className="text-xs text-muted-foreground">{KB_TEMPLATES.find(t => t.id === value)?.description}</div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-full max-w-[500px]">
          {KB_TEMPLATES.map((template) => (
            <SelectItem key={template.id} value={template.id} className="cursor-pointer py-3">
              <div className="space-y-1">
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-muted-foreground whitespace-normal">{template.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
