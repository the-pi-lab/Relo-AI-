import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className = "", size = "md", showText = false }: LogoProps) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
  };

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img 
          src="https://i.postimg.cc/cLL5mhWH/Screenshot-2025-12-30-234754.png" 
          alt="Logo" 
          className="w-full h-full object-cover rounded"
          loading="eager"
        />
      </div>
      {showText && (
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          THE π LAB
        </span>
      )}
    </motion.div>
  );
}
