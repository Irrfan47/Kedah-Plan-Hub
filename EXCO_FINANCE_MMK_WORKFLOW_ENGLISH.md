# 📋 WORKFLOW BETWEEN EXCO USERS AND FINANCE MMK

## 🎯 **System Overview**

The EXCO Budget Management System is a digital platform that manages the workflow of EXCO programs from draft stage until payment completion. This document explains the detailed workflow between EXCO users and Finance MMK officers.

---

## 👥 **User Roles in the System**

### **1. EXCO User (`exco_user`)**
- **Responsibilities**: Create and manage EXCO programs
- **Capabilities**: 
  - Create new programs
  - Upload required documents
  - Track program status
  - Answer queries from Finance MMK
  - View budget and allocations

### **2. Finance MMK (`finance_mmk`)**
- **Responsibilities**: Review, approve, and manage EXCO programs
- **Capabilities**:
  - Review all submitted programs
  - Approve or reject programs
  - Send queries to EXCO users
  - Manage program status
  - Control EXCO user budgets

---

## 🔄 **Complete Program Workflow**

### **Stage 1: Program Creation (EXCO User)**
```
📝 Draft → 📤 Submit for Review
```

**EXCO User Activities:**
1. **Create New Program**
   - Fill in program information (name, budget, recipient)
   - Upload required documents:
     - Service Center Acknowledgment Letter
     - PKN Approval Letter
     - Program Letter
     - EXCO Letter
     - Bank Account Statement
     - Code Registration Form
     - Additional documents (if any)

2. **Submit for Review**
   - Click "Submit" button to send program
   - Status changes from "Draft" to "Under Review"

**Notifications:**
- ✅ Admin receives "New Program Created" notification
- ✅ Other EXCO users receive notification
- ✅ Finance MMK receives "Program Under Review" notification

---

### **Stage 2: Initial Review (Finance MMK)**
```
👀 Under Review → ❓ Query (if needed) → ✅ Approve / ❌ Reject
```

**Finance MMK Activities:**
1. **Review Program**
   - View complete program information
   - Review uploaded documents
   - Determine if program meets requirements

2. **Actions That Can Be Taken:**
   - **Approve Program**: Status changes to "Complete can send to MMK"
   - **Reject Program**: Status changes to "Rejected"
   - **Send Query**: Status changes to "Query"

**Available Action Buttons:**
- 👁️ **View Documents**: Review all program documents
- 💬 **Add Remarks**: Give comments or instructions
- ❓ **Send Query**: Ask questions to EXCO user
- ✅ **Approve**: Approve program
- ❌ **Reject**: Reject program

---

### **Stage 3: Query Handling (if applicable)**
```
❓ Query → 📝 EXCO Response → 🔄 Review Again
```

**If Finance MMK Sends Query:**

1. **Finance MMK:**
   - Send query through "Query" button
   - Program status changes to "Query"
   - Notification sent to EXCO user

2. **EXCO User:**
   - Receive new query notification
   - Answer query through system
   - Upload additional documents if required
   - Status changes to "Query Answered"

3. **Finance MMK:**
   - Receive answer notification
   - Review answer and additional documents
   - Make decision: Approve or Reject

---

### **Stage 4: Submission to MMK Office**
```
📋 Complete → 🏢 MMK Review → ✅ Document Accepted
```

**EXCO User Activities:**
1. **Submit to MMK**
   - Click "Submit to MMK" button
   - Status changes to "Under Review by MMK"

**Finance MMK Activities:**
1. **Review for MMK**
   - Review program and documents again
   - Approve for MMK
   - Status changes to "Document Accepted by MMK"

---

### **Stage 5: Payment Processing**
```
💰 Payment in Progress → ✅ Payment Completed
```

**Finance MMK Activities:**
1. **Start Payment**
   - Click "Start Payment" button
   - Status changes to "Payment in Progress"

2. **Complete Payment**
   - Enter Voucher number
   - Enter EFT number
   - Click "Complete Payment" button
   - Status changes to "Payment Completed"

**Notifications:**
- ✅ EXCO user receives "Payment Completed" notification
- ✅ Finance Officer receives notification
- ✅ Super Admin receives notification

---

## 📊 **Budget Management**

### **Budget Control by Finance MMK:**
1. **View EXCO User Budgets**
   - Total budget amount
   - Budget already used
   - Remaining budget

2. **Edit EXCO User Budgets**
   - Click edit button (✏️) on budget table
   - Enter new budget amount
   - Click "Save" button to save

3. **Budget Table Shows:**
   - EXCO user name
   - Total programs
   - Pending programs
   - Total budget amount
   - Remaining budget

---

## 🔔 **Notification System**

### **Notifications for EXCO User:**
- 📝 Program status changes
- ❓ New queries from Finance MMK
- ✅ Document accepted by MMK
- 💰 Payment completed
- 💬 New remarks added

### **Notifications for Finance MMK:**
- 📝 New program under review
- ✅ Query answered by EXCO User
- 💬 New remarks added
- 🔄 Program status changes

---

## 📁 **Document Management**

### **Types of Documents Managed:**
1. **Original Documents** (uploaded by EXCO User)
2. **Finance Documents** (uploaded by Finance MMK)
3. **Additional Documents** (if required)

### **Document Functions:**
- 👁️ **View Documents**: Review document content
- 📥 **Download**: Download documents for storage
- 📤 **Upload**: Add new documents
- 🔄 **Replace Documents**: Change existing documents
- 📚 **Document History**: View all document versions

---

## ⚡ **Quick Actions**

### **For EXCO User:**
1. **Create Program**: Dashboard → Program Management → Create New Program
2. **Answer Query**: Query → Find program → Click "Answer Query"
3. **Track Status**: Status Tracking → View program progress

### **For Finance MMK:**
1. **Review Programs**: Program Management → View all programs
2. **Manage Queries**: Query → Review queries and answers
3. **Control Budget**: Dashboard → EXCO Users Budgets → Edit budget

---

## 🚨 **Program Status and Meanings**

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| **Draft** | Program in draft | EXCO User can edit and submit |
| **Under Review** | Under review | Finance MMK needs to review and make decision |
| **Query** | Has query | EXCO User needs to answer query |
| **Query Answered** | Query answered | Finance MMK needs to review answer |
| **Complete** | Ready for MMK | EXCO User can submit to MMK |
| **Under Review by MMK** | Under MMK review | Finance MMK needs to approve |
| **Document Accepted** | Accepted by MMK | Finance MMK can start payment |
| **Payment in Progress** | Payment being processed | Finance MMK needs to complete |
| **Payment Completed** | Payment completed | Program finished |
| **Rejected** | Rejected | EXCO User can recreate |

---

## 📋 **Action Checklist**

### **EXCO User Must:**
- [ ] Create program with complete information
- [ ] Upload all required documents
- [ ] Submit program for review
- [ ] Answer queries from Finance MMK (if any)
- [ ] Submit program to MMK (if approved)
- [ ] Track program status regularly

### **Finance MMK Must:**
- [ ] Review submitted programs
- [ ] Make decision: Approve, Reject, or Send Query
- [ ] Manage queries and answers
- [ ] Approve program for MMK
- [ ] Start and complete payment
- [ ] Control EXCO user budgets

---

## 🔧 **Troubleshooting**

### **Common Problems and Solutions:**

1. **Program Cannot Be Submitted**
   - Ensure all documents are uploaded
   - Check program information is complete
   - Ensure program status is "Draft"

2. **Query Not Answered**
   - Check "Query" tab in system
   - Ensure answer is submitted completely
   - Upload additional documents if required

3. **Budget Cannot Be Edited**
   - Ensure you are logged in as Finance MMK
   - Check that user is EXCO User
   - Try refreshing page and try again

4. **Documents Cannot Be Downloaded**
   - Check that document exists in system
   - Try downloading again
   - Contact admin if problem persists

---

## 📞 **Help and Support**

### **If You Need Help:**
1. **Check system documentation** first
2. **Use notification system** for communication
3. **Contact system admin** for technical issues
4. **Refer to user manual** for detailed guidance

### **Important Information:**
- System operates 24/7
- All actions are recorded in system
- Notifications sent automatically
- Data backup performed regularly

---

*This document was last updated on: [Current Date]*
*Version: 1.0*
*Generated for: EXCO Budget Management System*
