
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { METADATA_TEMPLATE } from "@/lib/template-loader"

interface StandardMetadataProps {
  userType: string
  onUserTypeChange: (value: string) => void
  product: string
  onProductChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  tags: string
  onTagsChange: (value: string) => void
  disabled?: boolean
}

export function StandardMetadata({
  userType,
  onUserTypeChange,
  product,
  onProductChange,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  disabled = false
}: StandardMetadataProps) {
  
  // Get field options from metadata template
  function getFieldOptions(fieldKey: string) {
    const field = METADATA_TEMPLATE.fields.find(f => f.key === fieldKey);
    return field?.options || [];
  }

  const userTypeOptions = getFieldOptions('userType');
  const productOptions = getFieldOptions('product');
  const categoryOptions = getFieldOptions('category');

  // Show categories only for PropertyEngine
  const showCategories = product === 'property_engine';

  return (
    <div className="space-y-4">
      {/* User Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">User Type</label>
        <Select value={userType} onValueChange={onUserTypeChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Who should have access?" />
          </SelectTrigger>
          <SelectContent>
            {userTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Product</label>
        <Select value={product} onValueChange={onProductChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Which product does this relate to?" />
          </SelectTrigger>
          <SelectContent>
            {productOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category - Only show for PropertyEngine */}
      {showCategories && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={onCategoryChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Main category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tags</label>
        <Input
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="e.g., upload, photos, drag-drop, status-management"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
