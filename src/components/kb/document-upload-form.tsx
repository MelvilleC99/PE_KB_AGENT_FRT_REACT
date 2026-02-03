
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, ArrowLeft, FileText, Brain, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StandardMetadata } from "./standard-metadata"
import { uploadDocument } from "@/lib/api/kb"

interface DocumentUploadFormProps {
  onBack: () => void
}

export function DocumentUploadForm({ onBack }: DocumentUploadFormProps) {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetCollection, setTargetCollection] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [result, setResult] = useState<{
    success: boolean;
    entry_id?: string;
    sections_extracted?: number;
    word_count?: number;
    chunks_created?: number;
  } | null>(null)
  
  // Metadata state
  const [title, setTitle] = useState("")
  const [userType, setUserType] = useState("internal")
  const [product, setProduct] = useState("property_engine")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")

  const collections = [
    { value: "definition", label: "Definitions", description: "Terms and explanations" },
    { value: "error", label: "Errors & Problems", description: "Troubleshooting guides" },
    { value: "how_to", label: "How-To Guides", description: "Step-by-step instructions" }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type - DOCX and PDF supported
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.docx') && !fileName.endsWith('.pdf')) {
        toast({
          title: "Invalid file type",
          description: "Only DOCX and PDF files are supported.",
          variant: "destructive"
        })
        return
      }

      setSelectedFile(file)
      setResult(null) // Clear previous result
      
      // Auto-populate title from filename
      if (!title) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
        setTitle(nameWithoutExt)
      }
    }
  }

  const isFormValid = () => {
    return selectedFile && targetCollection && title && userType && product && category
  }

  const handleProcess = async () => {
    if (!isFormValid() || !selectedFile) return

    setIsProcessing(true)
    setProcessingStatus("Uploading document...")
    setResult(null)
    
    try {
      setProcessingStatus("Extracting text from document...")
      
      const uploadResult = await uploadDocument({
        file: selectedFile,
        title: title,
        entryType: targetCollection,
        userType: userType,
        product: product,
        category: category,
        tags: tags,
        autoSync: true
      })

      if (uploadResult.success) {
        setProcessingStatus("Complete!")
        setResult({
          success: true,
          entry_id: uploadResult.entry_id,
          sections_extracted: uploadResult.sections_extracted,
          word_count: uploadResult.word_count,
          chunks_created: uploadResult.sync_status?.chunks_created
        })
        
        toast({
          title: "Document processed successfully",
          description: `Created KB entry with ${uploadResult.sections_extracted || 0} sections`
        })
      } else {
        throw new Error(uploadResult.error || 'Processing failed')
      }
    } catch (error) {
      console.error('Processing error:', error)
      setProcessingStatus("")
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setTargetCollection("")
    setTitle("")
    setUserType("internal")
    setProduct("property_engine")
    setCategory("")
    setTags("")
    setResult(null)
    setProcessingStatus("")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Options
        </Button>
        <h1 className="text-3xl font-bold">Upload Document</h1>
        <p className="text-muted-foreground mt-2">
          Upload a Word document or PDF to automatically create knowledge base entries
        </p>
      </div>

      {/* Success Result */}
      {result?.success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Document Processed Successfully!</h3>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>Entry ID: <code className="bg-green-100 px-1 rounded">{result.entry_id}</code></p>
                  <p>Sections extracted: {result.sections_extracted || 0}</p>
                  <p>Word count: {result.word_count?.toLocaleString() || 0}</p>
                  {result.chunks_created && (
                    <p>Vector chunks created: {result.chunks_created}</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Upload Another
                  </Button>
                  <Button variant="outline" size="sm" onClick={onBack}>
                    Back to KB
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form - hide if successful */}
      {!result?.success && (
        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>1. Select Document</CardTitle>
              <CardDescription>
                Upload a Word document (.docx) to process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium">
                        Click to upload or drag and drop
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Word documents (.docx) and PDF files supported
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                      onChange={handleFileSelect}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entry Type Selection */}
          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>2. Entry Type</CardTitle>
                <CardDescription>
                  What type of knowledge base entry should this create?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {collections.map((collection) => (
                    <Card
                      key={collection.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        targetCollection === collection.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                      onClick={() => !isProcessing && setTargetCollection(collection.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <h3 className="font-medium">{collection.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {collection.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Title */}
          {selectedFile && targetCollection && (
            <Card>
              <CardHeader>
                <CardTitle>3. Title</CardTitle>
                <CardDescription>
                  Give this document a descriptive title
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a clear, descriptive title"
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {selectedFile && targetCollection && title.trim() && (
            <Card>
              <CardHeader>
                <CardTitle>4. Metadata</CardTitle>
                <CardDescription>
                  Add metadata to help organize and find this content
                </CardDescription>
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
                  disabled={isProcessing}
                />
              </CardContent>
            </Card>
          )}

          {/* Processing Status */}
          {isProcessing && processingStatus && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-blue-600 animate-pulse" />
                  <span className="text-blue-700">{processingStatus}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Process Button */}
          {isFormValid() && (
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Reset
              </Button>
              <Button 
                onClick={handleProcess} 
                disabled={isProcessing}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Brain className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Process Document
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
