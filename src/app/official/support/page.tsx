'use client'

import React, { useState } from 'react'
import { Card, CardBody, Button, Input, Textarea, Accordion, AccordionItem, Link } from "@heroui/react"
import { FaQuestionCircle, FaEnvelope, FaDiscord, FaTelegram, FaTwitter, FaGithub, FaClock, FaShieldAlt, FaGamepad, FaCoins, FaWallet, FaExclamationTriangle } from 'react-icons/fa'
import AnimatedText from '@/components/AnimatedText'

const SupportPage = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Contact form submitted:', contactForm)
    // Reset form
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  const faqItems = [
    {
      key: "1",
      title: "How do I deposit funds?",
      content: "To deposit funds, go to your Account > Wallet page and click the 'Deposit' button. Select your preferred cryptocurrency and chain, then follow the instructions to generate a wallet address and send your funds."
    },
    {
      key: "2", 
      title: "How do I withdraw my winnings?",
      content: "To withdraw funds, go to your Account > Wallet page and click the 'Withdraw' button. Enter the amount you want to withdraw, provide the destination address, and complete the withdrawal process."
    },
    {
      key: "3",
      title: "What cryptocurrencies are supported?",
      content: "We currently support USDT on multiple chains including Ethereum, BNB Smart Chain, and Tron. More cryptocurrencies and chains will be added in the future."
    },
    {
      key: "4",
      title: "How do the games work?",
      content: "Our games use provably fair technology with server seeds and client seeds to ensure transparency. Each game result is verifiable and cannot be manipulated. Check the 'Fair Play' page for more details."
    },
    {
      key: "5",
      title: "What is the minimum deposit/withdrawal amount?",
      content: "Minimum deposit and withdrawal amounts vary by cryptocurrency. Check the deposit/withdrawal page for current limits. Generally, minimum amounts are set to cover network fees."
    },
    {
      key: "6",
      title: "How long do withdrawals take?",
      content: "Withdrawal processing times depend on the blockchain network. Most withdrawals are processed within 10-30 minutes, but can take longer during network congestion."
    },
    {
      key: "7",
      title: "Is my account secure?",
      content: "Yes, we use industry-standard security measures including encryption, secure authentication, and cold storage for funds. Your personal information is protected and never shared with third parties."
    },
    {
      key: "8",
      title: "Can I play on mobile?",
      content: "Yes, our platform is fully responsive and works on all devices including mobile phones and tablets. You can access all features through your mobile browser."
    }
  ]

  const supportCategories = [
    {
      icon: <FaWallet className="text-2xl text-blue-500" />,
      title: "Deposits & Withdrawals",
      description: "Help with funding your account and withdrawing winnings",
      topics: ["Deposit issues", "Withdrawal delays", "Minimum amounts", "Network fees"]
    },
    {
      icon: <FaGamepad className="text-2xl text-green-500" />,
      title: "Game Issues",
      description: "Problems with games, fairness, or gameplay",
      topics: ["Game not loading", "Fair play verification", "Game rules", "Technical issues"]
    },
    {
      icon: <FaShieldAlt className="text-2xl text-purple-500" />,
      title: "Account & Security",
      description: "Account management and security concerns",
      topics: ["Login issues", "Password reset", "Account verification", "Security questions"]
    },
    {
      icon: <FaCoins className="text-2xl text-yellow-500" />,
      title: "Rewards & Bonuses",
      description: "Questions about rewards, bonuses, and promotions",
      topics: ["Reward claims", "Bonus eligibility", "Promotional codes", "Loyalty program"]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <AnimatedText
          text="Support Center"
          className="text-4xl font-bold text-white"
          type="typewriter"
          duration={0.1}
          delay={0.3}
          stagger={0.08}
        />
        <AnimatedText
          text="Get help with your account, games, deposits, withdrawals, and more. Our support team is here to assist you 24/7."
          className="text-gray-300 text-lg max-w-2xl mx-auto"
          type="fade"
          duration={0.3}
          delay={1.0}
          stagger={0.01}
        />
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supportCategories.map((category, index) => (
          <Card key={index} className="bg-background-alt border border-gray-700 hover:border-gray-600 transition-colors">
            <CardBody className="p-6 text-center space-y-4">
              {category.icon}
              <h3 className="text-lg font-semibold text-white">{category.title}</h3>
              <p className="text-gray-400 text-sm">{category.description}</p>
              <div className="space-y-1">
                {category.topics.map((topic, topicIndex) => (
                  <div key={topicIndex} className="text-xs text-gray-500">• {topic}</div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaEnvelope className="text-2xl text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Contact Us</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-background border-gray-600"
                  }}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  value={contactForm.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  classNames={{
                    input: "text-white",
                    inputWrapper: "bg-background border-gray-600"
                  }}
                />
              </div>
              
              <Input
                label="Subject"
                placeholder="What can we help you with?"
                value={contactForm.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-background border-gray-600"
                }}
              />
              
              <Textarea
                label="Message"
                placeholder="Describe your issue or question in detail..."
                value={contactForm.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                minRows={4}
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-background border-gray-600"
                }}
              />
              
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isDisabled={!contactForm.name || !contactForm.email || !contactForm.message}
              >
                Send Message
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Contact Information */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <FaClock className="text-xl text-green-500" />
                <div>
                  <h3 className="text-white font-semibold">Response Time</h3>
                  <p className="text-gray-400">Usually within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <FaEnvelope className="text-xl text-blue-500" />
                <div>
                  <h3 className="text-white font-semibold">Email Support</h3>
                  <p className="text-gray-400">support@spinx.com</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Community Channels</h3>
                <div className="flex gap-4">
                  <Link href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <FaDiscord className="text-xl" />
                    <span>Discord</span>
                  </Link>
                  <Link href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <FaTelegram className="text-xl" />
                    <span>Telegram</span>
                  </Link>
                  <Link href="#" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <FaTwitter className="text-xl" />
                    <span>Twitter</span>
                  </Link>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="bg-background-alt border border-gray-700">
        <CardBody className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <FaQuestionCircle className="text-2xl text-yellow-500" />
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>
          
          <Accordion variant="splitted" className="px-0">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.key}
                title={item.title}
                className="text-white"
                classNames={{
                  title: "text-white",
                  content: "text-gray-300"
                }}
              >
                {item.content}
              </AccordionItem>
            ))}
          </Accordion>
        </CardBody>
      </Card>

      {/* Emergency Notice */}
      <Card className="bg-red-900/20 border border-red-500">
        <CardBody className="p-6">
          <div className="flex items-start gap-4">
            <FaExclamationTriangle className="text-2xl text-red-500 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Emergency Support</h3>
              <p className="text-gray-300 mb-4">
                If you&lsquo;re experiencing urgent issues with your account security or suspect unauthorized access, 
                please join our Discord server and create a ticket in the #support channel.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

    </div>
  )
}

export default SupportPage