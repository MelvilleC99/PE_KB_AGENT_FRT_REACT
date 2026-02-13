
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, Upload, X, Image as ImageIcon } from "lucide-react"

interface Step {
  id: string
  step_title: string
  description: string
  action: string
  screenshot?: string // URL to uploaded screenshot
}

interface DynamicStepsFormProps {
  value: Step[]
  onChange: (steps: Step[]) => void
}

export function DynamicStepsForm({ value, onChange }: DynamicStepsFormProps) {
  const steps = value || [createEmptyStep()]
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)

  function createEmptyStep(): Step {
    return {
      id: Date.now().toString() + Math.random(),
      step_title: "",
      description: "",
      action: "",
      screenshot: ""
    }
  }

  const addStep = () => {
    const newSteps = [...steps, createEmptyStep()]
    onChange(newSteps)
  }

  const removeStep = (stepId: string) => {
    if (steps.length === 1) return // Keep at least one step
    const newSteps = steps.filter(step => step.id !== stepId)
    onChange(newSteps)
  }

  const updateStep = (stepId: string, field: keyof Step, value: string) => {
    const newSteps = steps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    )
    onChange(newSteps)
  }

  const handleScreenshotUpload = async (stepId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploadingStepId(stepId)

    try {
      // Convert to base64 for now (later we'll upload to Firebase Storage)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        updateStep(stepId, 'screenshot', base64String)
        setUploadingStepId(null)
      }
      reader.onerror = () => {
        alert('Failed to read image')
        setUploadingStepId(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload screenshot')
      setUploadingStepId(null)
    }
  }

  const removeScreenshot = (stepId: string) => {
    updateStep(stepId, 'screenshot', '')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Steps</Label>
        <Button 
          onClick={addStep} 
          size="sm" 
          variant="outline"
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Step
        </Button>
      </div>

      {steps.map((step, stepIndex) => (
        <Card key={step.id} className="relative">
          <div className="absolute top-3 right-3">
            <Button
              onClick={() => removeStep(step.id)}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
              disabled={steps.length === 1}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <GripVertical className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-sm text-blue-600">
                Step {stepIndex + 1}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Step Title *</Label>
                <Input
                  value={step.step_title}
                  onChange={(e) => updateStep(step.id, "step_title", e.target.value)}
                  placeholder="e.g., Access Dashboard"
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Description *</Label>
                <Textarea
                  value={step.description}
                  onChange={(e) => updateStep(step.id, "description", e.target.value)}
                  placeholder="Detailed explanation of what to do in this step"
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Action</Label>
                <Textarea
                  value={step.action}
                  onChange={(e) => updateStep(step.id, "action", e.target.value)}
                  placeholder="e.g., Click 'Save', Navigate to Settings"
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <Label className="text-xs font-medium">Screenshot (Optional)</Label>
                {step.screenshot ? (
                  <div className="relative mt-2 border rounded-lg p-2 bg-gray-50">
                    <img 
                      src={step.screenshot} 
                      alt={`Step ${stepIndex + 1} screenshot`}
                      className="max-h-40 mx-auto rounded"
                    />
                    <Button
                      onClick={() => removeScreenshot(step.id)}
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white hover:bg-red-50"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <label 
                      htmlFor={`screenshot-${step.id}`}
                      className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        id={`screenshot-${step.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleScreenshotUpload(step.id, file)
                        }}
                        disabled={uploadingStepId === step.id}
                      />
                      {uploadingStepId === step.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          <span className="text-xs text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            Click to upload screenshot (PNG, JPG, max 5MB)
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
