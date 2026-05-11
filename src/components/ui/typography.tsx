import type { HTMLAttributes, TableHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type TypographyProps = HTMLAttributes<HTMLElement>;
type TypographyTableProps = TableHTMLAttributes<HTMLTableElement>;

export function TypographyEyebrow({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'inline-flex w-fit items-center rounded-full border border-[color:var(--muted)]/35 bg-white/[0.02] px-3 py-1 text-[0.68rem] uppercase leading-none tracking-[0.18em] text-[color:var(--subtitle)] [font-family:var(--type-eyebrow-family)] [font-weight:var(--type-eyebrow-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyH1({ className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        'scroll-m-20 max-w-[20ch] text-balance text-[clamp(3.4rem,6vw+1rem,8rem)] leading-[0.88] tracking-[-0.1em] text-[color:var(--title)] [font-family:var(--type-title-family)] [font-weight:var(--type-title-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyH2({ className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        'scroll-m-20 border-b border-[color:var(--muted)]/30 pb-4 text-pretty text-2xl leading-[1.03] tracking-[-0.07em] text-[color:var(--title)] sm:text-3xl lg:text-[2.15rem] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyH3({ className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        'scroll-m-20 text-pretty text-[1.3rem] leading-[1.1] tracking-[-0.055em] text-[color:var(--title)] sm:text-[1.5rem] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyH4({ className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        'scroll-m-20 text-lg leading-[1.25] tracking-[-0.04em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--font-weight-semibold)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyP({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'max-w-[74ch] text-base leading-[1.65] tracking-[-0.02em] text-[color:var(--text)] sm:text-[1.05rem] [font-family:var(--type-body-family)] [font-weight:var(--type-body-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyLead({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'max-w-[68ch] text-[1.1rem] leading-[1.5] tracking-[-0.05em] text-[color:var(--subtitle)] sm:text-[1.24rem] lg:text-[1.35rem] [font-family:var(--type-heading-family)] [font-weight:var(--font-weight-medium)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyLarge({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'text-lg leading-[1.4] tracking-[-0.05em] text-[color:var(--title)] sm:text-xl [font-family:var(--type-heading-family)] [font-weight:var(--font-weight-semibold)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographySmall({ className, ...props }: TypographyProps) {
  return (
    <small
      className={cn(
        'text-xs leading-[1.4] tracking-[0.08em] text-[color:var(--muted)] sm:text-sm [font-family:var(--type-label-family)] [font-weight:var(--type-label-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyMuted({ className, ...props }: TypographyProps) {
  return (
    <p
      className={cn(
        'max-w-[74ch] text-sm leading-[1.6] tracking-[-0.015em] text-[color:var(--subtitle)] sm:text-base [font-family:var(--type-body-family)] [font-weight:var(--font-weight-medium)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyBlockquote({ className, ...props }: TypographyProps) {
  return (
    <blockquote
      className={cn(
        'mt-6 max-w-[74ch] border-l border-[color:var(--subtitle)]/45 pl-5 text-base leading-[1.6] tracking-[-0.02em] text-[color:var(--subtitle)] sm:text-lg [font-family:var(--type-body-family)] [font-weight:var(--font-weight-medium)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyList({ className, ...props }: TypographyProps) {
  return (
    <ul
      className={cn(
        'my-5 ml-5 max-w-[72ch] list-disc space-y-2.5 pl-2 text-sm leading-[1.6] tracking-[-0.015em] text-[color:var(--text)] marker:text-[color:var(--subtitle)] sm:text-base [font-family:var(--type-body-family)] [font-weight:var(--type-body-weight)]',
        className
      )}
      {...props}
    />
  );
}

export function TypographyTable({ className, ...props }: TypographyTableProps) {
  return (
    <div className='my-6 w-full overflow-x-auto rounded-[5.5px] border border-[color:var(--muted)]/20 bg-white/[0.02]'>
      <table
        className={cn(
          'w-full min-w-[36rem] caption-bottom border-collapse text-left text-sm tracking-[-0.01em] text-[color:var(--text)] [font-family:var(--type-body-family)] [font-weight:var(--type-body-weight)]',
          className
        )}
        {...props}
      />
    </div>
  );
}

export function TypographyInlineCode({ className, ...props }: TypographyProps) {
  return (
    <code
      className={cn(
        'relative rounded-md border border-[color:var(--muted)]/35 bg-black/35 px-[0.35rem] py-[0.2rem] text-[0.9em] text-[color:var(--fg)] [font-family:var(--type-label-family)] [font-weight:var(--font-weight-medium)]',
        className
      )}
      {...props}
    />
  );
}
