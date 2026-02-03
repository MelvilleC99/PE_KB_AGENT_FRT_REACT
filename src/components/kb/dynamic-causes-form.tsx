
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, AlertCircle } from "lucide-react"

interface Cause {
  id: string
  cause_description: string
  solution: string
  related_help: string
}

interface DynamicCausesFormProps {
  value: Cause[]
  onChange: (causes: Cause[]) => void
}

export function DynamicCausesForm({ value, onChange }: DynamicCausesFormProps) {
  // Debug logging to see what we're getting
  console.log('🔍 DynamicCausesForm received value:', value, typeof value);
  
  // Ensure we always have a valid array
  let causes: Cause[] = [];
  
  if (Array.isArray(value)) {
    // Value is already an array - use it
    causes = value;
  } else if (value === null || value === undefined) {
    // No value provided - create empty array with one cause
    causes = [createEmptyCause()];
  } else {
    // Value is something else (object, string, etc.) - start fresh
    console.warn('⚠️ DynamicCausesForm received non-array value:', value);
    causes = [createEmptyCause()];
  }

  // Ensure we have at least one cause
  if (causes.length === 0) {
    causes = [createEmptyCause()];
  }
  
  // Ensure all causes have string properties (safety check)
  causes = causes.map(cause => ({
    id: cause.id || Date.now().toString() + Math.random(),
    cause_description: typeof cause.cause_description === 'string' ? cause.cause_description : '',
    solution: typeof cause.solution === 'string' ? cause.solution : '',
    related_help: typeof cause.related_help === 'string' ? cause.related_help : ''
  }));
  
  console.log('✅ DynamicCausesForm using causes:', causes);

  function createEmptyCause(): Cause {
    return {
      id: Date.now().toString() + Math.random(),
      cause_description: "",
      solution: "",
      related_help: ""
    }
  }

  const addCause = () => {
    const newCauses = [...causes, createEmptyCause()]
    onChange(newCauses)
  }

  const removeCause = (causeId: string) => {
    if (causes.length === 1) return // Keep at least one cause
    const newCauses = causes.filter(cause => cause.id !== causeId)
    onChange(newCauses)
  }

  const updateCause = (causeId: string, field: keyof Cause, value: string) => {
    const newCauses = causes.map(cause => 
      cause.id === causeId ? { ...cause, [field]: value } : cause
    )
    onChange(newCauses)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">Causes & Solutions</Label>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            <span>Add the most common causes first</span>
          </div>
        </div>
        <Button 
          onClick={addCause} 
          size="sm" 
          variant="outline"
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Cause
        </Button>
      </div>

      {causes.map((cause, causeIndex) => (
        <Card key={cause.id} className="relative border-l-4 border-l-blue-500">
          <div className="absolute top-3 right-3">
            <Button
              onClick={() => removeCause(cause.id)}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
              disabled={causes.length === 1}
              title="Remove this cause"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <CardContent className="pt-4 pb-4 pr-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Cause {causeIndex + 1}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">What&apos;s the cause? *</Label>
                <Textarea
                  value={cause.cause_description || ''}
                  onChange={(e) => updateCause(cause.id, "cause_description", e.target.value)}
                  placeholder="e.g., Property is rental listing - rentals don't support price reduction banners"
                  rows={2}
                  className="text-sm mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Describe when and why this cause happens. Be specific about conditions.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Solution *</Label>
                <Textarea
                  value={cause.solution || ''}
                  onChange={(e) => updateCause(cause.id, "solution", e.target.value)}
                  placeholder="e.g., Price reductions only work on sales listings. For rentals, you need to edit the rental amount instead."
                  rows={3}
                  className="text-sm mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Explain how to fix this issue. Include specific steps if needed.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Related Help (Optional)</Label>
                <Input
                  value={cause.related_help || ''}
                  onChange={(e) => updateCause(cause.id, "related_help", e.target.value)}
                  placeholder="e.g., how_to_edit_rental_price, check_listing_type"
                  className="text-sm mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Keywords or article names for related help content.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {causes.length > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800">
              <p className="font-medium mb-1">Agent Behavior:</p>
              <p>The agent will check causes in the order listed above. Put the most common cause first, as the agent will ask diagnostic questions based on this priority.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
