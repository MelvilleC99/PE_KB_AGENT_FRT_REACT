// Template and metadata loader utilities  
import definitionTemplate from './templates/definition.json';
import howToTemplate from './templates/how_to.json';
import errorTemplate from './templates/error.json';
import metadataTemplate from './templates/metadata.json';

// Export all templates as an array (UPDATED 3 TEMPLATES)
export const KB_TEMPLATES = [
  definitionTemplate,
  howToTemplate, 
  errorTemplate,
];

// Export metadata template
export const METADATA_TEMPLATE = metadataTemplate;

// Extract and export commonly used constants from metadata
const userTypeField = metadataTemplate.fields.find(f => f.key === 'userType');
const categoryField = metadataTemplate.fields.find(f => f.key === 'category');

export const USER_TYPES = userTypeField?.options || [];
export const CATEGORIES = categoryField?.options || [];

// Helper function to get template by ID
export function getTemplateById(id: string) {
  return KB_TEMPLATES.find(template => template.id === id);
}

// Helper function to get metadata requirements for a template
export function getMetadataRequirements(templateId: string) {
  const template = getTemplateById(templateId);
  return template?.metadata_requirements || {};
}

// Helper function to check if a field is required for a template
export function isFieldRequired(templateId: string, fieldName: string) {
  const requirements = getMetadataRequirements(templateId);
  return requirements[fieldName] === 'required';
}

// Get metadata field options
export function getMetadataFieldOptions(fieldKey: string) {
  const field = METADATA_TEMPLATE.fields.find(f => f.key === fieldKey);
  return field?.options || [];
}
