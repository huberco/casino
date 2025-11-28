"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

const GameButton = ({ children, href, className }: { children: React.ReactNode, href: string, className?: string }) => {

    const pathname = usePathname();
    const isActive = pathname === href;
    
    return (
        <Link 
            href={href} 
            className={`hover:scale-[1.01] text-semibold capitalize rounded-full px-4 py-2 transition-all duration-200 ${
                isActive 
                    ? "bg-primary text-background" 
                    : "bg-background text-white hover:bg-primary hover:text-background"
            } ${className}`}
        >
            {children}
        </Link>
    )
}

export default GameButton;