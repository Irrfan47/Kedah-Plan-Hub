# 🔔 Notification System Overview

## 📋 **User Roles**
- **Admin** (`admin`)
- **EXCO User** (`exco_user`)
- **Finance MMK** (`finance_mmk`)
- **Finance Officer** (`finance_officer`)
- **Super Admin** (`super_admin`)

---

## 🎯 **Notification Triggers & Recipients**

### **1. Program Creation** 📝
**When**: New program is created
**Recipients**:
- ✅ **Admin** - "New Program Created"
- ✅ **Other EXCO Users** - "New Program Created by EXCO User" (not the creator)
- ✅ **Finance MMK/Officer/Super Admin** - "New Program Under Review" (only if status = 'under_review')

**Message**: "Program '[Program Name]' has been created by [Creator Name]"

---

### **2. Status Changes** 🔄

#### **A. Under Review** 👀
**When**: Program status changes to 'under_review'
**Recipients**:
- ✅ **Finance MMK** - "Program Under Review"
- ✅ **Finance Officer** - "Program Under Review"
- ✅ **Super Admin** - "Program Under Review"
- ✅ **EXCO User** - "Program Status Changed"

**Message**: "Program '[Program Name]' is now under review"

#### **B. Payment Completed** ✅
**When**: Program status changes to 'payment_completed'
**Recipients**:
- ✅ **Program Creator** - "Payment Completed"
- ✅ **Finance Officer** - "Payment Completed"
- ✅ **Super Admin** - "Payment Completed"

**Message**: 
- Creator: "Your program '[Program Name]' payment has been completed"
- Others: "Program '[Program Name]' payment has been completed"

#### **C. Document Accepted by MMK** 📄
**When**: Program status changes to 'document_accepted_by_mmk'
**Recipients**:
- ✅ **Program Creator** - "Document Accepted"

**Message**: "Your program '[Program Name]' document has been accepted by MMK office"

#### **D. Under Review by MMK** 🔍
**When**: Program status changes to 'under_review_by_mmk'
**Recipients**:
- ✅ **Program Creator** - "Under Review by MMK"

**Message**: "Your program '[Program Name]' is now under review by MMK office"

#### **E. Program Rejected** ❌
**When**: Program status changes to 'rejected'
**Recipients**:
- ✅ **Program Creator** - "Program Rejected"

**Message**: "Your program '[Program Name]' has been rejected"

---

### **3. Query System** ❓

#### **A. Query Submitted** 📝
**When**: Finance MMK submits a query
**Recipients**:
- ✅ **Program Creator (EXCO User)** - "New Query from Finance MMK"

**Message**: "Finance MMK has submitted a query for program '[Program Name]'"

#### **B. Query Answered** ✅
**When**: EXCO User answers a query
**Recipients**:
- ✅ **Finance MMK** - "Query Answered"

**Message**: "EXCO USER has answered a query for program '[Program Name]'"

---

### **4. Remarks** 💬
**When**: Any user adds a remark to a program
**Recipients**:
- ✅ **All other users** - "New Remark Added" (except the user who added the remark)

**Message**: "New remark added to program '[Program Name]' by [User Name]"

---

## 📊 **Notification Summary by Role**

### **Admin** 👑
- ✅ New program created
- ✅ New remarks added

### **EXCO User** 👤
- ✅ New program created (only for programs created by other EXCO users)
- ✅ Program status changes (Under Review)
- ✅ New queries from Finance MMK (only for their own programs)
- ✅ New remarks added (except their own remarks)

### **Finance MMK** 💰
- ✅ New program under review
- ✅ Program status changes (Under Review)
- ✅ Query answered by EXCO User
- ✅ New remarks added (except their own remarks)

### **Finance Officer** 💼
- ✅ New program under review
- ✅ Program status changes (Under Review)
- ✅ Payment completed
- ✅ New remarks added (except their own remarks)

### **Super Admin** 🔧
- ✅ New program under review
- ✅ Program status changes (Under Review)
- ✅ Payment completed
- ✅ New remarks added (except their own remarks)

### **Program Creator** 🎯
- ✅ Payment completed
- ✅ Document accepted by MMK
- ✅ Under review by MMK
- ✅ Program rejected

---

## 🔧 **Technical Implementation**

### **Database Structure**
```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    program_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (program_id) REFERENCES programs(id)
);
```

### **Notification Types**
- `program_created` - New program created
- `status_change` - Program status changed
- `query` - New query submitted
- `query_answered` - Query answered
- `remark_added` - New remark added

### **Frontend Integration**
- Notifications are fetched via `/api/notifications.php`
- Real-time updates possible with polling or WebSocket
- Unread count displayed in navigation
- Click to mark as read functionality

---

## 🎯 **Key Features**

1. **Role-Based Targeting** - Notifications sent only to relevant users
2. **Program-Specific** - Each notification linked to specific program
3. **Read Status Tracking** - Users can mark notifications as read
4. **Timestamp Tracking** - All notifications include creation time
5. **Type Categorization** - Different notification types for filtering

---

## 📈 **Notification Flow Example**

**Scenario**: EXCO User creates a program → Finance MMK reviews → Query submitted → Query answered → Payment completed

1. **Program Created** → Admin + EXCO User notified
2. **Status: Under Review** → Finance MMK + EXCO User notified
3. **Query Submitted** → EXCO User notified
4. **Query Answered** → Finance MMK notified
5. **Payment Completed** → Program Creator + EXCO User notified

**Total Notifications**: 8 notifications across 5 events 