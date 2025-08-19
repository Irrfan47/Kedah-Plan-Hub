import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Camera, User, Lock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, changePassword, uploadProfilePicture, getProfilePicture, getUserProfile } from '../api/backend';
import { useLanguage } from '@/contexts/LanguageContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    portfolio: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [originalImageData, setOriginalImageData] = useState<string>(''); // Store original image
  const [croppedImageData, setCroppedImageData] = useState<string>(''); // Store cropped image

  // Load profile data and picture on component mount
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
      loadProfilePicture();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      const res = await getUserProfile(user.id);
      
      if (res.success && res.user) {
        
        // Update the user context with fresh data
        const updatedUser = {
          ...user,
          fullName: res.user.full_name,
          full_name: res.user.full_name,
          email: res.user.email,
          phoneNumber: res.user.phone_number,
          phone_number: res.user.phone_number,
          role: res.user.role,
          isActive: res.user.is_active === 1,
          is_active: res.user.is_active === 1,
          createdAt: res.user.created_at,
          created_at: res.user.created_at,
        };
        setUser(updatedUser);
        
        // Update profile form data
        setProfileData({
          fullName: res.user.full_name || '',
          email: res.user.email || '',
          phoneNumber: res.user.phone_number || '',
          portfolio: res.user.portfolio || '',
        });
        

      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadProfilePicture = async () => {
    if (!user?.id) return;
    
    try {
      const res = await getProfilePicture(user.id);
      if (res.success && res.profile_picture) {
        setProfilePhotoPreview(res.profile_picture);
      }
    } catch (error) {
      console.error('Error loading profile picture:', error);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setSelectedImage(imageData);
        setOriginalImageData(imageData); // Store original image
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      
      // Convert cropped blob to base64 for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const croppedImageData = e.target?.result as string;
        setCroppedImageData(croppedImageData); // Store cropped image
        setProfilePhotoPreview(croppedImageData); // Show cropped version in UI
      };
      reader.readAsDataURL(croppedBlob);
      
      setProfilePhoto(new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' }));
      setShowCropModal(false);
      setSelectedImage(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({ title: "Error", description: "Failed to crop image", variant: "destructive" });
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!originalImageData || !croppedImageData || !user?.id) {
      toast({
        title: "Error",
        description: "Please select and crop a profile picture first",
        variant: "destructive"
      });
      return;
    }

    // Prevent double-clicking
    if (isUploading) {
      return;
    }

    setIsUploading(true);
    try {
      // Send both original and cropped images to the server
      const res = await uploadProfilePicture(user.id, originalImageData, croppedImageData);
      
      if (res.success) {
        toast({ title: "Success", description: "Profile picture uploaded successfully" });
        setProfilePhoto(null);
        setOriginalImageData('');
        setCroppedImageData('');
        
        // Update user context with new profile picture (cropped version for UI)
        const updatedUser = { ...user, profilePhoto: profilePhotoPreview };
        setUser(updatedUser);
      } else {
        console.error('Upload failed:', res.message);
        toast({ title: "Error", description: res.message || "Failed to upload profile picture", variant: "destructive" });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload profile picture", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.fullName || !profileData.email) {
      toast({
        title: "Error",
        description: "Please fill all required fields (Name and Email are required)",
        variant: "destructive"
      });
      return;
    }
    if (!user?.id) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    
    const res = await updateProfile(user.id, profileData.fullName, profileData.email, profileData.phoneNumber, profileData.portfolio);
    
    if (res.success) {
      toast({ title: "Success", description: "Profile updated successfully" });
      // Refresh user profile data after successful update
      await loadUserProfile();
    } else {
      toast({ title: "Error", description: res.message || "Failed to update profile", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill all password fields",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }
    if (!user?.id) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    const res = await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);
    if (res.success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({ title: "Success", description: "Password changed successfully" });
    } else {
      toast({ title: "Error", description: res.message || "Failed to change password", variant: "destructive" });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: t('role.admin'),
      exco_user: t('role.exco_user'),
              finance_mmk: t('role.finance_mmk'),
        finance_officer: t('role.finance_officer'),
        super_admin: t('role.super_admin'),
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      exco_user: 'bg-blue-100 text-blue-800',
              finance_mmk: 'bg-green-100 text-green-800',
        finance_officer: 'bg-blue-100 text-blue-800',
        super_admin: 'bg-purple-100 text-purple-800',
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile Information
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Photo Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.photo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePhotoPreview} alt="Profile" />
                  <AvatarFallback className="text-lg">
                    {user ? getInitials(user.fullName || user.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('profile.photo_desc')}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <label htmlFor="profile-photo" className="cursor-pointer">
                        <Camera className="h-4 w-4 mr-2" />
                        {t('profile.change_photo')}
                        <input
                          id="profile-photo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoChange}
                        />
                      </label>
                    </Button>
                    {originalImageData && croppedImageData && (
                      <Button variant="outline" onClick={handleUploadProfilePicture} disabled={isUploading}>
                        {isUploading ? t('profile.uploading') : t('profile.upload')}
                      </Button>
                    )}
                    {profilePhotoPreview && (
                      <Button variant="outline" onClick={() => {
                        setProfilePhoto(null);
                        setOriginalImageData('');
                        setCroppedImageData('');
                        setProfilePhotoPreview(user?.profilePhoto || '');
                      }}>
                        {t('profile.reset')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crop your profile picture</DialogTitle>
                </DialogHeader>
                <div style={{ position: 'relative', width: 300, height: 300, background: '#222' }}>
                  {selectedImage && (
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowCropModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleCropConfirm}>Crop & Use</Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.basic_info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">{t('profile.full_name')} *</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    placeholder={t('profile.full_name')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t('profile.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    placeholder={t('profile.email')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phoneNumber">{t('profile.phone')} *</Label>
                  <Input
                    id="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                    placeholder={t('profile.phone')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="portfolio">{t('profile.portfolio')}</Label>
                  <Input
                    id="portfolio"
                    value={profileData.portfolio}
                    onChange={(e) => setProfileData({...profileData, portfolio: e.target.value})}
                    placeholder={t('profile.portfolio')}
                  />
                </div>
                
                <div>
                  <Label>{t('profile.role')}</Label>
                  <div className="mt-2">
                    <Badge className={getRoleColor(user?.role || '')}>
                      {getRoleLabel(user?.role || '')}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t('profile.account_status')}</Label>
                  <div className="mt-2">
                    <Badge className={user?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {user?.isActive ? t('users.active') : t('users.inactive')}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label>{t('profile.member_since')}</Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdateProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('profile.update_profile')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.change_password')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('profile.password_desc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">{t('profile.current_password')} *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder={t('profile.current_password')}
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">{t('profile.new_password')} *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder={t('profile.new_password')}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t('profile.password_help')}
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">{t('profile.confirm_password')} *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder={t('profile.confirm_password')}
                />
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleChangePassword}>
                  <Lock className="h-4 w-4 mr-2" />
                  {t('profile.change_password_btn')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}