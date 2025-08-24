<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $program_id = $_GET['program_id'] ?? null;
    
    if ($program_id) {
        // Get queries for a specific program
        $stmt = $conn->prepare('SELECT * FROM queries WHERE program_id = ? ORDER BY created_at DESC');
        $stmt->bind_param('i', $program_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $queries = [];
        while ($row = $result->fetch_assoc()) {
            $queries[] = $row;
        }
        echo json_encode(['success' => true, 'queries' => $queries]);
    } else {
        // Get all queries
        $result = $conn->query('SELECT * FROM queries ORDER BY created_at DESC');
        $queries = [];
        while ($row = $result->fetch_assoc()) {
            $queries[] = $row;
        }
        echo json_encode(['success' => true, 'queries' => $queries]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $program_id = $data['program_id'] ?? '';
    $question = $data['question'] ?? '';
    $created_by = $data['created_by'] ?? '';
    
    if (!$program_id || !$question || !$created_by) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        exit;
    }
    
    // Insert the query
    $stmt = $conn->prepare('INSERT INTO queries (program_id, question, created_by) VALUES (?, ?, ?)');
    $stmt->bind_param('iss', $program_id, $question, $created_by);
    
    if ($stmt->execute()) {
        $query_id = $stmt->insert_id;
        
        // Update program status to 'query'
        $update_stmt = $conn->prepare('UPDATE programs SET status = ? WHERE id = ?');
        $status = 'query';
        $update_stmt->bind_param('si', $status, $program_id);
        $update_stmt->execute();
        
        // Get program name for notification
        $program_stmt = $conn->prepare('SELECT program_name, created_by FROM programs WHERE id = ?');
        $program_stmt->bind_param('i', $program_id);
        $program_stmt->execute();
        $program_result = $program_stmt->get_result()->fetch_assoc();
        $program_name = $program_result['program_name'];
        $program_creator = $program_result['created_by'];
        
        // Notify the EXCO user who created the program when a query is created
        if ($program_creator) {
            // Check if the program creator is an EXCO user
            $user_role_stmt = $conn->prepare('SELECT role FROM users WHERE id = ?');
            $user_role_stmt->bind_param('i', $program_creator);
            $user_role_stmt->execute();
            $user_role_result = $user_role_stmt->get_result()->fetch_assoc();
            $user_role = $user_role_result ? $user_role_result['role'] : '';
            
            if ($user_role === 'exco_user') {
                $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                $title = 'Program Status Changed';
                $message = "Finance MMK has submitted a query for program '$program_name'";
                $type = 'status_change';
                $notification_stmt->bind_param('isssi', $program_creator, $title, $message, $type, $program_id);
                $notification_stmt->execute();
            }
        }
        
        echo json_encode(['success' => true, 'query_id' => $query_id]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create query.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $query_id = $data['query_id'] ?? '';
    $answer = $data['answer'] ?? '';
    $answered_by = $data['answered_by'] ?? '';
    
    if (!$query_id || !$answer || !$answered_by) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
        exit;
    }
    
    // Update the query with answer
    $stmt = $conn->prepare('UPDATE queries SET answer = ?, answered = 1 WHERE id = ?');
    $stmt->bind_param('si', $answer, $query_id);
    
    if ($stmt->execute()) {
        // Get the program_id for this query
        $get_program_stmt = $conn->prepare('SELECT program_id FROM queries WHERE id = ?');
        $get_program_stmt->bind_param('i', $query_id);
        $get_program_stmt->execute();
        $program_result = $get_program_stmt->get_result();
        $program_row = $program_result->fetch_assoc();
        $program_id = $program_row['program_id'];
        
        // Update program status to 'query_answered'
        $update_stmt = $conn->prepare('UPDATE programs SET status = ? WHERE id = ?');
        $status = 'query_answered';
        $update_stmt->bind_param('si', $status, $program_id);
        $update_stmt->execute();
        
        // Get program name for notification
        $program_stmt = $conn->prepare('SELECT program_name FROM programs WHERE id = ?');
        $program_stmt->bind_param('i', $program_id);
        $program_stmt->execute();
        $program_result = $program_stmt->get_result()->fetch_assoc();
        $program_name = $program_result['program_name'];
        
        // Create notifications for Finance MMK users only, except the one who answered
        // Get the user ID of the person who answered the query
        $answer_creator_stmt = $conn->prepare("SELECT id FROM users WHERE full_name = ?");
        $answer_creator_stmt->bind_param('s', $answered_by);
        $answer_creator_stmt->execute();
        $answer_creator_result = $answer_creator_stmt->get_result();
        $answer_creator_id = null;
        if ($answer_creator_row = $answer_creator_result->fetch_assoc()) {
            $answer_creator_id = $answer_creator_row['id'];
        }
        $answer_creator_stmt->close();
        
                 // Notify Finance MMK users
         $finance_mmk_users = $conn->query("SELECT id FROM users WHERE role = 'finance_mmk'");
         while ($finance_mmk = $finance_mmk_users->fetch_assoc()) {
             // Skip the user who answered the query
             if ($finance_mmk['id'] != $answer_creator_id) {
                 $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                 $title = 'Query Answered';
                 $message = "Query answered for '$program_name'";
                 $type = 'query_answered';
                 $notification_stmt->bind_param('isssi', $finance_mmk['id'], $title, $message, $type, $program_id);
                 $notification_stmt->execute();
             }
         }
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to answer query.']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method.']); 