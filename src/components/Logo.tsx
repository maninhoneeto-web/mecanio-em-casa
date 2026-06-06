import logoImg from "../assets/images/mecanico_casa_clean_1780786158558.png";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function Logo({ className = "", size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  const textSizes = {
    xs: "text-[5px] tracking-tight",
    sm: "text-[7px] tracking-wider",
    md: "text-[9px] tracking-widest font-black",
    lg: "text-[11px] tracking-[0.18em] font-black",
    xl: "text-sm tracking-[0.25em] font-black",
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* The Core Image Box */}
      <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
        {/* Outer Glowing Border with a container suited for our professional emblem */}
        <div className="absolute inset-0 rounded-2xl border border-cyan-400/30 bg-slate-950/40 backdrop-blur-md overflow-hidden p-1 shadow-[0_0_25px_rgba(6,182,212,0.15)] animate-[pulse_4s_ease-in-out_infinite]" />
        
        {/* High contrast dynamic logo image loaded as a React Asset */}
        <img 
          src={logoImg} 
          alt="Mecânico em Casa Logo" 
          className="relative z-10 w-full h-full object-cover rounded-xl border border-slate-800"
          referrerPolicy="no-referrer"
        />
        
        {/* Cyberpunk/Futuristic corner tech style details to make it feel highly professional */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400 z-20" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400 z-20" />
        
        {/* Background radial atmosphere glow */}
        <div className="absolute inset-1 bg-cyan-500/20 blur-xl rounded-full" />
      </div>

      {showText && (
        <div className="mt-3 text-center relative z-10">
          <div className={`text-[#00f3ff] uppercase bg-slate-950/90 border border-cyan-400/50 px-3 py-1 rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.25)] whitespace-nowrap select-none font-mono ${textSizes[size]}`}>
            MECÂNICO EM CASA
          </div>
        </div>
      )}
    </div>
  );
}
