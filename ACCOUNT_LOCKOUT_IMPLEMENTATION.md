# Account Lockout Security Feature Implementation

## Overview
This security feature automatically locks non-admin user accounts after 5 consecutive failed login attempts. Only administrators can unlock these accounts through the User Management interface.

## Features
- **Automatic Account Lockout**: Non-admin accounts are locked after 5 failed login attempts
- **Admin-Only Unlock**: Only administrators can unlock locked accounts
- **Real-time Monitoring**: Admins can see failed attempt counts and lockout reasons
- **Audit Trail**: All unlock actions are logged in the system

## Database Changes

### 1. Run the Migration Script
Execute the SQL migration script located at `database/account_lockout_migration.sql`:

```sql
-- Add new fields to users table for account lockout functionality
ALTER TABLE `users` 
ADD COLUMN `failed_login_attempts` INT DEFAULT 0 COMMENT 'Number of consecutive failed login attempts',
ADD COLUMN `account_locked_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Timestamp when account was locked due to failed attempts',
ADD COLUMN `lockout_reason` VARCHAR(255) DEFAULT NULL COMMENT 'Reason for account lockout';

-- Create indexes for better performance
CREATE INDEX `idx_failed_login_attempts` ON `users` (`failed_login_attempts`);
CREATE INDEX `idx_account_locked_at` ON `users` (`account_locked_at`);
```

### 2. New Database Fields
- `failed_login_attempts`: Tracks consecutive failed login attempts
- `account_locked_at`: Timestamp when account was locked
- `lockout_reason`: Human-readable reason for the lockout

## Backend Changes

### 1. Modified Files

#### `api/login.php`
- Enhanced login logic to track failed attempts
- Automatic account locking after 5 failed attempts
- Different behavior for admin vs non-admin users
- Reset failed attempts on successful login

#### `api/unlock_account.php` (New)
- New endpoint for admins to unlock accounts
- Verifies admin permissions before unlocking
- Logs unlock actions in status_history table

#### `api/users.php`
- Updated to include lockout information in user data
- Returns failed attempt counts and lockout details

### 2. Key Security Features
- **Admin Protection**: Admin and super_admin accounts cannot be locked out
- **Attempt Counting**: Tracks consecutive failed attempts per user
- **Automatic Locking**: Locks account after 5 failed attempts
- **Secure Unlocking**: Only admins can unlock accounts

## Frontend Changes

### 1. Modified Files

#### `src/contexts/AuthContext.tsx`
- Updated User interface to include lockout properties
- Enhanced login handling for lockout responses

#### `src/api/backend.js`
- Added `unlockAccount()` function for account unlocking

#### `src/pages/UserManagement.tsx`
- New "Locked Accounts" statistics card
- Enhanced user table with security status column
- Unlock account functionality with confirmation modal
- Visual indicators for locked accounts

### 2. New UI Elements
- **Locked Accounts Counter**: Shows total number of locked accounts
- **Security Status Column**: Displays lockout information and failed attempts
- **Unlock Button**: Green unlock button for locked accounts
- **Status Badges**: Different badges for Active, Inactive, and Locked accounts

## How It Works

### 1. Login Process
1. User attempts to log in with incorrect credentials
2. System increments `failed_login_attempts` counter
3. If counter reaches 5, account is automatically locked
4. User receives message about account being locked
5. Admin must unlock the account manually

### 2. Account Unlocking
1. Admin navigates to User Management
2. Sees locked accounts with red "Locked" badge
3. Clicks green unlock button for specific account
4. Confirms unlock action in modal
5. Account is unlocked and user can log in again

### 3. Security Measures
- Failed attempts are tracked per user
- Admin accounts are immune to lockouts
- All unlock actions are logged and auditable
- Lockout reason is preserved for security analysis

## User Experience

### For Regular Users
- Clear feedback on remaining login attempts
- Informative message when account is locked
- Clear instructions to contact administrator

### For Administrators
- Real-time visibility into account security status
- Easy identification of locked accounts
- Simple one-click unlock process
- Comprehensive audit trail

## Testing the Feature

### 1. Test Account Lockout
1. Create a test non-admin user account
2. Attempt to log in with wrong password 5 times
3. Verify account is locked after 5th attempt
4. Check that correct password is rejected when locked

### 2. Test Admin Unlock
1. Log in as administrator
2. Navigate to User Management
3. Find the locked test account
4. Use unlock button to restore access
5. Verify test user can log in again

### 3. Test Admin Immunity
1. Log in as admin user
2. Attempt wrong password multiple times
3. Verify admin account is never locked

## Security Considerations

### 1. Rate Limiting
- Consider implementing IP-based rate limiting for additional security
- Monitor for brute force attacks across multiple accounts

### 2. Notification System
- Consider email notifications to admins when accounts are locked
- Implement alerts for unusual lockout patterns

### 3. Audit Logging
- All lockout and unlock actions are logged
- Review logs regularly for security incidents
- Consider exporting logs for external analysis

## Maintenance

### 1. Regular Monitoring
- Check locked accounts count regularly
- Review failed login attempt patterns
- Monitor for unusual lockout activity

### 2. Database Maintenance
- Consider archiving old lockout records
- Monitor database performance with new indexes
- Regular backup of user security data

## Troubleshooting

### Common Issues
1. **Account not unlocking**: Verify admin permissions
2. **Lockout not working**: Check database migration was applied
3. **UI not updating**: Refresh user list after unlock action

### Debug Information
- Check browser console for JavaScript errors
- Review PHP error logs for backend issues
- Verify database field values directly

## Future Enhancements

### Potential Improvements
1. **Time-based auto-unlock**: Automatically unlock after X hours
2. **IP whitelisting**: Allow certain IPs to bypass lockout
3. **Two-factor authentication**: Require 2FA after failed attempts
4. **Geographic restrictions**: Lock accounts from suspicious locations
5. **Machine learning**: Detect unusual login patterns

## Conclusion

This account lockout feature provides a robust security layer against brute force attacks while maintaining administrative control over account access. The implementation is secure, user-friendly, and provides comprehensive monitoring capabilities for system administrators.
