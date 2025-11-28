
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { useModalType } from "@/contexts/modalContext";
import { FaCircleCheck } from "react-icons/fa6";
import PrimaryButton from "../ui/PrimaryButton";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";

export default function SuccessModal() {
    const { isOpen: isSuccessOpen, hideModal, modalData, } = useModalType('success')
    const [countdown, setCountdown] = useState<number | null>(null)
    const iconRef = useRef<HTMLDivElement>(null)
    
    // Initialize countdown when modal opens
    useEffect(() => {
        if (modalData?.duration && modalData.duration > 0) {
            // Convert milliseconds to seconds for countdown display
            setCountdown(Math.floor(modalData.duration / 1000))
        }
    }, [modalData?.duration])
    
    // Countdown timer
    useEffect(() => {
        if (countdown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prev => prev ? prev - 1 : null)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])
    
    // Auto-close modal when countdown reaches 0
    useEffect(() => {
        if (countdown === 0) {
            hideModal()
        }
    }, [countdown, hideModal])

    // Animate icon when modal opens
    useEffect(() => {
        if (isSuccessOpen && iconRef.current) {
            const icon = iconRef.current
            
            // Set initial state
            gsap.set(icon, {
                scale: 0,
                rotation: -180,
                opacity: 0
            })

            // Animate in with bounce effect
            gsap.to(icon, {
                scale: 1,
                rotation: 0,
                opacity: 1,
                duration: 0.8,
                ease: "back.out(1.7)"
            })

            // Add a subtle pulse effect
            gsap.to(icon, {
                scale: 1.1,
                duration: 0.3,
                delay: 0.8,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            })
        }
    }, [isSuccessOpen])
    return (
        <Modal backdrop={`blur`} isOpen={isSuccessOpen} onClose={hideModal} placement="auto">
            <ModalContent className="bg-background-alt border border-gray-700/50">
                {(hideModal) => (
                    <>
                        <ModalHeader className="flex flex-col gap-3 items-center">
                            <div ref={iconRef}>
                                <FaCircleCheck className="text-primary" size={60} />
                            </div>
                            <p>{modalData?.title}</p>
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                {modalData?.message}
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <PrimaryButton className="bg-background border border-primary" onClick={modalData?.onClose ?? hideModal}>
                                Close {countdown && countdown > 0 ? `in ${countdown}s` : ''}
                            </PrimaryButton>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

