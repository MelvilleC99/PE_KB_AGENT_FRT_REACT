
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KB_TEMPLATES } from "@/lib/template-loader"
import { DynamicWorkflowForm } from "@/components/kb/dynamic-workflow-form"
import { DynamicStepsForm } from "@/components/kb/dynamic-steps-form"
import { DynamicCausesForm } from "@/components/kb/dynamic-causes-form"
import { DynamicRelatedLinksForm } from "@/components/kb/dynamic-related-links-form"
import type { KBTemplateField } from "@/lib/types/kb"

interface EntryFormProps {
  templateId: string
  formData: Record<string, any>
  onFormDataChange: (data: Record<string, any>) => void
}

// Help text for definition fields
const DEFINITION_HELP: Record<string, string> = {
  term: "The exact term or phrase to define (e.g., 'Ready for Offer', 'ERF Size')",
  definition: "A clear, one-sentence explanation of what this term means",
  what_it_means: "Additional context to help agents understand when/how this applies",
  agent_action: "What should the agent do when they encounter this? (if applicable)",
  next_step: "What happens after this stage? (mainly for pipeline stages)",
  example: "A real-world scenario showing this term in use",
  also_known_as: "Other names for the same thing (e.g., 'Stand Size' for 'ERF Size')"
}

export function EntryForm({ templateId, formData, onFormDataChange }: EntryFormProps) {
  const template = KB_TEMPLATES.find((t) => t.id === templateId)

  if (!template) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Please select a template to begin creating your entry.
      </div>
    )
  }

  // Use dynamic form for workflows
  if (templateId === "workflow") {
    return <DynamicWorkflowForm formData={formData} onFormDataChange={onFormDataChange} />
  }

  const handleFieldChange = (fieldKey: string, value: string) => {
    onFormDataChange({
      ...formData,
      [fieldKey]: value,
    })
  }

  const getHelpText = (field: KBTemplateField): string | undefined => {
    if (templateId === "definition" && DEFINITION_HELP[field.key]) {
      return DEFINITION_HELP[field.key]
    }
    return undefined
  }

  const renderField = (field: KBTemplateField) => {
    const value = formData[field.key] || ""
    const helpText = getHelpText(field)

    switch (field.type) {
      case "text":
        return (
          <div className="space-y-1">
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
          </div>
        )
      case "textarea":
        return (
          <div className="space-y-1">
            <Textarea
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
          </div>
        )
      case "code":
        return (
          <div className="space-y-1">
            <Textarea
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="font-mono text-sm"
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
          </div>
        )
      case "select":
        return (
          <div className="space-y-1">
            <Select value={value} onValueChange={(val) => handleFieldChange(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem 
                    key={typeof option === 'string' ? option : option.value} 
                    value={typeof option === 'string' ? option : option.value}
                  >
                    {typeof option === 'string' ? option : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
          </div>
        )
      case "dynamic":
        // Handle dynamic fields (like steps in how-to)
        if (field.key === "steps") {
          return (
            <DynamicStepsForm
              value={value}
              onChange={(steps) => handleFieldChange(field.key, steps)}
            />
          )
        }
        // Handle dynamic causes for error entries
        if (field.key === "causes") {
          // Ensure value is always an array for causes
          const causesValue = Array.isArray(value) ? value : [];
          return (
            <DynamicCausesForm
              value={causesValue}
              onChange={(causes) => handleFieldChange(field.key, causes)}
            />
          )
        }
        return null
      case "dynamic_related_links":
        // Handle dynamic related links for how_to and definition templates
        return (
          <DynamicRelatedLinksForm
            value={value}
            onChange={(links) => handleFieldChange(field.key, links)}
            label={field.label}
            helpText={field.helpText}
          />
        )
      case "file":
        return (
          <div className="space-y-1">
            <Input
              type="file"
              accept={field.accept}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleFieldChange(field.key, file)
                }
              }}
            />
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
          </div>
        )
      case "image_upload":
        return (
          <div className="space-y-2">
            {value ? (
              <div className="relative border rounded-lg p-2 bg-gray-50">
                <img 
                  src={value} 
                  alt="Screenshot preview"
                  className="max-h-40 mx-auto rounded"
                />
                <button
                  onClick={() => handleFieldChange(field.key, '')}
                  className="absolute top-1 right-1 h-6 w-6 p-0 bg-white hover:bg-red-50 rounded flex items-center justify-center"
                >
                  <span className="text-red-600 text-xs">×</span>
                </button>
              </div>
            ) : (
              <div>
                <label 
                  htmlFor={field.key}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    id={field.key}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Convert to base64
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          handleFieldChange(field.key, reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <span className="text-xs text-gray-600">
                    📷 Click to upload screenshot (PNG, JPG, max 5MB)
                  </span>
                </label>
              </div>
            )}
            {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {template.fields.map((field) => {
        // Check if field should be shown based on showIf condition
        if (field.showIf) {
          const conditionValue = formData[field.showIf.field]
          if (conditionValue !== field.showIf.value) {
            return null // Hide field if condition not met
          }
        }
        
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        )
      })}
    </div>
  )
}
