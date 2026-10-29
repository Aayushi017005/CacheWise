import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Brain,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
  Activity,
  BarChart2,
  GitCompare,
  Lightbulb,
} from 'lucide-react';

/**
 * Split explanation markdown into structured logical sections based on ### headings
 */
function parseSections(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') {
    return [];
  }

  const rawSections = markdownText.split(/(?=###\s+)/g);
  const sections = [];

  for (const block of rawSections) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^###\s+([^\n]+)/);
    if (headingMatch) {
      const title = headingMatch[1].trim();
      const content = trimmed.replace(/^###\s+[^\n]+\n?/, '').trim();
      sections.push({ title, content });
    } else {
      sections.push({ title: 'Overview', content: trimmed });
    }
  }

  return sections;
}

export function AiInsightsViewer({ insights, benchmark }) {
  if (!insights) return null;

  const { explanation = '', provider = 'Educational fallback', isOffline = false } = insights;
  const results = benchmark?.results;

  // Track expanded state for detailed accordion sections
  const [expandedSections, setExpandedSections] = useState({
    'Workload Access Pattern Analysis': true,
    'Engineering & Algorithmic Trade-offs': true,
    'Recommended Next Workload': true,
  });

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Determine provider presentation tag
  const getProviderBadge = () => {
    const p = String(provider).toLowerCase();
    if (p.includes('gemini')) {
      return {
        label: 'Gemini AI',
        icon: Sparkles,
        style: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      };
    }
    if (p.includes('unavailable') || isOffline) {
      return {
        label: 'AI unavailable',
        icon: AlertCircle,
        style: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      };
    }
    return {
      label: 'Educational fallback',
      icon: Brain,
      style: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    };
  };

  const badge = getProviderBadge();
  const BadgeIcon = badge.icon;
  const sections = parseSections(explanation).map((section) => {
    // Older or truncated AI responses may end immediately after this heading.
    // Keep the section useful even when the AI provider returns incomplete text.
    if (section.title === 'Recommended Next Workload' && !section.content.trim()) {
      const capacity = benchmark?.capacity ?? 3;
      const requests = benchmark?.requestCount ?? 12;
      return {
        ...section,
        content: `Run a repeating four-key sequence (A, B, C, D) with cache capacity ${capacity}. When capacity is 3, this working set is larger than the cache, so this workload should demonstrate cache thrashing. For the 12-request sequence A, B, C, D repeated three times, expected result at capacity 3 is 0 hits and 12 misses for FIFO, LRU, and LFU.`,
      };
    }
    return section;
  });

  // Markdown component styling mapping
  const markdownComponents = {
    h1: ({ children }) => <h3 className="text-sm font-semibold text-slate-100 mt-2 mb-1">{children}</h3>,
    h2: ({ children }) => <h4 className="text-xs font-semibold text-slate-200 mt-2 mb-1">{children}</h4>,
    h3: ({ children }) => <h5 className="text-xs font-semibold text-slate-200 mt-1 mb-1">{children}</h5>,
    p: ({ children }) => <p className="text-xs text-slate-300 leading-relaxed my-1.5">{children}</p>,
    strong: ({ children }) => <strong className="font-semibold text-slate-100 text-teal-300/90">{children}</strong>,
    em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 my-2 ml-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 my-2 ml-1">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-950 text-teal-300 border border-slate-800">
        {children}
      </code>
    ),
  };

  // Extract Summary Section if present, else fallback
  const summarySection = sections.find((s) => s.title.toLowerCase().includes('summary'));
  const detailSections = sections.filter((s) => !s.title.toLowerCase().includes('summary'));

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">AI Architectural Insights</h3>
            <p className="text-xs text-slate-400">
              Technical explanation and access pattern evaluation
            </p>
          </div>
        </div>

        {/* Clear AI Status Badge */}
        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-medium self-start sm:self-auto ${badge.style}`}>
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Verified Backend Benchmark Metrics Grid */}
      {results && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Verified Benchmark Metrics (Backend Deterministic)
            </span>
            {benchmark.bestStrategy && (
              <span className="inline-flex items-center space-x-1 text-xs text-teal-300 font-medium">
                <Award className="w-3.5 h-3.5 text-teal-400" />
                <span>Optimal: {benchmark.bestStrategy}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['LRU', 'LFU', 'FIFO'].map((strat) => {
              const item = results[strat];
              if (!item) return null;
              const isWinner = strat === benchmark.bestStrategy;

              return (
                <div
                  key={strat}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isWinner
                      ? 'bg-teal-500/10 border-teal-500/30 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs flex items-center space-x-1.5">
                      <span>{strat}</span>
                      {isWinner && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300">
                          Winner
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold font-mono text-teal-400">
                      {item.hitRatioPercentage}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Hits</span>
                      <span className="text-emerald-400 font-semibold">{item.hits}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Misses</span>
                      <span className="text-amber-400 font-semibold">{item.misses}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Evictions</span>
                      <span className="text-rose-400 font-semibold">{item.evictions}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Callout Banner */}
      {summarySection && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-200">
          <div className="flex items-center space-x-2 text-teal-300 font-semibold mb-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Performance Summary</span>
          </div>
          <ReactMarkdown components={markdownComponents}>
            {summarySection.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Expandable Detailed Technical Sections */}
      <div className="space-y-3">
        {detailSections.map((section, idx) => {
          const isExpanded = expandedSections[section.title] ?? true;

          // Icon per section
          let SectionIcon = Lightbulb;
          if (section.title.toLowerCase().includes('workload') || section.title.toLowerCase().includes('pattern')) {
            SectionIcon = BarChart2;
          } else if (section.title.toLowerCase().includes('trade-off') || section.title.toLowerCase().includes('algorithmic')) {
            SectionIcon = GitCompare;
          }

          return (
            <div
              key={idx}
              className="border border-slate-800/90 rounded-xl bg-slate-950/40 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <SectionIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-200">
                    {section.title}
                  </span>
                </div>
                <div className="text-slate-400 p-0.5">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 bg-slate-900/20 text-xs text-slate-300">
                  <ReactMarkdown components={markdownComponents}>
                    {section.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

