import Image from "next/image";
// import ethAccra from "../../../public/illustration.svg"

export default function Loading() {
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || "/illustration.svg";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Events Hub....';

  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen p-8 bg-white">
      <div className="flex flex-col items-center gap-8">
        {/* Logo Image */}
        <div className="relative w-[900px] h-[500px]">
          <Image
            src={logoUrl}
            alt={`${appName} logo`}
            width={192}
            height={192}
            unoptimized
            className="object-cover w-full h-full"
            priority
          />
        </div>
        
        {/* Pulsing App Name */}
        <h1 className="text-3xl font-bold text-gray-800 animate-pulse text-center">
          {appName}
        </h1>
      </div>
    </div>
  );
}