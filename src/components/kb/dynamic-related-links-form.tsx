
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Link as LinkIcon, Info } from "lucide-react"

interface RelatedLink {
  id: string
  title: string
}

interface DynamicRelatedLinksFormProps {
  value: RelatedLink[] | string | null | undefined
  onChange: (links: RelatedLink[]) => void
  label?: string
  helpText?: string
}

export function DynamicRelatedLinksForm({ 
  value, 
  onChange,
  label = "Related Helpful Links",
  helpText = "Reference other KB entries by their exact title"
}: DynamicRelatedLinksFormProps) {
  
  // Handle different input types and ensure we always have a valid array
  let links: RelatedLink[] = [];
  
  if (Array.isArray(value)) {
    // Already an array - use it
    links = value.map((item, idx) => {
      if (typeof item === 'string') {
        // Convert string to object
        return {
          id: `link_${Date.now()}_${idx}`,
          title: item
        };
      }
      // Already an object
      return {
        id: item.id || `link_${Date.now()}_${idx}`,
        title: item.title || ''
      };
    });
  } else if (typeof value === 'string' && value.trim()) {
    // Legacy: parse from comma/newline separated string
    const parsed = value
      .split(/[\n,]/) // Split by newline or comma
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    links = parsed.map((title, idx) => ({
      id: `link_${Date.now()}_${idx}`,
      title
    }));
  }
  
  // Ensure we have at least one empty link
  if (links.length === 0) {
    links = [createEmptyLink()];
  }

  function createEmptyLink(): RelatedLink {
    return {
      id: `link_${Date.now()}_${Math.random()}`,
      title: ""
    }
  }

  const addLink = () => {
    const newLinks = [...links, createEmptyLink()]
    onChange(newLinks)
  }

  const removeLink = (linkId: string) => {
    const newLinks = links.filter(link => link.id !== linkId)
    // Keep at least one link (even if empty) for better UX
    if (newLinks.length === 0) {
      onChange([createEmptyLink()])
    } else {
      onChange(newLinks)
    }
  }

  const updateLink = (linkId: string, title: string) => {
    const newLinks = links.map(link => 
      link.id === linkId ? { ...link, title } : link
    )
    onChange(newLinks)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Label className="text-sm font-medium">{label} (Optional)</Label>
          <p className="text-xs text-muted-foreground">
            {helpText}
          </p>
        </div>
        <Button 
          onClick={addLink} 
          size="sm" 
          variant="outline"
          className="text-xs"
          type="button"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Link
        </Button>
      </div>

      <div className="space-y-2">
        {links.map((link, index) => (
          <Card key={link.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <Input
                  value={link.title}
                  onChange={(e) => updateLink(link.id, e.target.value)}
                  placeholder={`e.g., How to ${index === 0 ? 'resize images' : index === 1 ? 'upload photos' : 'check image quality'}`}
                  className="text-sm flex-1"
                />
                <Button
                  onClick={() => removeLink(link.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0"
                  type="button"
                  title="Remove this link"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {links.some(link => link.title.trim()) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800">
              <p className="font-medium">How This Helps:</p>
              <p className="text-xs mt-1">
                When users ask questions, the agent will automatically fetch these related documents 
                to provide more complete answers without requiring follow-up questions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
