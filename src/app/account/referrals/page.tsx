import { Button } from "@heroui/react";
import { FaEnvelope, FaFacebook, FaSquareEnvelope, FaSquareFacebook, FaSquareXTwitter, FaXTwitter } from "react-icons/fa6";

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-white">Referrals</h1>

      <div className="grid grid-cols-1  lg:grid-cols-3 gap-6">
        {/* Referral Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-background-alt rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Referral Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Referrals</span>
                <span className="text-2xl font-bold text-white">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Miners</span>
                <span className="text-2xl font-bold text-white">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Earnings</span>
                <span className="text-2xl font-bold text-primary">0.042 BNB</span>
              </div>
            </div>
          </div>

          {/* Invite Friends */}
          <div className="bg-background-alt rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Invite Friends</h2>
            <p className="text-gray-300 text-sm mb-4">
              Invite your friends to join Spinx and earn rewards when they start mining.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Personal Invite Link
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value="https://spinx.io/invite/cryptoking42"
                  readOnly
                  className="min-w-0 flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="bg-primary text-background px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                  Copy
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Share Options</h3>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1 bg-primary px-3 py-2 rounded-lg text-center items-center flex gap-2 transition-colors text-sm">
                  <FaEnvelope size={20} className="text-background-alt shrink-0" />
                </Button>
                <Button className="flex-1 bg-primary px-3 py-2 rounded-lg text-center items-center flex gap-2 transition-colors text-sm">
                  <FaXTwitter size={20} className="text-background-alt shrink-0" />
                </Button>
                <Button className="flex-1 bg-primary px-3 py-2 rounded-lg text-center items-center flex gap-2 transition-colors text-sm">
                  <FaFacebook size={20} className="text-background-alt shrink-0" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-primary bg-gray-600 border-gray-500 rounded focus:ring-primary focus:ring-2"
              />
              <div>
                <p className="text-white text-sm font-medium">Earn rewards together</p>
                <p className="text-gray-400 text-xs">
                  You will get 5% of your friends mining rewards for the first 3 months.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        <div className="lg:col-span-2">
          <div className="bg-background-alt rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Referrals</h2>
            <div className="space-y-4">
              {/* Referral Item 1 */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">alex943</h3>
                    <p className="text-gray-400 text-sm">2 days ago</p>
                  </div>
                </div>
                <span className="bg-primary text-background px-3 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>

              {/* Referral Item 2 */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">cryptofan22</h3>
                    <p className="text-gray-400 text-sm">5 days ago</p>
                  </div>
                </div>
                <span className="bg-primary text-background px-3 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>

              {/* Referral Item 3 */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">miner_jane</h3>
                    <p className="text-gray-400 text-sm">1 week ago</p>
                  </div>
                </div>
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Pending
                </span>
              </div>

              {/* Referral Item 4 */}
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">btc_master</h3>
                    <p className="text-gray-400 text-sm">2 weeks ago</p>
                  </div>
                </div>
                <span className="bg-primary text-background px-3 py-1 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
