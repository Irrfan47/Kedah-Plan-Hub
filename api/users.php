<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['exco_stats'])) {
    try {
        // Get all exco_users with their budgets and program stats
        $users = [];
        $result = $conn->query("SELECT id, full_name, total_budget FROM users WHERE role = 'exco_user'");
        if (!$result) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            exit;
        }
        
        while ($user = $result->fetch_assoc()) {
            $user_id = $user['id'];
            // Total programs
            $totalPrograms = $conn->query("SELECT COUNT(*) as cnt FROM programs WHERE created_by = '$user_id'")->fetch_assoc()['cnt'];
            // Pending programs
            $pendingPrograms = $conn->query("SELECT COUNT(*) as cnt FROM programs WHERE created_by = '$user_id' AND status NOT IN ('payment_completed','rejected')")->fetch_assoc()['cnt'];
            // Allocated programs budget (complete_can_send_to_mmk status and beyond, excluding rejected)
            $allocatedBudget = $conn->query("SELECT SUM(budget) as sum FROM programs WHERE created_by = '$user_id' AND status IN ('complete_can_send_to_mmk', 'under_review_by_mmk', 'document_accepted_by_mmk', 'payment_in_progress', 'payment_completed')")->fetch_assoc()['sum'] ?? 0;
            $allocatedBudget = $allocatedBudget ? floatval($allocatedBudget) : 0;
            // Remaining budget
            $remainingBudget = floatval($user['total_budget']) - $allocatedBudget;
            $users[] = [
                'id' => $user_id,
                'name' => $user['full_name'],
                'total_budget' => floatval($user['total_budget']),
                'remaining_budget' => $remainingBudget,
                'total_programs' => intval($totalPrograms),
                'pending_programs' => intval($pendingPrograms),
            ];
        }
        echo json_encode(['success' => true, 'users' => $users]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching EXCO stats: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['user_budget'])) {
    try {
        $user_id = $_GET['user_id'] ?? null;
        if (!$user_id) {
            echo json_encode(['success' => false, 'message' => 'User ID required.']);
            exit;
        }
        
        // Get user budget information
        $stmt = $conn->prepare('SELECT id, full_name, role, total_budget FROM users WHERE id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'User not found.']);
            exit;
        }
        
        $user = $result->fetch_assoc();
        
        if ($user['role'] === 'exco_user') {
            // Calculate remaining budget for EXCO user
            $total_budget = floatval($user['total_budget']);
            
            // Get allocated programs budget (complete_can_send_to_mmk status and beyond, excluding rejected)
            $allocated_budget_stmt = $conn->prepare('SELECT SUM(budget) as allocated_budget FROM programs WHERE created_by = ? AND status IN ("complete_can_send_to_mmk", "under_review_by_mmk", "document_accepted_by_mmk", "payment_in_progress", "payment_completed")');
            $allocated_budget_stmt->bind_param('i', $user_id);
            $allocated_budget_stmt->execute();
            $allocated_budget_result = $allocated_budget_stmt->get_result();
            $allocated_budget_data = $allocated_budget_result->fetch_assoc();
            
            $allocated_budget = $allocated_budget_data['allocated_budget'] ? floatval($allocated_budget_data['allocated_budget']) : 0;
            $remaining_budget = $total_budget - $allocated_budget;
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role'],
                    'total_budget' => $total_budget,
                    'allocated_budget' => $allocated_budget,
                    'remaining_budget' => $remaining_budget
                ]
            ]);
            
            $approved_budget_stmt->close();
        } else {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'full_name' => $user['full_name'],
                    'role' => $user['role'],
                    'total_budget' => 0,
                    'approved_budget' => 0,
                    'remaining_budget' => 0
                ]
            ]);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching user budget: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query('SELECT id, full_name, email, phone_number, role, is_active, created_at, last_login, failed_login_attempts, account_locked_at, lockout_reason, portfolio FROM users');
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode(['success' => true, 'users' => $users]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['set_budget'])) {
            // Only finance_mmk can set budget (finance_officer and super_admin are view-only)
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $total_budget = $data['total_budget'] ?? null;
    if (!$user_id || $total_budget === null) {
        echo json_encode(['success' => false, 'message' => 'User ID and total_budget required.']);
        exit;
    }
    $stmt = $conn->prepare('UPDATE users SET total_budget = ? WHERE id = ? AND role = "exco_user"');
    $stmt->bind_param('di', $total_budget, $user_id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update budget.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $full_name = $data['full_name'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $phone_number = $data['phone_number'] ?? '';
    $role = $data['role'] ?? '';
    $portfolio = $data['portfolio'] ?? '';
    if (!$full_name || !$email || !$password) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        exit;
    }
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('INSERT INTO users (full_name, email, password, phone_number, role, portfolio) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('ssssss', $full_name, $email, $hashed_password, $phone_number, $role, $portfolio);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'user_id' => $stmt->insert_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error creating user.']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method.']); 