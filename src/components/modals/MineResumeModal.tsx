import type { ModalProps } from "@heroui/react";

import React, { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    RadioGroup,
    Radio,
} from "@heroui/react";
import { gameApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/socketContext";
import PrimaryButton from "../ui/PrimaryButton";

export default function MineResumeModal(props: { resumeGame: (gameId: string) => void }) {
    const { resumeGame  } = props;
    const { isOpen, onOpen, onOpenChange, } = useDisclosure();
    const { user } = useAuth();
    const { isConnected } = useWebSocket();

    const [incompleteGames, setIncompleteGames] = useState<any[]>([])

    // Fetch incomplete games
    const fetchIncompleteGames = async () => {
        try {
            const response = await gameApi.mine.getIncompleteGames()
            if (response.success && response.data) {
                setIncompleteGames(response.data.games || [])
                // Show resume modal if there are incomplete games
                if (response.data.games && response.data.games.length > 0) {
                    onOpen()
                }
            }
        } catch (error) {
            console.error('Failed to fetch incomplete games:', error)
        }
    }

    useEffect(() => {
        if (user.isAuthenticated && isConnected) {
            fetchIncompleteGames()
        }
    }, [user.isAuthenticated, isConnected])

    return (
        <div className="flex flex-col gap-2">

            <Modal isOpen={isOpen} scrollBehavior={"inside"} onOpenChange={onOpenChange} backdrop="blur">
                <ModalContent className="bg-background">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h2 className="text-white font-bold text-2xl">Resume incomplete games</h2>

                            </ModalHeader>
                            <ModalBody>
                                <p className="text-gray-300 mb-4">
                                    You have {incompleteGames.length} incomplete game{incompleteGames.length > 1 ? 's' : ''}.
                                    Would you like to resume your most recent game?
                                </p>
                                {incompleteGames.slice(0, 3).map((game, index) => (
                                    <div key={game.id} className="bg-background-alt rounded-lg p-3 border border-gray-700/50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-medium">
                                                    Game #{game.id.slice(-6)}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Wager: {game.wager} • Multiplier: {game.multiplier.toFixed(2)}x
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    Gems found: {game.revealedTiles.length}
                                                </p>
                                            </div>
                                            <PrimaryButton
                                                onClick={() => {resumeGame(game.id); onClose();}}
                                            >
                                                Resume
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                ))}
                            </ModalBody>
                            <ModalFooter>
                                <Button className="bg-background-alt border border-primary rounded-full" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
