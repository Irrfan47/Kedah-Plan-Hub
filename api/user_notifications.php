<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Debug endpoint to check all notifications
    if (isset($_GET['debug']) && $_GET['debug'] === 'all') {
        try {
            $stmt = $conn->prepare('SELECT COUNT(*) as total FROM notifications');
            $stmt->execute();
            $result = $stmt->get_result();
            $count = $result->fetch_assoc()['total'];
            
            echo json_encode([
                'success' => true,
                'debug' => [
                    'total_notifications_in_database' => $count,
                    'message' => 'Debug mode: showing total notifications count'
                ]
            ]);
            exit;
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Debug error: ' . $e->getMessage()]);
            exit;
        }
    }
    
    // Debug endpoint to check database structure
    if (isset($_GET['debug']) && $_GET['debug'] === 'structure') {
        try {
            // Check what tables exist
            $tables = [];
            $result = $conn->query("SHOW TABLES");
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
            
            // Check notifications table structure
            $notificationsColumns = [];
            $result = $conn->query("DESCRIBE notifications");
            while ($row = $result->fetch_assoc()) {
                $notificationsColumns[] = $row;
            }
            
            // Check if programs table exists and its structure
            $programsColumns = [];
            if (in_array('programs', $tables)) {
                $result = $conn->query("DESCRIBE programs");
                while ($row = $result->fetch_assoc()) {
                    $programsColumns[] = $row;
                }
            }
            
            echo json_encode([
                'success' => true,
                'debug' => [
                    'available_tables' => $tables,
                    'notifications_table_structure' => $notificationsColumns,
                    'programs_table_structure' => $programsColumns,
                    'message' => 'Debug mode: showing database structure'
                ]
            ]);
            exit;
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Debug error: ' . $e->getMessage()]);
            exit;
        }
    }
    
    // Debug endpoint to check notifications table columns only
    if (isset($_GET['debug']) && $_GET['debug'] === 'columns') {
        try {
            $result = $conn->query("DESCRIBE notifications");
            $columns = [];
            while ($row = $result->fetch_assoc()) {
                $columns[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'debug' => [
                    'notifications_columns' => $columns,
                    'message' => 'Debug mode: showing notifications table columns only'
                ]
            ]);
            exit;
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Debug error: ' . $e->getMessage()]);
            exit;
        }
    }
    
    // Debug endpoint to check duplicate notifications
    if (isset($_GET['debug']) && $_GET['debug'] === 'duplicates') {
        try {
            // Find notifications with the same content
            $stmt = $conn->prepare('
                SELECT 
                    title, 
                    message, 
                    program_id, 
                    type,
                    COUNT(*) as count,
                    GROUP_CONCAT(id) as notification_ids,
                    GROUP_CONCAT(created_at) as created_times
                FROM notifications 
                WHERE program_id IS NOT NULL
                GROUP BY title, message, program_id, type
                HAVING COUNT(*) > 1
                ORDER BY COUNT(*) DESC
            ');
            $stmt->execute();
            $result = $stmt->get_result();
            
            $duplicates = [];
            while ($row = $result->fetch_assoc()) {
                $duplicates[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'debug' => [
                    'duplicate_notifications' => $duplicates,
                    'total_duplicate_groups' => count($duplicates),
                    'message' => 'Debug mode: showing duplicate notifications'
                ]
            ]);
            exit;
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Debug error: ' . $e->getMessage()]);
            exit;
        }
    }
    try {
        if (!isset($_GET['exco_user_id'])) {
            echo json_encode(['success' => false, 'message' => 'EXCO user ID is required']);
            exit;
        }

        $excoUserId = intval($_GET['exco_user_id']);
        
        // Get user role first to filter notifications appropriately
        $roleStmt = $conn->prepare('SELECT role FROM users WHERE id = ?');
        $roleStmt->bind_param('i', $excoUserId);
        $roleStmt->execute();
        $roleResult = $roleStmt->get_result()->fetch_assoc();
        $userRole = $roleResult ? $roleResult['role'] : 'exco_user';
        
        // Build query based on user role
        $query = '';
        $params = [];
        $bindTypes = '';
        
        // ALL users only see notifications directly sent to them (n.user_id = ?)
        // This matches how the main notification system works
        $query = '
            SELECT DISTINCT
                n.id,
                n.title,
                n.message,
                n.type,
                n.is_read,
                n.program_id,
                n.created_at
            FROM notifications n
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
        ';
        $params = [$excoUserId];
        $bindTypes = 'i';
        
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($bindTypes, ...$params);
        }
        
        // bind_param is already handled above based on role
        $stmt->execute();
        $result = $stmt->get_result();
        
        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'message' => $row['message'],
                'type' => $row['type'],
                'is_read' => intval($row['is_read']),
                'program_id' => $row['program_id'],
                'program_name' => null, // We'll get this separately if needed
                'created_at' => $row['created_at']
            ];
        }
        
        // Add debug information
        $debug = [
            'exco_user_id' => $excoUserId,
            'user_role' => $userRole,
            'total_notifications_found' => count($notifications),
            'query_executed' => true,
            'query_used' => $query
        ];
        
        // If debug mode is enabled, show more information
        if (isset($_GET['debug']) && $_GET['debug'] === 'detailed') {
            // Get all notifications directly sent to this user (matching main notification system)
            $debugQuery = '
                SELECT n.id, n.title, n.message, n.type, n.program_id, n.user_id
                FROM notifications n
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC
                LIMIT 10
            ';
            $debugParams = [$excoUserId];
            $debugBindTypes = 'i';
            
            $debugStmt = $conn->prepare($debugQuery);
            $debugStmt->bind_param($debugBindTypes, ...$debugParams);
            $debugStmt->execute();
            $debugResult = $debugStmt->get_result();
            
            $allUserNotifications = [];
            while ($row = $debugResult->fetch_assoc()) {
                $allUserNotifications[] = $row;
            }
            
            $debug['all_user_notifications'] = $allUserNotifications;
            $debug['debug_mode'] = 'detailed';
        }
        
        echo json_encode([
            'success' => true, 
            'notifications' => $notifications,
            'debug' => $debug
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error fetching user notifications: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['exco_user_id'])) {
            echo json_encode(['success' => false, 'message' => 'EXCO user ID is required']);
            exit;
        }

        $excoUserId = intval($input['exco_user_id']);
        $notificationId = isset($input['notification_id']) ? intval($input['notification_id']) : null;
        $markAll = isset($input['mark_all']) ? $input['mark_all'] : false;
        
        if ($markAll) {
            // Mark all notifications for this user as read
            $stmt = $conn->prepare('
                UPDATE notifications n
                SET n.is_read = 1
                WHERE 
                    -- Program under review (status_change with "under_review" status)
                    (n.type = "status_change" AND n.program_id IN (SELECT id FROM programs WHERE created_by = ?) AND n.message LIKE "%under review%") OR
                    -- Notifications directly sent to this user
                    (n.user_id = ?)
            ');
            $stmt->bind_param('ii', $excoUserId, $excoUserId);
        } else if ($notificationId) {
            // Mark specific notification as read
            $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');
            $stmt->bind_param('i', $notificationId);
        } else {
            echo json_encode(['success' => false, 'message' => 'Either notification_id or mark_all is required']);
            exit;
        }
        
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Notification(s) marked as read']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No notifications found to update']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error marking notification as read: ' . $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['exco_user_id'])) {
            echo json_encode(['success' => false, 'message' => 'EXCO user ID is required']);
            exit;
        }

        $excoUserId = intval($input['exco_user_id']);
        $notificationId = isset($input['notification_id']) ? intval($input['notification_id']) : null;
        $deleteAll = isset($input['delete_all']) ? $input['delete_all'] : false;
        
        if ($deleteAll) {
            // Delete all notifications for this user
            $stmt = $conn->prepare('
                DELETE n FROM notifications n
                WHERE 
                    -- Program under review (status_change with "under_review" status)
                    (n.type = "status_change" AND n.program_id IN (SELECT id FROM programs WHERE created_by = ?) AND n.message LIKE "%under review%") OR
                    -- Notifications directly sent to this user
                    (n.user_id = ?)
            ');
            $stmt->bind_param('ii', $excoUserId, $excoUserId);
        } else if ($notificationId) {
            // Delete specific notification
            $stmt = $conn->prepare('DELETE FROM notifications WHERE id = ?');
            $stmt->bind_param('i', $notificationId);
        } else {
            echo json_encode(['success' => false, 'message' => 'Either notification_id or delete_all is required']);
            exit;
        }
        
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Notification(s) deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No notifications found to delete']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error deleting notification: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);
