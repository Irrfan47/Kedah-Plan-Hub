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
        $data = json_decode(file_get_contents('php://input'), true);
        $user_id = $data['user_id'] ?? '';
        $is_active = $data['is_active'] ?? 1;
        
        if (!$user_id) {
            echo json_encode(['success' => false, 'message' => 'User ID is required.']);
            exit;
        }
        
        // Debug logging
        error_log("Updating user status - User ID: $user_id, New Status: $is_active");
        
        // Update user status
        $stmt = $conn->prepare('UPDATE users SET is_active = ? WHERE id = ?');
        $stmt->bind_param('ii', $is_active, $user_id);
        
        if ($stmt->execute()) {
            // Verify the update
            $verify_stmt = $conn->prepare('SELECT is_active FROM users WHERE id = ?');
            $verify_stmt->bind_param('i', $user_id);
            $verify_stmt->execute();
            $result = $verify_stmt->get_result();
            $updated_user = $result->fetch_assoc();
            
            error_log("User status updated successfully. Verified value: " . $updated_user['is_active']);
            echo json_encode(['success' => true, 'message' => 'User status updated successfully.']);
        } else {
            error_log("Error updating user status: " . $stmt->error);
            echo json_encode(['success' => false, 'message' => 'Error updating user status.']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
?> 