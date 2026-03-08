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
      className={`rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'col-span-2 row-span-2' : ''} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(18,18,26,0.92), rgba(17,17,17,0.98))',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-start gap-3 min-w-0">
          {Icon && <Icon size={20} className="mt-1 flex-shrink-0" style={{ color: 'var(--accent-bitcoin)' }} />}
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p className="mt-1 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
        </div>
        <div className="whitespace-nowrap font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
          {fmt.ago(lastUpdated)}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 dashboard-card-content">
        {children}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(17,17,17,0.35)' }}>
        <button
          onClick={handleCopyMarkdown}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono transition hover:bg-white/6 hover:text-[color:var(--accent-bitcoin)]"
          style={{ color: 'var(--text-secondary)' }}
          title="Copy Markdown"
        >
          <Copy size={14} />
          <span className="hidden sm:inline">Copy</span>
        </button>

        <button
          onClick={handleScreenshot}
          disabled={isScreenshotting}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono transition hover:bg-white/6 hover:text-[color:var(--accent-bitcoin)] disabled:opacity-50"
          style={{ color: 'var(--text-secondary)' }}
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
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono transition hover:bg-white/6 hover:text-[color:var(--accent-bitcoin)]"
          style={{ color: 'var(--text-secondary)' }}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
}
