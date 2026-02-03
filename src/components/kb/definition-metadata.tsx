
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { CATEGORIES, SUBCATEGORIES, DEFINITION_TYPES } from "@/lib/template-loader"

interface DefinitionMetadataProps {
  title: string
  onTitleChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  subcategory: string
  onSubcategoryChange: (value: string) => void
  definitionType: string
  onDefinitionTypeChange: (value: string) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
}

export function DefinitionMetadata({
  title,
  onTitleChange,
  category,
  onCategoryChange,
  subcategory,
  onSubcategoryChange,
  definitionType,
  onDefinitionTypeChange,
  tags,
  onTagsChange,
}: DefinitionMetadataProps) {
  const [availableSubcategories, setAvailableSubcategories] = useState<Array<{value: string, label: string}>>([])
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    // Update subcategories when category changes
    if (category && SUBCATEGORIES[category as keyof typeof SUBCATEGORIES]) {
      setAvailableSubcategories(SUBCATEGORIES[category as keyof typeof SUBCATEGORIES])
    } else {
      setAvailableSubcategories([])
    }
  }, [category])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter the term or concept name (e.g., 'ERF Size', 'Ready for Offer')"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category *</label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select where this term appears in the system" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategory - Dynamic based on category */}
      {category && availableSubcategories.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Subcategory</label>
          <Select value={subcategory} onValueChange={onSubcategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {availableSubcategories.map((subcat) => (
                <SelectItem key={subcat.value} value={subcat.value}>
                  {subcat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Type - Sales/Rental/Both/General */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select value={definitionType} onValueChange={onDefinitionTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Does this apply to sales, rentals, or both?" />
          </SelectTrigger>
          <SelectContent>
            {DEFINITION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Tags</label>
          <p className="text-xs text-muted-foreground">Add keywords to help find this definition later</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g. property, legal, pipeline"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddTag()
              }
            }}
          />
          <Button type="button" onClick={handleAddTag} variant="outline">
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
