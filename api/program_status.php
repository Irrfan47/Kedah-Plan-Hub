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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $program_id = $data['program_id'] ?? '';
        $status = $data['status'] ?? '';
        $voucher_number = $data['voucher_number'] ?? null;
        $eft_number = $data['eft_number'] ?? null;
        $eft_date = $data['eft_date'] ?? null;
        
        // Debug logging
        error_log("Program status change request - program_id: $program_id, status: $status, voucher_number: $voucher_number, eft_number: $eft_number, eft_date: $eft_date");
        
        if (!$program_id || !$status) {
            echo json_encode(['success' => false, 'message' => 'Program ID and status are required.']);
            exit;
        }
        
        // Validate status
        $valid_statuses = ['draft', 'under_review', 'query', 'query_answered', 'complete_can_send_to_mmk', 'document_accepted_by_mmk', 'payment_in_progress', 'payment_completed', 'rejected'];
        if (!in_array($status, $valid_statuses)) {
            echo json_encode(['success' => false, 'message' => 'Invalid status.']);
            exit;
        }
        
        // Update program status
        if ($status === 'payment_completed' && ($voucher_number || $eft_number || $eft_date)) {
            // For payment_completed status, update with voucher, EFT numbers, and EFT date
            $stmt = $conn->prepare('UPDATE programs SET status = ?, voucher_number = ?, eft_number = ?, eft_date = ? WHERE id = ?');
            $stmt->bind_param('ssssi', $status, $voucher_number, $eft_number, $eft_date, $program_id);
        } else {
            // For other statuses, just update the status
            $stmt = $conn->prepare('UPDATE programs SET status = ? WHERE id = ?');
            $stmt->bind_param('si', $status, $program_id);
        }
        
        if ($stmt->execute()) {
            error_log("Status update executed successfully - affected rows: " . $stmt->affected_rows);
            if ($stmt->affected_rows > 0) {
                // Get program details first
                $program_stmt = $conn->prepare('SELECT program_name, created_by FROM programs WHERE id = ?');
                $program_stmt->bind_param('i', $program_id);
                $program_stmt->execute();
                $program_result = $program_stmt->get_result()->fetch_assoc();
                
                if (!$program_result) {
                    error_log("ERROR: Program not found for ID: $program_id");
                    echo json_encode(['success' => false, 'message' => 'Program not found.']);
                    exit;
                }
                
                // Insert into status_history table
                $history_stmt = $conn->prepare('INSERT INTO status_history (program_id, status, changed_by, changed_at, remarks) VALUES (?, ?, ?, NOW(), ?)');
                $changed_by = $data['changed_by'] ?? $program_result['created_by'] ?? 1; // Default to user ID 1 if not provided
                $remarks = "Status changed to $status";
                error_log("Inserting status history - program_id: $program_id, status: $status, changed_by: $changed_by, remarks: $remarks");
                
                // Validate changed_by is not null or empty
                if (!$changed_by) {
                    error_log("ERROR: changed_by is null or empty, using default value 1");
                    $changed_by = 1;
                }
                
                $history_stmt->bind_param('isis', $program_id, $status, $changed_by, $remarks);
                if ($history_stmt->execute()) {
                    error_log("Status history inserted successfully");
                } else {
                    error_log("Failed to insert status history: " . $history_stmt->error);
                }
                $history_stmt->close();
                
                if ($program_result) {
                    $program_name = $program_result['program_name'];
                    $created_by = $program_result['created_by'];
                    
                    // Validate program data
                    if (!$program_name || !$created_by) {
                        error_log("ERROR: Invalid program data - program_name: $program_name, created_by: $created_by");
                        echo json_encode(['success' => false, 'message' => 'Invalid program data.']);
                        exit;
                    }
                    
                    // Always notify the program creator for any status change
                    if ($created_by) {
                        error_log("Creating notification for program creator - user_id: $created_by, program_name: $program_name, status: $status");
                        
                        // Validate required fields for notification
                        if (!$created_by || !$program_name || !$status || !$program_id) {
                            error_log("ERROR: Missing required fields for notification - created_by: $created_by, program_name: $program_name, status: $status, program_id: $program_id");
                        } else {
                            $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                            $title = 'Program Status Changed';
                            $message = "Your program '$program_name' status changed to " . ucwords(str_replace('_', ' ', $status));
                            $type = 'status_change';
                            $notification_stmt->bind_param('isssi', $created_by, $title, $message, $type, $program_id);
                            if ($notification_stmt->execute()) {
                                error_log("Notification created successfully for program creator");
                            } else {
                                error_log("Failed to create notification for program creator: " . $notification_stmt->error);
                            }
                        }
                    }
                    
                    // Create notifications based on status change
                    if ($status === 'under_review') {
                        // Notify Finance MMK users
                        $finance_users = $conn->query("SELECT id FROM users WHERE role IN ('finance_mmk', 'finance_officer', 'super_admin')");
                        while ($finance = $finance_users->fetch_assoc()) {
                            $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                            $title = 'Program Under Review';
                            $message = "Program '$program_name' is now under review";
                            $type = 'status_change';
                            $notification_stmt->bind_param('isssi', $finance['id'], $title, $message, $type, $program_id);
                            $notification_stmt->execute();
                        }
                    } elseif ($status === 'payment_completed') {
                        // Notify Finance Officer and Super Admin
                        $finance_officer_users = $conn->query("SELECT id FROM users WHERE role = 'finance_officer'");
                        while ($finance_officer = $finance_officer_users->fetch_assoc()) {
                            $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                            $title = 'Payment Completed';
                            $message = "Program '$program_name' payment has been completed";
                            $type = 'status_change';
                            $notification_stmt->bind_param('isssi', $finance_officer['id'], $title, $message, $type, $program_id);
                            $notification_stmt->execute();
                        }
                        
                        $super_admin_users = $conn->query("SELECT id FROM users WHERE role = 'super_admin'");
                        while ($super_admin = $super_admin_users->fetch_assoc()) {
                            $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                            $title = 'Payment Completed';
                            $message = "Program '$program_name' payment has been completed";
                            $type = 'status_change';
                            $notification_stmt->bind_param('isssi', $super_admin['id'], $title, $message, $type, $program_id);
                            $notification_stmt->execute();
                        }
                        
                        // Notify Admin users
                        $admin_users = $conn->query("SELECT id FROM users WHERE role = 'admin'");
                        while ($admin = $admin_users->fetch_assoc()) {
                            $notification_stmt = $conn->prepare('INSERT INTO notifications (user_id, title, message, type, program_id) VALUES (?, ?, ?, ?, ?)');
                            $title = 'Payment Completed';
                            $message = "Program '$program_name' payment has been completed";
                            $type = 'status_change';
                            $notification_stmt->bind_param('isssi', $admin['id'], $title, $message, $type, $program_id);
                            $notification_stmt->execute();
                        }
                    } elseif ($status === 'document_accepted_by_mmk') {
                        // Budget validation and deduction when program reaches Document Accepted status
                        $program_budget_stmt = $conn->prepare('SELECT budget, created_by FROM programs WHERE id = ?');
                        $program_budget_stmt->bind_param('i', $program_id);
                        $program_budget_stmt->execute();
                        $program_budget_result = $program_budget_stmt->get_result()->fetch_assoc();
                        
                        if ($program_budget_result) {
                            $program_budget = floatval($program_budget_result['budget']);
                            $created_by = $program_budget_result['created_by'];
                            
                            // Check if user is an EXCO user and validate budget
                            $user_check = $conn->prepare('SELECT role, total_budget FROM users WHERE id = ?');
                            $user_check->bind_param('i', $created_by);
                            $user_check->execute();
                            $user_result = $user_check->get_result();
                            
                            if ($user_result->num_rows > 0) {
                                $user_data = $user_result->fetch_assoc();
                                
                                if ($user_data['role'] === 'exco_user') {
                                    $total_budget = floatval($user_data['total_budget']);
                                    
                                    // Get already deducted budget from other programs
                                    $deducted_budget_stmt = $conn->prepare('SELECT SUM(budget) as deducted_budget FROM programs WHERE created_by = ? AND status IN ("document_accepted_by_mmk", "payment_in_progress", "payment_completed") AND id != ?');
                                    $deducted_budget_stmt->bind_param('ii', $created_by, $program_id);
                                    $deducted_budget_stmt->execute();
                                    $deducted_budget_result = $deducted_budget_stmt->get_result()->fetch_assoc();
                                    
                                    $deducted_budget = $deducted_budget_result['deducted_budget'] ? floatval($deducted_budget_result['deducted_budget']) : 0;
                                    $remaining_budget = $total_budget - $deducted_budget;
                                    
                                    // Check if program budget exceeds remaining budget
                                    if ($program_budget > $remaining_budget) {
                                        // Revert the status change since budget is insufficient
                                        $revert_stmt = $conn->prepare('UPDATE programs SET status = ? WHERE id = ?');
                                        $revert_stmt->bind_param('si', 'complete_can_send_to_mmk', $program_id);
                                        $revert_stmt->execute();
                                        
                                        $exceeded_amount = $program_budget - $remaining_budget;
                                        echo json_encode([
                                            'success' => false, 
                                            'message' => 'Budget exceeded. Program budget exceeds remaining budget by RM ' . number_format($exceeded_amount, 2) . '. Cannot accept document.',
                                            'budget_error' => true,
                                            'program_budget' => $program_budget,
                                            'remaining_budget' => $remaining_budget,
                                            'total_budget' => $total_budget,
                                            'deducted_budget' => $deducted_budget
                                        ]);
                                        exit;
                                    }
                                    
                                    $deducted_budget_stmt->close();
                                }
                            }
                            $user_check->close();
                            $program_budget_stmt->close();
                        }
                    } elseif ($status === 'rejected') {
                        // No need to notify program creator here - already done in general block
                    }
                }
                
                error_log("Program status change completed successfully for program_id: $program_id, new_status: $status");
                echo json_encode(['success' => true, 'message' => 'Program status updated successfully.']);
            } else {
                error_log("Program status change failed - no rows affected for program_id: $program_id");
                echo json_encode(['success' => false, 'message' => 'Program not found or no changes made.']);
            }
        } else {
            error_log("Program status update failed with error: " . $conn->error);
            echo json_encode(['success' => false, 'message' => 'Error updating program status: ' . $conn->error]);
        }
        
        $stmt->close();
    } catch (Exception $e) {
        error_log("ERROR: Exception occurred during program status change: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'An error occurred: ' . $e->getMessage()]);
    }
    exit;
}
echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
