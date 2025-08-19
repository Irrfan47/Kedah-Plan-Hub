<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $document_id = $_GET['id'] ?? '';
        
        if (!$document_id) {
            echo json_encode(['success' => false, 'message' => 'Document ID required']);
            exit;
        }
        
        // Get document information from database
        require_once 'config.php';
        
        $stmt = $conn->prepare('SELECT * FROM documents WHERE id = ?');
        $stmt->bind_param('i', $document_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $document = $result->fetch_assoc();
        
        if (!$document) {
            echo json_encode(['success' => false, 'message' => 'Document not found']);
            exit;
        }
        
        // Construct the file path
        $file_path = __DIR__ . '/uploads/' . $document['filename'];
        
        // Check if file exists
        if (!file_exists($file_path)) {
            echo json_encode(['success' => false, 'message' => 'Document file not found']);
            exit;
        }
        
        // Check if file is readable
        if (!is_readable($file_path)) {
            echo json_encode(['success' => false, 'message' => 'Document file not readable']);
            exit;
        }
        
        // Get file info
        $file_info = pathinfo($file_path);
        $file_size = filesize($file_path);
        
        // Determine content type based on file extension
        $extension = strtolower($file_info['extension']);
        $content_types = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png'
        ];
        
        $content_type = $content_types[$extension] ?? 'application/octet-stream';
        
        // Set headers for download
        header('Content-Type: ' . $content_type);
        header('Content-Disposition: attachment; filename="' . $document['original_name'] . '"');
        header('Content-Length: ' . $file_size);
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Clear any output buffers
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        // Output file content
        readfile($file_path);
        exit;
        
    } catch (Exception $e) {
        error_log('Document download error: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error downloading document: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>

