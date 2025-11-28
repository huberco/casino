'use client'

import React, { useState } from 'react'
import { Card, CardBody, Accordion, AccordionItem, Button, Input, Chip } from "@heroui/react"
import { FaQuestionCircle, FaSearch, FaWallet, FaGamepad, FaShieldAlt, FaCog, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa'
import AnimatedText from '@/components/AnimatedText'

const FaqPage = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')

    const categories = [
        { id: 'all', label: 'All Questions', icon: <FaQuestionCircle /> },
        { id: 'getting-started', label: 'Getting Started', icon: <FaCog /> },
        { id: 'deposits-withdrawals', label: 'Deposits & Withdrawals', icon: <FaWallet /> },
        { id: 'games', label: 'Games', icon: <FaGamepad /> },
        { id: 'security', label: 'Security & Fairness', icon: <FaShieldAlt /> },
        { id: 'troubleshooting', label: 'Troubleshooting', icon: <FaExclamationTriangle /> }
    ]

    const faqData = [
        // Getting Started
        {
            id: 'what-is-spinx',
            category: 'getting-started',
            question: 'What is SpinX Games?',
            answer: 'SpinX Games is a provably fair online gaming platform that offers various casino-style games using cryptocurrency. Our platform uses blockchain technology to ensure transparency and fairness in all game outcomes.'
        },
        {
            id: 'how-to-register',
            category: 'getting-started',
            question: 'How do I create an account?',
            answer: 'Creating an account is simple! Just visit our homepage and click "Sign Up". You&apos;ll need to provide a valid email address and create a secure password. No personal documents are required for basic gameplay.'
        },
        {
            id: 'age-requirement',
            category: 'getting-started',
            question: 'What is the minimum age requirement?',
            answer: 'You must be at least 18 years old to use SpinX Games. By creating an account, you confirm that you meet this age requirement and are legally allowed to participate in online gaming in your jurisdiction.'
        },
        {
            id: 'supported-countries',
            category: 'getting-started',
            question: 'Which countries are supported?',
            answer: 'SpinX Games is available in most countries where online gaming is legal. However, we do not provide services to residents of certain restricted jurisdictions. Please check our Terms of Service for the complete list of restricted countries.'
        },

        // Deposits & Withdrawals
        {
            id: 'how-to-deposit',
            category: 'deposits-withdrawals',
            question: 'How do I deposit funds?',
            answer: 'To deposit funds, go to your Account > Wallet page and click the "Deposit" button. Select your preferred cryptocurrency and chain, then follow the instructions to generate a wallet address. Send your funds to the provided address and wait for blockchain confirmation.'
        },
        {
            id: 'supported-cryptocurrencies',
            category: 'deposits-withdrawals',
            question: 'Which cryptocurrencies are supported?',
            answer: 'We currently support USDT (Tether) on multiple blockchain networks including Ethereum, BNB Smart Chain, and Tron. We plan to add more cryptocurrencies and chains in the future based on user demand.'
        },
        {
            id: 'minimum-deposit',
            category: 'deposits-withdrawals',
            question: 'What is the minimum deposit amount?',
            answer: 'Minimum deposit amounts vary by cryptocurrency and network. Generally, the minimum is set to cover network fees plus a small buffer. Check the deposit page for current minimum amounts for each supported cryptocurrency.'
        },
        {
            id: 'deposit-time',
            category: 'deposits-withdrawals',
            question: 'How long do deposits take?',
            answer: 'Deposit times depend on the blockchain network you&apos;re using. Most deposits are credited within 10-30 minutes after blockchain confirmation. During network congestion, it may take longer. You can track your deposit status in your wallet page.'
        },
        {
            id: 'how-to-withdraw',
            category: 'deposits-withdrawals',
            question: 'How do I withdraw my winnings?',
            answer: 'To withdraw funds, go to your Account > Wallet page and click the "Withdraw" button. Enter the amount you want to withdraw, provide the destination address, and complete any required verification steps. Withdrawals are processed automatically.'
        },
        {
            id: 'withdrawal-time',
            category: 'deposits-withdrawals',
            question: 'How long do withdrawals take?',
            answer: 'Most withdrawals are processed within 10-30 minutes. However, processing times can vary based on network congestion and the specific blockchain you&apos;re using. You can track your withdrawal status in your transaction history.'
        },
        {
            id: 'withdrawal-fees',
            category: 'deposits-withdrawals',
            question: 'Are there withdrawal fees?',
            answer: 'Yes, withdrawal fees apply to cover blockchain network costs. Fees vary by cryptocurrency and network. The exact fee amount is displayed before you confirm your withdrawal. Fees are deducted from your withdrawal amount.'
        },

        // Games
        {
            id: 'what-games-available',
            category: 'games',
            question: 'What games are available?',
            answer: 'We currently offer four main games: Roulette (bet on heads, tails, or crown), Crash (cash out before the multiplier crashes), Mine (navigate a minefield to collect treasures), and Coinflip (simple 50/50 chance game). More games are planned for the future.'
        },
        {
            id: 'how-roulette-works',
            category: 'games',
            question: 'How does Roulette work?',
            answer: 'In Roulette, you can bet on heads (2X payout), tails (2X payout), or crown (10X payout). The game uses 37 slots with 18 heads, 18 tails, and 1 crown. Players have 20 seconds to place bets, then a random result is generated using provably fair technology.'
        },
        {
            id: 'how-crash-works',
            category: 'games',
            question: 'How does Crash work?',
            answer: 'Crash is a multiplier game where you place a bet and watch the multiplier rise. You can cash out at any time before it crashes. The longer you wait, the higher your potential payout, but the higher the risk of losing everything.'
        },
        {
            id: 'how-mine-works',
            category: 'games',
            question: 'How does Mine work?',
            answer: 'In Mine, you navigate through a grid to collect treasures while avoiding mines. You can choose how many mines to place (more mines = higher payouts). The game ends when you hit a mine or choose to cash out with your collected treasures.'
        },
        {
            id: 'how-coinflip-works',
            category: 'games',
            question: 'How does Coinflip work?',
            answer: 'Coinflip is a simple 50/50 chance game. You bet on either heads or tails, and if you win, you double your bet. It&apos;s the simplest game on our platform with instant results.'
        },
        {
            id: 'provably-fair',
            category: 'games',
            question: 'What does "provably fair" mean?',
            answer: 'Provably fair means that all game outcomes are verifiable and cannot be manipulated. We use cryptographic methods (server seeds, client seeds, and game IDs) to generate random results that you can verify yourself using our verification tools.'
        },

        // Security & Fairness
        {
            id: 'is-platform-secure',
            category: 'security',
            question: 'Is the platform secure?',
            answer: 'Yes, we implement industry-standard security measures including encryption, secure authentication, and cold storage for funds. Your personal information is protected and never shared with third parties without your consent.'
        },
        {
            id: 'how-to-verify-fairness',
            category: 'security',
            question: 'How can I verify game fairness?',
            answer: 'You can verify any game result using our provably fair verification tools. Each game provides a server seed hash before the game starts and reveals the actual seed after. You can use these to verify that the result was generated fairly.'
        },
        {
            id: 'account-security',
            category: 'security',
            question: 'How do I keep my account secure?',
            answer: 'Use a strong, unique password and enable two-factor authentication if available. Never share your account credentials with anyone. Be cautious of phishing attempts and only access our platform through official channels.'
        },
        {
            id: 'fund-security',
            category: 'security',
            question: 'Are my funds safe?',
            answer: 'Yes, we use cold storage for the majority of user funds, keeping only a small amount in hot wallets for daily operations. This significantly reduces the risk of theft. Additionally, we implement multiple security layers to protect user assets.'
        },

        // Troubleshooting
        {
            id: 'game-not-loading',
            category: 'troubleshooting',
            question: 'What if a game doesn&apos;t load?',
            answer: 'Try refreshing the page or clearing your browser cache. If the problem persists, check your internet connection and try using a different browser. If issues continue, contact our support team with details about the problem.'
        },
        {
            id: 'deposit-not-credited',
            category: 'troubleshooting',
            question: 'My deposit hasn&apos;t been credited yet',
            answer: 'First, check if your transaction has been confirmed on the blockchain. Deposits require blockchain confirmation before being credited. If your transaction is confirmed but not credited after 30 minutes, contact support with your transaction hash.'
        },
        {
            id: 'withdrawal-delayed',
            category: 'troubleshooting',
            question: 'My withdrawal is taking longer than expected',
            answer: 'Withdrawals can be delayed due to network congestion or high transaction volumes. Check the blockchain explorer for your transaction status. If it&apos;s been more than 2 hours, contact support with your withdrawal details.'
        },
        {
            id: 'forgot-password',
            category: 'troubleshooting',
            question: 'I forgot my password',
            answer: 'Click "Forgot Password" on the login page and enter your email address. We&apos;ll send you a password reset link. If you don&apos;t receive the email, check your spam folder or contact support for assistance.'
        },
        {
            id: 'account-locked',
            category: 'troubleshooting',
            question: 'My account is locked or suspended',
            answer: 'Account suspensions usually occur due to security concerns or policy violations. Contact our support team immediately to understand the reason and resolve the issue. We&apos;ll work with you to restore access when appropriate.'
        },
        {
            id: 'mobile-issues',
            category: 'troubleshooting',
            question: 'I&apos;m having issues on mobile',
            answer: 'Our platform is fully responsive and works on mobile devices. If you&apos;re experiencing issues, try clearing your browser cache, updating your browser, or using a different browser. Some features may work better on desktop.'
        }
    ]

    const filteredFaqs = faqData.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const getCategoryIcon = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId)
        return category ? category.icon : <FaQuestionCircle />
    }

    const getCategoryColor = (categoryId: string): "primary" | "default" | "secondary" | "success" | "warning" | "danger" => {
        const colors: Record<string, "primary" | "default" | "secondary" | "success" | "warning" | "danger"> = {
            'getting-started': 'default',
            'deposits-withdrawals': 'primary',
            'games': 'secondary',
            'security': 'success',
            'troubleshooting': 'warning'
        }
        return colors[categoryId] || 'default'
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaQuestionCircle className="text-4xl -mt-2" />
          <AnimatedText
            text="Frequently Asked Questions"
            className="text-4xl font-bold text-white"
            type="typewriter"
            duration={0.1}
            delay={0.3}
            stagger={0.05}
          />
        </div>
        <AnimatedText
          text="Find answers to common questions about SpinX Games. Can&apos;t find what you&apos;re looking for? Contact our support team."
          className="text-gray-300 text-lg max-w-2xl mx-auto"
          type="fade"
          duration={0.3}
          delay={1.0}
          stagger={0.01}
        />
      </div>

            {/* Search and Filter */}
            <div className="space-y-6">
                {/* Search Bar */}
                <Card className="bg-background-alt border border-gray-700">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-4">
                            <FaSearch className="text-gray-400 text-xl" />
                            <Input
                                placeholder="Search FAQ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                classNames={{
                                    input: "text-white",
                                    inputWrapper: "bg-background border-gray-600"
                                }}
                                className="flex-1"
                            />
                        </div>
                    </CardBody>
                </Card>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                        <Chip
                            key={category.id}
                            startContent={category.icon}
                            variant={selectedCategory === category.id ? "solid" : "bordered"}
                            color={selectedCategory === category.id ? "primary" : "default"}
                            className={`cursor-pointer ${selectedCategory === category.id ? "bg-primary text-background" : "bg-background-alt"}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            {category.label}
                        </Chip>
                    ))}
                </div>
            </div>

            {/* Results Count */}
            <div className="text-center">
                <p className="text-gray-400">
                    Showing {filteredFaqs.length} of {faqData.length} questions
                    {searchTerm && ` for "${searchTerm}"`}
                    {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
                </p>
            </div>

            {/* FAQ Accordion */}
            <Card className="bg-background-alt border border-gray-700">
                <CardBody className="p-6">
                    {filteredFaqs.length > 0 ? (
                        <Accordion variant="splitted" className="px-0">
                            {filteredFaqs.map((faq) => (
                                <AccordionItem
                                    key={faq.id}
                                    title={
                                        <div className="flex items-center gap-3">
                                            {getCategoryIcon(faq.category)}
                                            <span className="text-white font-semibold">{faq.question}</span>
                                            <Chip
                                                size="sm"
                                                color={getCategoryColor(faq.category)}
                                                variant="flat"
                                                className="ml-auto"
                                            >
                                                {categories.find(c => c.id === faq.category)?.label}
                                            </Chip>
                                        </div>
                                    }
                                    className="text-white"
                                    classNames={{
                                        title: "text-white",
                                        content: "text-gray-300"
                                    }}
                                >
                                    <div className="space-y-3">
                                        <p>{faq.answer}</p>
                                        {faq.category === 'security' && (
                                            <div className="flex items-center gap-2 text-green-400 text-sm">
                                                <FaCheckCircle />
                                                <span>Verified secure</span>
                                            </div>
                                        )}
                                    </div>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center py-12">
                            <FaQuestionCircle className="text-6xl text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                            <p className="text-gray-400 mb-6">
                                We couldn&apos;t find any questions matching your search criteria.
                            </p>
                            <div className="space-y-2">
                                <Button
                                    color="primary"
                                    variant="bordered"
                                    onPress={() => {
                                        setSearchTerm('')
                                        setSelectedCategory('all')
                                    }}
                                >
                                    Clear Filters
                                </Button>
                                <div className="text-sm text-gray-500">
                                    or <a href="/official/support" className="text-blue-400 hover:text-blue-300">contact support</a>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Quick Help Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-background-alt border border-gray-700">
                    <CardBody className="p-6 text-center">
                        <FaWallet className="text-3xl text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Need Help with Payments?</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Questions about deposits, withdrawals, or cryptocurrency?
                        </p>
                        <Button
                            color="primary"
                            variant="bordered"
                            size="sm"
                            onPress={() => setSelectedCategory('deposits-withdrawals')}
                        >
                            View Payment FAQ
                        </Button>
                    </CardBody>
                </Card>

                <Card className="bg-background-alt border border-gray-700">
                    <CardBody className="p-6 text-center">
                        <FaGamepad className="text-3xl text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Game Questions?</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Learn how to play our games and understand the rules.
                        </p>
                        <Button
                            color="secondary"
                            variant="bordered"
                            size="sm"
                            onPress={() => setSelectedCategory('games')}
                        >
                            View Game FAQ
                        </Button>
                    </CardBody>
                </Card>

                <Card className="bg-background-alt border border-gray-700">
                    <CardBody className="p-6 text-center">
                        <FaShieldAlt className="text-3xl text-purple-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Security Concerns?</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Learn about our security measures and provably fair system.
                        </p>
                        <Button
                            color="success"
                            variant="bordered"
                            size="sm"
                            onPress={() => setSelectedCategory('security')}
                        >
                            View Security FAQ
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}

export default FaqPage