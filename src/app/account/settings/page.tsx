"use client"
import PrimaryButton from "@/components/ui/PrimaryButton";
import { Accordion, AccordionItem, Avatar, Input, Select, SelectItem, Switch, Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { FaDesktop, FaLaptop, FaMobile, FaEye, FaEyeSlash, FaKey, FaCopy, FaRotateRight } from "react-icons/fa6";
import { useAuth } from "@/contexts/AuthContext";
import { gameApi } from "@/lib/api";
import supabase from "@/lib/supabase";

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [marketingUpdates, setMarketingUpdates] = useState(false);
  
  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Seed management state
  const [showSeed, setShowSeed] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedError, setSeedError] = useState("");
  const [seedSuccess, setSeedSuccess] = useState("");

  // Clear password fields
  const clearPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPasswordFields();
    };
  }, []);

  // Copy seed to clipboard
  const copySeedToClipboard = async () => {
    if (!user.profile?.seed) return;
    
    try {
      await navigator.clipboard.writeText(user.profile.seed);
      setSeedSuccess("Seed copied to clipboard!");
      setTimeout(() => setSeedSuccess(""), 3000);
    } catch (error) {
      setSeedError("Failed to copy seed to clipboard");
      setTimeout(() => setSeedError(""), 3000);
    }
  };

  // Regenerate seed
  const regenerateSeed = async () => {
    if (!user.isAuthenticated) {
      setSeedError("You must be logged in to regenerate your seed");
      return;
    }

    try {
      setSeedLoading(true);
      setSeedError("");
      setSeedSuccess("");

      const response = await gameApi.user.regenerateSeed();
      
      if (response.success) {
        setSeedSuccess("Seed regenerated successfully!");
        // Refresh the user profile to get the new seed
        await refreshProfile();
        setTimeout(() => setSeedSuccess(""), 5000);
      } else {
        setSeedError(response.error || "Failed to regenerate seed");
        setTimeout(() => setSeedError(""), 5000);
      }
      
    } catch (error) {
      setSeedError("Failed to regenerate seed. Please try again.");
      setTimeout(() => setSeedError(""), 5000);
    } finally {
      setSeedLoading(false);
    }
  };

  // Password update function
  const handlePasswordUpdate = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError("");
      setPasswordSuccess("");

      // Check if user is authenticated
      if (!user.isAuthenticated) {
        setPasswordError("You must be logged in to update your password");
        return;
      }

      // Check if user has a valid email
      if (!user.email) {
        setPasswordError("User email not found. Please contact support.");
        return;
      }

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError("All fields are required");
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long");
        return;
      }

      // Additional password strength validation
      if (newPassword.length < 8) {
        setPasswordError("For better security, password should be at least 8 characters long");
        return;
      }

      // Check for common weak patterns
      if (newPassword.toLowerCase() === 'password' || 
          newPassword.toLowerCase() === '123456' ||
          newPassword.toLowerCase() === 'qwerty') {
        setPasswordError("Please choose a stronger password");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match");
        return;
      }

      if (newPassword === currentPassword) {
        setPasswordError("New password must be different from current password");
        return;
      }

      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      console.log(signInError);

      if (signInError) {
        setPasswordError("Current password is incorrect");
        return;
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      // Success
      setPasswordSuccess("Password updated successfully!");
      clearPasswordFields();
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(""), 3000);
      
    } catch (error) {
      setPasswordError("An unexpected error occurred");
      console.error("Password update error:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-white">Settings</h1>

      {/* Account Settings */}
      <div className="bg-background-alt rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Account Settings</h2>
                 <p className="text-sm text-gray-400 mb-6">
           Update your account password. For security, you must enter your current password and choose a strong, unique password (minimum 8 characters).
         </p>
        <div className="flex flex-col gap-4">
          <div>
            <Input
              classNames={{
                inputWrapper: "bg-background"
              }}
              type={showPasswords.current ? "text" : "password"}
                             label="Current password"
               labelPlacement="outside"
               placeholder="********"
               value={currentPassword}
               onChange={(e) => setCurrentPassword(e.target.value)}
               endContent={
                 <Button
                   isIconOnly
                   variant="light"
                   size="sm"
                   onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                   className="text-gray-400 hover:text-white"
                 >
                   {showPasswords.current ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                 </Button>
               }
             />
             <p className="text-xs text-gray-400 mt-1">
               Enter your current password to verify your identity
             </p>
          </div>
          <div>
            <Input
              classNames={{
                inputWrapper: "bg-background"
              }}
              type={showPasswords.new ? "text" : "password"}
              label="New password"
              labelPlacement="outside"
              placeholder="********"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="text-gray-400 hover:text-white"
                >
                  {showPasswords.new ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </Button>
              }
            />
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs text-gray-400">Password strength:</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      let color = "bg-gray-600";
                      if (newPassword.length >= 6) color = "bg-yellow-500";
                      if (newPassword.length >= 8) color = "bg-orange-500";
                      if (newPassword.length >= 10) color = "bg-green-500";
                      if (newPassword.length >= 12) color = "bg-green-600";
                      
                      return (
                        <div
                          key={level}
                          className={`w-2 h-2 rounded-full ${color} transition-colors`}
                        />
                      );
                    })}
                  </div>
                </div>
                                 <p className="text-xs text-gray-400">
                   {newPassword.length < 6 && "Too short"}
                   {newPassword.length >= 6 && newPassword.length < 8 && "Too short (min 8)"}
                   {newPassword.length >= 8 && newPassword.length < 10 && "Fair"}
                   {newPassword.length >= 10 && newPassword.length < 12 && "Good"}
                   {newPassword.length >= 12 && "Strong"}
                 </p>
              </div>
            )}
          </div>
          <div>
            <Input
              classNames={{
                inputWrapper: "bg-background"
              }}
              type={showPasswords.confirm ? "text" : "password"}
              label="Confirm password"
              labelPlacement="outside"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              endContent={
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="text-gray-400 hover:text-white"
                >
                  {showPasswords.confirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </Button>
              }
            />
          </div>
        </div>
        
        {/* Error and Success Messages */}
        {passwordError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{passwordError}</p>
          </div>
        )}
        
        {passwordSuccess && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">{passwordSuccess}</p>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <PrimaryButton 
            onClick={handlePasswordUpdate}
            disabled={passwordLoading}
          >
            {passwordLoading ? "Updating..." : "Save Changes"}
          </PrimaryButton>
          
          <PrimaryButton
            onClick={clearPasswordFields}
            disabled={passwordLoading}
            className="border border-primary bg-background"
          >
            Reset
          </PrimaryButton>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-background-alt rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Email Notifications</h3>
              <p className="text-sm text-gray-400">Receive email updates about your account</p>
            </div>
            <Switch isSelected={emailNotifications} onValueChange={setEmailNotifications} isDisabled disabled={true}/>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-400">Receive push notifications about game results</p>
            </div>
            <Switch isSelected={pushNotifications} onValueChange={setPushNotifications} />
          </div>
          <div className="items-center justify-between hidden">
            <div>
              <h3 className="text-white font-medium">Marketing Updates</h3>
              <p className="text-sm text-gray-400">Receive updates about promotions and news</p>
            </div>
            <Switch isSelected={marketingUpdates} onValueChange={setMarketingUpdates} />
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-background-alt rounded-lg p-6 hidden">
        <h2 className="text-xl font-semibold text-white mb-6">Language & Token</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select className="max-w-xs" classNames={{
              trigger: "bg-background"
            }} label="Language" labelPlacement="outside">
              <SelectItem
                key="english"
                startContent={
                  <Avatar alt="English" className="w-6 h-6" src="https://flagcdn.com/gb.svg" />
                }
              >
                English
              </SelectItem>
              <SelectItem
                key="indonesia"
                startContent={
                  <Avatar alt="Indonesia" className="w-6 h-6" src="https://flagcdn.com/id.svg" />
                }
              >
                Indonesia
              </SelectItem>
              <SelectItem
                key="malaysia"
                startContent={<Avatar alt="Malaysia" className="w-6 h-6" src="https://flagcdn.com/ma.svg" />}
              >
                Malaysia
              </SelectItem>
            </Select>
          </div>
          <div>
            <Select
              classNames={{
                trigger: "bg-background"
              }}
              label="Token" labelPlacement="outside"
            >
              <SelectItem key="bn"
                startContent={
                  <Avatar alt="BNB" className="w-6 h-6" src="/assets/images/tokens/bnb.webp" />
                } >BNB</SelectItem>
              <SelectItem key="tether"
                startContent={
                  <Avatar alt="Tether" className="w-6 h-6" src="/assets/images/tokens/tether.webp" />
                } >Tether (USDT)</SelectItem>
            </Select>
          </div>
        </div>
        <div className="mt-6">
          <PrimaryButton>
            Save Preferences
          </PrimaryButton>
        </div>
      </div>

      {/* Provably Fair Gaming */}
      <div className="bg-background-alt rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Provably Fair Gaming</h2>
        <p className="text-sm text-gray-400 mb-6">
          Your personal seed is used for provably fair gaming. Keep it secure and don&apos;t share it with others.
        </p>
        
        <div className="space-y-4">
          {/* Seed Display */}
          <div>
            <label className="text-white font-medium mb-2 block">Your Gaming Seed</label>
            <div className="flex items-center gap-2">
              <Input
                classNames={{
                  inputWrapper: "bg-background"
                }}
                type={showSeed ? "text" : "password"}
                value={user.profile?.seed || "No seed available"}
                readOnly
                endContent={
                  <div className="flex items-center gap-1">
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => setShowSeed(!showSeed)}
                      className="text-gray-400 hover:text-white"
                    >
                      {showSeed ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </Button>
                    {user.profile?.seed && (
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={copySeedToClipboard}
                        className="text-gray-400 hover:text-white"
                      >
                        <FaCopy size={16} />
                      </Button>
                    )}
                  </div>
                }
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {user.profile?.seed 
                ? "This seed is used to ensure fair game results. Keep it private." 
                : "You don't have a seed yet. Generate one to start playing provably fair games."
              }
            </p>
          </div>

          {/* Seed Actions */}
          <div className="flex gap-3">
            <PrimaryButton
              onClick={regenerateSeed}
              disabled={seedLoading}
            >
              <div className="flex items-center gap-2">
                <FaRotateRight size={16} />
                {seedLoading ? "Regenerating..." : "Generate New Seed"}
              </div>
            </PrimaryButton>
          </div>

          {/* Seed Status Messages */}
          {seedError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{seedError}</p>
            </div>
          )}
          
          {seedSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">{seedSuccess}</p>
            </div>
          )}

          {/* Seed Information */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <FaKey size={16} />
              About Your Seed
            </h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Your seed is unique to your account and never changes unless you regenerate it</li>
              <li>• It&apos;s used to ensure all game results are provably fair and verifiable</li>
              <li>• You can verify game fairness using your seed and the game&apos;s server seed</li>
              <li>• Keep your seed private - sharing it could compromise game fairness</li>
              <li>• If you suspect your seed is compromised, regenerate a new one</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-background-alt rounded-lg p-6 hidden">
        <h2 className="text-xl font-semibold text-white mb-6">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <PrimaryButton>
              Enable
            </PrimaryButton>
          </div>
          <div className="flex items-center justify-between">
            <Accordion selectionMode="multiple">
              <AccordionItem
                key="1"
                aria-label="Login History"
                subtitle="2 Devices"
                title="Login History"
              >
                <ul className="flex flex-col gap-2">
                  <li>
                    <div className="flex items-center gap-2 justify-between bg-background rounded-lg px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FaMobile size={32} className="text-primary" />
                        <p className="text-white font-medium">Asas TH53244H43119</p>
                      </div>
                      <div className="text-end text-sm flex flex-col gap-1 text-white/50">
                        <p className="font-medium">IP: <span className="text-gray-400">127.0.0.1</span></p>
                        <p className="font-medium">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center gap-2 justify-between bg-background rounded-lg px-6 py-3">
                      <div className="flex items-center gap-2">
                        <FaDesktop size={32} className="text-primary" />
                        <p className="text-white font-medium">Asas TH53244H43119</p>
                      </div>
                      <div className="text-end text-sm flex flex-col gap-1 text-white/50">
                        <p className="font-medium">IP: <span className="text-gray-400">127.0.0.1</span></p>
                        <p className="font-medium">{new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </AccordionItem>
            </Accordion>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Session Timeout</h3>
              <p className="text-sm text-gray-400">Automatically log out after inactivity</p>
            </div>
            <PrimaryButton>
              30 minutes
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div >
  );
}
