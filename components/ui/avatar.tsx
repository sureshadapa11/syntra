import { cn, getInitials } from "@/lib/utils";

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
  "2xl": "w-20 h-20 text-xl",
};

const colors = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-red-600",
];

function getColor(name: string) {
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-semibold shrink-0", sizeClasses[size], getColor(name), className)}>
      {getInitials(name)}
    </div>
  );
}
