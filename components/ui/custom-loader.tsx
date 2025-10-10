"use client"

import React from 'react'

interface CustomLoaderProps {
  size?: number
  dotSize?: number
  dotCount?: number
  color?: string
  speed?: string
  spread?: string
  className?: string
}

export function CustomLoader({
  size = 64,
  dotSize = 6,
  dotCount = 6,
  color = '#3b82f6',
  speed = '1s',
  spread = '60deg',
  className = ''
}: CustomLoaderProps) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{
        '--size': `${size}px`,
        '--dot-size': `${dotSize}px`,
        '--dot-count': dotCount,
        '--color': color,
        '--speed': speed,
        '--spread': spread
      } as React.CSSProperties}
    >
      <div className="dots">
        {Array.from({ length: dotCount }, (_, i) => (
          <div key={i} className="dot" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
      
      <style jsx>{`
        .dots {
          width: var(--size);
          height: var(--size);
          position: relative;
        }

        .dot {
          width: var(--size);
          height: var(--size);
          animation: dwl-dot-spin calc(var(--speed) * 5) infinite linear both;
          animation-delay: calc(var(--i) * var(--speed) / (var(--dot-count) + 2) * -1);
          rotate: calc(var(--i) * var(--spread) / (var(--dot-count) - 1));
          position: absolute;
        }

        .dot::before {
          content: "";
          display: block;
          width: var(--dot-size);
          height: var(--dot-size);
          background-color: var(--color);
          border-radius: 50%;
          position: absolute;
          transform: translate(-50%, -50%);
          bottom: 0;
          left: 50%;
        }

        @keyframes dwl-dot-spin {
          0% {
            transform: rotate(0deg);
            animation-timing-function: cubic-bezier(0.390, 0.575, 0.565, 1.000);
            opacity: 1;
          }

          2% {
            transform: rotate(20deg);
            animation-timing-function: linear;
            opacity: 1;
          }

          30% {
            transform: rotate(180deg);
            animation-timing-function: cubic-bezier(0.445, 0.050, 0.550, 0.950);
            opacity: 1;
          }

          41% {
            transform: rotate(380deg);
            animation-timing-function: linear;
            opacity: 1;
          }

          69% {
            transform: rotate(520deg);
            animation-timing-function: cubic-bezier(0.445, 0.050, 0.550, 0.950);
            opacity: 1;
          }

          76% {
            opacity: 1;
          }

          76.1% {
            opacity: 0;
          }

          80% {
            transform: rotate(720deg);
          }

          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Convenience components for common use cases
export function PageLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <CustomLoader size={80} color="#3b82f6" />
    </div>
  )
}

export function ButtonLoader({ className = '' }: { className?: string }) {
  return (
    <CustomLoader size={20} dotSize={3} dotCount={4} color="#ffffff" className={className} />
  )
}

export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <CustomLoader size={32} dotSize={4} dotCount={5} color="#6b7280" className={className} />
  )
}
