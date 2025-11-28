'use client'

import React from 'react'
import { Card, CardBody, Button } from "@heroui/react"
import { FaUsers, FaDollarSign, FaShare, FaChartLine } from 'react-icons/fa'
import AnimatedText from '@/components/AnimatedText'

const AffiliatesPage = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <FaUsers className="text-4xl text-blue-500" />
                    <AnimatedText
                        text="Affiliate Program"
                        className="text-4xl font-bold text-white"
                        type="typewriter"
                        duration={0.1}
                        delay={0.3}
                        stagger={0.08}
                    />
                </div>
                <AnimatedText
                    text="Earn rewards by referring new players to SpinX Games. Join our affiliate program and start earning today."
                    className="text-gray-300 text-lg max-w-2xl mx-auto"
                    type="fade"
                    duration={0.3}
                    delay={1.0}
                    stagger={0.01}
                />
            </div>

            {/* Coming Soon */}
            <Card className="bg-background-alt border border-gray-700">
                <CardBody className="p-8 text-center">
                    <AnimatedText
                        text="Coming Soon"
                        className="text-2xl font-bold text-white mb-4"
                        type="typewriter"
                        duration={0.1}
                        delay={0.5}
                        stagger={0.05}
                    />
                    <p className="text-gray-300 mb-6">
                        Our affiliate program is currently under development. 
                        Stay tuned for exciting opportunities to earn rewards by referring players.
                    </p>
                </CardBody>
            </Card>
        </div>
    )
}

export default AffiliatesPage;