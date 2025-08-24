// src/api/backend.js

// Base URL for your PHP backend
// For root domain hosting, this should point to the api folder at root
export const BASE_URL = '/Nurkamal/kedah-plan-hub-production/api';

// 1. Login
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// 2. Get all users
export async function getUsers() {
  // Add cache-busting parameter
  const timestamp = Date.now();
  const url = `${BASE_URL}/users.php?t=${timestamp}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  
  return res.json();
}

// 3. Upload a document (for initial program creation)
export async function uploadDocument(programId, file, uploadedBy = '', documentType = 'original', changeReason = 'Document update') {
  const formData = new FormData();
  formData.append('program_id', programId);
  formData.append('file', file);
  formData.append('uploaded_by', uploadedBy);
  formData.append('document_type', documentType);
  formData.append('change_reason', changeReason);
  
  const res = await fetch(`${BASE_URL}/upload_new_document.php`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

// 3.1. Download a document
export async function downloadDocument(documentId) {
  try {
    const downloadUrl = `${BASE_URL}/download_current_document.php?id=${documentId}`;
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, message: 'Download started' };
  } catch (error) {
    console.error('Failed to download document:', error);
    throw error;
  }
}

// 4.1. Download a historical document from history folder
export async function downloadHistoricalDocument(historyFilePath, originalFilename = null) {
  try {
    // Use fetch approach for all file types to ensure proper download
    try {
      const response = await fetch(`${BASE_URL}/download_document.php?is_history=true&history_file_path=${encodeURIComponent(historyFilePath)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'historical_document';
      
      if (contentDisposition) {
        // Try to extract filename from Content-Disposition header
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        } else {
          // Fallback: try without quotes
          const filenameMatch2 = contentDisposition.match(/filename=([^;]+)/);
          if (filenameMatch2) {
            filename = filenameMatch2[1].trim();
          }
        }
      }
      
      // If we still don't have a proper filename, use the original filename or a default
      if ((filename === 'historical_document' || !filename) && originalFilename) {
        filename = originalFilename;
      } else if (filename === 'historical_document' || !filename) {
        // Determine file extension based on content type
        const contentType = response.headers.get('Content-Type');
        let extension = 'pdf';
        if (contentType) {
          if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
            extension = 'jpg';
          } else if (contentType.includes('image/png')) {
            extension = 'png';
          } else if (contentType.includes('image/gif')) {
            extension = 'gif';
          } else if (contentType.includes('image/bmp')) {
            extension = 'bmp';
          } else if (contentType.includes('image/webp')) {
            extension = 'webp';
          } else if (contentType.includes('application/pdf')) {
            extension = 'pdf';
          }
        }
        filename = `historical_document.${extension}`;
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename: filename };
    } catch (fetchError) {
      // Fallback to window.open method
      const downloadUrl = `${BASE_URL}/download_document.php?is_history=true&history_file_path=${encodeURIComponent(historyFilePath)}`;
      const newWindow = window.open(downloadUrl, '_blank');
      
      if (!newWindow) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }
      
      return { success: true, method: 'window.open' };
    }
  } catch (error) {
    console.error('Historical document download failed:', error);
    throw error;
  }
}

// 4.2. Check for orphaned document history records
export async function checkOrphanedDocuments() {
  try {
    const response = await fetch(`${BASE_URL}/recover_lost_documents.php`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to check orphaned documents:', error);
    throw error;
  }
}

// 4.3. Attempt to recover a lost document
export async function recoverLostDocument(historyId) {
  try {
    const response = await fetch(`${BASE_URL}/recover_lost_documents.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'recover', history_id: historyId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to recover lost document:', error);
    throw error;
  }
}

// 4.4. Test history folder functionality
export async function testHistoryFolder() {
  try {
    const response = await fetch(`${BASE_URL}/test_history_folder.php`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to test history folder:', error);
    throw error;
  }
}

// 4.5. Check database schema for document_history table
export async function checkDatabaseSchema() {
  try {
    const response = await fetch(`${BASE_URL}/check_database_schema.php`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to check database schema:', error);
    throw error;
  }
}

// 5. NEW SIMPLIFIED DOCUMENT SYSTEM

// 5.1. Replace a document (new simplified system)
export async function replaceDocument(documentId, programId, file, changeReason, uploadedBy) {
  try {
    const formData = new FormData();
    formData.append('action', 'replace_document');
    formData.append('document_id', documentId);
    formData.append('program_id', programId);
    formData.append('new_document', file);
    formData.append('change_reason', changeReason);
    formData.append('uploaded_by', uploadedBy);
    
    const response = await fetch(`${BASE_URL}/replace_document.php`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to replace document:', error);
    throw error;
  }
}

// 5.2. Get document information for editing
export async function getDocumentInfo(documentId) {
  try {
    const response = await fetch(`${BASE_URL}/replace_document.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_document_info',
        document_id: documentId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to get document info:', error);
    throw error;
  }
}

// 5.3. Get document history (new simplified system)
export async function getDocumentHistorySimple(documentId, programId) {
  try {
    const params = new URLSearchParams();
    if (documentId) params.append('document_id', documentId);
    if (programId) params.append('program_id', programId);
    
    const response = await fetch(`${BASE_URL}/get_document_history_simple.php?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to get document history:', error);
    throw error;
  }
}

// 5.4. Download historical document (new simplified system)
export async function downloadHistoryDocumentSimple(filePath, originalName) {
  try {
    const params = new URLSearchParams({
      file_path: filePath,
      original_name: originalName || ''
    });
    
    const downloadUrl = `${BASE_URL}/download_history_document.php?${params}`;
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = originalName || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, message: 'Download started' };
  } catch (error) {
    console.error('Failed to download historical document:', error);
    throw error;
  }
}

// 3.2. View a document (opens in browser for images, downloads for others)
export async function viewDocument(documentId) {
  try {
    const viewUrl = `${BASE_URL}/view_current_document.php?id=${documentId}`;
    
    // Open document in new tab for viewing
    window.open(viewUrl, '_blank');
    
    return { success: true, message: 'Document opened in new tab' };
  } catch (error) {
    console.error('Failed to view document:', error);
    throw error;
  }
}

// 4.5. Delete a document
export async function deleteDocument(documentId) {
  const res = await fetch(`${BASE_URL}/delete_document.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: documentId }),
  });
  return res.json();
}

// 5. Change password
export async function changePassword(id, oldPassword, newPassword) {
  const res = await fetch(`${BASE_URL}/change_password.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, old_password: oldPassword, new_password: newPassword }),
  });
  return res.json();
}

// 6. Create a user
export async function createUser(user) {
  const res = await fetch(`${BASE_URL}/users.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.json();
}

// 7. Update a user
export async function updateUser(userId, userData) {
  const res = await fetch(`${BASE_URL}/update_user.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...userData }),
  });
  return res.json();
}

// 8. Update user status (active/inactive)
export async function updateUserStatus(userId, isActive) {
  const payload = { user_id: userId, is_active: isActive ? 1 : 0 };
  
  const res = await fetch(`${BASE_URL}/update_user_status.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const result = await res.json();
  return result;
}

// Unlock account that was locked due to failed login attempts
export async function unlockAccount(userId, adminUserId) {
  const res = await fetch(`${BASE_URL}/unlock_account.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, admin_user_id: adminUserId }),
  });
  return res.json();
}

// 9. Delete a user
export async function deleteUser(userId) {
  const res = await fetch(`${BASE_URL}/delete_user.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

// 7. Example: Get all programs
export async function getPrograms(excoUserId = null) {
  const url = excoUserId ? `${BASE_URL}/programs.php?exco_user_id=${excoUserId}` : `${BASE_URL}/programs.php`;
  const res = await fetch(url);
  return res.json();
}

// 8. Example: Create a new program
export async function createProgram(program) {
  const res = await fetch(`${BASE_URL}/programs.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(program),
  });
  return res.json();
}

// 8.5. Update a program
export async function updateProgram(programId, program) {
  const res = await fetch(`${BASE_URL}/update_program.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: programId, ...program }),
  });
  return res.json();
}

// 9. Example: Change program status
export async function changeProgramStatus(program_id, status, voucher_number, eft_number, eft_date) {
  const res = await fetch(`${BASE_URL}/program_status.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ program_id, status, voucher_number, eft_number, eft_date }),
  });
  return res.json();
}

// 10. Example: Add a remark
export async function addRemark(program_id, remark, created_by, user_role) {
  const res = await fetch(`${BASE_URL}/remarks.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ program_id, remark, created_by, user_role }),
  });
  return res.json();
}

// 11. Example: Get all remarks for a program
export async function getRemarks(program_id) {
  const res = await fetch(`${BASE_URL}/remarks.php?program_id=${program_id}`);
  return res.json();
}

// 12. Update profile
export async function updateProfile(id, full_name, email, phone_number, portfolio) {
  const res = await fetch(`${BASE_URL}/profile.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, full_name, email, phone_number, portfolio }),
  });
  return res.json();
}

// 13. Upload profile picture
export async function uploadProfilePicture(userId, originalImage, croppedImage) {
  const requestBody = { 
    user_id: userId, 
    original_image: originalImage,
    cropped_image: croppedImage
  };
  
  const res = await fetch(`${BASE_URL}/upload_profile_picture.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  
  const responseData = await res.json();
  return responseData;
}

// 14. Get profile picture
export async function getProfilePicture(userId) {
  const res = await fetch(`${BASE_URL}/get_profile_picture.php?user_id=${userId}`);
  return res.json();
}

// 14.1. Get user profile data
export async function getUserProfile(userId) {
  const res = await fetch(`${BASE_URL}/profile.php?id=${userId}`, {
    credentials: 'include'
  });
  return res.json();
}

// 15. Get dashboard data
export async function getDashboard() {
  const res = await fetch(`${BASE_URL}/dashboard.php`);
  return res.json();
}

// 16. Get budget data
export async function getBudget() {
  const res = await fetch(`${BASE_URL}/budget.php`);
  return res.json();
}

// 16.1. Get user budget information
export async function getUserBudget(userId) {
  const res = await fetch(`${BASE_URL}/users.php?user_budget=1&user_id=${userId}`);
  return res.json();
}

export async function updateBudget(totalBudget) {
  const res = await fetch(`${BASE_URL}/budget.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total_budget: totalBudget }),
  });
  return res.json();
}

// 17. Delete a program
export async function deleteProgram(programId) {
  const res = await fetch(`${BASE_URL}/delete_program.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ program_id: programId }),
  });
  return res.json();
}

// Notification functions
export async function getNotifications(userId) {
  const res = await fetch(`${BASE_URL}/notifications.php?user_id=${userId}`);
  return res.json();
}

export async function markNotificationAsRead(userId, notificationId = null) {
  const res = await fetch(`${BASE_URL}/notifications.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user_id: userId, 
      notification_id: notificationId,
      mark_all: !notificationId 
    }),
  });
  return res.json();
}

export async function deleteNotification(userId, notificationId = null) {
  const res = await fetch(`${BASE_URL}/notifications.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user_id: userId, 
      notification_id: notificationId,
      delete_all: !notificationId 
    }),
  });
  return res.json();
}

export async function createNotification(userId, title, message, type = 'info', programId = null) {
  const res = await fetch(`${BASE_URL}/notifications.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user_id: userId, 
      title, 
      message, 
      type, 
      program_id: programId 
    }),
  });
  return res.json();
}

// Query functions
export async function getQueries(programId = null) {
  const url = programId ? `${BASE_URL}/queries.php?program_id=${programId}` : `${BASE_URL}/queries.php`;
  const res = await fetch(url);
  return res.json();
}

export async function createQuery(programId, question, createdBy) {
  const res = await fetch(`${BASE_URL}/queries.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      program_id: programId, 
      question, 
      created_by: createdBy 
    }),
  });
  return res.json();
}

export async function answerQuery(queryId, answer, answeredBy) {
  const res = await fetch(`${BASE_URL}/queries.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query_id: queryId, 
      answer, 
      answered_by: answeredBy 
    }),
  });
  return res.json();
}

// Get EXCO users
export async function getExcoUsers() {
  const res = await fetch(`${BASE_URL}/exco_users.php`);
  return res.json();
}

export async function getUserNotifications(excoUserId) {
  const res = await fetch(`${BASE_URL}/user_notifications.php?exco_user_id=${excoUserId}`);
  return res.json();
}

export async function markUserNotificationAsRead(excoUserId, notificationId = null) {
  const res = await fetch(`${BASE_URL}/user_notifications.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      exco_user_id: excoUserId, 
      notification_id: notificationId,
      mark_all: !notificationId 
    }),
  });
  return res.json();
}

export async function deleteUserNotification(excoUserId, notificationId = null) {
  const res = await fetch(`${BASE_URL}/user_notifications.php`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      exco_user_id: excoUserId, 
      notification_id: notificationId,
      delete_all: !notificationId 
    }),
  });
  return res.json();
}

// Get EXCO user dashboard data
export async function getExcoUserDashboard(userId) {
  const res = await fetch(`${BASE_URL}/exco_user_dashboard.php?user_id=${userId}`);
  return res.json();
}

// Get document history
export async function getDocumentHistory(documentId = null, programId = null) {
  let url = `${BASE_URL}/get_document_history.php`;
  if (documentId) {
    url += `?document_id=${documentId}`;
  } else if (programId) {
    url += `?program_id=${programId}`;
  }
  const res = await fetch(url);
  return res.json();
}

// Update EXCO user budget
export async function updateExcoUserBudget(userId, totalBudget) {
  const res = await fetch(`${BASE_URL}/exco_user_dashboard.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, total_budget: totalBudget }),
  });
  return res.json();
} 