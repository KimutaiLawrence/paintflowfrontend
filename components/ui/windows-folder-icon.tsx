"use client"

import React from 'react'

interface WindowsFolderIconProps {
  className?: string
  size?: number
  onClick?: () => void
}

export const WindowsFolderIcon: React.FC<WindowsFolderIconProps> = ({ 
  className = "", 
  size = 24, 
  onClick 
}) => {
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={onClick}
    >
      {/* Folder base */}
      <div 
        className="absolute bottom-0 w-full rounded-sm"
        style={{ 
          height: '88%',
          background: 'linear-gradient(-35deg, rgb(238, 194, 47) 5%, rgb(255, 223, 118))',
          borderTop: '2px solid rgb(206, 167, 39)'
        }}
      />
      
      {/* Folder tab */}
      <div 
        className="absolute rounded-sm"
        style={{
          top: '5%',
          width: '38%',
          height: '19%',
          backgroundColor: 'rgb(206, 167, 39)',
          boxShadow: '0 1px 5px -2px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Tab fold */}
        <div 
          className="absolute"
          style={{
            left: '88%',
            width: '0',
            height: '0',
            borderLeft: '7px solid rgb(206, 167, 39)',
            borderTop: '0.3em solid transparent',
            borderBottom: '0.3em solid transparent'
          }}
        />
      </div>
      
      {/* Blue folder - smaller */}
      <div 
        className="absolute rounded-sm"
        style={{
          left: '0.7em',
          bottom: '0.1em',
          width: '1.8em',
          height: '0.6em',
          background: 'linear-gradient(-35deg, rgb(25, 102, 218), rgb(109, 165, 249))',
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.4)'
        }}
      />
      
      {/* Blue folder line - smaller */}
      <div 
        className="absolute rounded-full"
        style={{
          left: '1.1em',
          bottom: '0.4em',
          width: '1.0em',
          height: '0.12em',
          backgroundColor: 'rgb(20, 77, 163)',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  )
}
