"use client"
import { Button, Spinner } from "@heroui/react"

const PrimaryButton = ({ children, className = "bg-primary text-background", onClick, isLoading, disabled = false }: { children: React.ReactNode, className?: string, onClick?: () => void, isLoading?: boolean, disabled?: boolean }) => {

    return (
        <Button className={`hover:scale-[1.01] text-semibold capitalize rounded-full px-6 py-3 ${className} ${isLoading ? "cursor-not-allowed bg-primary/20 " : ""} ${disabled ? "cursor-not-allowed bg-primary/20 hover:bg-primary/20 hover:shadow-none" : ""}`} onPress={()=>{if(!isLoading && !disabled) onClick?.()}}>
            {isLoading ? <Spinner classNames={{ label: "text-foreground" }}  color="primary" variant="gradient" size="sm"/>
                : children}
        </Button>
    )
}

export default PrimaryButton;