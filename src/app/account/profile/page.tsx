'use client'

import PrimaryButton from '@/components/ui/PrimaryButton'
import { useAuth } from '@/contexts/AuthContext'
import { useModal, useModalType } from '@/contexts/modalContext'
import { gameApi } from '@/lib/api'
import supabase from '@/lib/supabase'
import { addToast, Avatar, Input, Textarea } from '@heroui/react'
import { useState, useEffect, useRef } from 'react'
import { FaEdit } from 'react-icons/fa'
import { FaCheck, FaCircleCheck, FaScreenpal } from 'react-icons/fa6'
import SocketStatus from '@/components/SocketStatus'
import AuthStatus from '@/components/AuthStatus'

export default function ProfilePage() {
  const { user, refreshProfile, updateUser } = useAuth()
  const { showModal, hideModal } = useModal()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    bio: ''
  })
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(user?.profile?.avatar ?? "/assets/images/avatar/default.png");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is a MetaMask wallet user
  const isWalletUser = user.profile?.walletAddress && !user.profile?.supabaseId
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        addToast({
          title: 'Please select an image file',
          color: 'danger'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        addToast({
          title: 'File size must be less than 5MB',
          color: 'danger'
        });
        return;
      }

      // Clean up previous preview URL if it exists
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }

      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadFile = async () => {
    try {
      if (!file) {
        addToast({
          title: 'No file selected',
          color: 'danger'
        });
        return;
      }
      setLoading(true);
      const data = new FormData();
      data.set("file", file);

      const uploadRequest = await gameApi.user.uploadAvatar(data);
      console.log('🔄 Upload request:', uploadRequest)
      if (uploadRequest.success && uploadRequest.data) {
        // Update the user context with new data
        updateUser(uploadRequest.data);

        // Update the preview to show the new avatar
        if (uploadRequest.data.avatar) {
          setPreview(uploadRequest.data.avatar);
        }

        // Clear the file selection
        setFile(null);
        showModal('success', {
          title: "Avatar Updated!",
          message: "Your profile picture has been updated successfully.",
          duration: 3000,
          onClose: () => {
            hideModal()
          }
        })
      } else {
        throw new Error(uploadRequest.error || 'Failed to update avatar');
      }
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.profile) {
      setFormData({
        displayName: user.profile.displayName || user.profile.username || user.profile.name || '',
        email: user.profile.email || '',
        bio: user.profile.bio || ''
      })

      // Update preview when user avatar changes
      if (user.profile.avatar) {
        setPreview(user.profile.avatar);
      }

      // Show notification for MetaMask users without email
      const isWalletUser = user.profile.walletAddress && !user.profile.supabaseId
      if (isWalletUser && !user.profile.email) {
        addToast({
          title: '🦊 Welcome MetaMask User!',
          description: 'Please add your email and complete your profile to get notifications and updates.',
          color: 'warning'
        })
      }
    }
    // else {
    //   refreshProfile()
    // }
  }, [user.profile])

  // Cleanup effect to revoke object URLs
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  const handleSaveChanges = async () => {
    // Validate form data
    if (!formData.displayName.trim()) {
      showModal('error', {
        title: "Validation Error",
        message: "Display Name cannot be empty.",
        onClose: () => hideModal()
      })
      return
    }

    // Email validation - only validate if email is provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        showModal('error', {
          title: "Validation Error",
          message: "Please enter a valid email address.",
          onClose: () => hideModal()
        })
        return
      }
    } else if (!isWalletUser) {
      // Email is required for Supabase users but optional for wallet users
      showModal('error', {
        title: "Validation Error",
        message: "Email cannot be empty.",
        onClose: () => hideModal()
      })
      return
    }

    // Check if data has actually changed
    const hasChanges =
      formData.displayName.trim() !== (user.profile?.displayName || user.profile?.username || user.profile?.name || '') ||
      formData.email.trim() !== (user.profile?.email || '') ||
      formData.bio.trim() !== (user.profile?.bio || '')

    if (!hasChanges) {
      showModal('error', {
        title: "No Changes",
        message: "No changes were made to save.",
        onClose: () => hideModal()
      })
      return
    }

    try {
      setLoading(true)

      // Check if user is authenticated via Supabase or Wallet (MetaMask)
      if (isWalletUser) {
        console.log('🦊 MetaMask wallet user detected, updating backend profile directly...')
        
        // For wallet users, update backend profile directly (no Supabase)
        const updateResponse = await gameApi.user.updateProfile({
          username: formData.displayName,
          displayName: formData.displayName,
          email: formData.email,
          bio: formData.bio
        })

        if (!updateResponse.success) {
          throw new Error(updateResponse.error || 'Failed to update profile')
        }

        console.log('✅ Wallet user profile updated successfully:', updateResponse.data)

        // Update local user context
        if (updateResponse.data) {
          updateUser(updateResponse.data)
        }

        // Refresh profile
        await refreshProfile()

        // Show success modal
        showModal('success', {
          title: "Profile Updated!",
          message: "Your profile has been successfully updated.",
          duration: 3000,
          onClose: () => {
            hideModal()
            setIsEditing(false)
          }
        })
      } else {
        // Step 1: Update Supabase user metadata for Supabase users
        console.log('🔄 Step 1: Updating Supabase user metadata...')
        const { data: supabaseUser, error: supabaseError } = await supabase.auth.getUser()

        if (supabaseError) {
          throw new Error(`Failed to get current user: ${supabaseError.message}`)
        }

        if (!supabaseUser.user) {
          throw new Error('No authenticated user found')
        }

        console.log('✅ Current Supabase user:', supabaseUser.user.email)

        // Update Supabase user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          email: formData.email,
          data: {
            full_name: formData.displayName,
            display_name: formData.displayName,
            username: formData.displayName,
            bio: formData.bio
          }
        })

        if (updateError) {
          throw new Error(`Failed to update Supabase user: ${updateError.message}`)
        }

        console.log('✅ Supabase user metadata updated successfully')

        // Step 2: If Supabase update successful, update backend profile
        console.log('🔄 Step 2: Updating backend profile...')
        const updateResponse = await gameApi.user.updateProfile({
          username: formData.displayName,
          displayName: formData.displayName,
          email: formData.email,
          bio: formData.bio
        })

        if (!updateResponse.success) {
          throw new Error(updateResponse.error || 'Failed to update backend profile')
        }

        console.log('✅ Backend profile updated successfully:', updateResponse.data)

        // Step 3: Update local user context
        console.log('🔄 Step 3: Updating local user context...')
        if (updateResponse.data) {
          updateUser(updateResponse.data)
        }

        // Step 4: Refresh profile to get latest data
        console.log('🔄 Step 4: Refreshing profile...')
        await refreshProfile()

        console.log('✅ Profile update completed successfully!')

        // Step 5: Show success modal
        showModal('success', {
          title: "Profile Updated!",
          message: "Your profile has been successfully updated.",
          duration: 3000,
          onClose: () => {
            hideModal()
            setIsEditing(false)
          }
        })
      }

    } catch (error) {
      console.error('Failed to save changes:', error)

      // Show error modal
      showModal('error', {
        title: "Update Failed",
        message: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        onClose: () => hideModal()
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  if (user.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  if (!user.profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Profile not found</div>
      </div>
    )
  }



  const needsProfileCompletion = isWalletUser && (!user.profile?.email || !user.profile?.displayName)

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">Profile Information</h1>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* MetaMask User Notice */}
        {needsProfileCompletion && (
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🦊</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Complete Your Profile</h3>
                <p className="text-gray-300 mb-3">
                  You&apos;re logged in with MetaMask! To get the most out of SpinX, please add your email and display name.
                </p>
                <ul className="text-sm text-gray-400 space-y-1 mb-4">
                  <li>• Receive important notifications and updates</li>
                  <li>• Recover your account if needed</li>
                  <li>• Participate in exclusive events and promotions</li>
                </ul>
                {!isEditing && (
                  <PrimaryButton
                    onClick={() => setIsEditing(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Complete Profile Now
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Information Section */}
        <div className="bg-background-alt rounded-xl p-8 shadow-lg flex-col flex">

          <div className="flex flex-col xl:flex-row gap-8 w-full">
            {/* Left side - Avatar and basic info */}
            <div className="flex items-center lg:items-start space-y-4 gap-4">
              {/* User Avatar */}
              <div className="relative flex">
                <Avatar src={preview} alt={user.username} className='w-24 h-24 border border-primary' />
                <div className="absolute right-0 top-0 bg-black/50 z-10 p-1 rounded-md cursor-pointer hover:scale-105 active:scale-100 hover:bg-black/60 transition"
                  onClick={() => inputRef.current?.click()} >
                  <FaEdit className="text-primary" />
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                {file !== null && <div className="absolute rounded-b-full bottom-0 left-1/2 z-10 hover:scale-105 active:scale-100 cursor-pointer -translate-x-1/2 bg-primary/70 hover:bg-primary px-2 h-1/2 rounded-sm w-full content-center items-center flex justify-center text-center text-xs text-white/50 py-0.5"
                  onClick={() => uploadFile()}>
                  <FaCircleCheck size={30} className="text-xl font-bold text-background" />
                </div>}
              </div>
              {
                loading && <div className="z-50 absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-md">
                  <FaScreenpal size={30} className='text-white/30 animate-spin' />
                </div>
              }
              {/* User Details */}
              <div className="text-start lg:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {user?.profile?.displayName || user?.profile?.username || user?.profile?.name || 'SpinX User'}
                </h2>
                <h3>Level {user?.profile.level}</h3>
                <p className="text-gray-400 text-sm">
                  Member since {formatDate(user?.profile?.createdAt ?? new Date().toISOString())}
                </p>
                <p className="text-gray-400 text-xs hidden">
                  Last updated {formatDate(user?.profile?.updatedAt ?? new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Right side - Form fields */}
            <div className="flex-1 flex gap-4 flex-col">
              <div>
                <Input
                  classNames={{
                    inputWrapper: "bg-background",
                  }}
                  size='lg'
                  label="Display Name"
                  labelPlacement="outside"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  disabled={!isEditing}
                />

              </div>

              <div>
                <Input
                  classNames={{
                    inputWrapper: "bg-background",
                  }}
                  size='lg'
                  label="Email"
                  labelPlacement="outside"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />

              </div>

              <div>
                <Textarea
                  classNames={{
                    inputWrapper: "bg-background",
                  }}
                  size='lg'
                  label="Bio"
                  labelPlacement="outside"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

            </div>

          </div>
          {/* Action Buttons */}
          <div className="flex gap-4 items-end justify-end mt-4">
            {!isEditing ? (
              <PrimaryButton
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                Edit Profile
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </PrimaryButton>
                <PrimaryButton
                  onClick={() => {
                    setIsEditing(false)
                    // Reset form data to original values
                    if (user.profile) {
                      setFormData({
                        displayName: user.profile.displayName || user.profile.username || user.profile.name || '',
                        email: user.profile.email || '',
                        bio: user.profile.bio || ''
                      })
                    }
                  }}
                  className="border border-primary bg-background"
                  disabled={loading}
                >
                  Cancel
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gaming Stats Section */}
      <div className="bg-background-alt rounded-xl p-8 shadow-lg hidden">
        <h2 className="text-2xl font-bold text-white mb-6">Gaming Stats</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Games Played */}
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {user.profile.totalGames || 204}
            </div>
            <div className="text-gray-300 text-sm">Games Played</div>
          </div>

          {/* Wins */}
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {user.profile.totalWins || 128}
            </div>
            <div className="text-gray-300 text-sm">Wins</div>
          </div>

          {/* Win Rate */}
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {user.profile.winRate ? `${user.profile.winRate}%` : '62%'}
            </div>
            <div className="text-gray-300 text-sm">Win Rate</div>
          </div>

          {/* Earnings */}
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {user.profile.totalWon ? `${user.profile.totalWon} ETH` : '15.75 ETH'}
            </div>
            <div className="text-gray-300 text-sm">Earnings</div>
          </div>
                 </div>
       </div>
     </div>
   )
 }
