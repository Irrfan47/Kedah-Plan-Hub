<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get the request data - handle both FormData and JSON
        $action = $_POST['action'] ?? '';
        
        if ($action === 'replace_document') {
            // Document replacement logic
            $document_id = $_POST['document_id'] ?? '';
            $program_id = $_POST['program_id'] ?? '';
            $new_file = $_FILES['new_document'] ?? null;
            $change_reason = $_POST['change_reason'] ?? 'Document replaced';
            $uploaded_by = $_POST['uploaded_by'] ?? '';
            
            if (!$document_id || !$program_id || !$uploaded_by) {
                echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
                exit;
            }
            
            // Get the existing document
            $stmt = $conn->prepare('SELECT * FROM documents WHERE id = ? AND program_id = ?');
            $stmt->bind_param('ii', $document_id, $program_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $existing_doc = $result->fetch_assoc();
            
            if (!$existing_doc) {
                echo json_encode(['success' => false, 'message' => 'Document not found']);
                exit;
            }
            
            // If no new file was uploaded, just return success (no replacement)
            if (!$new_file || $new_file['error'] === UPLOAD_ERR_NO_FILE) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'No new document selected - original document preserved',
                    'action' => 'no_replacement'
                ]);
                exit;
            }
            
            // Check if file upload was successful
            if ($new_file['error'] !== UPLOAD_ERR_OK) {
                echo json_encode(['success' => false, 'message' => 'File upload failed']);
                exit;
            }
            
            // Validate file type and size
            $allowed_types = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
            $file_extension = strtolower(pathinfo($new_file['name'], PATHINFO_EXTENSION));
            
            if (!in_array($file_extension, $allowed_types)) {
                echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed: ' . implode(', ', $allowed_types)]);
                exit;
            }
            
            if ($new_file['size'] > 10 * 1024 * 1024) { // 10MB limit
                echo json_encode(['success' => false, 'message' => 'File too large. Maximum size: 10MB']);
                exit;
            }
            
            // Set up directories
            $upload_dir = __DIR__ . '/uploads/';
            $history_dir = $upload_dir . 'history/';
            
            // Create history directory if it doesn't exist
            if (!is_dir($history_dir)) {
                if (!mkdir($history_dir, 0777, true)) {
                    echo json_encode(['success' => false, 'message' => 'Failed to create history directory']);
                    exit;
                }
            }
            
            // Get next version number
            $version_stmt = $conn->prepare('SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM document_history WHERE original_document_id = ?');
            $version_stmt->bind_param('i', $document_id);
            $version_stmt->execute();
            $version_result = $version_stmt->get_result();
            $version_row = $version_result->fetch_assoc();
            $next_version = $version_row['next_version'];
            
            // Step 1: Copy original file to history BEFORE doing anything else
            $original_file_path = $upload_dir . $existing_doc['filename'];
            $history_filename = 'v' . $next_version . '_' . $existing_doc['filename'];
            $history_file_path = $history_dir . $history_filename;
            
            if (!file_exists($original_file_path)) {
                echo json_encode(['success' => false, 'message' => 'Original document file not found']);
                exit;
            }
            
            // Copy to history
            if (!copy($original_file_path, $history_file_path)) {
                echo json_encode(['success' => false, 'message' => 'Failed to backup original document']);
                exit;
            }
            
            // Verify copy was successful
            if (!file_exists($history_file_path) || filesize($history_file_path) !== filesize($original_file_path)) {
                echo json_encode(['success' => false, 'message' => 'Failed to verify backup copy']);
                exit;
            }
            
            // Step 2: Save to document history
            // Store array values in variables first to avoid bind_param reference issues
            $existing_filename = $existing_doc['filename'];
            $existing_original_name = $existing_doc['original_name'];
            $existing_uploaded_by = $existing_doc['uploaded_by'];
            $existing_document_type = $existing_doc['document_type'];
            $existing_uploaded_at = $existing_doc['uploaded_at'];
            $history_file_path_value = 'history/' . $history_filename;
            
            $history_stmt = $conn->prepare('INSERT INTO document_history (original_document_id, program_id, filename, original_name, uploaded_by, document_type, uploaded_at, replaced_at, replaced_by, version_number, change_reason, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)');
            $history_stmt->bind_param('iisssssssss', 
                $document_id, 
                $program_id, 
                $existing_filename, 
                $existing_original_name, 
                $existing_uploaded_by, 
                $existing_document_type, 
                $existing_uploaded_at,
                $uploaded_by,
                $next_version,
                $change_reason,
                $history_file_path_value
            );
            
            if (!$history_stmt->execute()) {
                // If history save fails, remove the backup file
                if (file_exists($history_file_path)) {
                    unlink($history_file_path);
                }
                echo json_encode(['success' => false, 'message' => 'Failed to save document history']);
                exit;
            }
            
            // Step 3: Upload the new file with versioned filename
            $base_name = pathinfo($existing_doc['original_name'], PATHINFO_FILENAME);
            
            // Extract the program ID from the original filename (e.g., "Surat Akuan Pusat Khidmat(54)" -> "54")
            preg_match('/\((\d+)\)$/', $base_name, $matches);
            $program_id_suffix = $matches[1] ?? '';
            
            // Generate new filename with version number
            if ($program_id_suffix) {
                // If filename already has program ID, add version number
                $new_filename = $base_name . '(' . $next_version . ').' . $file_extension;
            } else {
                // If no program ID in filename, add it
                $new_filename = $base_name . '(' . $program_id . ')(' . $next_version . ').' . $file_extension;
            }
            $new_file_path = $upload_dir . $new_filename;
            
            if (!move_uploaded_file($new_file['tmp_name'], $new_file_path)) {
                // If upload fails, remove the backup file
                if (file_exists($history_file_path)) {
                    unlink($history_file_path);
                }
                echo json_encode(['success' => false, 'message' => 'Failed to upload new document']);
                exit;
            }
            
            // Step 4: Update the main document record
            $update_stmt = $conn->prepare('UPDATE documents SET filename = ?, original_name = ?, document_type = ?, uploaded_by = ?, uploaded_at = NOW() WHERE id = ?');
            $update_stmt->bind_param('ssssi', $new_filename, $new_filename, $existing_doc['document_type'], $uploaded_by, $document_id);
            
            if (!$update_stmt->execute()) {
                // If update fails, remove the new file and backup
                if (file_exists($new_file_path)) {
                    unlink($new_file_path);
                }
                if (file_exists($history_file_path)) {
                    unlink($history_file_path);
                }
                echo json_encode(['success' => false, 'message' => 'Failed to update document record']);
                exit;
            }
            
            // Step 5: Only NOW delete the original file (after everything succeeded)
            if (file_exists($original_file_path)) {
                unlink($original_file_path);
            }
            
            // Success!
            echo json_encode([
                'success' => true,
                'message' => 'Document replaced successfully',
                'action' => 'replaced',
                'new_filename' => $new_filename,
                'version' => $next_version,
                'history_id' => $conn->insert_id
            ]);
            
            $history_stmt->close();
            $update_stmt->close();
            $version_stmt->close();
            
        } elseif ($action === 'get_document_info') {
            // Get document information for editing
            $document_id = $_POST['document_id'] ?? '';
            
            if (!$document_id) {
                echo json_encode(['success' => false, 'message' => 'Document ID required']);
                exit;
            }
            
            $stmt = $conn->prepare('SELECT * FROM documents WHERE id = ?');
            $stmt->bind_param('i', $document_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $document = $result->fetch_assoc();
            
            if (!$document) {
                echo json_encode(['success' => false, 'message' => 'Document not found']);
                exit;
            }
            
            echo json_encode([
                'success' => true,
                'document' => $document
            ]);
            
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
        
    } catch (Exception $e) {
        error_log('Document replacement error: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
