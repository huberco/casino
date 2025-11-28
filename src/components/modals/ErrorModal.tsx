import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { useModalType } from "@/contexts/modalContext";
import { FaTriangleExclamation } from "react-icons/fa6";
import PrimaryButton from "../ui/PrimaryButton";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function ErrorModal() {
    const { isOpen: isErrorOpen, hideModal, modalData } = useModalType('error')
    const iconRef = useRef<HTMLDivElement>(null)

    const handleClose = () => {
        if (modalData?.onClose) {
            modalData.onClose()
        }
        hideModal()
    }

    // Animate icon when modal opens
    useEffect(() => {
        if (isErrorOpen && iconRef.current) {
            const icon = iconRef.current
            
            // Set initial state
            gsap.set(icon, {
                scale: 0,
                rotation: -180,
                opacity: 0
            })

            // Animate in
            gsap.to(icon, {
                scale: 1,
                rotation: 0,
                opacity: 1,
                duration: 0.6,
                ease: "back.out(1.7)"
            })

            // Add a subtle shake effect
            gsap.to(icon, {
                x: -5,
                duration: 0.1,
                delay: 0.6,
                yoyo: true,
                repeat: 3,
                ease: "power2.inOut"
            })
        }
    }, [isErrorOpen])

    return (
        <Modal backdrop={`blur`} isOpen={isErrorOpen} onClose={hideModal} placement="auto">
            <ModalContent className="bg-background-alt border border-gray-700/50">
                {(hideModal) => (
                    <>
                        <ModalHeader className="flex flex-col gap-3 items-center">
                            <div ref={iconRef}>
                                <FaTriangleExclamation className="text-red-500" size={60} />
                            </div>
                            <p>{modalData?.title}</p>
                        </ModalHeader>
                        <ModalBody>
                            <p>
                                {modalData?.message}
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <PrimaryButton className="bg-background border border-primary" onClick={handleClose}>
                                Close
                            </PrimaryButton>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}