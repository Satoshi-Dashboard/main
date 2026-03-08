import { isValidElement, useState } from 'react';
import { Copy, Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';
import { fmt } from '../../utils/formatters';

function collectChartDataFromNode(node, acc = []) {
  if (!node) return acc;

  if (Array.isArray(node)) {
    node.forEach((item) => collectChartDataFromNode(item, acc));
    return acc;
  }

  if (!isValidElement(node)) return acc;

  const { type, props } = node;
  const typeName = typeof type === 'string' ? type : (type?.displayName || type?.name || '');
  const hasChartLikeName = /chart|graph|plot|spark|treemap|map|heatmap/i.test(typeName);

  if (hasChartLikeName && Array.isArray(props?.data) && props.data.length > 0) {
    acc.push({
      source: typeName,
      data: props.data,
    });
  }

  if (props?.children) {
    collectChartDataFromNode(props.children, acc);
  }

  return acc;
}

function toMarkdownDataBlock(value) {
  if (value == null) return 'No data available';
  if (typeof value === 'string') return value;

  try {
    return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
  } catch {
    return String(value);
  }
}

export default function DashboardCard({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  markdownFn,
  exportData,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScreenshotting, setIsScreenshotting] = useState(false);
  const { showToast } = useToast();
  const lastUpdated = Date.now();

  const handleCopyMarkdown = () => {
    const cardElement = typeof document !== 'undefined' ? document.getElementById(`card-${id}`) : null;
    const contentElement = cardElement?.querySelector('.dashboard-card-content');
    const rawText = contentElement?.textContent || '';
    const normalizedText = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');

    const chartData = collectChartDataFromNode(children);
    const effectiveData = exportData ?? (chartData.length ? chartData : null);

    const markdown =
      typeof markdownFn === 'function'
        ? markdownFn({ title, subtitle, exportData: effectiveData, chartData, text: normalizedText })
        : [
            `## ${title}${subtitle ? ` - ${subtitle}` : ''}`,
            normalizedText ? `### Snapshot\n\n${normalizedText}` : null,
            `### Data\n\n${toMarkdownDataBlock(effectiveData)}`,
            `_Last updated: ${new Date().toLocaleString()}_`,
          ]
            .filter(Boolean)
            .join('\n\n');

    navigator.clipboard.writeText(markdown).then(() => {
      showToast('Copied to clipboard!');
    });
  };

  const handleScreenshot = async () => {
    setIsScreenshotting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const element = document.getElementById(`card-${id}`);
      if (element) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#111111',
          scale: 2,
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.png`;
        link.click();
        showToast('Screenshot saved!');
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      showToast('Screenshot failed');
    } finally {
      setIsScreenshotting(false);
    }
  };

  return (
    <div
      id={`card-${id}`}
      className={`bg-gradient-to-br from-gray-900/50 to-gray-950 border border-gray-700/30 rounded-xl overflow-hidden hover:border-yellow-500/30 transition-all duration-300 ${isExpanded ? 'col-span-2 row-span-2' : ''} ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700/20 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && <Icon size={20} className="text-yellow-500 mt-1 flex-shrink-0" />}
          <div className="min-w-0">
            <h3 className="text-yellow-50 font-mono font-semibold text-sm">{title}</h3>
            {subtitle && <p className="text-gray-500 font-mono text-xs mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="text-gray-600 font-mono text-xs whitespace-nowrap flex-shrink-0">
          {fmt.ago(lastUpdated)}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 dashboard-card-content">
        {children}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-700/20 flex items-center justify-between gap-2 bg-gray-950/30">
        <button
          onClick={handleCopyMarkdown}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition"
          title="Copy Markdown"
        >
          <Copy size={14} />
          <span className="hidden sm:inline">Copy</span>
        </button>

        <button
          onClick={handleScreenshot}
          disabled={isScreenshotting}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition disabled:opacity-50"
          title="Screenshot"
        >
          {isScreenshotting ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span className="hidden sm:inline">Screenshot</span>
            </>
          )}
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-gray-400 hover:text-yellow-400 hover:bg-gray-800 transition"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
}
