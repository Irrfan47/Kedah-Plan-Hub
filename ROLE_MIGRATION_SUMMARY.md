# Role Migration Summary: Combining exco_pa into exco_user

## Overview
This document summarizes the changes made to combine the `exco_pa` role into the `exco_user` role, effectively merging the PA (Personal Assistant) functionality into the EXCO User role.

## Changes Made

### Backend API Changes

#### 1. api/queries.php
- Updated notification queries to target `exco_user` instead of `exco_pa`
- Changed notification messages from "EXCO PA" to "EXCO USER"

#### 2. api/program_status.php
- Updated notification queries to target `exco_user` instead of `exco_pa`
- Removed `exco_pa` from combined role queries

#### 3. api/remarks.php
- Removed `exco_pa` from the user role list in notifications

#### 4. api/programs.php
- Updated notification queries to target `exco_user` instead of `exco_pa`

### Frontend Changes

#### 1. src/contexts/AuthContext.tsx
- Removed `exco_pa` from the `UserRole` type definition

#### 2. src/components/layout/AppSidebar.tsx
- Removed `exco_pa` from menu item role arrays
- Updated queries menu to be accessible by `exco_user` instead of `exco_pa`
- Removed `exco_pa` from role label mapping

#### 3. src/contexts/LanguageContext.tsx
- Removed `role.exco_pa` translations from both English and Malay

#### 4. src/pages/UserManagement.tsx
- Removed `exco_pa` from role badge variants
- Removed `exco_pa` from role selection dropdowns

#### 5. src/pages/Profile.tsx
- Removed `exco_pa` from role labels and colors

#### 6. src/pages/ProgramManagement.tsx
- Updated `canCreateProgram` check to only include `exco_user`
- Updated query answer permission to use `exco_user` instead of `exco_pa`

#### 7. src/pages/Login.tsx
- Removed Exco PA demo credential from login page

#### 8. src/components/layout/DashboardLayout.tsx
- Removed `exco_pa` from role label mapping

### Database Migration

#### 1. api/migrate_exco_pa_to_exco_user.sql
- Created migration script to update existing users with `exco_pa` role to `exco_user` role

## Impact

### What Changed
1. **Role Consolidation**: The `exco_pa` role has been completely removed from the system
2. **Permission Updates**: All permissions previously granted to `exco_pa` users are now available to `exco_user` users
3. **Notification Updates**: All notifications previously sent to `exco_pa` users are now sent to `exco_user` users
4. **UI Updates**: All UI elements that referenced `exco_pa` now reference `exco_user`

### What Remains the Same
1. **Core Functionality**: All existing functionality remains intact
2. **User Experience**: Users with the new combined role will have access to both EXCO User and PA features
3. **Data Integrity**: All existing data and relationships are preserved

## Migration Steps

1. **Run the SQL migration script** to update existing users:
   ```sql
   UPDATE users SET role = 'exco_user' WHERE role = 'exco_pa';
   ```

2. **Deploy the updated code** to your production environment

3. **Verify the changes** by checking that:
   - All users previously with `exco_pa` role now have `exco_user` role
   - All functionality works as expected
   - Notifications are properly sent to the correct users

## Testing Recommendations

1. **User Role Testing**: Verify that users with the combined role can access all features
2. **Notification Testing**: Ensure notifications are sent to the correct users
3. **Permission Testing**: Verify that all permissions work correctly
4. **UI Testing**: Check that all UI elements display correctly without the old role

## Rollback Plan

If needed, the changes can be rolled back by:
1. Restoring the previous code versions
2. Running a reverse migration script to restore `exco_pa` users
3. Reverting the database changes

## Notes

- This change simplifies the role system by reducing the number of roles from 4 to 3
- The combined role provides more flexibility for users who need both EXCO and PA capabilities
- All existing functionality is preserved while reducing complexity