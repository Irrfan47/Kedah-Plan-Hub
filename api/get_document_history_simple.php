<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $document_id = $_GET['document_id'] ?? '';
        $program_id = $_GET['program_id'] ?? '';
        
        if (!$document_id && !$program_id) {
            echo json_encode(['success' => false, 'message' => 'Document ID or Program ID required']);
            exit;
        }
        
        // Build the query based on what we have
        if ($document_id) {
            // Get history for a specific document
            $stmt = $conn->prepare('
                SELECT 
                    dh.*,
                    u.full_name as replaced_by_name,
                    d.original_name as current_document_name,
                    d.uploaded_at as current_uploaded_at
                FROM document_history dh
                LEFT JOIN users u ON u.id = dh.replaced_by
                LEFT JOIN documents d ON d.id = dh.original_document_id
                WHERE dh.original_document_id = ?
                ORDER BY dh.version_number DESC
            ');
            $stmt->bind_param('i', $document_id);
        } else {
            // Get history for all documents in a program
            $stmt = $conn->prepare('
                SELECT 
                    dh.*,
                    u.full_name as replaced_by_name,
                    d.original_name as current_document_name,
                    d.uploaded_at as current_uploaded_at
                FROM document_history dh
                LEFT JOIN users u ON u.id = dh.replaced_by
                LEFT JOIN documents d ON d.id = dh.original_document_id
                WHERE dh.program_id = ?
                ORDER BY dh.original_document_id, dh.version_number DESC
            ');
            $stmt->bind_param('i', $program_id);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $history = [];
        while ($row = $result->fetch_assoc()) {
            // Check if the historical file actually exists
            $file_path = __DIR__ . '/uploads/' . $row['file_path'];
            $file_exists = file_exists($file_path);
            
            $history[] = [
                'id' => $row['id'],
                'original_document_id' => $row['original_document_id'],
                'program_id' => $row['program_id'],
                'filename' => $row['filename'],
                'original_name' => $row['original_name'],
                'uploaded_by' => $row['uploaded_by'],
                'document_type' => $row['document_type'],
                'uploaded_at' => $row['uploaded_at'],
                'replaced_at' => $row['replaced_at'],
                'replaced_by' => $row['replaced_by'],
                'replaced_by_name' => $row['replaced_by_name'],
                'version_number' => $row['version_number'],
                'change_reason' => $row['change_reason'],
                'file_path' => $row['file_path'],
                'file_exists' => $file_exists,
                'current_document_name' => $row['current_document_name'],
                'current_uploaded_at' => $row['current_uploaded_at']
            ];
        }
        
        echo json_encode([
            'success' => true,
            'history' => $history,
            'total_records' => count($history),
            'message' => count($history) > 0 ? 'Document history retrieved successfully' : 'No document history found'
        ]);
        
    } catch (Exception $e) {
        error_log('Document history error: ' . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Error retrieving document history: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
