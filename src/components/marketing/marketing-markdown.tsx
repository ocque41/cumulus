'use client';

import type { HTMLAttributes } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

type MarketingMarkdownProps = HTMLAttributes<HTMLDivElement> & {
  content: string;
};

export function MarketingMarkdown({ content, className, ...props }: MarketingMarkdownProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ className: nodeClassName, ...nodeProps }) => (
            <h2
              className={cn(
                'scroll-m-20 text-pretty text-2xl font-semibold leading-[1.02] tracking-[-0.08em] text-[color:var(--title)] sm:text-[2rem]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          h3: ({ className: nodeClassName, ...nodeProps }) => (
            <h3
              className={cn(
                'scroll-m-20 text-pretty text-[1.28rem] font-semibold leading-[1.08] tracking-[-0.05em] text-[color:var(--title)] sm:text-[1.45rem]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          p: ({ className: nodeClassName, ...nodeProps }) => (
            <p
              className={cn(
                'max-w-[76ch] text-[1rem] leading-[1.7] tracking-[-0.03em] text-[color:var(--text)] sm:text-[1.04rem]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          ul: ({ className: nodeClassName, ...nodeProps }) => (
            <ul
              className={cn(
                'ml-5 max-w-[74ch] list-disc space-y-2.5 pl-2 text-[0.98rem] leading-[1.65] tracking-[-0.03em] text-[color:var(--text)] marker:text-[color:var(--subtitle)]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          ol: ({ className: nodeClassName, ...nodeProps }) => (
            <ol
              className={cn(
                'ml-5 max-w-[74ch] list-decimal space-y-2.5 pl-2 text-[0.98rem] leading-[1.65] tracking-[-0.03em] text-[color:var(--text)] marker:text-[color:var(--subtitle)]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          li: ({ className: nodeClassName, ...nodeProps }) => <li className={cn('pl-1', nodeClassName)} {...nodeProps} />,
          blockquote: ({ className: nodeClassName, ...nodeProps }) => (
            <blockquote
              className={cn(
                'border-l border-[color:var(--subtitle)]/45 pl-5 text-[1rem] font-medium leading-[1.7] tracking-[-0.03em] text-[color:var(--subtitle)]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          hr: ({ className: nodeClassName, ...nodeProps }) => (
            <hr className={cn('border-0 border-t border-[color:var(--muted)]/25', nodeClassName)} {...nodeProps} />
          ),
          a: ({ className: nodeClassName, ...nodeProps }) => (
            <a
              className={cn(
                'underline decoration-[color:var(--subtitle)]/60 underline-offset-4 transition-colors hover:text-[color:var(--title)]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          table: ({ className: nodeClassName, ...nodeProps }) => (
            <div className='overflow-x-auto rounded-[5.5px] border border-[color:var(--glass-border-base)]/70 bg-black/15'>
              <table className={cn('min-w-full border-collapse text-left text-sm text-[color:var(--text)]', nodeClassName)} {...nodeProps} />
            </div>
          ),
          thead: ({ className: nodeClassName, ...nodeProps }) => <thead className={cn('bg-white/[0.04]', nodeClassName)} {...nodeProps} />,
          th: ({ className: nodeClassName, ...nodeProps }) => (
            <th
              className={cn(
                'border-b border-[color:var(--glass-border-base)]/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--subtitle)]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          td: ({ className: nodeClassName, ...nodeProps }) => (
            <td
              className={cn(
                'border-b border-[color:var(--glass-border-base)]/40 px-4 py-3 align-top text-[0.95rem] leading-[1.55] tracking-[-0.02em]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          pre: ({ className: nodeClassName, ...nodeProps }) => (
            <pre
              className={cn(
                'overflow-x-auto rounded-[5.5px] border border-[color:var(--glass-border-base)]/70 bg-black/30 px-4 py-4 text-[0.86rem] leading-[1.65] text-[color:var(--fg)]',
                nodeClassName
              )}
              {...nodeProps}
            />
          ),
          code: ({ className: nodeClassName, children, ...nodeProps }) => {
            const isBlock = Boolean(nodeClassName);

            if (isBlock) {
              return (
                <code className={cn('font-mono text-[0.86rem] text-[color:var(--fg)]', nodeClassName)} {...nodeProps}>
                  {children}
                </code>
              );
            }

            return (
              <code
                className={cn(
                  'rounded-md border border-[color:var(--glass-border-base)]/70 bg-black/25 px-1.5 py-0.5 font-mono text-[0.88em] font-semibold text-[color:var(--fg)]',
                  nodeClassName
                )}
                {...nodeProps}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
