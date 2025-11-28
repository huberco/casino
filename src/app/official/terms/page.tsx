'use client'

import React from 'react'
import { Card, CardBody, Divider } from "@heroui/react"
import { FaGavel, FaShieldAlt, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'
import AnimatedText from '@/components/AnimatedText'

const TermsOfServicePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FaGavel className="text-3xl text-blue-500" />
          <AnimatedText
            text="Terms of Service"
            className="text-4xl font-bold text-white"
            type="typewriter"
            duration={0.1}
            delay={0.3}
            stagger={0.08}
          />
        </div>
        <AnimatedText
          text={`Last updated: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`}
          className="text-gray-300 text-lg"
          type="fade"
          duration={0.3}
          delay={1.0}
          stagger={0.01}
        />
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-blue-400 mt-1" />
            <AnimatedText
              text="By using SpinX Games, you agree to be bound by these Terms of Service. Please read them carefully before using our platform."
              className="text-blue-200 text-sm"
              type="fade"
              duration={0.3}
              delay={1.5}
              stagger={0.01}
            />
          </div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="space-y-8">
        {/* 1. Acceptance of Terms */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using SpinX Games (&quot;the Platform&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p className="text-gray-300">
              These Terms of Service constitute a legally binding agreement between you and SpinX Games. Your continued use of the Platform constitutes acceptance of any modifications to these terms.
            </p>
          </CardBody>
        </Card>

        {/* 2. Description of Service */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-4">
              SpinX Games is an online gaming platform that offers provably fair casino-style games including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Roulette games with cryptocurrency betting</li>
              <li>Crash multiplier games</li>
              <li>Mine field navigation games</li>
              <li>Coin flip games</li>
              <li>Other games as may be added from time to time</li>
            </ul>
            <p className="text-gray-300 mt-4">
              All games use provably fair technology to ensure transparency and fairness in outcomes.
            </p>
          </CardBody>
        </Card>

        {/* 3. User Eligibility */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Eligibility</h2>
            <div className="space-y-4">
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-400 mt-1" />
                  <div>
                    <h3 className="text-yellow-200 font-semibold mb-2">Age Requirements</h3>
                    <p className="text-yellow-200 text-sm">
                      You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use this service. 
                      By using the Platform, you represent and warrant that you meet this age requirement.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300">
                You are not eligible to use the Platform if:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>You are under 18 years of age</li>
                <li>You are located in a jurisdiction where online gambling is prohibited</li>
                <li>You have been previously banned from the Platform</li>
                <li>You are using the service on behalf of someone else without authorization</li>
                <li>You are a resident of a restricted jurisdiction</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* 4. Account Registration */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">4. Account Registration</h2>
            <p className="text-gray-300 mb-4">
              To use certain features of the Platform, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information to keep it accurate</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
            </p>
          </CardBody>
        </Card>

        {/* 5. Deposits and Withdrawals */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">5. Deposits and Withdrawals</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Deposits</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>All deposits must be made using supported cryptocurrencies</li>
                  <li>Minimum deposit amounts apply and may vary by cryptocurrency</li>
                  <li>Deposits are credited to your account after blockchain confirmation</li>
                  <li>We are not responsible for delays in blockchain processing</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Withdrawals</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Withdrawals are processed to the same address used for deposits when possible</li>
                  <li>Minimum withdrawal amounts apply and may vary by cryptocurrency</li>
                  <li>Withdrawal fees may apply and are deducted from the withdrawal amount</li>
                  <li>We reserve the right to request additional verification for withdrawals</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 6. Gaming Rules */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">6. Gaming Rules</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Fair Play</h3>
                <p className="text-gray-300 mb-2">
                  All games use provably fair technology. You can verify the fairness of any game result using the provided tools.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Prohibited Activities</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Using automated software or bots to play games</li>
                  <li>Attempting to manipulate or exploit game outcomes</li>
                  <li>Creating multiple accounts to circumvent limits</li>
                  <li>Sharing account credentials with others</li>
                  <li>Using the service for money laundering or illegal activities</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Game Outcomes</h3>
                <p className="text-gray-300">
                  All game outcomes are final and cannot be reversed except in cases of technical errors or system malfunctions as determined by us.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 7. Privacy and Security */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">7. Privacy and Security</h2>
            <div className="flex items-start gap-3 mb-4">
              <FaShieldAlt className="text-green-400 mt-1" />
              <div>
                <h3 className="text-green-200 font-semibold mb-2">Data Protection</h3>
                <p className="text-green-200 text-sm">
                  We implement industry-standard security measures to protect your personal information and funds.
                </p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our service.
            </p>
            
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>We collect only necessary information to provide our services</li>
              <li>Your personal information is never sold to third parties</li>
              <li>We use encryption to protect sensitive data</li>
              <li>We may share information only as required by law or to protect our rights</li>
            </ul>
          </CardBody>
        </Card>

        {/* 8. Limitation of Liability */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-red-400 mt-1" />
                <div>
                  <h3 className="text-red-200 font-semibold mb-2">Important Notice</h3>
                  <p className="text-red-200 text-sm">
                    Please read this section carefully as it limits our liability to you.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">
              To the maximum extent permitted by law, SpinX Games shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Loss of profits, data, or other intangible losses</li>
              <li>Damages resulting from your use or inability to use the service</li>
              <li>Unauthorized access to or alteration of your data</li>
              <li>Third-party conduct or content on the service</li>
              <li>Any other matter relating to the service</li>
            </ul>
          </CardBody>
        </Card>

        {/* 9. Termination */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
            <p className="text-gray-300 mb-4">
              Either party may terminate this agreement at any time. We may terminate or suspend your account immediately, without prior notice, for any reason, including if you breach these Terms of Service.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Upon Termination</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Your right to use the service will cease immediately</li>
                  <li>We may delete your account and all associated data</li>
                  <li>Outstanding balances will be processed according to our withdrawal policy</li>
                  <li>Provisions that by their nature should survive termination will remain in effect</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 10. Changes to Terms */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by:
            </p>
            
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Posting the updated terms on our website</li>
              <li>Sending email notifications to registered users</li>
              <li>Displaying notices within the application</li>
            </ul>
            
            <p className="text-gray-300 mt-4">
              Your continued use of the service after such modifications constitutes acceptance of the updated terms.
            </p>
          </CardBody>
        </Card>

        {/* 11. Governing Law */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
            <p className="text-gray-300 mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
            </p>
            
            <p className="text-gray-300">
              Any disputes arising from these terms or your use of the service shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization].
            </p>
          </CardBody>
        </Card>

        {/* 12. Contact Information */}
        <Card className="bg-background-alt border border-gray-700">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">12. Contact Information</h2>
            <p className="text-gray-300 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            
            <div className="space-y-2 text-gray-300">
              <p><strong>Email:</strong> legal@spinx.com</p>
              <p><strong>Support:</strong> support@spinx.com</p>
              <p><strong>Website:</strong> <a href="/official/support" className="text-blue-400 hover:text-blue-300">Support Center</a></p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer Notice */}
      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-gray-300 text-sm">
            By using SpinX Games, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            This document was last updated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TermsOfServicePage
