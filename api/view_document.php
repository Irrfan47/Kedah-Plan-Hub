<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $filename = $_GET['filename'] ?? null;
    $original_name = $_GET['original_name'] ?? null;
    
    if (!$filename) {
        http_response_code(400);
        echo 'Filename is required.';
        exit;
    }
    
    $file_path = __DIR__ . '/uploads/' . $filename;
    
    if (!file_exists($file_path)) {
        http_response_code(404);
        echo 'File not found.';
        exit;
    }
    
    // Get file info
    $file_size = filesize($file_path);
    $file_extension = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
    
    // Set appropriate content type based on file extension
    $content_types = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls' => 'application/vnd.ms-excel',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt' => 'text/plain'
    ];
    
    $content_type = $content_types[$file_extension] ?? 'application/octet-stream';
    
    // For images and PDFs, display in browser
    // For other file types, force download
    if (in_array($file_extension, ['pdf', 'jpg', 'jpeg', 'png', 'gif'])) {
        header('Content-Type: ' . $content_type);
        header('Content-Length: ' . $file_size);
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
    } else {
        // Force download for other file types
        header('Content-Type: ' . $content_type);
        header('Content-Length: ' . $file_size);
        header('Content-Disposition: attachment; filename="' . ($original_name ?: $filename) . '"');
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
    }
    
    // Output file content
    readfile($file_path);
    exit;
}

http_response_code(405);
echo 'Method not allowed.';
?>
