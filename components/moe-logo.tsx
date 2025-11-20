import Image from "next/image"

export function MoELogo({
  className = "",
  size = "medium",
}: { className?: string; size?: "small" | "medium" | "large" }) {
  // Determine the size based on the prop
  const dimensions = {
    small: { width: 60, height: 48 },
    medium: { width: 80, height: 64 },
    large: { width: 120, height: 96 },
  }

  const { width, height } = dimensions[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/images/moe-logo.png"
        alt="Ministry of Education, Guyana Logo"
        width={width}
        height={height}
        priority
        className="object-contain"
      />
      <div className="font-semibold text-gray-800 leading-tight">
        <div className="text-base md:text-lg">Ministry of Education</div>
        <div className="text-sm text-gray-600">Guyana</div>
      </div>
    </div>
  )
}
