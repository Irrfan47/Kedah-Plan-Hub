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
        $admin_user_id = $data['admin_user_id'] ?? '';
        
        if (!$user_id || !$admin_user_id) {
            echo json_encode(['success' => false, 'message' => 'User ID and Admin User ID are required.']);
            exit;
        }
        
        // Verify that the requesting user is an admin
        $admin_check_stmt = $conn->prepare('SELECT role FROM users WHERE id = ?');
        $admin_check_stmt->bind_param('i', $admin_user_id);
        $admin_check_stmt->execute();
        $admin_result = $admin_check_stmt->get_result();
        $admin_user = $admin_result->fetch_assoc();
        
        if (!$admin_user || !in_array($admin_user['role'], ['admin', 'super_admin'])) {
            echo json_encode(['success' => false, 'message' => 'Only administrators can unlock accounts.']);
            exit;
        }
        
        // Get the user to be unlocked
        $user_check_stmt = $conn->prepare('SELECT id, full_name, email, account_locked_at, lockout_reason FROM users WHERE id = ?');
        $user_check_stmt->bind_param('i', $user_id);
        $user_check_stmt->execute();
        $user_result = $user_check_stmt->get_result();
        $user = $user_result->fetch_assoc();
        
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'User not found.']);
            exit;
        }
        
        if ($user['account_locked_at'] === null) {
            echo json_encode(['success' => false, 'message' => 'This account is not locked.']);
            exit;
        }
        
        // Unlock the account
        $unlock_stmt = $conn->prepare('UPDATE users SET failed_login_attempts = 0, account_locked_at = NULL, lockout_reason = NULL, is_active = 1 WHERE id = ?');
        $unlock_stmt->bind_param('i', $user_id);
        
                 if ($unlock_stmt->execute()) {
             // Account unlocked successfully - no need to log to status_history since it's not program-related
            
            echo json_encode([
                'success' => true, 
                'message' => 'Account unlocked successfully.',
                'user' => [
                    'id' => $user['id'],
                    'full_name' => $user['full_name'],
                    'email' => $user['email']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error unlocking account.']);
        }
        
        $admin_check_stmt->close();
        $user_check_stmt->close();
        $unlock_stmt->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
?>
