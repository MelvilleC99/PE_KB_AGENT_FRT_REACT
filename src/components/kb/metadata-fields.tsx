
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CATEGORIES, SEVERITY_LEVELS, USER_ROLES, SUBCATEGORIES, DEFINITION_TYPES } from "@/lib/template-loader"
import { X } from "lucide-react"
import { useState } from "react"

interface MetadataFieldsProps {
  title: string
  onTitleChange: (title: string) => void
  category: string
  onCategoryChange: (category: string) => void
  subcategory: string
  onSubcategoryChange: (subcategory: string) => void
  type: string
  onTypeChange: (type: string) => void
  severity: string
  onSeverityChange: (severity: string) => void
  userRoles: string[]
  onUserRolesChange: (roles: string[]) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  templateId?: string
}

export function MetadataFields({
  title,
  onTitleChange,
  category,
  onCategoryChange,
  subcategory,
  onSubcategoryChange,
  type,
  onTypeChange,
  severity,
  onSeverityChange,
  userRoles,
  onUserRolesChange,
  tags,
  onTagsChange,
  templateId,
}: MetadataFieldsProps) {
  const [newTag, setNewTag] = useState("")

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleRoleChange = (role: string, checked: boolean) => {
    if (checked) {
      onUserRolesChange([...userRoles, role])
    } else {
      onUserRolesChange(userRoles.filter((r) => r !== role))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter a descriptive title for this entry"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category *</label>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
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

      {/* Subcategory - only show if category is selected */}
      {category && SUBCATEGORIES[category as keyof typeof SUBCATEGORIES] && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Subcategory</label>
          <Select value={subcategory} onValueChange={onSubcategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a subcategory" />
            </SelectTrigger>
            <SelectContent>
              {SUBCATEGORIES[category as keyof typeof SUBCATEGORIES]?.map((subcat) => (
                <SelectItem key={subcat.value} value={subcat.value}>
                  {subcat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Type - for definitions (Sales/Rentals/Both/General) */}
      {templateId === "definition" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {DEFINITION_TYPES.map((defType) => (
                <SelectItem key={defType.value} value={defType.value}>
                  {defType.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Only show severity for problem_solution and error templates */}
      {(templateId === "error" || templateId === "problem_solution") && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Severity *</label>
          <Select value={severity} onValueChange={onSeverityChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select severity level" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Tags</label>
          <p className="text-xs text-muted-foreground">Add keywords to help find this entry later</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g. pipeline, sales, offer"
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
