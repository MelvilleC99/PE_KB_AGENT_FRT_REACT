
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { KB_TEMPLATES } from "@/lib/template-loader"

interface PreviewPanelProps {
  templateId: string
  title: string
  category: string
  severity?: string
  userType: string // Updated from userRoles
  product: string // Added product
  tags: string // Updated from string[] to string (comma-separated)
  formData: Record<string, any>
  definitionType?: string
}

export function PreviewPanel({ 
  templateId, 
  title, 
  category, 
  severity, 
  userType,
  product,
  tags, 
  formData,
  definitionType 
}: PreviewPanelProps) {
  const template = KB_TEMPLATES.find((t) => t.id === templateId)

  if (!template || !title) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Fill in the form to see a preview of your entry.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-xl font-semibold text-balance">{title}</h3>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{template.name}</Badge>
          <Badge variant="outline">{category.replace("_", " ")}</Badge>
          <Badge variant="outline">{userType}</Badge>
          <Badge variant="outline">{product}</Badge>
          {severity && <Badge variant={severity === "critical" ? "destructive" : "default"}>{severity}</Badge>}
        </div>

        {/* Tags */}
        {tags && tags.trim() && (
          <div>
            <p className="text-sm font-medium mb-2">Tags:</p>
            <div className="flex flex-wrap gap-1">
              {tags.split(',').map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Content Fields */}
        <div className="space-y-6">
          {template.fields.map((field) => {
            const value = formData[field.key]
            if (!value) return null

            return (
              <div key={field.key} className="border-l-4 border-blue-200 pl-4">
                <h4 className="font-semibold text-base text-gray-900 mb-3 uppercase tracking-wide">
                  {field.label}
                </h4>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {field.type === "code" ? (
                    <pre className="bg-gray-100 border border-gray-200 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                      <code>{value}</code>
                    </pre>
                  ) : field.type === "textarea" ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{value}</div>
                  ) : typeof value === 'object' && value !== null ? (
                    // Handle object values (like related_help)
                    <div className="space-y-2">
                      {Object.entries(value).map(([key, val]) => (
                        <div key={key}>
                          <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}: </span>
                          <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="font-medium">{String(value)}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
