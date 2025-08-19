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
        // Get the request data
        $program_id = $_POST['program_id'] ?? '';
        $uploaded_by = $_POST['uploaded_by'] ?? '';
        $document_type = $_POST['document_type'] ?? 'original';
        $change_reason = $_POST['change_reason'] ?? 'Initial document upload';
        
        // Check if file was uploaded
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'No file uploaded or upload failed']);
            exit;
        }
        
        $file = $_FILES['file'];
        
        // Validate required parameters
        if (!$program_id || !$uploaded_by) {
            echo json_encode(['success' => false, 'message' => 'Missing required parameters']);
            exit;
        }
        
        // Validate file type and size
        $allowed_types = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($file_extension, $allowed_types)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed: ' . implode(', ', $allowed_types)]);
            exit;
        }
        
        if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
            echo json_encode(['success' => false, 'message' => 'File too large. Maximum size: 10MB']);
            exit;
        }
        
        // Set up upload directory
        $upload_dir = __DIR__ . '/uploads/';
        
        // Create uploads directory if it doesn't exist
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0777, true)) {
                echo json_encode(['success' => false, 'message' => 'Failed to create uploads directory']);
                exit;
            }
        }
        
        // Generate unique filename
        $filename = uniqid() . '_' . basename($file['name']);
        $target_path = $upload_dir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $target_path)) {
            echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file']);
            exit;
        }
        
        // Verify file was saved
        if (!file_exists($target_path)) {
            echo json_encode(['success' => false, 'message' => 'File was not saved properly']);
            exit;
        }
        
        // Save document record to database
        $stmt = $conn->prepare('INSERT INTO documents (program_id, filename, original_name, uploaded_by, document_type, uploaded_at) VALUES (?, ?, ?, ?, ?, NOW())');
        $stmt->bind_param('issss', $program_id, $filename, $file['name'], $uploaded_by, $document_type);
        
        if (!$stmt->execute()) {
            // If database insert fails, remove the uploaded file
            if (file_exists($target_path)) {
                unlink($target_path);
            }
            echo json_encode(['success' => false, 'message' => 'Failed to save document record to database']);
            exit;
        }
        
        $document_id = $conn->insert_id;
        
        // Success!
        echo json_encode([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'document_id' => $document_id,
            'filename' => $filename,
            'original_name' => $file['name'],
            'file_size' => $file['size'],
            'uploaded_at' => date('Y-m-d H:i:s')
        ]);
        
        $stmt->close();
        
    } catch (Exception $e) {
        error_log('Document upload error: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>

