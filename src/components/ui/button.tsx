"use client"

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { animate } from 'animejs'

import { cn } from '@/lib/utils'
import { useMagnetic } from '@/hooks/use-magnetic'

const buttonVariants = cva(
  "relative inline-flex items-center justify-start gap-2 whitespace-nowrap rounded-[5.5px] text-sm font-normal tracking-[0.08em] transition-colors duration-200 overflow-hidden no-underline decoration-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [font-family:var(--type-label-family)]",
  {
    variants: {
      variant: {
        default: 'bg-transparent text-[color:var(--muted)] shadow-none hover:text-[color:var(--text)] [font-weight:var(--type-label-weight)]',
        plain: 'bg-transparent text-[color:var(--muted)] shadow-none hover:text-[color:var(--text)] [font-weight:var(--type-label-weight)]',
        destructive: 'bg-transparent text-destructive shadow-none hover:text-destructive [font-weight:var(--type-label-weight)]',
        outline: 'bg-transparent text-[color:var(--muted)] shadow-none hover:text-[color:var(--text)] [font-weight:var(--type-label-weight)]',
        secondary: 'bg-transparent text-[color:var(--muted)] shadow-none hover:text-[color:var(--text)] [font-weight:var(--type-label-weight)]',
        ghost: 'bg-transparent text-[color:var(--muted)] shadow-none hover:text-[color:var(--text)] [font-weight:var(--type-label-weight)]',
        link: 'bg-transparent text-[color:var(--muted)] shadow-none hover:text-[color:var(--text)] [font-weight:var(--type-label-weight)]',
        brand:
          'bg-[color:var(--color-paper)] !text-[color:var(--color-ink)] rounded-[5.5px] hover:opacity-90 tracking-wide shadow-none before:hidden after:hidden [&_*]:!text-[color:var(--color-ink)] [font-weight:var(--font-weight-semibold)]',
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        hero: "h-auto px-5 py-3 gap-2 text-xl font-normal leading-none",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  leadingGlyph = false,
  glyphClassName,
  children,
  magnetic = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    leadingGlyph?: boolean
    glyphClassName?: string
    magnetic?: boolean
  }) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Apply magnetic effect if enabled
  useMagnetic(buttonRef, { disabled: !magnetic })

  // Refs for animation targets
  const topLeftRef = React.useRef<HTMLSpanElement>(null)
  const bottomRightRef = React.useRef<HTMLSpanElement>(null)

  // Track hover state for elastic animations
  const isHovered = React.useRef(false)

  // Setup animations
  React.useEffect(() => {
    // Capture current refs to ensure they exist for the effect duration and cleanup
    const btn = buttonRef.current
    const tl = topLeftRef.current
    const br = bottomRightRef.current

    if (!tl || !br || !btn) return

    // Helper for random values
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Initial Appearance Animation
    animate(tl, {
      width: ['0%', '28%'],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 800,
      delay: 100
    })

    animate(br, {
      height: ['0%', '28%'],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 800,
      delay: 200
    })

    const handleMouseEnter = () => {
      isHovered.current = true
      // Elastic expansion on hover with Glow
      animate(tl, {
        width: '45%',
        boxShadow: '0 0 12px rgba(255,255,255,0.6)',
        filter: 'brightness(1.5)',
        easing: 'easeOutElastic(1, .5)',
        duration: 800
      })
      animate(br, {
        height: '45%',
        boxShadow: '0 0 12px rgba(255,255,255,0.6)',
        filter: 'brightness(1.5)',
        easing: 'easeOutElastic(1, .5)',
        duration: 800
      })
    }

    const handleMouseLeave = () => {
      isHovered.current = false
      // Return to base state
      animate(tl, {
        width: '28%',
        boxShadow: '0 0 0px rgba(255,255,255,0)',
        filter: 'brightness(1)',
        easing: 'easeOutExpo',
        duration: 600
      })
      animate(br, {
        height: '28%',
        boxShadow: '0 0 0px rgba(255,255,255,0)',
        filter: 'brightness(1)',
        easing: 'easeOutExpo',
        duration: 600
      })
    }

    const handleClick = () => {
      // Physics-based click impact
      // 1. Scale down for tactile feel
      animate(btn, {
        scale: 0.95,
        duration: 50,
        easing: 'easeOutQuad',
        complete: () => {
          // 2. Spring back
          animate(btn, {
            scale: 1,
            duration: 800,
            easing: 'easeOutElastic(1, .5)'
          })
        }
      });

      // Glitch effect on click (subtle)
      const targets = [tl, br]

      animate(targets, {
        translateX: () => random(-2, 2),
        translateY: () => random(-2, 2),
        duration: 50,
        direction: 'alternate',
        loop: 3,
        easing: 'steps(2)',
        complete: () => {
          // Reset transforms
          animate(targets, {
            translateX: 0,
            translateY: 0,
            duration: 50
          })
        }
      })
    }

    btn.addEventListener('mouseenter', handleMouseEnter)
    btn.addEventListener('mouseleave', handleMouseLeave)
    btn.addEventListener('click', handleClick)

    return () => {
      btn.removeEventListener('mouseenter', handleMouseEnter)
      btn.removeEventListener('mouseleave', handleMouseLeave)
      btn.removeEventListener('click', handleClick)
    }
  }, [])

  let renderedChildren = children

  if (leadingGlyph) {
    const childContent = React.isValidElement(children)
      ? (children.props as { children?: React.ReactNode }).children
      : children

    const glyphContent = (
      <span className="inline-flex items-end gap-[2px] leading-none">
        <BracketGlyph
          className={cn(
            "h-[70px] w-[70px] -translate-y-[6px] text-[#999999]",
            glyphClassName
          )}
          aria-hidden
        />
        <span className="leading-none">{childContent}</span>
      </span>
    )

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement
      renderedChildren = React.cloneElement(childElement, undefined, glyphContent)
    } else {
      renderedChildren = glyphContent
    }
  }

  // Only render brackets for non-brand/non-link variants if desired,
  // or just let CSS hide them if we add classes.
  // For now, we render them always but control visibility via CSS or variants if needed.
  // The 'brand' variant previously had `before:hidden after:hidden`, so we should mimic that.
  // Also, if asChild is true, we CANNOT render brackets as siblings because Slot expects a single child.
  const showBrackets = !asChild && !['brand', 'link', 'ghost'].includes(variant || 'default')

  // Separate render path for Slot (asChild) to ensure exactly one child
  if (asChild) {
    return (
      <Slot
        ref={buttonRef}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
          leadingGlyph && "gap-[2px] bg-transparent px-3 py-2 shadow-none"
        )}
        {...props}
      >
        {renderedChildren}
      </Slot>
    )
  }

  return (
    <button
      ref={buttonRef}
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        leadingGlyph && "gap-[2px] bg-transparent px-3 py-2 shadow-none"
      )}
      {...props}
    >
      {/* Top Left Bracket */}
      {showBrackets && (
        <span
          ref={topLeftRef}
          className="absolute bottom-0 left-0 h-[1.5px] w-[28%] bg-current rounded-bl-[20px] pointer-events-none"
        />
      )}

      {/* Bottom Left Vertical Line */}
      {showBrackets && (
        <span
          ref={bottomRightRef}
          className="absolute bottom-0 left-0 w-[1.5px] h-[28%] bg-current rounded-bl-[20px] pointer-events-none"
        />
      )}

      {renderedChildren}
    </button>
  )
}

function BracketGlyph(
  props: React.SVGProps<SVGSVGElement> & { className?: string }
) {
  const { className, ...rest } = props

  return (
    <svg
      width="35"
      height="36"
      viewBox="0 0 35 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...rest}
    >
      <path
        d="M6.40616 24.903V7.70308C6.40616 7.31478 6.09138 7 5.70308 7C5.31478 7 5 7.31478 5 7.70308V24.903C5 28.8226 8.17724 32 12.097 32H29.2969C29.6852 32 30 31.6852 30 31.2969C30 30.9086 29.6852 30.5938 29.2969 30.5938H12.097C8.95425 30.5938 6.40616 28.0459 6.40616 24.903Z"
        fill="currentColor"
      />
    </svg>
  )
}

export { Button, buttonVariants }
