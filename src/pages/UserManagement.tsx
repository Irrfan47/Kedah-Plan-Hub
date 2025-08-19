import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Users, UserPlus, Shield, UserCheck, UserX, Search, Filter, Edit, Trash2, Lock, Unlock, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth, User, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUsers, createUser, updateUser, updateUserStatus, deleteUser, unlockAccount } from '../api/backend';
import { useLanguage } from '@/contexts/LanguageContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isUnlockAccountOpen, setIsUnlockAccountOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [unlockingUser, setUnlockingUser] = useState<User | null>(null);
  const [updatingUserIds, setUpdatingUserIds] = useState<Set<string>>(new Set());
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'exco_user' as UserRole,
  });
  const [editUser, setEditUser] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'exco_user' as UserRole,
    password: '', // Add password field for editing
  });

  // Helper function to normalize user data from backend
  const normalizeUserData = (user: any) => {
    // Debug: Log the specific finance mmk user data
    if (user.email === 'finance_mmk@gmail.com') {
      console.log('🔍 Normalizing Finance MMK User:', {
        original: user,
        failed_login_attempts: user.failed_login_attempts,
        account_locked_at: user.account_locked_at,
        lockout_reason: user.lockout_reason
      });
    }
    
    const normalized = {
      ...user,
      // Ensure isActive is always a boolean and consistent with is_active
      isActive: Boolean(user.is_active),
      // Keep is_active as is for backend compatibility (number 0/1)
      is_active: user.is_active
    };
    
    // Debug: Log the normalized result for finance mmk
    if (user.email === 'finance_mmk@gmail.com') {
      console.log('🔍 Normalized Finance MMK User:', {
        normalized: normalized,
        isActive: normalized.isActive,
        is_active: normalized.is_active,
        failed_login_attempts: normalized.failed_login_attempts,
        account_locked_at: normalized.account_locked_at,
        lockout_reason: normalized.lockout_reason
      });
    }
    
    console.log('Normalizing user:', {
      original: { id: user.id, is_active: user.is_active, isActive: user.isActive },
      normalized: { id: normalized.id, is_active: normalized.is_active, isActive: normalized.isActive }
    });
    
    return normalized;
  };

  useEffect(() => {
    getUsers().then(res => {
      if (res.success && res.users) {
        console.log('Initial users loaded:', res.users);
        
        // Debug: Check specific finance mmk account
        const financeUser = res.users.find(u => u.email === 'finance_mmk@gmail.com');
        if (financeUser) {
          console.log('🔍 Finance MMK User Data:', {
            id: financeUser.id,
            email: financeUser.email,
            failed_login_attempts: financeUser.failed_login_attempts,
            account_locked_at: financeUser.account_locked_at,
            lockout_reason: financeUser.lockout_reason,
            is_active: financeUser.is_active
          });
        }
        
        // Normalize the user data to ensure consistent isActive/is_active mapping
        const normalizedUsers = res.users.map(normalizeUserData);
        console.log('Normalized users:', normalizedUsers);
        setUsers(normalizedUsers);
      } else {
        console.error('Failed to load users:', res);
      }
    }).catch(error => {
      console.error('Error loading users:', error);
    });
  }, []);

  // Statistics
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.isActive && !u.account_locked_at).length;
  const inactiveUsers = users.filter(u => !u.isActive && !u.account_locked_at).length;
  const lockedUsers = users.filter(u => u.account_locked_at !== null).length;
  
  // Debug: Log current user states
  console.log('Current users state:', users.map(u => ({
    id: u.id,
    name: u.fullName || u.full_name,
    is_active: u.is_active,
    isActive: u.isActive,
    role: u.role,
    failed_login_attempts: u.failed_login_attempts,
    account_locked_at: u.account_locked_at,
    lockout_reason: u.lockout_reason
  })));

  // Filter users
  const filteredUsers = users.filter(user => {
    const name = user.fullName || user.full_name || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.password || !newUser.phoneNumber) {
      toast({
        title: t('common.error'),
        description: t('users.fill_required_fields'),
        variant: "destructive",
      });
      return;
    }
    const userToAdd = {
      full_name: newUser.fullName,
      email: newUser.email,
      password: newUser.password,
      phone_number: newUser.phoneNumber,
      role: newUser.role,
    };
    const res = await createUser(userToAdd);
    if (res.success) {
      toast({ title: t('common.success'), description: t('users.added_successfully') });
      getUsers().then(res => {
        if (res.success && res.users) {
          const normalizedUsers = res.users.map(normalizeUserData);
          setUsers(normalizedUsers);
        }
      });
      setNewUser({ fullName: '', email: '', password: '', phoneNumber: '', role: 'exco_user' });
      setIsAddUserOpen(false);
    } else {
      toast({ title: t('common.error'), description: res.message || t('users.add_failed'), variant: "destructive" });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      fullName: user.fullName || user.full_name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || user.phone_number || '',
      role: user.role || 'exco_user',
      password: '', // Always blank when opening modal
    });
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser?.id || !editUser.fullName || !editUser.email || !editUser.phoneNumber) {
      toast({
        title: t('common.error'),
        description: t('users.fill_required_fields'),
        variant: "destructive",
      });
      return;
    }
    const userData: any = {
      full_name: editUser.fullName,
      email: editUser.email,
      phone_number: editUser.phoneNumber,
      role: editUser.role,
    };
    if (editUser.password && editUser.password.trim() !== '') {
      userData.password = editUser.password;
    }
    const res = await updateUser(editingUser.id, userData);
    if (res.success) {
      toast({ title: t('common.success'), description: t('users.updated_successfully') });
      getUsers().then(res => {
        if (res.success && res.users) {
          const normalizedUsers = res.users.map(normalizeUserData);
          setUsers(normalizedUsers);
        }
      });
      setIsEditUserOpen(false);
      setEditingUser(null);
    } else {
      toast({ title: t('common.error'), description: res.message || t('users.update_failed'), variant: "destructive" });
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setIsDeleteUserOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser?.id) {
      toast({
        title: t('common.error'),
        description: t('users.user_not_found'),
        variant: "destructive",
      });
      return;
    }

    const res = await deleteUser(deletingUser.id);
    if (res.success) {
      toast({ title: t('common.success'), description: t('users.deleted_successfully') });
      getUsers().then(res => {
        if (res.success && res.users) {
          const normalizedUsers = res.users.map(normalizeUserData);
          setUsers(normalizedUsers);
        }
      });
      setIsDeleteUserOpen(false);
      setDeletingUser(null);
    } else {
      toast({ title: t('common.error'), description: res.message || t('users.delete_failed'), variant: "destructive" });
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Prevent multiple simultaneous updates for the same user
    if (updatingUserIds.has(userId)) {
      console.log('User update already in progress for:', userId);
      return;
    }
    
    // Get current status - use isActive if available, otherwise convert is_active to boolean
    const currentStatus = user.isActive !== undefined ? user.isActive : Boolean(user.is_active);
    const newStatus = !currentStatus;
    
    console.log('Toggling user status:', {
      userId,
      currentStatus,
      newStatus,
      user: { is_active: user.is_active, isActive: user.isActive }
    });
    
    // Mark this user as being updated
    setUpdatingUserIds(prev => new Set(prev).add(userId));
    
    try {
      // Update the local state IMMEDIATELY for instant UI feedback
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(u => 
          u.id === userId 
            ? { ...u, is_active: newStatus ? 1 : 0, isActive: newStatus }
            : u
        );
        
        console.log('Local state updated immediately:', {
          userId,
          newStatus,
          updatedUser: updatedUsers.find(u => u.id === userId)
        });
        
        return updatedUsers;
      });
      
      // Now send the update to the backend
      const res = await updateUserStatus(userId, newStatus);
      console.log('Update response:', res);
      
      if (res.success) {
        toast({ title: t('common.success'), description: t('users.status_updated') });
        
        // Verify the backend update by refreshing data (with small delay to ensure backend processing)
        setTimeout(() => {
          getUsers().then(res => {
            if (res.success && res.users) {
              console.log('Refreshed users from server:', res.users);
              const normalizedUsers = res.users.map(normalizeUserData);
              console.log('Normalized users after refresh:', normalizedUsers);
              
              // Only update if the server data matches our expected state
              const expectedUser = normalizedUsers.find(u => u.id === userId);
              if (expectedUser && expectedUser.is_active === (newStatus ? 1 : 0)) {
                console.log('Server data confirmed our update, applying normalized data');
                setUsers(normalizedUsers);
              } else {
                console.log('Server data mismatch - keeping our local state. Expected:', newStatus ? 1 : 0, 'Got:', expectedUser?.is_active);
                // Don't override our local state if server data is wrong
              }
            }
          });
        }, 500); // 500ms delay to ensure backend has processed the update
      } else {
        // If backend update failed, revert the local state
        toast({ title: t('common.error'), description: res.message || t('users.status_update_failed'), variant: "destructive" });
        
        // Revert to previous state
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === userId 
              ? { ...u, is_active: currentStatus ? 1 : 0, isActive: currentStatus }
              : u
          )
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({ title: t('common.error'), description: 'An error occurred while updating status', variant: "destructive" });
      
      // Revert to previous state on error
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, is_active: currentStatus ? 1 : 0, isActive: currentStatus }
            : u
        )
      );
    } finally {
      // Always remove the updating flag
      setUpdatingUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleUnlockAccount = async () => {
    if (!unlockingUser?.id || !currentUser?.id) {
      toast({
        title: t('common.error'),
        description: 'Unable to unlock account. Missing user information.',
        variant: "destructive",
      });
      return;
    }

    const res = await unlockAccount(unlockingUser.id, currentUser.id);
    if (res.success) {
      toast({ 
        title: t('common.success'), 
        description: `Account unlocked successfully for ${unlockingUser.fullName || unlockingUser.full_name}` 
      });
      getUsers().then(res => {
        if (res.success && res.users) {
          const normalizedUsers = res.users.map(normalizeUserData);
          setUsers(normalizedUsers);
        }
      });
      setIsUnlockAccountOpen(false);
      setUnlockingUser(null);
    } else {
      toast({ 
        title: t('common.error'), 
        description: res.message || 'Failed to unlock account', 
        variant: "destructive" 
      });
    }
  };

  const handleResetFailedAttempts = async (userId: string) => {
    try {
      // Call the unlock account API to reset failed attempts
      const res = await unlockAccount(userId, currentUser?.id || '');
      if (res.success) {
        toast({ 
          title: t('common.success'), 
          description: 'Failed login attempts reset successfully' 
        });
        // Refresh the user list
        getUsers().then(res => {
          if (res.success && res.users) {
            const normalizedUsers = res.users.map(normalizeUserData);
            setUsers(normalizedUsers);
          }
        });
      } else {
        toast({ 
          title: t('common.error'), 
          description: res.message || 'Failed to reset attempts', 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: t('common.error'), 
        description: 'Error resetting failed attempts', 
        variant: "destructive" 
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      admin: "bg-primary-light text-primary",
      exco_user: "bg-success-light text-success",
              finance_mmk: "bg-secondary-light text-secondary",
        finance_officer: "bg-blue-100 text-blue-800",
        super_admin: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={variants[role]}>
        {t(`role.${role}`)}
      </Badge>
    );
  };

  const getAccountStatusBadge = (user: User) => {
    // Debug: Log the user data being processed for status badge
    if (user.email === 'finance_mmk@gmail.com') {
      console.log('🔍 getAccountStatusBadge called for Finance MMK:', {
        user: user,
        account_locked_at: user.account_locked_at,
        failed_login_attempts: user.failed_login_attempts,
        lockout_reason: user.lockout_reason,
        isActive: user.isActive
      });
    }
    
    if (user.account_locked_at) {
      console.log('🔍 Finance MMK: Account is locked, showing LOCKED badge');
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Locked
        </Badge>
      );
    }
    
    if (user.failed_login_attempts > 0) {
      const attemptsRemaining = 5 - user.failed_login_attempts;
      console.log('🔍 Finance MMK: Has failed attempts, showing attempts badge');
      return (
        <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {attemptsRemaining} attempts left
        </Badge>
      );
    }
    
    if (user.isActive) {
      console.log('🔍 Finance MMK: Account is active, showing ACTIVE badge');
      return (
        <Badge className="bg-success-light text-success">
          Active
        </Badge>
      );
    } else {
      console.log('🔍 Finance MMK: Account is inactive, showing INACTIVE badge');
      return (
        <Badge className="bg-danger-light text-danger">
          Inactive
        </Badge>
      );
    }
  };

  const getAccountStatusInfo = (user: User) => {
    // Debug: Log the user data being processed for status info
    if (user.email === 'finance_mmk@gmail.com') {
      console.log('🔍 getAccountStatusInfo called for Finance MMK:', {
        user: user,
        account_locked_at: user.account_locked_at,
        failed_login_attempts: user.failed_login_attempts,
        lockout_reason: user.lockout_reason
      });
    }
    
    if (user.account_locked_at) {
      console.log('🔍 Finance MMK: Account is locked, showing lockout info');
      return (
        <div className="text-xs text-red-600">
          <div>🔒 Locked: {new Date(user.account_locked_at).toLocaleString()}</div>
          {user.lockout_reason && <div>📝 Reason: {user.lockout_reason}</div>}
          {user.failed_login_attempts && <div>⚠️ Failed: {user.failed_login_attempts}/5</div>}
        </div>
      );
    }
    
    if (user.failed_login_attempts && user.failed_login_attempts > 0) {
      const attemptsRemaining = 5 - user.failed_login_attempts;
      console.log('🔍 Finance MMK: Has failed attempts, showing attempts info');
      return (
        <div className="text-xs text-orange-600">
          <div>⚠️ Failed attempts: {user.failed_login_attempts}/5</div>
          <div>🔄 {attemptsRemaining} attempts remaining</div>
        </div>
      );
    }
    
    console.log('🔍 Finance MMK: No security issues, showing green status');
    return (
      <div className="text-xs text-green-600">
        ✅ No security issues
      </div>
    );
  };

  // Only allow admin and super_admin access
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
              <div className="text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground">{t('users.access_denied')}</h2>
        <p className="text-muted-foreground">{t('users.no_permission')}</p>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mobile-zoom-out">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('users.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('users.subtitle')}
          </p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <UserPlus className="w-4 h-4 mr-2" />
              {t('users.add_user')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.add_new_user')}</DialogTitle>
              <DialogDescription>
                {t('users.add_user_desc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('users.name')}</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={t('users.enter_full_name')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('users.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@gov.my"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('users.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t('users.enter_password')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('users.phone')}</Label>
                <Input
                  id="phone"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+60123456789"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">{t('users.role')}</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as UserRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.select_role')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('role.admin')}</SelectItem>
                    <SelectItem value="exco_user">{t('role.exco_user')}</SelectItem>
                    <SelectItem value="finance_mmk">{t('role.finance_mmk')}</SelectItem>
                    <SelectItem value="finance_officer">{t('role.finance_officer')}</SelectItem>
                    <SelectItem value="super_admin">{t('role.super_admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddUser}>
                  {t('users.add_user')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={editUser.fullName}
                  onChange={(e) => setEditUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@gov.my"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={editUser.phoneNumber}
                  onChange={(e) => setEditUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+60123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select 
                  value={editUser.role} 
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, role: value as UserRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="exco_user">Exco User</SelectItem>
                    <SelectItem value="finance_mmk">Finance MMK</SelectItem>
                    <SelectItem value="finance_officer">Finance Officer</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPassword">Password</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Update User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Modal */}
        <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>User to delete:</strong> {deletingUser?.fullName || deletingUser?.full_name}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Email: {deletingUser?.email}
                </p>
                <p className="text-sm text-red-700">
                  Role: {deletingUser?.role?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('users.total_users')}</p>
                <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('users.admins')}</p>
                <p className="text-3xl font-bold text-primary">{adminUsers}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('users.active_users')}</p>
                <p className="text-3xl font-bold text-success">{activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('users.inactive_users')}</p>
                <p className="text-3xl font-bold text-danger">{inactiveUsers}</p>
              </div>
              <div className="w-12 h-12 bg-danger-light rounded-xl flex items-center justify-center">
                <UserX className="w-6 h-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Locked Accounts</p>
                <p className="text-3xl font-bold text-red-600">{lockedUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {users.filter(u => u.failed_login_attempts > 0).length} with failed attempts
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-elevated">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('users.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-sm"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('users.all_roles')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('users.all_roles')}</SelectItem>
                  <SelectItem value="admin">{t('role.admin')}</SelectItem>
                  <SelectItem value="exco_user">{t('role.exco_user')}</SelectItem>
                  <SelectItem value="finance_mmk">{t('role.finance_mmk')}</SelectItem>
                  <SelectItem value="finance_officer">{t('role.finance_officer')}</SelectItem>
                  <SelectItem value="super_admin">{t('role.super_admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔄 Manual refresh triggered...');
                // Force refresh with cache busting
                const timestamp = Date.now();
                console.log('🔄 Cache busting timestamp:', timestamp);
                
                getUsers().then(res => {
                  if (res.success && res.users) {
                    console.log('🔄 Refresh - Users received:', res.users.length);
                    
                    // Debug: Check specific finance mmk account on refresh
                    const financeUser = res.users.find(u => u.email === 'finance_mmk@gmail.com');
                    if (financeUser) {
                      console.log('🔄 Refresh - Finance MMK User Data:', {
                        id: financeUser.id,
                        email: financeUser.email,
                        failed_login_attempts: financeUser.failed_login_attempts,
                        account_locked_at: financeUser.account_locked_at,
                        lockout_reason: financeUser.lockout_reason,
                        is_active: financeUser.is_active
                      });
                    }
                    
                    const normalizedUsers = res.users.map(normalizeUserData);
                    setUsers(normalizedUsers);
                    toast({ title: "Users Refreshed", description: "User list has been updated" });
                  } else {
                    console.error('🔄 Refresh failed:', res);
                  }
                }).catch(error => {
                  console.error('🔄 Refresh error:', error);
                });
              }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                console.log('🚫 Force refresh with cache clear...');
                // Clear users state first, then fetch
                setUsers([]);
                setTimeout(() => {
                  getUsers().then(res => {
                    if (res.success && res.users) {
                      console.log('🚫 Force refresh - Users received:', res.users.length);
                      const normalizedUsers = res.users.map(normalizeUserData);
                      setUsers(normalizedUsers);
                      toast({ title: "Force Refresh Complete", description: "Cache cleared and users reloaded" });
                    }
                  });
                }, 100);
              }}
              className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertTriangle className="w-4 h-4" />
              Force Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('users.users_count').replace('{count}', filteredUsers.length.toString())}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.name')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.email')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.phone')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.role')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Security Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.created')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('users.last_login')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-fast">
                    <td className="py-3 px-4 font-medium text-foreground">{user.fullName || user.full_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.phoneNumber || user.phone_number}</td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">
                      {getAccountStatusBadge(user)}
                    </td>
                    <td className="py-3 px-4">
                      {getAccountStatusInfo(user)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.created_at || user.createdAt ? new Date(user.created_at || user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.id === currentUser?.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        {/* Reset Failed Attempts Button for users with failed attempts */}
                        {(() => {
                          // Debug: Log the condition check for finance mmk
                          if (user.email === 'finance_mmk@gmail.com') {
                            console.log('🔍 Reset Button Condition Check for Finance MMK:', {
                              user: user,
                              failed_login_attempts: user.failed_login_attempts,
                              account_locked_at: user.account_locked_at,
                              condition1: user.failed_login_attempts > 0,
                              condition2: !user.account_locked_at,
                              shouldShow: (user.failed_login_attempts > 0 && !user.account_locked_at) ? 'YES' : 'NO'
                            });
                          }
                          return user.failed_login_attempts > 0 && !user.account_locked_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetFailedAttempts(user.id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              title="Reset Failed Attempts"
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          );
                        })()}
                        
                        {/* Unlock Account Button for locked accounts */}
                        {(() => {
                          // Debug: Log the condition check for finance mmk
                          if (user.email === 'finance_mmk@gmail.com') {
                            console.log('🔍 Unlock Button Condition Check for Finance MMK:', {
                              user: user,
                              account_locked_at: user.account_locked_at,
                              condition: !!user.account_locked_at,
                              shouldShow: user.account_locked_at ? 'YES' : 'NO'
                            });
                          }
                          return user.account_locked_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUnlockingUser(user);
                                setIsUnlockAccountOpen(true);
                              }}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              title="Unlock Account"
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              Unlock
                            </Button>
                          );
                        })()}
                        
                        {/* Status Toggle Switch (works for all accounts) */}
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => toggleUserStatus(user.id)}
                            disabled={user.id === currentUser?.id || updatingUserIds.has(user.id)}
                          />
                          {updatingUserIds.has(user.id) && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {user.isActive ? "Active" : "Inactive"}
                          {updatingUserIds.has(user.id) && " (Updating...)"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unlock Account Confirmation Modal */}
      <Dialog open={isUnlockAccountOpen} onOpenChange={setIsUnlockAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Unlock className="w-5 h-5" />
              Unlock Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unlock this account? This will reset the failed login attempts and allow the user to log in again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Account to unlock:</strong> {unlockingUser?.fullName || unlockingUser?.full_name}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Email: {unlockingUser?.email}
              </p>
              <p className="text-sm text-green-700">
                Role: {unlockingUser?.role?.replace('_', ' ').toUpperCase()}
              </p>
              {unlockingUser?.failed_login_attempts && (
                <p className="text-sm text-green-700 mt-2">
                  <strong>Failed Login Attempts:</strong> {unlockingUser.failed_login_attempts}/5
                </p>
              )}
              {unlockingUser?.lockout_reason && (
                <p className="text-sm text-green-700 mt-2">
                  <strong>Lockout Reason:</strong> {unlockingUser.lockout_reason}
                </p>
              )}
              {unlockingUser?.account_locked_at && (
                <p className="text-sm text-green-700">
                  <strong>Locked Since:</strong> {new Date(unlockingUser.account_locked_at).toLocaleString()}
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsUnlockAccountOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUnlockAccount}
                className="bg-green-600 hover:bg-green-700"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}