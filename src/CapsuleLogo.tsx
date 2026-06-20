import React from "react";

interface CapsuleLogoProps {
  className?: string; // Optional custom classes
  size?: number;      // Size in pixels
  animated?: boolean; // Enable active pulsing bio-bonds animation
}

export default function CapsuleLogo({ className = "", size = 40, animated = true }: CapsuleLogoProps) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`} 
      style={{ width: size, height: size }}
      id="capsule-logo-container"
    >
      {/* Background soft glow aura */}
      <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-400/5 blur-xl rounded-full pointer-events-none" />
      
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_10px_rgba(16,185,129,0.15)] dark:drop-shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
      >
        <defs>
          {/* Gradients for Left Pink Pill Capsule */}
          <linearGradient id="pinkCapsuleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2a85" />
            <stop offset="60%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
          
          <linearGradient id="pinkGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </linearGradient>

          {/* Gradients for Right Cyan Pill Capsule */}
          <linearGradient id="cyanCapsuleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>

          <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neonSubtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g className="transition-transform duration-500 hover:scale-[1.05] origin-center">
          {/* 1. LEFT HALF: SLANTED PINK CAPSULE (Rounded Cap) */}
          <g className={animated ? "animate-pulse" : ""} style={{ animationDuration: "3s" }}>
            {/* Soft backdrop neon shadow */}
            <path
              d="M 85 55 C 50 35, 15 55, 25 90 C 35 125, 68 115, 80 108 L 92 102 Z"
              fill="url(#pinkGlow)"
              filter="url(#neonSubtleGlow)"
              opacity="0.5"
            />
            {/* Main Capsule Cap Shell */}
            <path
              d="M 82,60 C 58,46, 32,60, 36,86 C 40,108, 62,112, 80,102 C 86,99, 91,96, 92,95 L 85,82 Z"
              fill="url(#pinkCapsuleGrad)"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Highlight gloss */}
            <path
              d="M 45,66 C 36,78, 42,92, 50,88"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>

          {/* 2. RIGHT HALF: SLANTED CYAN CAPSULE (Rounded Cap) */}
          <g className={animated ? "animate-pulse" : ""} style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}>
            {/* Soft backdrop neon shadow */}
            <path
              d="M 120 120 L 110 135 C 120 145, 150 160, 175 140 C 200 120, 185 85, 150 100 Z"
              fill="url(#cyanGlow)"
              filter="url(#neonSubtleGlow)"
              opacity="0.4"
            />
            {/* Main Capsule Cap Shell */}
            <path
              d="M 112,112 L 120,126 C 132,120, 148,112, 160,118 C 174,124, 172,142, 156,150 C 136,160, 118,144, 114,136 Z"
              fill="url(#cyanCapsuleGrad)"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Highlight gloss */}
            <path
              d="M 152,142 C 160,136, 158,124, 150,126"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>

          {/* 3. CENTRAL EXPLODING BIO-CHEMICAL MOLECULES NETWORK (Pink + Blue interactions) */}
          <g id="molecules-exploding-group" className={animated ? "animate-pulse" : ""}>
            {/* Connective Lattice Bonds lines */}
            <line x1="88" y1="92" x2="108" y2="108" stroke="#f43f5e" strokeWidth="1.5" opacity="0.6" strokeDasharray="3 3" />
            <line x1="94" y1="114" x2="114" y2="114" stroke="#a7f3d0" strokeWidth="1" opacity="0.7" />
            <line x1="82" y1="102" x2="94" y2="114" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.6" />
            <line x1="105" y1="88" x2="116" y2="102" stroke="#d946ef" strokeWidth="1" opacity="0.5" />
            
            {/* Central Molecular Nodes (Cyan Node) */}
            <circle cx="108" cy="108" r="7" fill="#0ea5e9" stroke="#ffffff" strokeWidth="1.5" filter="url(#neonSubtleGlow)" />
            <circle cx="108" cy="108" r="2.5" fill="#ffffff" />

            {/* Pink Neon Node */}
            <circle cx="94" cy="114" r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
            
            {/* Purple Interaction Sphere */}
            <circle cx="88" cy="92" r="4.5" fill="#d946ef" opacity="0.9" />

            {/* Glowing Golden Receptor/Atom center */}
            <circle cx="116" cy="94" r="3.5" fill="#fbbf24" filter="url(#neonSubtleGlow)" />

            {/* Outer floating atoms */}
            <circle cx="74" cy="82" r="2" fill="#ff2a85" className="animate-ping" style={{ animationDuration: "4s" }} />
            <circle cx="132" cy="115" r="2.5" fill="#0ea5e9" />
            <circle cx="122" cy="130" r="1.5" fill="#22c55e" />
            <circle cx="100" cy="80" r="2" fill="#eab308" />
          </g>
        </g>
      </svg>
    </div>
  );
}
