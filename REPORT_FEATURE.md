# Report Feature Documentation

## Overview
The Report feature allows users to generate comprehensive reports of programs based on date ranges and user selection. This feature is accessible to all user roles with different permissions.

## Features

### 🔍 **Date Range Selection**
- Select start and end dates for the report period
- Defaults to current month on page load
- Validates that both dates are selected

### 👥 **User Filtering**
- **EXCO Users**: Can only generate reports for their own programs
- **Admin/Finance Users**: Can generate reports for:
  - All EXCO users (default)
  - Specific EXCO users
  - Individual user selection

### 📊 **Report Content**
- Only includes programs with `payment_completed` and `rejected` status
- Shows programs grouped by EXCO user
- Displays comprehensive program details:
  - Program Name
  - Budget (RM)
  - Recipient
  - Reference Number
  - Created Date
  - Status

### 📋 **Report Structure**
1. **Header**: Logo, title, and report period
2. **User Sections**: Each EXCO user's programs in separate sections
3. **Summary**: Per-user and overall totals
4. **Download**: HTML format with print functionality

## File Structure

### Frontend Files
- `src/pages/Report.tsx` - Main report page component
- `src/components/layout/AppSidebar.tsx` - Navigation menu (updated)
- `src/contexts/LanguageContext.tsx` - Translations (updated)
- `src/App.tsx` - Routing (updated)

### Backend Files
- `api/report.php` - Report generation API

## API Endpoints

### GET `/api/report.php`
**Parameters:**
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)
- `user_id` (optional): Specific user ID or 'all'
- `download` (optional): '1' to download HTML report

**Response:**
```json
{
  "success": true,
  "programs": [
    {
      "id": "1",
      "program_name": "Program Name",
      "budget": 1000.00,
      "recipient_name": "Recipient Name",
      "exco_letter_ref": "REF001",
      "status": "payment_completed",
      "created_at": "2024-01-01",
      "created_by": "user_id"
    }
  ]
}
```

## Usage Instructions

### For EXCO Users
1. Navigate to "Report" in the sidebar
2. Select date range (defaults to current month)
3. Click "Generate Report" to preview
4. Click "Download HTML" to get the report

### For Admin/Finance Users
1. Navigate to "Report" in the sidebar
2. Select date range
3. Choose "All EXCO Users" or specific user
4. Click "Generate Report" to preview
5. Click "Download HTML" to get the report

## Report Output

### HTML Report Features
- **Professional Layout**: Clean, print-friendly design
- **Logo Integration**: Company logo at the top
- **User Grouping**: Programs organized by EXCO user
- **Status Highlighting**: Color-coded status indicators
- **Summary Statistics**: Per-user and overall totals
- **Print Functionality**: Browser print dialog integration

### Report Sections
1. **Header**: Logo, title, description, date range
2. **User Sections**: "Programs for [User Name]"
3. **Data Tables**: Program details with all columns
4. **User Summaries**: Total programs and budget per user
5. **Overall Summary**: Total programs and budget across all users

## Security & Permissions

### Role-Based Access
- **EXCO Users**: Can only see their own programs
- **Admin/Finance**: Can see all programs or filter by user
- **Authentication Required**: All report access requires login

### Data Filtering
- Only shows `payment_completed` and `rejected` programs
- Respects user permissions and role restrictions
- Secure SQL queries with parameterized statements

## Future Enhancements

### Planned Features
- **PDF Generation**: Integration with TCPDF library
- **Excel Export**: CSV/Excel format options
- **Advanced Filtering**: Status, budget range, recipient filters
- **Scheduled Reports**: Automated report generation
- **Email Integration**: Direct email delivery

### Technical Improvements
- **Caching**: Report data caching for performance
- **Pagination**: Large dataset handling
- **Real-time Updates**: Live data refresh
- **Custom Templates**: User-defined report formats

## Installation Notes

### Dependencies
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: PHP, MySQL
- **PDF Library**: TCPDF (optional, for future PDF generation)

### Configuration
- Ensure `img/logo.png` exists for logo display
- Configure database connection in `api/config.php`
- Set up proper file permissions for uploads

## Troubleshooting

### Common Issues
1. **No Data**: Check date range and user permissions
2. **Download Fails**: Verify file permissions and browser settings
3. **Logo Missing**: Ensure `img/logo.png` exists
4. **Permission Errors**: Check user role and access rights

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify API endpoint accessibility
3. Test database connectivity
4. Validate user authentication status 