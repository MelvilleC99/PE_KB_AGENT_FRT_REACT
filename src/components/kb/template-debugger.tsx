// Diagnostic component to test template loading

import { useEffect, useState } from 'react';

export function TemplateDebugger() {
  const [debugInfo, setDebugInfo] = useState<{
    templatesCount: number;
    templates: any[];
    categories: any[];
    error?: string;
  }>({
    templatesCount: 0,
    templates: [],
    categories: []
  });

  useEffect(() => {
    async function loadTemplateData() {
      try {
        // Try to import templates
        const { KB_TEMPLATES, CATEGORIES } = await import('@/lib/template-loader');
        
        setDebugInfo({
          templatesCount: KB_TEMPLATES?.length || 0,
          templates: KB_TEMPLATES || [],
          categories: CATEGORIES || [],
        });
      } catch (error) {
        setDebugInfo({
          templatesCount: 0,
          templates: [],
          categories: [],
          error: String(error)
        });
      }
    }

    loadTemplateData();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Template Loading Debug</h3>
      
      {debugInfo.error ? (
        <div className="text-red-600">
          <strong>Error:</strong> {debugInfo.error}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <strong>Templates Found:</strong> {debugInfo.templatesCount}
          </div>
          
          {debugInfo.templates.length > 0 && (
            <div>
              <strong>Template List:</strong>
              <ul className="list-disc ml-4">
                {debugInfo.templates.map((template, index) => (
                  <li key={index}>
                    {template.id}: {template.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <strong>Categories Found:</strong> {debugInfo.categories.length}
          </div>
        </div>
      )}
    </div>
  );
}
