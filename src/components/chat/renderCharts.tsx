import { VegaLiteChart } from "@/components/charts/VegaLiteChart";

/**
 * Extracts Vega-Lite specs from markdown code blocks
 */
function extractVegaLiteSpecs(text: string): Array<{ spec: Record<string, unknown>; startIndex: number; endIndex: number }> {
  const specs: Array<{ spec: Record<string, unknown>; startIndex: number; endIndex: number }> = [];
  
  // Match code blocks with language vega-lite or json containing Vega-Lite specs
  const codeBlockRegex = /```(?:vega-lite|json|javascript|js)?\n([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const codeContent = match[1].trim();
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(codeContent);
      
      // Check if it looks like a Vega-Lite spec
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed.mark || parsed.encoding || parsed.$schema?.includes("vega-lite"))
      ) {
        // Deep clone to ensure it's a plain object (no Sets, Maps, etc.)
        const sanitizedSpec = JSON.parse(JSON.stringify(parsed));
        specs.push({
          spec: sanitizedSpec,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    } catch {
      // Not valid JSON, skip
    }
  }
  
  return specs;
}

/**
 * Renders text with Vega-Lite charts embedded
 */
export function renderTextWithCharts(text: string) {
  const specs = extractVegaLiteSpecs(text);
  
  if (specs.length === 0) {
    return { hasCharts: false, elements: [{ type: "text" as const, content: text }] };
  }
  
  const elements: Array<{ type: "text" | "chart"; content?: string; spec?: Record<string, unknown> }> = [];
  let lastIndex = 0;
  
  specs.forEach(({ spec, startIndex, endIndex }) => {
    // Add text before the code block
    if (startIndex > lastIndex) {
      const beforeText = text.slice(lastIndex, startIndex).trim();
      if (beforeText) {
        elements.push({ type: "text", content: beforeText });
      }
    }
    
    // Add the chart
    elements.push({ type: "chart", spec });
    
    lastIndex = endIndex;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      elements.push({ type: "text", content: remainingText });
    }
  }
  
  return { hasCharts: true, elements };
}

