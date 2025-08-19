<?php
session_start(); // <-- Start the session at the very top
ob_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173'); // <-- Set to your frontend's URL
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once 'config.php';

try {
    // Get raw POST data
    $raw_data = file_get_contents('php://input');
    error_log("Raw POST data: " . $raw_data);
    error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
    
    // Initialize data array
    $data = [];
    
    // Try to decode as JSON first
    if (!empty($raw_data)) {
        $data = json_decode($raw_data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("JSON decode error: " . json_last_error_msg());
            $data = [];
        }
    }
    
    // If JSON failed or empty, try $_POST
    if (empty($data) && !empty($_POST)) {
        error_log("Using $_POST data instead");
        $data = $_POST;
    }
    
    error_log("Final data array: " . print_r($data, true));
    
    // Extract email and password
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    error_log("Extracted - Email: '$email', Password length: " . strlen($password));

    if (empty($email) || empty($password)) {
        error_log("Missing email or password");
        echo json_encode(['success' => false, 'message' => 'Email and password required.']);
        exit;
    }

    // Log the login attempt
    error_log("Login attempt for email: " . $email);

    // Initialize response variable
    $response = null;

    // First, check if user exists and get their current status
    $stmt = $conn->prepare('SELECT * FROM users WHERE email = ?');
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param('s', $email);
    if (!$stmt->execute()) {
        throw new Exception('Execute failed: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        error_log("No user found for email: " . $email);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;
    }

    // Check if account is locked due to failed attempts (for non-admin users only)
    if ($user['role'] !== 'admin') {
        if ($user['account_locked_at'] !== null) {
            error_log("Account locked for user: " . $email . " - Locked at: " . $user['account_locked_at']);
            echo json_encode([
                'success' => false, 
                'message' => 'Account is locked due to too many failed login attempts. Please contact an administrator to unlock your account.',
                'account_locked' => true
            ]);
            exit;
        }
    }

    // Check if account is inactive (admin deactivated)
    if ($user['is_active'] == 0) {
        error_log("Account inactive for user: " . $email);
        echo json_encode(['success' => false, 'message' => 'Account is inactive. Please contact an administrator.']);
        exit;
    }

    // Verify password
    if (password_verify($password, $user['password'])) {
        // Login successful - reset failed attempts and unlock account if it was locked
        $update_stmt = $conn->prepare('UPDATE users SET failed_login_attempts = 0, account_locked_at = NULL, lockout_reason = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?');
        $update_stmt->bind_param('i', $user['id']);
        $update_stmt->execute();
        $update_stmt->close();
        
        unset($user['password']); // Remove password from response
        
        // Convert cropped profile picture to base64 for frontend
        if ($user['cropped_profile_picture']) {
            $user['profilePhoto'] = 'data:image/jpeg;base64,' . base64_encode($user['cropped_profile_picture']);
        }
        
        // Remove the binary data to avoid JSON encoding issues
        unset($user['profile_picture']);
        unset($user['cropped_profile_picture']);
        
        // --- SESSION SETTING FOR LOGIN ---
        $_SESSION['user_id'] = $user['id']; // <-- This is the key line!
        
        $response = ['success' => true, 'user' => $user];
        error_log("Login successful for: " . $email);
    } else {
        // Password verification failed
        error_log("Password verification failed for: " . $email);
        
        // Increment failed login attempts for non-admin users only
        if ($user['role'] !== 'admin') {
            $new_failed_attempts = $user['failed_login_attempts'] + 1;
            
            if ($new_failed_attempts >= 5) {
                // Lock the account after 5 failed attempts
                $lock_stmt = $conn->prepare('UPDATE users SET failed_login_attempts = ?, account_locked_at = CURRENT_TIMESTAMP, lockout_reason = ? WHERE id = ?');
                $lockout_reason = 'Account locked due to 5 consecutive failed login attempts';
                $lock_stmt->bind_param('isi', $new_failed_attempts, $lockout_reason, $user['id']);
                $lock_stmt->execute();
                $lock_stmt->close();
                
                error_log("Account locked for user: " . $email . " after 5 failed attempts");
                echo json_encode([
                    'success' => false, 
                    'message' => 'Account is locked due to too many failed login attempts. Please contact an administrator to unlock your account.',
                    'account_locked' => true,
                    'attempts_remaining' => 0
                ]);
                exit;
            } else {
                // Update failed attempts count
                $update_stmt = $conn->prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?');
                $update_stmt->bind_param('ii', $new_failed_attempts, $user['id']);
                $update_stmt->execute();
                $update_stmt->close();
                
                $attempts_remaining = 5 - $new_failed_attempts;
                error_log("Failed login attempt for user: " . $email . " - Attempts: " . $new_failed_attempts . "/5");
                
                $response = [
                    'success' => false, 
                    'message' => 'Invalid email or password. ' . $attempts_remaining . ' attempts remaining before account lockout.',
                    'attempts_remaining' => $attempts_remaining
                ];
            }
        } else {
            // Admin users don't get locked out
            $response = ['success' => false, 'message' => 'Invalid email or password.'];
        }
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    // Only set response if it hasn't been set yet
    if (!isset($response)) {
        $response = ['success' => false, 'message' => 'Unexpected error occurred.'];
    }
}

$conn->close();

// Clear any output buffer and send response
ob_end_clean();
echo json_encode($response);
?>