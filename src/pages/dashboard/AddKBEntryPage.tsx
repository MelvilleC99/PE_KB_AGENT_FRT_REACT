import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { TemplateSelector } from "@/components/kb/template-selector"
import { EntryForm } from "@/components/kb/entry-form"
import { PreviewPanel } from "@/components/kb/preview-panel"
import { DocumentUploadForm } from "@/components/kb/document-upload-form"
import { ArrowLeft, Save, Eye, EyeOff, Edit, Upload } from "lucide-react"
import { createKBEntry } from "@/lib/api/kb"
import { StandardMetadata } from "@/components/kb/standard-metadata"

export function AddKBEntryPage() {
  const { toast } = useToast()
  const [mode, setMode] = useState<'choice' | 'manual' | 'upload'>('choice')
  const [templateId, setTemplateId] = useState("")
  const [userType, setUserType] = useState("internal") // Default to internal
  const [product, setProduct] = useState("property_engine") // Default to property_engine
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Handle going back to choice screen
  const handleBackToChoice = () => {
    setMode('choice')
    setTemplateId("")
    setUserType("internal")
    setProduct("property_engine")
    setCategory("")
    setTags("")
    setFormData({})
    setShowPreview(false)
  }

  const isFormValid = () => {
    // Need template and basic metadata to proceed to content step
    if (!templateId) return false;
    
    // For PropertyEngine, category is required
    if (product === 'property_engine' && !category) return false;
    
    return true;
  }

  // Helper function to extract related document titles from formData
  const extractRelatedDocuments = (): string[] => {
    const relatedLinks = formData.related_links;
    
    // Handle array of objects (from dynamic form)
    if (Array.isArray(relatedLinks)) {
      return relatedLinks
        .map(link => {
          if (typeof link === 'string') return link.trim();
          if (link && typeof link === 'object' && link.title) return link.title.trim();
          return null;
        })
        .filter(title => title && title.length > 0) as string[];
    }
    
    // Handle legacy string format (comma/newline separated)
    if (typeof relatedLinks === 'string' && relatedLinks.trim()) {
      return relatedLinks
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    
    // Handle error template's causes with related_help
    if (templateId === 'error' && Array.isArray(formData.causes)) {
      const relatedHelp: string[] = [];
      formData.causes.forEach((cause: any) => {
        if (cause.related_help && typeof cause.related_help === 'string') {
          // Parse related_help the same way (comma/newline separated)
          const parsed = cause.related_help
            .split(/[\n,]/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
          relatedHelp.push(...parsed);
        }
      });
      return relatedHelp;
    }
    
    return [];
  }

  const handleSave = async () => {
    console.log('🎯 handleSave called with:');
    console.log('templateId:', templateId);
    console.log('formData:', formData);
    console.log('userType:', userType);
    console.log('product:', product);
    console.log('category:', category);
    console.log('isFormValid():', isFormValid());
    
    if (!isFormValid()) {
      console.log('❌ Form validation failed');
      return;
    }

    try {
      // Extract title from form data based on template
      let title = "";
      if (templateId === "definition") {
        title = formData.term || "Untitled Definition";
      } else if (templateId === "how_to") {
        title = formData.title || "Untitled How-To";
      } else if (templateId === "error") {
        title = formData.issue_title || formData.error_code || "Untitled Issue";
      } else {
        title = "Untitled Entry";
      }

      // Transform formData into clean content string for vector embeddings (no headers)
      let contentText = ""
      
      if (templateId === "definition") {
        // For definitions, create structured content with proper headers
        const parts = []
        
        if (formData.term) {
          parts.push(`Term: ${formData.term}`)
        }
        
        if (formData.definition) {
          parts.push(`\nDefinition:\n${formData.definition}`)
        }
        
        if (formData.examples) {
          parts.push(`\nExamples:\n${formData.examples}`)
        }
        
        if (formData.also_known_as) {
          parts.push(`\nAlso Known As:\n${formData.also_known_as}`)
        }
        
        // Related documents (keep in content for embeddings too)
        const relatedDocs = extractRelatedDocuments();
        if (relatedDocs.length > 0) {
          parts.push(`\nRelated Documents:\n${relatedDocs.join(', ')}`)
        }
        
        contentText = parts.join("\n")  // ✅ Join with newlines
      } else if (templateId === "how_to") {
        // For how-to guides, create structured content with proper headers
        const parts = []
        
        // Title
        if (formData.title) {
          parts.push(`How to: ${formData.title}`)
        }
        
        // Overview
        if (formData.overview) {
          parts.push(`\nOverview:\n${formData.overview}`)
        }
        
        // Estimated time
        if (formData.estimated_time) {
          parts.push(`\nEstimated Time: ${formData.estimated_time}`)
        }
        
        // Prerequisites
        if (formData.prerequisites) {
          parts.push(`\nPrerequisites:\n${formData.prerequisites}`)
        }
        
        // Steps with proper structure
        if (formData.step_type === "single" && formData.single_step_description) {
          parts.push(`\nSteps:\n${formData.single_step_description}`)
        } else if (formData.step_type === "multi" && formData.steps && Array.isArray(formData.steps)) {
          parts.push('\nSteps:')
          formData.steps.forEach((step, index) => {
            parts.push('')  // blank line
            parts.push(`Step ${index + 1}:`)
            if (step.step_title) parts.push(step.step_title)
            if (step.description) parts.push(step.description)
            if (step.action) parts.push(`Action: ${step.action}`)
            if (step.expected_outcome) parts.push(`Expected: ${step.expected_outcome}`)
          })
        }
        
        // Common issues
        if (formData.common_issues) {
          parts.push(`\nCommon Issues:\n${formData.common_issues}`)
        }
        
        // Tips
        if (formData.tips) {
          parts.push(`\nTips:\n${formData.tips}`)
        }
        
        // Related documents (keep in content for embeddings too)
        const relatedDocs = extractRelatedDocuments();
        if (relatedDocs.length > 0) {
          parts.push(`\nRelated Documents:\n${relatedDocs.join(', ')}`)
        }
        
        contentText = parts.join("\n")  // ✅ Join with newlines
      } else if (templateId === "error") {
        // For error/issue entries, create structured content with proper headers and formatting
        const parts = []
        
        // Title with header
        if (formData.issue_title) {
          parts.push(`Error: ${formData.issue_title}`)
        }
        
        // Issue description with header
        if (formData.issue_description) {
          parts.push(`\nIssue Description:\n${formData.issue_description}`)
        }
        
        // Error code with header (if exists)
        if (formData.error_code) {
          parts.push(`\nError Code: ${formData.error_code}`)
        }
        
        // Causes with proper structure
        if (formData.causes && Array.isArray(formData.causes) && formData.causes.length > 0) {
          parts.push('\nTroubleshooting:')
          
          formData.causes.forEach((cause, index) => {
            parts.push('') // blank line before each cause
            parts.push(`Cause ${index + 1}:`)
            if (cause.cause_description) {
              parts.push(cause.cause_description)
            }
            
            if (cause.solution) {
              parts.push('')  // blank line before solution
              parts.push('Solution:')
              parts.push(cause.solution)
            }
            
            if (cause.related_help) {
              parts.push('')  // blank line before related help
              parts.push('Related Help:')
              parts.push(cause.related_help)
            }
          })
        }
        
        contentText = parts.join("\n")  // ✅ Join with newlines for proper structure
      } else {
        // For other templates, concatenate all text fields without headers
        const textValues = Object.values(formData).filter(value => 
          typeof value === 'string' && value.trim().length > 0
        )
        contentText = textValues.join(" ")
      }

      const entryData = {
        type: templateId,
        title,
        content: contentText, // Clean content for vector embeddings
        rawFormData: formData, // Structured form data for display/editing
        metadata: {
          entryType: templateId, // AUTO-POPULATED: definition/error/how_to
          userType: userType || 'internal',
          product: product || 'property_engine',
          category: category || '',
          tags: tags || '',
          related_documents: extractRelatedDocuments() // Extract from related_links or related_help
        }
      }

      // AUTO-POPULATE: Copy error_code to metadata if it exists
      if (templateId === 'error' && formData.error_code) {
        entryData.metadata.error_code = formData.error_code;
      }

      // AUTO-POPULATE: Add process info for how-to
      if (templateId === 'how_to') {
        entryData.metadata.process_type = formData.step_type; // 'single' or 'multi'
        
        if (formData.step_type === 'multi' && formData.steps) {
          entryData.metadata.step_count = formData.steps.length;
        }
      }

      console.log('🚀 About to save entry data:', entryData);

      const result = await createKBEntry(entryData)

      if (result.success) {
        toast({
          title: "Entry created successfully",
          description: "Your knowledge base entry has been saved and processed for vector search."
        })
        
        // Reset form
        handleBackToChoice()
      } else {
        throw new Error(result.error || 'Failed to create entry')
      }
    } catch (error) {
      console.error('Save error:', error)
      let errorMessage = "Failed to create entry"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    handleBackToChoice()
  }

  // Show choice screen
  if (mode === 'choice') {
    return (
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Add Knowledge Base Entry</h1>
          <p className="text-muted-foreground">Choose how you want to add content to your knowledge base</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setMode('manual')}>
            <CardHeader>
              <Edit className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Create Manually</CardTitle>
              <CardDescription>
                Use structured templates to create knowledge base entries with guided forms
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setMode('upload')}>
            <CardHeader>
              <Upload className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Upload a document (PDF, TXT, JSON) and automatically create knowledge base entries
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  // Show document upload interface
  if (mode === 'upload') {
    return (
      <DocumentUploadForm onBack={handleBackToChoice} />
    )
  }

  // Manual entry mode - clean flow like document upload
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={handleBackToChoice} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Create KB Entry Manually</h1>
        <p className="text-muted-foreground">Follow the steps below to create your knowledge base entry</p>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {/* 1. Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Choose Template</CardTitle>
            <CardDescription>Select the type of knowledge you want to capture</CardDescription>
          </CardHeader>
          <CardContent>
            {!templateId ? (
              <TemplateSelector value={templateId} onValueChange={setTemplateId} />
            ) : (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">
                  Selected: {templateId.charAt(0).toUpperCase() + templateId.slice(1).replace('_', ' ')}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setTemplateId("")}
                  className="text-muted-foreground"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Metadata */}
        {templateId && (
          <Card>
            <CardHeader>
              <CardTitle>2. Metadata</CardTitle>
              <CardDescription>Add metadata to help organize and find this content</CardDescription>
            </CardHeader>
            <CardContent>
              <StandardMetadata
                userType={userType}
                onUserTypeChange={setUserType}
                product={product}
                onProductChange={setProduct}
                category={category}
                onCategoryChange={setCategory}
                tags={tags}
                onTagsChange={setTags}
              />
            </CardContent>
          </Card>
        )}

        {/* 3. Content Details */}
        {isFormValid() && (
          <Card>
            <CardHeader>
              <CardTitle>3. Content Details</CardTitle>
              <CardDescription>
                Fill in the specific content for your {templateId.replace('_', ' ')} entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntryForm
                templateId={templateId}
                formData={formData}
                onFormDataChange={setFormData}
              />
            </CardContent>
          </Card>
        )}

        {/* Preview & Actions */}
        {isFormValid() && Object.keys(formData).length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            {showPreview && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    This is how your entry will appear in the knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PreviewPanel
                    templateId={templateId}
                    title={
                      templateId === "definition" ? formData.term || "Untitled Definition" :
                      templateId === "how_to" ? formData.title || "Untitled How-To" :
                      templateId === "error" ? (formData.issue_title || formData.error_code || "Untitled Issue") :
                      "Untitled Entry"
                    }
                    category={category}
                    tags={tags}
                    userType={userType}
                    product={product}
                    formData={formData}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isFormValid()}>
                <Save className="mr-2 h-4 w-4" />
                Create Entry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
