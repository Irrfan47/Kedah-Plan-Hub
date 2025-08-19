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
        $history_file_path = $_GET['file_path'] ?? '';
        $original_name = $_GET['original_name'] ?? '';
        
        if (!$history_file_path) {
            echo json_encode(['success' => false, 'message' => 'File path required']);
            exit;
        }
        
        // Construct the full file path
        $full_file_path = __DIR__ . '/uploads/' . $history_file_path;
        
        // Security check - ensure the path is within uploads directory
        $real_file_path = realpath($full_file_path);
        $uploads_dir = realpath(__DIR__ . '/uploads/');
        
        if (!$real_file_path || strpos($real_file_path, $uploads_dir) !== 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid file path']);
            exit;
        }
        
        // Check if file exists
        if (!file_exists($real_file_path)) {
            echo json_encode(['success' => false, 'message' => 'Historical document file not found']);
            exit;
        }
        
        // Check if file is readable
        if (!is_readable($real_file_path)) {
            echo json_encode(['success' => false, 'message' => 'Historical document file not readable']);
            exit;
        }
        
        // Get file info
        $file_info = pathinfo($real_file_path);
        $file_size = filesize($real_file_path);
        
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
        header('Content-Disposition: attachment; filename="' . ($original_name ?: $file_info['basename']) . '"');
        header('Content-Length: ' . $file_size);
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Clear any output buffers
        if (ob_get_level()) {
            ob_end_clean();
        }
        
        // Output file content
        readfile($real_file_path);
        exit;
        
    } catch (Exception $e) {
        error_log('Historical document download error: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error downloading historical document: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>

