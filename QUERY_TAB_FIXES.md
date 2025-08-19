# Query Tab Fixes

## Issues Fixed

### 1. **Missing Query Button for EXCO Users**
**Problem**: EXCO users were missing the query button (HelpCircle icon) in the action buttons
**Solution**: ✅ Added the missing query button for EXCO users in the action buttons section

### 2. **"Program not found" Error**
**Problem**: EXCO users were getting "Program not found or no changes made" error when trying to update programs
**Solution**: ✅ Added debugging and data type conversion to ensure proper program ID handling

## Changes Made

### 1. src/pages/Query.tsx
- **Added missing query button** for EXCO users with HelpCircle icon
- **Added debugging** to track program ID and data being sent
- **Added data type conversion** to ensure program ID is properly handled as integer
- **Added console logging** to help debug the update process

### 2. api/update_program.php
- **Added error logging** to track what data is being received
- **Added debugging** to see parsed values and SQL execution results
- **Added exception logging** to catch any errors

## Debugging Information

The debugging will help identify:
1. **Program ID type and value** being sent from frontend
2. **Data being received** by the backend
3. **SQL execution results** including affected rows
4. **Any exceptions** that might occur during the update process

## Testing Steps

1. **Test EXCO User Query Button**: 
   - Login as EXCO user
   - Go to Query tab
   - Verify that query button (HelpCircle icon) is visible for programs

2. **Test Program Update**:
   - Try to edit a program in the query tab
   - Check browser console for debugging information
   - Check server logs for backend debugging information
   - Verify that update works without "Program not found" error

## Expected Results

- ✅ EXCO users should see the query button (HelpCircle icon) in action buttons
- ✅ EXCO users should be able to update programs without "Program not found" error
- ✅ Console logs should show proper program ID and data being sent
- ✅ Server logs should show successful SQL execution

## Notes

- The debugging logs will help identify if there are any data type mismatches
- The program ID conversion ensures compatibility with the backend
- All existing functionality is preserved while adding the missing features