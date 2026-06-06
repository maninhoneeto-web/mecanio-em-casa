import { Wrench, MapPin } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  const iconSizes = {
    xs: 16,
    sm: 24,
    md: 40,
    lg: 64,
    xl: 96,
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {/* Outer Glowing Hexagon / Circle */}
      <div className="absolute inset-0 rounded-full border-2 border-neon-blue/80 neon-border animate-[pulse_3s_ease-in-out_infinite]" />
      
      {/* Inner Elements */}
      <div className="relative z-10 flex items-center justify-center">
        <MapPin 
          size={iconSizes[size]} 
          className="text-slate-100 absolute transform -translate-y-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
          strokeWidth={1.5}
        />
        <Wrench 
          size={iconSizes[size] * 0.6} 
          className="text-neon-blue absolute transform translate-y-3 drop-shadow-[0_0_8px_rgba(0,243,255,0.8)]" 
          strokeWidth={2}
        />
      </div>
      
      {/* Background glow */}
      <div className="absolute inset-2 bg-blue-500/20 blur-xl rounded-full" />
    </div>
  );
}
