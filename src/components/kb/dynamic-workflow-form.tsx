
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { KB_TEMPLATES } from "@/lib/template-loader"

interface WorkflowStep {
  id: string
  title: string
  description: string
  actions: string[]
  expected_outcome: string
  ui_location: string
}

interface DynamicWorkflowFormProps {
  formData: any
  onFormDataChange: (data: any) => void
}

export function DynamicWorkflowForm({ formData, onFormDataChange }: DynamicWorkflowFormProps) {
  const workflowTemplate = KB_TEMPLATES.find(t => t.id === 'workflow')
  
  const [steps, setSteps] = useState<WorkflowStep[]>(
    formData.steps || [
      {
        id: Date.now().toString(),
        title: "",
        description: "",
        actions: [""],
        expected_outcome: "",
        ui_location: ""
      }
    ]
  )

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      title: "",
      description: "",
      actions: [""],
      expected_outcome: "",
      ui_location: ""
    }
    const updatedSteps = [...steps, newStep]
    setSteps(updatedSteps)
    onFormDataChange({ ...formData, steps: updatedSteps })
  }

  const removeStep = (stepId: string) => {
    const updatedSteps = steps.filter(step => step.id !== stepId)
    setSteps(updatedSteps)
    onFormDataChange({ ...formData, steps: updatedSteps })
  }

  const updateStep = (stepId: string, field: keyof WorkflowStep, value: any) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    )
    setSteps(updatedSteps)
    onFormDataChange({ ...formData, steps: updatedSteps })
  }

  const addAction = (stepId: string) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId 
        ? { ...step, actions: [...step.actions, ""] }
        : step
    )
    setSteps(updatedSteps)
    onFormDataChange({ ...formData, steps: updatedSteps })
  }

  const updateAction = (stepId: string, actionIndex: number, value: string) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            actions: step.actions.map((action, index) => 
              index === actionIndex ? value : action
            )
          }
        : step
    )
    setSteps(updatedSteps)
    onFormDataChange({ ...formData, steps: updatedSteps })
  }

  const removeAction = (stepId: string, actionIndex: number) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            actions: step.actions.filter((_, index) => index !== actionIndex)
          }
        : step
    )
    setSteps(updatedSteps)
    onFormDataChange({ ...formData, steps: updatedSteps })
  }

  return (
    <div className="space-y-4">
      {/* Basic workflow info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="workflow_name">Workflow Name</Label>
          <Input
            id="workflow_name"
            value={formData.workflow_name || ""}
            onChange={(e) => onFormDataChange({ ...formData, workflow_name: e.target.value })}
            placeholder="e.g., Create New Property Listing"
          />
        </div>

        <div>
          <Label htmlFor="overview">Overview</Label>
          <Textarea
            id="overview"
            value={formData.overview || ""}
            onChange={(e) => onFormDataChange({ ...formData, overview: e.target.value })}
            placeholder="Brief description of what this workflow accomplishes"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="estimated_time">Estimated Time</Label>
            <Input
              id="estimated_time"
              value={formData.estimated_time || ""}
              onChange={(e) => onFormDataChange({ ...formData, estimated_time: e.target.value })}
              placeholder="e.g., 30-45 minutes"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="prerequisites">Prerequisites</Label>
          <Textarea
            id="prerequisites"
            value={formData.prerequisites || ""}
            onChange={(e) => onFormDataChange({ ...formData, prerequisites: e.target.value })}
            placeholder="• Agent account&#10;• Property details&#10;• Photos ready"
            rows={3}
          />
        </div>
      </div>

      {/* Dynamic Steps */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Workflow Steps</h3>
          <Button onClick={addStep} size="sm" className="bg-[var(--pe-action)] hover:bg-[var(--pe-action-dark)]">
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </div>

        {steps.map((step, stepIndex) => (
          <Card key={step.id} className="relative">
            <div className="absolute top-4 right-4">
              <Button
                onClick={() => removeStep(step.id)}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                disabled={steps.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-[var(--pe-primary)]">
                  Step {stepIndex + 1}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Step Title</Label>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, "title", e.target.value)}
                    placeholder="e.g., Access Dashboard"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(step.id, "description", e.target.value)}
                    placeholder="What happens in this step?"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Actions</Label>
                  {step.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex gap-2 mb-2">
                      <Input
                        value={action}
                        onChange={(e) => updateAction(step.id, actionIndex, e.target.value)}
                        placeholder="e.g., Click 'Listings' in sidebar"
                      />
                      <Button
                        onClick={() => removeAction(step.id, actionIndex)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        disabled={step.actions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => addAction(step.id)}
                    size="sm"
                    variant="outline"
                    className="mt-1"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Action
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Expected Outcome</Label>
                    <Input
                      value={step.expected_outcome}
                      onChange={(e) => updateStep(step.id, "expected_outcome", e.target.value)}
                      placeholder="What should the user see?"
                    />
                  </div>
                  <div>
                    <Label>UI Location</Label>
                    <Input
                      value={step.ui_location}
                      onChange={(e) => updateStep(step.id, "ui_location", e.target.value)}
                      placeholder="e.g., Dashboard > Sidebar"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
