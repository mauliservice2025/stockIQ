const INITIAL_DATA = {
  "users": [	
    {
        "id": "USR-107",5
1        "created_at": "2026-10-03T16:41:15.272Z",
        "status": "ACTIVE",
        "failed_logins": 0,&
"        "employee_id": "EMP-9107",-
)        "employee_name": "Sanket Borole",#
        "first_name": "Sanket", 
        "middle_name": null,"
        "last_name": "Borole",,
(        "display_name": "Sanket Borole",)
%        "full_name": "Sanket Borole",&
"        "user_type": "Technician",&
"        "designation": "Mechanic",3
/        "department": "Operations Directorate",
        "specialty": null,*
&        "mobile_number": "8765678765","
        "phone": "8765678765",4
0        "email": "pravinofficial2020@gmail.com","
        "username": "SANKETB",-
)        "primary_role": "ROLE-STORE-MGR",$
         "company_id": "COMP-01",#
        "plant_id": "PLANT-01", 
        "assigned_plants": [
            "ALL",
            "PLANT-01",
            "PLANT-02"

        ],*
&        "warehouse_id": "WH-PUN-MAIN",0
,        "reporting_manager": "Pravin Patil",)
%        "joining_date": "2026-06-15",9
5        "effective_from": "2026-10-02T18:30:00.000Z",!
        "effective_to": null,!
        "locked_until": null,'
#        "two_factor_enabled": true,0
,        "password_salt": "54f0bfd0b102ddc0",x
t        "password_hash": "sha256$54f0bfd0b102ddc0$5fe9db8246d633bfd4ecf4df4ab9b9873b85d1f471512ad2764ddaf0d00b1b81",!
        "password_history": [k
g            "sha256$e15306499da307a5$0d0006c7fbc0fb1b3e58cdb500991cef37312be3ff9def3249de0cdceb4488c4",j
f            "sha256$54f0bfd0b102ddc0$5fe9db8246d633bfd4ecf4df4ab9b9873b85d1f471512ad2764ddaf0d00b1b81"

        ],*
&        "must_change_password": false,@
<        "password_last_changed": "2026-10-19T02:19:54.037Z",C
?        "temp_password_expires_at": "2026-10-04T16:41:14.817Z",0
,        "primary_role_id": "ROLE-STORE-MGR",8
4        "last_login_at": "2026-10-19T02:19:21.645Z",5
1        "updated_at": "2026-10-19T02:19:54.151Z",,
(        "selected_branch_id": "PLANT-01"

    },	
    {
      "id": "USR-001", 
      "username": "PRAVINP",$
       "employee_id": "EMP-9042",*
&      "employee_name": "Pravin Patil",!
      "first_name": "Pravin",
      "middle_name": "R",
      "last_name": "Patil",)
%      "display_name": "Pravin Patil",&
"      "full_name": "Pravin Patil",
      "user_type": "Admin",C
?      "designation": "Chief Technology Officer & System Admin",9
5      "department": "Management Information Systems",9
5      "specialty": "Enterprise Architecture & Cloud",(
$      "mobile_number": "9822011234",)
%      "email": "pravinp@apexind.com",
      "status": "ACTIVE",'
#      "primary_role": "ROLE-ADMIN",*
&      "primary_role_id": "ROLE-ADMIN","
      "company_id": "COMP-01",!
      "plant_id": "PLANT-01",(
$      "warehouse_id": "WH-PUN-MAIN",4
0      "reporting_manager": "Board of Directors",7
3      "effective_from": "2022-12-31T18:30:00.000Z",5
1      "effective_to": "2030-12-30T18:30:00.000Z",
      "failed_logins": 0,
      "locked_until": null,.
*      "password_salt": "8e586b61258a4e78",v
r      "password_hash": "sha256$8e586b61258a4e78$3e97b9a6561cadd5acc3251e2589fd03aab1acd429423928e0d76b05f6ab41f8",
      "password_history": [g
c        "sha256$7614ce883e323258$5890cc50b36610396971005f69ef512c1a1c095ac7882d4e37de7f47c681960b",g
c        "sha256$48cffd77e87ed7da$1806e7c0e78d5f5665025eff68f40556c325f48406d93f0823c2c6d90cf1d7ce",f
b        "sha256$8e586b61258a4e78$3e97b9a6561cadd5acc3251e2589fd03aab1acd429423928e0d76b05f6ab41f8"
      ],(
$      "must_change_password": false,>
:      "password_last_changed": "2026-09-26T20:37:36.904Z",3
/      "last_login": "2026-09-24T11:59:56.803Z",3
/      "created_at": "2026-09-24T05:27:45.751Z",%
!      "two_factor_enabled": true, 
      "phone": "9822011234", 
      "secondary_roles": [],'
#      "joining_date": "2023-01-01",3
/      "updated_at": "2026-10-01T07:45:09.063Z",A
=      "temp_password_expires_at": "2026-09-25T09:39:47.867Z",6
2      "last_login_at": "2026-10-01T06:55:42.191Z",+
'      "selected_branch_id": "PLANT-01",!
      "assigned_plants": null

    },	
    {
        "id": "USR-002",'
#        "username": "QA_LEAD_2026",&
"        "employee_id": "EMP-9002",0
,        "employee_name": "Rushikesh Dhiwar",&
"        "first_name": "Rushikesh", 
        "middle_name": null,"
        "last_name": "Dhiwar",/
+        "display_name": "Rushikesh Dhiwar",,
(        "full_name": "Rushikesh Dhiwar",$
         "user_type": "Employee",>
:        "designation": "Senior Warehouse & Store Manager",/
+        "department": "Warehouse & Stores",
        "specialty": null,*
&        "mobile_number": "9833022345",,
(        "email": "r.sharma@apexind.com",
        "status": "ACTIVE",'
#        "primary_role": "ROLE-003",*
&        "primary_role_id": "ROLE-003",$
         "company_id": "COMP-01",#
        "plant_id": "PLANT-01",*
&        "warehouse_id": "WH-PUN-MAIN",0
,        "reporting_manager": "Pravin Patil",)
%        "joining_date": "2023-03-15",9
5        "effective_from": "2023-03-14T18:30:00.000Z",7
3        "effective_to": "2029-12-30T18:30:00.000Z",
        "failed_logins": 0,!
        "locked_until": null,'
#        "two_factor_enabled": true,0
,        "password_salt": "e5f6a1b2c3d49999",x
t        "password_hash": "sha256$e5f6a1b2c3d49999$20b154ea3e9e64898bf2d7aa650542dded6d5b7c6af55fb74596354e142bbbc2",!
        "password_history": [j
f            "sha256$b70d423aacf95b7e$270aada03af23c90f189eb0fa153d972e4655706600ddb60ff5a197c34065339"

        ],*
&        "must_change_password": false,@
<        "password_last_changed": "2026-09-26T15:09:59.129Z",1
-        "last_login": "2026-09-16T09:15:00Z",5
1        "created_at": "2026-09-24T05:27:45.752Z","
        "phone": "9833022345","
        "secondary_roles": [],5
1        "updated_at": "2026-10-16T10:38:33.854Z",C
?        "temp_password_expires_at": "2026-09-25T09:43:29.334Z",8
4        "last_login_at": "2026-09-29T05:19:01.796Z",#
        "assigned_plants": null

    },	
    {
      "id": "USR-003", 
      "username": "a.desai",$
       "employee_id": "EMP-9003",)
%      "employee_name": "Anita Desai", 
      "first_name": "Anita",
      "middle_name": "",
      "last_name": "Desai",(
$      "display_name": "Anita Desai",%
!      "full_name": "Anita Desai","
      "user_type": "Employee",=
9      "designation": "Manager - Strategic Sourcing & PO",/
+      "department": "Procurement & Supply",
      "specialty": null,(
$      "mobile_number": "9844033456",)
%      "email": "a.desai@apexind.com",
      "status": "ACTIVE",%
!      "primary_role": "ROLE-003",(
$      "primary_role_id": "ROLE-003","
      "company_id": "COMP-01",!
      "plant_id": "PLANT-01",(
$      "warehouse_id": "WH-PUN-MAIN",/
+      "reporting_manager": "Sanjay Kapoor",7
3      "effective_from": "2023-04-30T18:30:00.000Z",5
1      "effective_to": "2028-12-30T18:30:00.000Z",
      "failed_logins": 1,
      "locked_until": null,%
!      "two_factor_enabled": true,.
*      "password_salt": "a1b2c3d4e5f67890",v
r      "password_hash": "sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4",!
      "password_history": [],(
$      "must_change_password": false,/
+      "last_login": "2026-09-16T08:45:00Z",3
/      "created_at": "2026-09-24T05:27:45.753Z", 
      "phone": "9844033456",(
$      "password_last_changed": null, 
      "last_login_at": null,3
/      "updated_at": "2026-10-01T10:49:30.159Z", 
      "secondary_roles": [],!
      "assigned_plants": null

    },	
    {
      "id": "USR-106",
      "username": "SAGARS",$
       "employee_id": "EMP-9106",*
&      "employee_name": "Sagar Sabale", 
      "first_name": "Sagar",
      "middle_name": "",
      "last_name": "Sable",(
$      "display_name": "Sagar Sable",%
!      "full_name": "Sagar Sable","
      "user_type": "Employee",6
2      "designation": "Store Operations Executive",3
/      "department": "Hydraulics Assembly Dept",
      "specialty": "",(
$      "mobile_number": "9820260106", 
      "phone": "9820260106",-
)      "email": "sagar.sable@stockiq.com",
      "status": "ACTIVE",%
!      "primary_role": "ROLE-002",(
$      "primary_role_id": "ROLE-002","
      "company_id": "COMP-01",!
      "plant_id": "PLANT-01",(
$      "warehouse_id": "WH-PUN-MAIN",.
*      "reporting_manager": "Pravin Patil",&
"      "two_factor_enabled": false,
      "failed_logins": 0,
      "locked_until": null,.
*      "password_salt": "7c4d7a89b790c1db",v
r      "password_hash": "sha256$7c4d7a89b790c1db$dd2854189a8660f07e9a364009d30cbcb95ba1d914edbb0dac135db46b58adda",
      "password_history": [g
c        "sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4",g
c        "sha256$655882c6d2128b6c$c56ac6333eeb5f8f9e33f96c91c38994817d47e64e830c92805b79c527c1ada3",f
b        "sha256$7c4d7a89b790c1db$dd2854189a8660f07e9a364009d30cbcb95ba1d914edbb0dac135db46b58adda"
      ],(
$      "must_change_password": false,>
:      "password_last_changed": "2026-09-27T21:02:04.786Z",'
#      "joining_date": "2026-06-15",7
3      "effective_from": "2026-06-14T18:30:00.000Z",
      "effective_to": null,3
/      "created_at": "2026-09-29T07:48:25.204Z",A
=      "temp_password_expires_at": "2026-09-30T09:37:03.504Z",3
/      "updated_at": "2026-10-01T10:47:59.106Z",6
2      "last_login_at": "2026-10-01T08:33:41.316Z", 
      "secondary_roles": [],
      "assigned_plants": [
        "ALL",
        "PLANT-01",
        "PLANT-02"
      ]

    },	
    {
        "id": "USR-108",!
        "username": "NITIND",&
"        "employee_id": "EMP-9108",%
!        "employee_name": "nitin","
        "first_name": "nitin",
        "middle_name": "",!
        "last_name": "patel",*
&        "display_name": "nitin patel",'
#        "full_name": "nitin patel",&
"        "user_type": "Technician",&
"        "designation": "Mechanic",/
+        "department": "Warehouse & Stores",
        "specialty": "",*
&        "mobile_number": "8765434567","
        "phone": "8765434567",4
0        "email": "pravinofficial2020@gmail.com",
        "status": "ACTIVE",'
#        "primary_role": "ROLE-004",*
&        "primary_role_id": "ROLE-002",$
         "company_id": "COMP-01",
        "plant_id": "ALL",*
&        "warehouse_id": "WH-PUN-MAIN",0
,        "reporting_manager": "Pravin Patil",'
#        "two_factor_enabled": true,
        "failed_logins": 0,!
        "locked_until": null,)
%        "joining_date": "2026-06-15",+
'        "effective_from": "2026-06-15",5
1        "created_at": "2026-10-08T12:41:17.054Z", 
        "assigned_plants": [
            "ALL",
            "PLANT-01",
            "PLANT-02"

        ],)
%        "effective_to": "2030-12-31",0
,        "password_salt": "84cac6ece3fc1886",x
t        "password_hash": "sha256$84cac6ece3fc1886$a82080e8ee37e4627c8264ea152bb2f9089ddbf59692fef64755b7c8e8f84332",!
        "password_history": [k
g            "sha256$ef3096b156abae0c$8ef67e2881c3f3136d9d5b96dbd6539a3e3dc759bab8f7ddc83f3685ffed3427",k
g            "sha256$1d46fd8322602a41$b683c91472dab1575ac3077f73b4927f06c98929c16d9ef8dc872ed3eb5c7e64",k
g            "sha256$9781e012d456a2b8$ed586c204505dd42299e4557c740d61d740d5c0356211f8c4b1af18abadc35e5",j
f            "sha256$84cac6ece3fc1886$a82080e8ee37e4627c8264ea152bb2f9089ddbf59692fef64755b7c8e8f84332"

        ],*
&        "must_change_password": false,@
<        "password_last_changed": "2026-10-18T18:49:43.213Z",C
?        "temp_password_expires_at": "2026-10-19T18:48:47.623Z",5
1        "updated_at": "2026-10-18T18:49:43.341Z",8
4        "last_login_at": "2026-10-18T18:49:14.202Z",,
(        "selected_branch_id": "PLANT-01"

    },	
    {
        "id": "USR-109","
        "username": "VIKRAMR",&
"        "employee_id": "EMP-9109",-
)        "employee_name": "Vikram Rathod",#
        "first_name": "Vikram",
        "middle_name": "","
        "last_name": "Rathod",,
(        "display_name": "Vikram Rathod",)
%        "full_name": "Vikram Rathod",&
"        "user_type": "Technician",>
:        "designation": "Electrical Specialist Technician",5
1        "department": "Hydraulics Assembly Dept",3
/        "specialty": "EV & Electrical Systems",*
&        "mobile_number": "9820260109","
        "phone": "9820260109",1
-        "email": "vikram.rathod@stockiq.com",
        "status": "ACTIVE",'
#        "primary_role": "ROLE-002",*
&        "primary_role_id": "ROLE-002",$
         "company_id": "COMP-01",#
        "plant_id": "PLANT-01",*
&        "warehouse_id": "WH-PUN-MAIN",4
0        "reporting_manager": "Rushikesh Dhiwar",(
$        "two_factor_enabled": false,
        "failed_logins": 0,!
        "locked_until": null,)
%        "joining_date": "2026-06-15",9
5        "effective_from": "2026-06-14T18:30:00.000Z",5
1        "created_at": "2026-09-29T07:48:25.204Z",0
,        "password_salt": "a1b2c3d4e5f67890",x
t        "password_hash": "sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4",!
        "password_history": [j
f            "sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4"

        ],*
&        "must_change_password": false,?
;        "password_last_changed": "2026-09-29T07:48:25.204Z"

    },	
    {
        "id": "USR-110","
        "username": "GANESHJ",&
"        "employee_id": "EMP-9110",-
)        "employee_name": "Ganesh Jadhav",#
        "first_name": "Ganesh",
        "middle_name": "","
        "last_name": "Jadhav",,
(        "display_name": "Ganesh Jadhav",)
%        "full_name": "Ganesh Jadhav",&
"        "user_type": "Technician",9
5        "designation": "General Mechanic Technician",5
1        "department": "Hydraulics Assembly Dept",4
0        "specialty": "Chassis & Brake Overhaul",*
&        "mobile_number": "9820260110","
        "phone": "9820260110",1
-        "email": "ganesh.jadhav@stockiq.com",
        "status": "ACTIVE",'
#        "primary_role": "ROLE-002",*
&        "primary_role_id": "ROLE-002",$
         "company_id": "COMP-01",#
        "plant_id": "PLANT-01",*
&        "warehouse_id": "WH-PUN-MAIN",4
0        "reporting_manager": "Rushikesh Dhiwar",(
$        "two_factor_enabled": false,
        "failed_logins": 0,!
        "locked_until": null,)
%        "joining_date": "2026-06-15",9
5        "effective_from": "2026-06-14T18:30:00.000Z",5
1        "created_at": "2026-09-29T07:48:25.204Z",0
,        "password_salt": "a1b2c3d4e5f67890",x
t        "password_hash": "sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4",!
        "password_history": [j
f            "sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4"

        ],*
&        "must_change_password": false,?
;        "password_last_changed": "2026-09-29T07:48:25.204Z"	
    }
  ],
  "roles": [	
    {
      "id": "ROLE-ADMIN",!
      "code": "SYSTEM_ADMIN",)
%      "name": "System Administrator",u
q      "description": "Full system configuration, security governance, user lifecycle and operational oversight.", 
      "role_type": "SYSTEM",
      "is_system": true,
      "status": "ACTIVE",
      "user_count": 1

    },	
    {!
      "id": "ROLE-STORE-MGR",
      "code": "STORE_MGR","
      "name": "Store Manager",
}      "description": "Store operations supervisor, GRN inward approval, stock transfer sanction, and cycle count approvals.",%
!      "role_type": "OPERATIONAL",
      "is_system": true,
      "status": "ACTIVE",
      "user_count": 1

    },	
    {$
       "id": "ROLE-PURCHASE-MGR",!
      "code": "PURCHASE_MGR",%
!      "name": "Purchase Manager",†
      "description": "Approves purchase requisitions, signs vendor purchase orders up to â‚¹10 Lakhs, manages supplier masters.",%
!      "role_type": "OPERATIONAL",
      "is_system": true,
      "status": "ACTIVE",
      "user_count": 1

    },	
    {
      "id": "ROLE-002",#
      "code": "STORE_OPS_EXEC",/
+      "name": "Store Operations Executive",…
€      "description": "Store operations executive, parts inward, job card issue/return, transfer, cycle count and stock ledger.",%
!      "role_type": "OPERATIONAL",
      "is_system": true,
      "status": "ACTIVE",
      "user_count": 1

    },	
    {
      "id": "ROLE-003","
      "code": "STORE_MGR_OPS",4
0      "name": "Senior Store & Sourcing Manager",o
k      "description": "Senior store and inventory management, material receipts and requisition approvals.",%
!      "role_type": "OPERATIONAL",
      "is_system": true,
      "status": "ACTIVE",
      "user_count": 2

    },	
    {
      "id": "ROLE-004",*
&      "code": "WORKSHOP_TECH_BILLING",=
9      "name": "Workshop Technician & Billing Specialist",•
      "description": "Two-wheeler garage workshop technician, job cards, parts requisition, estimates, billing, and vehicle delivery handover.",%
!      "role_type": "OPERATIONAL",
      "is_system": false,
      "status": "ACTIVE",
      "user_count": 1	
    }
  ],
  "actions": [	
    {
      "code": "VIEW",
      "name": "View",2
.      "description": "View and search records"

    },	
    {
      "code": "ADD",
      "name": "Add",-
)      "description": "Create new records"

    },	
    {
      "code": "EDIT",
      "name": "Edit",7
3      "description": "Modify draft or open records"

    },	
    {
      "code": "DELETE",
      "name": "Delete",9
5      "description": "Delete records where permitted"

    },	
    {
      "code": "SUBMIT",
      "name": "Submit",B
>      "description": "Submit transactions for formal approval"

    },	
    {
      "code": "APPROVE",
      "name": "Approve",G
C      "description": "Authorize and approve submitted transactions"

    },	
    {
      "code": "REJECT",
      "name": "Reject",G
C      "description": "Reject and return transactions with comments"

    },	
    {
      "code": "CANCEL",
      "name": "Cancel",<
8      "description": "Cancel approved/open transactions"

    },	
    {
      "code": "PRINT",
      "name": "Print",@
<      "description": "Generate formatted printouts and PDFs"

    },	
    {
      "code": "EXPORT",
      "name": "Export",;
7      "description": "Export tabular data to Excel/CSV"

    },	
    {
      "code": "IMPORT",
      "name": "Import",7
3      "description": "Bulk upload data via CSV/XLS"

    },	
    {
      "code": "POST",
      "name": "Post",P
L      "description": "Commit transaction balances to financial/stock ledger"

    },	
    {
      "code": "REVERSE",
      "name": "Reverse",@
<      "description": "Reverse previously posted transaction"

    },	
    {
      "code": "CLOSE",
      "name": "Close",A
=      "description": "Close completed orders or requisitions"

    },	
    {
      "code": "REOPEN",
      "name": "Reopen",A
=      "description": "Reopen closed transactions with reason"	
    }
  ],
  "permissions": [	
    {
      "id": "PERM-MASTERS",(
$      "module": "Master Management",6
2      "name": "Item, Category, Warehouse Masters",
      "code": "MASTERS"

    },	
    {
      "id": "PERM-DASH",
      "module": "Overview",.
*      "name": "Operations & BI Dashboard",
      "code": "DASHBOARD"

    },	
    {
      "id": "PERM-PR","
      "module": "Procurement",/
+      "name": "Purchase Requisitions (PR)", 
      "code": "REQUISITIONS"

    },	
    {
      "id": "PERM-PO","
      "module": "Procurement",)
%      "name": "Purchase Orders (PO)",
      "code": "ORDERS"

    },	
    {
      "id": "PERM-GRN", 
      "module": "Receiving",.
*      "name": "Goods Receipt Notes (GRN)",
      "code": "GRN"

    },	
    {
      "id": "PERM-QA", 
      "module": "Receiving",5
1      "name": "Quality Inspection & Disposition",
      "code": "QUALITY"

    },	
    {
      "id": "PERM-PUTAWAY", 
      "module": "Warehouse",2
.      "name": "Directed Putaway & Bin Matrix",
      "code": "PUTAWAY"

    },	
    {!
      "id": "PERM-INVENTORY", 
      "module": "Inventory",8
4      "name": "Stock Balances & Batch Traceability",
      "code": "INVENTORY"

    },	
    {!
      "id": "PERM-TRANSFERS", 
      "module": "Inventory",3
/      "name": "Inter-Facility Stock Transfers",
      "code": "TRANSFERS"

    },	
    {
      "id": "PERM-PROD",!
      "module": "Production",5
1      "name": "Work Orders, BOM & Issue to Prod",
      "code": "PRODUCTION"

    },	
    { 
      "id": "PERM-DISPATCH", 
      "module": "Logistics",1
-      "name": "Sales Dispatch & Gate Passes",
      "code": "DISPATCH"

    },	
    {
      "id": "PERM-RETURNS", 
      "module": "Logistics",0
,      "name": "Reverse Logistics & Returns",
      "code": "RETURNS"

    },	
    {
      "id": "PERM-ADJUST",
      "module": "Control",/
+      "name": "Stock Counts & Adjustments",
      "code": "ADJUSTMENTS"

    },	
    {
      "id": "PERM-REPORTS",
      "module": "Reports",.
*      "name": "Executive MIS & Analytics",
      "code": "REPORTS"

    },	
    {
      "id": "PERM-USERS",
      "module": "Security",8
4      "name": "User Roles & Permissions Management",#
      "code": "USER_MANAGEMENT"

    },	
    {$
       "id": "PERM-STORE-MASTER",/
+      "module": "Store & Inventory Master",!
      "name": "Store Master", 
      "code": "STORE_MASTER"

    },	
    {!
      "id": "PERM-STORE-MAP",/
+      "module": "Store & Inventory Master",2
.      "name": "Category & Item Store Mapping",&
"      "code": "STORE_CATEGORY_MAP"

    },	
    {%
!      "id": "PERM-STORE-VEHICLE",/
+      "module": "Store & Inventory Master",0
,      "name": "Vehicle Model Compatibility",(
$      "code": "STORE_VEHICLE_COMPAT"

    },	
    { 
      "id": "PERM-STORE-PR",/
+      "module": "Store & Inventory Master",.
*      "name": "Purchase Requisition (PR)",
      "code": "STORE_TX_PR"

    },	
    { 
      "id": "PERM-STORE-PO",/
+      "module": "Store & Inventory Master",(
$      "name": "Purchase Order (PO)",
      "code": "STORE_TX_PO"

    },	
    {!
      "id": "PERM-STORE-GRN",/
+      "module": "Store & Inventory Master",(
$      "name": "GRN / Parts Receipt", 
      "code": "STORE_TX_GRN"

    },	
    {"
      "id": "PERM-STORE-PRTN",/
+      "module": "Store & Inventory Master",*
&      "name": "Purchase Return (RTV)",,
(      "code": "STORE_TX_PURCHASE_RETURN"

    },	
    {#
      "id": "PERM-STORE-ISSUE",/
+      "module": "Store & Inventory Master",+
'      "name": "General Material Issue",+
'      "code": "STORE_TX_MATERIAL_ISSUE"

    },	
    {"
      "id": "PERM-STORE-MRTN",/
+      "module": "Store & Inventory Master",,
(      "name": "General Material Return",,
(      "code": "STORE_TX_MATERIAL_RETURN"

    },	
    {&
"      "id": "PERM-STORE-JC-ISSUE",/
+      "module": "Store & Inventory Master",)
%      "name": "Job Card Parts Issue",+
'      "code": "STORE_TX_JOB_CARD_ISSUE"

    },	
    {$
       "id": "PERM-STORE-JC-RTN",/
+      "module": "Store & Inventory Master",*
&      "name": "Job Card Parts Return",,
(      "code": "STORE_TX_JOB_CARD_RETURN"

    },	
    {"
      "id": "PERM-STORE-XFER",/
+      "module": "Store & Inventory Master",2
.      "name": "Store-to-Store Stock Transfer",+
'      "code": "STORE_TX_STOCK_TRANSFER"

    },	
    {$
       "id": "PERM-STORE-ADJUST",/
+      "module": "Store & Inventory Master",%
!      "name": "Stock Adjustment",-
)      "code": "STORE_TX_STOCK_ADJUSTMENT"

    },	
    {#
      "id": "PERM-STORE-COUNT",/
+      "module": "Store & Inventory Master",)
%      "name": "Physical Stock Count",+
'      "code": "STORE_TX_PHYSICAL_COUNT"

    },	
    {%
!      "id": "PERM-STORE-RESERVE",/
+      "module": "Store & Inventory Master",&
"      "name": "Stock Reservation",.
*      "code": "STORE_TX_STOCK_RESERVATION"

    },	
    {$
       "id": "PERM-STORE-WALKIN",/
+      "module": "Store & Inventory Master",(
$      "name": "Walk-in Retail Sale",)
%      "code": "STORE_TX_WALK_IN_SALE"

    },	
    {!
      "id": "PERM-STORE-OTC",/
+      "module": "Store & Inventory Master",0
,      "name": "Over-the-Counter (OTC) Sale",)
%      "code": "STORE_TX_COUNTER_SALE"

    },	
    {$
       "id": "PERM-STORE-SLSRTN",/
+      "module": "Store & Inventory Master",,
(      "name": "Sales Return (Customer)",)
%      "code": "STORE_TX_SALES_RETURN"

    },	
    {&
"      "id": "PERM-STORE-WARRANTY",/
+      "module": "Store & Inventory Master",*
&      "name": "Warranty Parts Return",,
(      "code": "STORE_TX_WARRANTY_RETURN"

    },	
    {#
      "id": "PERM-STORE-SCRAP",/
+      "module": "Store & Inventory Master",-
)      "name": "Scrap / Salvage Disposal",+
'      "code": "STORE_TX_SCRAP_DISPOSAL"

    },	
    {%
!      "id": "PERM-STORE-IB-XFER",/
+      "module": "Store & Inventory Master",*
&      "name": "Inter-Branch Transfer",)
%      "code": "STORE_TX_INTER_BRANCH"

    },	
    {&
"      "id": "PERM-STORE-BIN-XFER",/
+      "module": "Store & Inventory Master",(
$      "name": "Bin-to-Bin Transfer",)
%      "code": "STORE_TX_BIN_TRANSFER"

    },	
    {%
!      "id": "PERM-STORE-OPENING",/
+      "module": "Store & Inventory Master",(
$      "name": "Opening Stock Entry",*
&      "code": "STORE_TX_OPENING_STOCK"

    },	
    {(
$      "id": "PERM-STORE-QUARANTINE",/
+      "module": "Store & Inventory Master",&
"      "name": "Quarantine & Hold",'
#      "code": "STORE_TX_QUARANTINE"

    },	
    { 
      "id": "PERM-STORE-QA",/
+      "module": "Store & Inventory Master",,
(      "name": "Quality Inspection (QA)",)
%      "code": "STORE_TX_QUALITY_INSP"

    },	
    {#
      "id": "PERM-STORE-RULES",/
+      "module": "Store & Inventory Master",/
+      "name": "Inventory Rules & Policies",)
%      "code": "STORE_INVENTORY_RULES"

    },	
    {$
       "id": "PERM-STORE-LEDGER",/
+      "module": "Store & Inventory Master",-
)      "name": "Multi-Store Stock Ledger",&
"      "code": "STORE_STOCK_LEDGER"

    },	
    {%
!      "id": "PERM-COMMON-MASTER",$
       "module": "Common Master",D
@      "name": "Country, State, District, City, Pin Code Master",!
      "code": "COMMON_MASTER"

    },	
    {"
      "id": "PERM-TAX-MASTER",
      "module": "Masters",D
@      "name": "Tax Master (GST Slabs & Taxation Configuration)",
      "code": "TAX_MASTER"

    },	
    {"
      "id": "PERM-DOC-SERIES",4
0      "module": "Organization & Facility Setup",2
.      "name": "Document Number Series Master",%
!      "code": "DOC_SERIES_MASTER"

    },	
    {$
       "id": "PERM-FIN-CALENDAR",4
0      "module": "Organization & Facility Setup",.
*      "name": "Financial Calendar Master",-
)      "code": "FINANCIAL_CALENDAR_MASTER"

    },	
    {&
"      "id": "PERM-HOLIDAY-MASTER",4
0      "module": "Organization & Facility Setup",#
      "name": "Holiday Master","
      "code": "HOLIDAY_MASTER"

    },	
    {"
      "id": "PERM-REG-CONFIG",4
0      "module": "Organization & Facility Setup",6
2      "name": "Registration Configuration Master",'
#      "code": "CONFIG_REGISTRATION"

    },	
    {(
$      "id": "PERM-DOC-PRINT-CONFIG",4
0      "module": "Organization & Facility Setup",8
4      "name": "Document Print Configuration Master",+
'      "code": "DOC_PRINT_CONFIG_MASTER"	
    }
  ],
  "role_permissions": [	
    {"
      "role_id": "ROLE-ADMIN",1
-      "perm_code": "DOC_PRINT_CONFIG_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",-
)      "perm_code": "CONFIG_REGISTRATION",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",3
/      "perm_code": "FINANCIAL_CALENDAR_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",+
'      "perm_code": "DOC_SERIES_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",$
       "perm_code": "TAX_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",!
      "perm_code": "MASTERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",'
#      "perm_code": "COMMON_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",#
      "perm_code": "DASHBOARD",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",&
"      "perm_code": "REQUISITIONS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN", 
      "perm_code": "ORDERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",
      "perm_code": "GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",!
      "perm_code": "QUALITY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",!
      "perm_code": "PUTAWAY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",#
      "perm_code": "INVENTORY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",#
      "perm_code": "TRANSFERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",$
       "perm_code": "PRODUCTION",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN","
      "perm_code": "DISPATCH",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",!
      "perm_code": "RETURNS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",%
!      "perm_code": "ADJUSTMENTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",!
      "perm_code": "REPORTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {"
      "role_id": "ROLE-ADMIN",)
%      "perm_code": "USER_MANAGEMENT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": true,
      "close": true,
      "reopen": true

    },	
    {)
%      "role_id": "ROLE-PURCHASE-MGR",#
      "perm_code": "DASHBOARD",
      "view": true,
      "add": false,
      "edit": false,
      "delete": false,
      "submit": false,
      "approve": false,
      "reject": false,
      "cancel": false,
      "print": true,
      "export": true,
      "import": false,
      "post": false,
      "reverse": false,
      "close": false,
      "reopen": false

    },	
    {)
%      "role_id": "ROLE-PURCHASE-MGR",&
"      "perm_code": "REQUISITIONS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": false,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": false,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {)
%      "role_id": "ROLE-PURCHASE-MGR", 
      "perm_code": "ORDERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": false,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {)
%      "role_id": "ROLE-PURCHASE-MGR",
      "perm_code": "GRN",
      "view": true,
      "add": false,
      "edit": false,
      "delete": false,
      "submit": false,
      "approve": false,
      "reject": false,
      "cancel": false,
      "print": true,
      "export": true,
      "import": false,
      "post": false,
      "reverse": false,
      "close": false,
      "reopen": false

    },	
    {)
%      "role_id": "ROLE-PURCHASE-MGR",!
      "perm_code": "MASTERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": false,
      "submit": false,
      "approve": true,
      "reject": false,
      "cancel": false,
      "print": true,
      "export": true,
      "import": false,
      "post": false,
      "reverse": false,
      "close": false,
      "reopen": false

    },	
    {)
%      "role_id": "ROLE-PURCHASE-MGR",!
      "perm_code": "REPORTS",
      "view": true,
      "add": false,
      "edit": false,
      "delete": false,
      "submit": false,
      "approve": false,
      "reject": false,
      "cancel": false,
      "print": true,
      "export": true,
      "import": false,
      "post": false,
      "reverse": false,
      "close": false,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",#
      "perm_code": "DASHBOARD",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",
      "perm_code": "GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",!
      "perm_code": "PUTAWAY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",#
      "perm_code": "INVENTORY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",#
      "perm_code": "TRANSFERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",!
      "perm_code": "RETURNS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",%
!      "perm_code": "ADJUSTMENTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",&
"      "perm_code": "STORE_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",,
(      "perm_code": "STORE_CATEGORY_MAP",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",.
*      "perm_code": "STORE_VEHICLE_COMPAT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",%
!      "perm_code": "STORE_TX_PR",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",%
!      "perm_code": "STORE_TX_PO",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",&
"      "perm_code": "STORE_TX_GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",2
.      "perm_code": "STORE_TX_PURCHASE_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",1
-      "perm_code": "STORE_TX_MATERIAL_ISSUE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",2
.      "perm_code": "STORE_TX_MATERIAL_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",1
-      "perm_code": "STORE_TX_JOB_CARD_ISSUE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",2
.      "perm_code": "STORE_TX_JOB_CARD_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",1
-      "perm_code": "STORE_TX_STOCK_TRANSFER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",3
/      "perm_code": "STORE_TX_STOCK_ADJUSTMENT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",1
-      "perm_code": "STORE_TX_PHYSICAL_COUNT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",4
0      "perm_code": "STORE_TX_STOCK_RESERVATION",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_TX_WALK_IN_SALE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_TX_COUNTER_SALE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_TX_SALES_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",2
.      "perm_code": "STORE_TX_WARRANTY_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",1
-      "perm_code": "STORE_TX_SCRAP_DISPOSAL",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_TX_INTER_BRANCH",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_TX_BIN_TRANSFER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",0
,      "perm_code": "STORE_TX_OPENING_STOCK",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",-
)      "perm_code": "STORE_TX_QUARANTINE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_TX_QUALITY_INSP",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",/
+      "perm_code": "STORE_INVENTORY_RULES",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",,
(      "perm_code": "STORE_STOCK_LEDGER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",!
      "perm_code": "REPORTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR", 
      "perm_code": "ORDERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR",&
"      "perm_code": "REQUISITIONS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    {&
"      "role_id": "ROLE-STORE-MGR","
      "perm_code": "PLANNING",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",#
      "perm_code": "DASHBOARD",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",
      "perm_code": "GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",!
      "perm_code": "PUTAWAY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",#
      "perm_code": "INVENTORY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",#
      "perm_code": "TRANSFERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",!
      "perm_code": "RETURNS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",%
!      "perm_code": "ADJUSTMENTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",&
"      "perm_code": "STORE_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",,
(      "perm_code": "STORE_CATEGORY_MAP",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",.
*      "perm_code": "STORE_VEHICLE_COMPAT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",%
!      "perm_code": "STORE_TX_PR",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",%
!      "perm_code": "STORE_TX_PO",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",&
"      "perm_code": "STORE_TX_GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",2
.      "perm_code": "STORE_TX_PURCHASE_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",1
-      "perm_code": "STORE_TX_MATERIAL_ISSUE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",2
.      "perm_code": "STORE_TX_MATERIAL_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",1
-      "perm_code": "STORE_TX_JOB_CARD_ISSUE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",2
.      "perm_code": "STORE_TX_JOB_CARD_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",1
-      "perm_code": "STORE_TX_STOCK_TRANSFER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",3
/      "perm_code": "STORE_TX_STOCK_ADJUSTMENT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",1
-      "perm_code": "STORE_TX_PHYSICAL_COUNT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",4
0      "perm_code": "STORE_TX_STOCK_RESERVATION",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_TX_WALK_IN_SALE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_TX_COUNTER_SALE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_TX_SALES_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",2
.      "perm_code": "STORE_TX_WARRANTY_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",1
-      "perm_code": "STORE_TX_SCRAP_DISPOSAL",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_TX_INTER_BRANCH",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_TX_BIN_TRANSFER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",0
,      "perm_code": "STORE_TX_OPENING_STOCK",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",-
)      "perm_code": "STORE_TX_QUARANTINE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_TX_QUALITY_INSP",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",/
+      "perm_code": "STORE_INVENTORY_RULES",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-002",,
(      "perm_code": "STORE_STOCK_LEDGER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",#
      "perm_code": "DASHBOARD",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",
      "perm_code": "GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",!
      "perm_code": "PUTAWAY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",#
      "perm_code": "INVENTORY",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",#
      "perm_code": "TRANSFERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",!
      "perm_code": "RETURNS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",%
!      "perm_code": "ADJUSTMENTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",&
"      "perm_code": "STORE_MASTER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",,
(      "perm_code": "STORE_CATEGORY_MAP",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",.
*      "perm_code": "STORE_VEHICLE_COMPAT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",%
!      "perm_code": "STORE_TX_PR",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",%
!      "perm_code": "STORE_TX_PO",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",&
"      "perm_code": "STORE_TX_GRN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",2
.      "perm_code": "STORE_TX_PURCHASE_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",1
-      "perm_code": "STORE_TX_MATERIAL_ISSUE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",2
.      "perm_code": "STORE_TX_MATERIAL_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",1
-      "perm_code": "STORE_TX_JOB_CARD_ISSUE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",2
.      "perm_code": "STORE_TX_JOB_CARD_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",1
-      "perm_code": "STORE_TX_STOCK_TRANSFER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",3
/      "perm_code": "STORE_TX_STOCK_ADJUSTMENT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",1
-      "perm_code": "STORE_TX_PHYSICAL_COUNT",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",4
0      "perm_code": "STORE_TX_STOCK_RESERVATION",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_TX_WALK_IN_SALE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_TX_COUNTER_SALE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_TX_SALES_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",2
.      "perm_code": "STORE_TX_WARRANTY_RETURN",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",1
-      "perm_code": "STORE_TX_SCRAP_DISPOSAL",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_TX_INTER_BRANCH",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_TX_BIN_TRANSFER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",0
,      "perm_code": "STORE_TX_OPENING_STOCK",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",-
)      "perm_code": "STORE_TX_QUARANTINE",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_TX_QUALITY_INSP",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",/
+      "perm_code": "STORE_INVENTORY_RULES",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",,
(      "perm_code": "STORE_STOCK_LEDGER",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",!
      "perm_code": "REPORTS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003", 
      "perm_code": "ORDERS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003",&
"      "perm_code": "REQUISITIONS",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-003","
      "perm_code": "PLANNING",
      "view": true,
      "add": true,
      "edit": true,
      "delete": true,
      "submit": true,
      "approve": true,
      "reject": true,
      "cancel": true,
      "print": true,
      "export": true,
      "import": true,
      "post": true,
      "reverse": false,
      "close": true,
      "reopen": false

    },	
    { 
      "role_id": "ROLE-004",#
      "perm_code": "DASHBOARD",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",+
'      "perm_code": "BILLING_DASHBOARD",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",1
-      "perm_code": "STORE_TX_JOB_CARD_ISSUE",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",#
      "perm_code": "JOB_CARDS",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",+
'      "perm_code": "BILLING_ESTIMATES",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",*
&      "perm_code": "CUSTOMER_BILLING",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",%
!      "perm_code": "DRAFT_BILLS",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",%
!      "perm_code": "FINAL_BILLS",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",*
&      "perm_code": "VEHICLE_DELIVERY",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false

    },	
    { 
      "role_id": "ROLE-004",#
      "perm_code": "INVENTORY",ò
í      "view": true, "add": true, "edit": true, "delete": true, "submit": true, "approve": true, "reject": true, "cancel": true, "print": true, "export": true, "import": true, "post": true, "reverse": false, "close": true, "reopen": false	
    }
  ],
  "sod_rules": [	
    {
      "id": "SOD-001",2
.      "rule_code": "SOD_PO_CREATE_VS_APPROVE",
}      "rule_description": "A user cannot simultaneously hold Purchase Order creation and Purchase Order approval authority.",5
1      "conflicting_role_1": "ROLE-PURCHASE-EXEC",4
0      "conflicting_role_2": "ROLE-PURCHASE-MGR",@
<      "conflicting_function_1": "Purchase Order Generation",(
$      "conflicting_action_1": "ADD",C
?      "conflicting_function_2": "Purchase Order Authorization",,
(      "conflicting_action_2": "APPROVE",!
      "severity": "CRITICAL",
      "status": "ACTIVE"	
    }
  ],
  "approval_authorities": [	
    {
      "id": "APPR-002",&
"      "role_id": "ROLE-STORE-MGR",3
/      "role_name": "Store & Warehouse Manager",1
-      "transaction_type": "STOCK_ADJUSTMENT",
      "min_amount": 0,
      "max_amount": 50000,
      "currency": "INR",&
"      "approval_level": "LEVEL_1",X
T      "description": "Authorizes physical stock variance write-offs up to â‚¹50,000"

    },	
    {
      "id": "APPR-003",)
%      "role_id": "ROLE-PURCHASE-MGR",*
&      "role_name": "Purchase Manager",/
+      "transaction_type": "PURCHASE_ORDER",
      "min_amount": 0,
      "max_amount": 100000,
      "currency": "INR",&
"      "approval_level": "LEVEL_1",U
Q      "description": "Approves standard POs up to â‚¹1,00,000 (Department Level)"

    },	
    {
      "id": "APPR-004",&
"      "role_id": "ROLE-PROC-HEAD",*
&      "role_name": "Procurement Head",/
+      "transaction_type": "PURCHASE_ORDER",
      "min_amount": 100001, 
      "max_amount": 1000000,
      "currency": "INR",&
"      "approval_level": "LEVEL_2",Y
U      "description": "Approves capital & high-volume material POs up to â‚¹10,00,000"

    },	
    {
      "id": "APPR-005","
      "role_id": "ROLE-ADMIN",E
A      "role_name": "System Administrator / Executive Management",/
+      "transaction_type": "PURCHASE_ORDER", 
      "min_amount": 1000001,"
      "max_amount": 999999999,
      "currency": "INR",&
"      "approval_level": "LEVEL_3",b
^      "description": "Unlimited expenditure approval for enterprise contracts (> â‚¹10 Lakhs)"	
    }
  ],
  "approval_delegations": [	
    {
      "id": "DEL-2026-001",*
&      "delegating_user_id": "USR-003",0
,      "delegating_user_name": "Anita Desai",0
,      "delegating_role": "Purchase Manager",(
$      "delegate_user_id": "USR-002",3
/      "delegate_user_name": "Rushikesh Dhiwar",+
'      "delegate_role": "Store Manager",7
3      "permission_type": "PURCHASE_ORDER_APPROVAL",%
!      "start_date": "2026-09-10",#
      "end_date": "2026-09-25",e
a      "reason": "On international vendor audit and business leave; delegated PO signing rights.",
      "status": "ACTIVE",(
$      "approved_by": "Pravin Patil",.
*      "created_at": "2026-09-08T10:00:00Z"

    },	
    {
      "id": "DEL-2026-002",*
&      "delegating_user_id": "USR-002",5
1      "delegating_user_name": "Rushikesh Dhiwar",-
)      "delegating_role": "Store Manager",(
$      "delegate_user_id": "USR-106",.
*      "delegate_user_name": "Sagar Sable",8
4      "delegate_role": "Store Operations Executive",7
3      "permission_type": "GRN_ACCEPTANCE_APPROVAL",%
!      "start_date": "2026-08-01",#
      "end_date": "2026-08-15",O
K      "reason": "Store audit assignment; delegated GRN temporary signing.",
      "status": "EXPIRED",(
$      "approved_by": "Pravin Patil",.
*      "created_at": "2026-07-28T14:30:00Z"	
    }
  ],
  "access_requests": [	
    {
      "id": "REQ-ACC-801",+
'      "request_number": "REQ-2026-801",
      "user_id": "USR-106",%
!      "user_name": "Sagar Sable",$
       "employee_id": "EMP-9106",7
3      "current_role": "Store Operations Executive",0
,      "requested_role_id": "ROLE-STORE-MGR",1
-      "requested_role_name": "Store Manager",I
E      "requested_warehouse": "WH-PUN-MAIN (Central Spare Parts Hub)",P
L      "reason": "Acting Shift Supervisor for assembly dispatch operations.",'
#      "status": "PENDING_IT_ADMIN",'
#      "manager_status": "APPROVED",k
g      "manager_comment": "Recommended. Sagar has completed safety and inventory ledger certification.",:
6      "manager_approval_date": "2026-09-14T11:00:00Z",)
%      "dept_head_status": "APPROVED",J
F      "dept_head_comment": "Approved for Pune Assembly Unit shift 2.",<
8      "dept_head_approval_date": "2026-09-15T09:30:00Z",.
*      "created_at": "2026-09-12T14:00:00Z"	
    }
  ], 
  "user_warehouse_access": [	
    {
      "user_id": "USR-001",(
$      "warehouse_id": "WH-PUN-MAIN",(
$      "access_type": "FULL_CONTROL",
      "is_default": true

    },	
    {
      "user_id": "USR-001",)
%      "warehouse_id": "WH-PUN-SPARE",(
$      "access_type": "FULL_CONTROL",
      "is_default": false

    },	
    {
      "user_id": "USR-001",'
#      "warehouse_id": "WH-PUN-LUB",(
$      "access_type": "FULL_CONTROL",
      "is_default": false

    },	
    {
      "user_id": "USR-002",(
$      "warehouse_id": "WH-PUN-MAIN",(
$      "access_type": "FULL_CONTROL",
      "is_default": true

    },	
    {
      "user_id": "USR-002",)
%      "warehouse_id": "WH-PUN-SPARE",(
$      "access_type": "FULL_CONTROL",
      "is_default": false

    },	
    {
      "user_id": "USR-003",)
%      "warehouse_id": "WH-PUN-SPARE",%
!      "access_type": "VIEW_ONLY",
      "is_default": true

    },	
    {
      "user_id": "USR-106",(
$      "warehouse_id": "WH-PUN-MAIN",(
$      "access_type": "FULL_CONTROL",
      "is_default": true

    },	
    {
      "user_id": "USR-106",)
%      "warehouse_id": "WH-PUN-SPARE",(
$      "access_type": "FULL_CONTROL",
      "is_default": false	
    }
  ],!
  "user_department_access": [	
    {
      "user_id": "USR-001",%
!      "department_id": "DEPT-01","
      "can_requisition": true,
      "can_approve": true

    },	
    {
      "user_id": "USR-001",%
!      "department_id": "DEPT-02","
      "can_requisition": true,
      "can_approve": true

    },	
    {
      "user_id": "USR-001",%
!      "department_id": "DEPT-03","
      "can_requisition": true,
      "can_approve": true

    },	
    {
      "user_id": "USR-001",%
!      "department_id": "DEPT-04","
      "can_requisition": true,
      "can_approve": true

    },	
    {
      "user_id": "USR-002",%
!      "department_id": "DEPT-02","
      "can_requisition": true,
      "can_approve": true

    },	
    {
      "user_id": "USR-003",%
!      "department_id": "DEPT-03","
      "can_requisition": true,
      "can_approve": true

    },	
    {
      "user_id": "USR-106",%
!      "department_id": "DEPT-02","
      "can_requisition": true,
      "can_approve": false	
    }
  ],
  "password_policies": {
    "min_length": 8,
    "max_length": 64,"
    "require_uppercase": true,"
    "require_lowercase": true,
    "require_number": true,%
!    "require_special_char": true, 
    "disallow_spaces": true,.
*    "disallow_username_in_password": true,'
#    "disallow_personal_info": true,
    "expiry_days": 90,
    "history_limit": 5,!
    "max_failed_attempts": 5,'
#    "lockout_duration_minutes": 30,,
(    "force_change_on_first_login": true,*
&    "temp_password_validity_hours": 24
  }, 
  "login_security_config": {!
    "max_failed_attempts": 5,'
#    "lockout_duration_minutes": 30,&
"    "session_timeout_minutes": 45,)
%    "concurrent_sessions_allowed": 2,*
&    "two_factor_auth_required": false,(
$    "ip_whitelisting_enabled": false
  },
  "user_sessions": [	
    {
      "id": "SESS-101",
      "user_id": "USR-001",&
"      "user_name": "Pravin Patil",)
%      "role": "System Administrator",'
#      "ip_address": "192.168.1.10",3
/      "device": "Windows Desktop / Chrome 128",/
+      "login_time": "2026-09-10T15:30:00Z",$
       "last_active": "Just now",
      "is_current": true,
      "status": "ACTIVE"

    },	
    {
      "id": "SESS-102",
      "user_id": "USR-002",*
&      "user_name": "Rushikesh Dhiwar",.
*      "role": "Store & Warehouse Manager",'
#      "ip_address": "192.168.1.45",2
.      "device": "Zebra Handheld Scanner TC57",/
+      "login_time": "2026-09-10T14:15:00Z",'
#      "last_active": "12 mins ago",
      "is_current": false,
      "status": "ACTIVE"

    },	
    {
      "id": "SESS-103",
      "user_id": "USR-003",%
!      "user_name": "Anita Desai",%
!      "role": "Purchase Manager",'
#      "ip_address": "192.168.1.60",(
$      "device": "macOS / Safari 18",/
+      "login_time": "2026-09-10T13:45:00Z",'
#      "last_active": "42 mins ago",
      "is_current": false,
      "status": "ACTIVE"

    },	
    {
      "id": "SESS-104",
      "user_id": "USR-106",%
!      "user_name": "Sagar Sable",/
+      "role": "Store Operations Executive",'
#      "ip_address": "192.168.1.88",0
,      "device": "Android Handheld / Chrome",/
+      "login_time": "2026-09-10T11:20:00Z",%
!      "last_active": "2 hrs ago",
      "is_current": false,
      "status": "ACTIVE"	
    }
  ],
  "login_history": [	
    {
      "id": "LOG-801",.
*      "timestamp": "2026-09-10T15:30:00Z",
      "user_id": "USR-001",&
"      "user_name": "Pravin Patil",
      "ip": "192.168.1.10",'
#      "device": "Windows / Chrome",
      "status": "SUCCESS", 
      "failure_reason": null

    },	
    {
      "id": "LOG-802",.
*      "timestamp": "2026-09-10T14:15:00Z",
      "user_id": "USR-002",*
&      "user_name": "Rushikesh Dhiwar",
      "ip": "192.168.1.45",,
(      "device": "Zebra Barcode Scanner",
      "status": "SUCCESS", 
      "failure_reason": null

    },	
    {
      "id": "LOG-803",.
*      "timestamp": "2026-09-10T13:40:00Z",
      "user_id": "USR-003",%
!      "user_name": "Anita Desai",
      "ip": "192.168.1.60",%
!      "device": "macOS / Safari",
      "status": "FAILED",8
4      "failure_reason": "Invalid Password Attempt 1"

    },	
    {
      "id": "LOG-804",.
*      "timestamp": "2026-09-10T13:45:00Z",
      "user_id": "USR-003",%
!      "user_name": "Anita Desai",
      "ip": "192.168.1.60",%
!      "device": "macOS / Safari",
      "status": "SUCCESS", 
      "failure_reason": null

    },	
    {
      "id": "LOG-805",.
*      "timestamp": "2026-09-10T11:20:00Z",
      "user_id": "USR-106",%
!      "user_name": "Sagar Sable",
      "ip": "192.168.1.88",0
,      "device": "Android Handheld / Chrome",
      "status": "SUCCESS", 
      "failure_reason": null	
    }
  ],
  "itemSubcategories": [	
    {
      "id": "SUB-BRK-01",#
      "category_id": "CAT-BRK",
      "code": "BRK-PAD",
      "name": "Brake Pad"

    },	
    {
      "id": "SUB-BRK-02",#
      "category_id": "CAT-BRK",
      "code": "BRK-SHO",
      "name": "Brake Shoe"

    },	
    {
      "id": "SUB-BRK-03",#
      "category_id": "CAT-BRK",
      "code": "BRK-DSC",
      "name": "Brake Disc"

    },	
    {
      "id": "SUB-BRK-04",#
      "category_id": "CAT-BRK",
      "code": "BRK-DRM",
      "name": "Brake Drum"

    },	
    {
      "id": "SUB-BRK-05",#
      "category_id": "CAT-BRK",
      "code": "BRK-CBL",
      "name": "Brake Cable"

    },	
    {
      "id": "SUB-BRK-06",#
      "category_id": "CAT-BRK",
      "code": "BRK-FLD",
      "name": "Brake Fluid"

    },	
    {
      "id": "SUB-ELC-01",$
       "category_id": "CAT-ELEC",
      "code": "ELC-BAT",
      "name": "Battery"

    },	
    {
      "id": "SUB-ELC-02",$
       "category_id": "CAT-ELEC",
      "code": "ELC-BLB",
      "name": "Bulb"

    },	
    {
      "id": "SUB-ELC-03",$
       "category_id": "CAT-ELEC",
      "code": "ELC-FUS",
      "name": "Fuse"

    },	
    {
      "id": "SUB-ELC-04",$
       "category_id": "CAT-ELEC",
      "code": "ELC-RLY",
      "name": "Relay"

    },	
    {
      "id": "SUB-ELC-05",$
       "category_id": "CAT-ELEC",
      "code": "ELC-HRN",
      "name": "Horn"

    },	
    {
      "id": "SUB-ELC-06",$
       "category_id": "CAT-ELEC",
      "code": "ELC-WIR","
      "name": "Wiring Harness"

    },	
    {
      "id": "SUB-ELC-07",$
       "category_id": "CAT-ELEC",
      "code": "ELC-STR",!
      "name": "Starter Motor"

    },	
    {
      "id": "SUB-ELC-08",$
       "category_id": "CAT-ELEC",
      "code": "ELC-REC",3
/      "name": "Regulator / Rectifier (RR Unit)"

    },	
    {
      "id": "SUB-ELC-09",$
       "category_id": "CAT-ELEC",
      "code": "ELC-SPK",
      "name": "Spark Plug"

    },	
    {
      "id": "SUB-ENG-01",#
      "category_id": "CAT-ENG",
      "code": "ENG-PST","
      "name": "Piston & Rings"

    },	
    {
      "id": "SUB-ENG-02",#
      "category_id": "CAT-ENG",
      "code": "ENG-VLV",#
      "name": "Valves & Guides"

    },	
    {
      "id": "SUB-ENG-03",#
      "category_id": "CAT-ENG",
      "code": "ENG-GSK",
      "name": "Gasket Kit"

    },	
    {
      "id": "SUB-TRN-01",%
!      "category_id": "CAT-TRANS",
      "code": "TRN-CLT", 
      "name": "Clutch Plate"

    },	
    {
      "id": "SUB-TRN-02",%
!      "category_id": "CAT-TRANS",
      "code": "TRN-CHN",*
&      "name": "Drive Chain & Sprocket"

    },	
    {
      "id": "SUB-TRN-03",%
!      "category_id": "CAT-TRANS",
      "code": "TRN-BLT","
      "name": "CVT Drive Belt"

    },	
    {
      "id": "SUB-LUB-01",#
      "category_id": "CAT-LUB",!
      "code": "LUB-4T-10W30",(
$      "name": "Engine Oil 4T 10W-30"

    },	
    {
      "id": "SUB-LUB-02",#
      "category_id": "CAT-LUB",!
      "code": "LUB-4T-20W40",(
$      "name": "Engine Oil 4T 20W-40"

    },	
    {
      "id": "SUB-LUB-03",#
      "category_id": "CAT-LUB",
      "code": "LUB-FRK","
      "name": "Front Fork Oil"

    },	
    {
      "id": "SUB-LUB-04",#
      "category_id": "CAT-LUB",
      "code": "LUB-GRS",,
(      "name": "Chassis & Bearing Grease"

    },	
    {
      "id": "SUB-FLT-01",#
      "category_id": "CAT-FLT", 
      "code": "FLT-AIR-FOM",%
!      "name": "Air Filter (Foam)"

    },	
    {
      "id": "SUB-FLT-02",#
      "category_id": "CAT-FLT", 
      "code": "FLT-AIR-PPR",0
,      "name": "Air Filter (Paper Cartridge)"

    },	
    {
      "id": "SUB-FLT-03",#
      "category_id": "CAT-FLT",
      "code": "FLT-OIL",%
!      "name": "Engine Oil Filter"

    },	
    {
      "id": "SUB-TYR-01",#
      "category_id": "CAT-TYR", 
      "code": "TYR-TBL-FRT",0
,      "name": "Tubeless Front Tyre 90/90-12"

    },	
    {
      "id": "SUB-TYR-02",#
      "category_id": "CAT-TYR",
      "code": "TYR-TBL-RR",0
,      "name": "Tubeless Rear Tyre 90/100-10"

    },	
    {
      "id": "SUB-WAR-01",$
       "category_id": "CAT-WARR",
      "code": "WAR-CLM",'
#      "name": "Warranty Claim Part"

    },	
    {
      "id": "SUB-SCP-01",$
       "category_id": "CAT-SCRP",
      "code": "SCP-MTL",'
#      "name": "Salvage Metal Scrap"	
    }
  ],
  "storeTypes": [	
    {
      "id": "ST-01",
      "code": "MAIN_STORE",
      "name": "Main Store",9
5      "purpose": "Central spare parts inventory hub",%
!      "is_parent_allowed": false, 
      "is_sub_store": false,
      "active": true

    },	
    {
      "id": "ST-02",
      "code": "SUB_STORE",
      "name": "Sub Store",E
A      "purpose": "Parts used by technicians / branch operations",$
       "is_parent_allowed": true,
      "is_sub_store": true,
      "active": true	
    }
  ],"
  "storeTransactionConfigs": [	
    {$
       "store_id": "WH-PUN-MAIN",'
#      "store_code": "STR-PUN-MAIN",?
;      "store_name": "Main Store - Central Spare Parts Hub",'
#      "purchase_requisition": true,!
      "purchase_order": true,
      "grn_receipt": true,"
      "purchase_return": true,!
      "material_issue": true,"
      "material_return": true,"
      "job_card_issue": false,#
      "job_card_return": false,!
      "stock_transfer": true,#
      "stock_adjustment": true,'
#      "physical_stock_count": true,$
       "stock_reservation": true,
      "walk_in_sale": true,
      "counter_sale": true,
      "sales_return": true,#
      "warranty_return": false,"
      "scrap_disposal": false,(
$      "inter_branch_transfer": true,
      "bin_transfer": true, 
      "opening_stock": true,
      "quarantine": true,$
       "quality_inspection": true

    },	
    {%
!      "store_id": "WH-PUN-SPARE",(
$      "store_code": "STR-PUN-SPARE",0
,      "store_name": "Spare Parts Sub Store",'
#      "purchase_requisition": true,"
      "purchase_order": false,
      "grn_receipt": false,#
      "purchase_return": false,!
      "material_issue": true,"
      "material_return": true,!
      "job_card_issue": true,"
      "job_card_return": true,!
      "stock_transfer": true,#
      "stock_adjustment": true,'
#      "physical_stock_count": true,$
       "stock_reservation": true,
      "walk_in_sale": true,
      "counter_sale": true,
      "sales_return": true,#
      "warranty_return": false,"
      "scrap_disposal": false,)
%      "inter_branch_transfer": false,
      "bin_transfer": true, 
      "opening_stock": true,
      "quarantine": false,%
!      "quality_inspection": false

    },	
    {#
      "store_id": "WH-PUN-LUB",&
"      "store_code": "STR-PUN-LUB",*
&      "store_name": "Lubricant Store",'
#      "purchase_requisition": true,"
      "purchase_order": false,
      "grn_receipt": false,#
      "purchase_return": false,!
      "material_issue": true,"
      "material_return": true,!
      "job_card_issue": true,"
      "job_card_return": true,!
      "stock_transfer": true,#
      "stock_adjustment": true,'
#      "physical_stock_count": true,$
       "stock_reservation": true,
      "walk_in_sale": true,
      "counter_sale": true,
      "sales_return": true,#
      "warranty_return": false,"
      "scrap_disposal": false,)
%      "inter_branch_transfer": false,
      "bin_transfer": true, 
      "opening_stock": true,
      "quarantine": false,%
!      "quality_inspection": false

    },	
    {$
       "store_id": "WH-PUN-WARR",'
#      "store_code": "STR-PUN-WARR",;
7      "store_name": "Warranty / Defective Parts Store",(
$      "purchase_requisition": false,"
      "purchase_order": false,
      "grn_receipt": false,#
      "purchase_return": false,"
      "material_issue": false,#
      "material_return": false,"
      "job_card_issue": false,#
      "job_card_return": false,!
      "stock_transfer": true,#
      "stock_adjustment": true,'
#      "physical_stock_count": true,%
!      "stock_reservation": false, 
      "walk_in_sale": false, 
      "counter_sale": false, 
      "sales_return": false,"
      "warranty_return": true,!
      "scrap_disposal": true,)
%      "inter_branch_transfer": false,
      "bin_transfer": true,!
      "opening_stock": false,
      "quarantine": true,$
       "quality_inspection": true

    },	
    {%
!      "store_id": "WH-PUN-SCRAP",(
$      "store_code": "STR-PUN-SCRAP",9
5      "store_name": "Scrap & Salvage Disposal Store",(
$      "purchase_requisition": false,"
      "purchase_order": false,
      "grn_receipt": false,#
      "purchase_return": false,"
      "material_issue": false,#
      "material_return": false,"
      "job_card_issue": false,#
      "job_card_return": false,!
      "stock_transfer": true,#
      "stock_adjustment": true,'
#      "physical_stock_count": true,%
!      "stock_reservation": false, 
      "walk_in_sale": false, 
      "counter_sale": false, 
      "sales_return": false,#
      "warranty_return": false,!
      "scrap_disposal": true,)
%      "inter_branch_transfer": false,
      "bin_transfer": true,!
      "opening_stock": false,
      "quarantine": false,%
!      "quality_inspection": false

    },	
    {#
      "store_id": "WH-PUN-WRK",&
"      "store_code": "STR-PUN-WRK",:
6      "store_name": "Workshop Floor Bay & Tech Store",(
$      "purchase_requisition": false,"
      "purchase_order": false,
      "grn_receipt": false,#
      "purchase_return": false,!
      "material_issue": true,"
      "material_return": true,!
      "job_card_issue": true,"
      "job_card_return": true,!
      "stock_transfer": true,$
       "stock_adjustment": false,'
#      "physical_stock_count": true,$
       "stock_reservation": true, 
      "walk_in_sale": false, 
      "counter_sale": false, 
      "sales_return": false,#
      "warranty_return": false,"
      "scrap_disposal": false,)
%      "inter_branch_transfer": false, 
      "bin_transfer": false,!
      "opening_stock": false,
      "quarantine": false,%
!      "quality_inspection": false	
    }
  ],
  "vehicleManufacturers": [	
    {
      "id": "VM-01",
      "code": "HONDA",<
8      "name": "Honda Motorcycle & Scooter India (HMSI)",%
!      "country": "Japan / India",
      "active": true

    },	
    {
      "id": "VM-02",
      "code": "TVS",&
"      "name": "TVS Motor Company",
      "country": "India",
      "active": true

    },	
    {
      "id": "VM-03",
      "code": "HERO",'
#      "name": "Hero MotoCorp Ltd.",
      "country": "India",
      "active": true

    },	
    {
      "id": "VM-04",
      "code": "YAMAHA",'
#      "name": "India Yamaha Motor",%
!      "country": "Japan / India",
      "active": true

    },	
    {
      "id": "VM-05",
      "code": "BAJAJ",$
       "name": "Bajaj Auto Ltd.",
      "country": "India",
      "active": true

    },	
    {
      "id": "VM-06","
      "code": "ROYAL_ENFIELD",2
.      "name": "Royal Enfield (Eicher Motors)",
      "country": "India",
      "active": true

    },	
    {
      "id": "VM-07",
      "code": "SUZUKI",,
(      "name": "Suzuki Motorcycle India",%
!      "country": "Japan / India",
      "active": true	
    }
  ],
  "vehicleModels": [	
    {
      "id": "MOD-01",%
!      "manufacturer_id": "VM-01",
      "code": "ACTIVA-6G",
      "name": "Activa 6G",$
       "variant": "Deluxe (BS6)",!
      "displacement_cc": 110,
      "year_from": 2020,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-02",%
!      "manufacturer_id": "VM-01",
      "code": "ACTIVA-125",
      "name": "Activa 125",)
%      "variant": "Disc SmartXonnect",!
      "displacement_cc": 125,
      "year_from": 2019,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-03",%
!      "manufacturer_id": "VM-01",
      "code": "SHINE-125",
      "name": "Shine 125","
      "variant": "Disc Brake",!
      "displacement_cc": 125,
      "year_from": 2018,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-04",%
!      "manufacturer_id": "VM-02", 
      "code": "JUPITER-125", 
      "name": "Jupiter 125",)
%      "variant": "Disc SmartXonnect",!
      "displacement_cc": 125,
      "year_from": 2021,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-05",%
!      "manufacturer_id": "VM-02",
      "code": "APACHE-160",&
"      "name": "Apache RTR 160 4V",(
$      "variant": "Dual Channel ABS",!
      "displacement_cc": 160,
      "year_from": 2020,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-06",%
!      "manufacturer_id": "VM-03","
      "code": "SPLENDOR-PLUS","
      "name": "Splendor Plus",&
"      "variant": "Self Cast XTEC", 
      "displacement_cc": 97,
      "year_from": 2018,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-07",%
!      "manufacturer_id": "VM-04",
      "code": "FZ-V3",
      "name": "FZ-S V3","
      "variant": "Deluxe ABS",!
      "displacement_cc": 149,
      "year_from": 2019,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-08",%
!      "manufacturer_id": "VM-05",
      "code": "PULSAR-150",
      "name": "Pulsar 150",%
!      "variant": "Twin Disc BS6",!
      "displacement_cc": 150,
      "year_from": 2018,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-09",%
!      "manufacturer_id": "VM-06", 
      "code": "CLASSIC-350",+
'      "name": "Classic 350 (J-Series)",$
       "variant": "Dark Stealth",!
      "displacement_cc": 349,
      "year_from": 2021,
      "year_to": 2026,
      "fuel_type": "Petrol"

    },	
    {
      "id": "MOD-10",%
!      "manufacturer_id": "VM-07",
      "code": "ACCESS-125",
      "name": "Access 125",4
0      "variant": "Special Edition Ride Connect",!
      "displacement_cc": 125,
      "year_from": 2020,
      "year_to": 2026,
      "fuel_type": "Petrol"	
    }
  ],#
  "itemVehicleCompatibility": [	
    {
      "id": "IVC-01",#
      "item_id": "ITEM-2W-001",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-02",)
%      "variant": "Disc SmartXonnect",
      "year_from": 2019,
      "year_to": 2026,'
#      "notes": "Direct OEM Fitment"

    },	
    {
      "id": "IVC-02",#
      "item_id": "ITEM-2W-001",%
!      "manufacturer_id": "VM-02",
      "model_id": "MOD-04",)
%      "variant": "Disc SmartXonnect",
      "year_from": 2021,
      "year_to": 2026,'
#      "notes": "Direct OEM Fitment"

    },	
    {
      "id": "IVC-03",#
      "item_id": "ITEM-2W-001",%
!      "manufacturer_id": "VM-07",
      "model_id": "MOD-10",4
0      "variant": "Special Edition Ride Connect",
      "year_from": 2020,
      "year_to": 2026,'
#      "notes": "Direct OEM Fitment"

    },	
    {
      "id": "IVC-04",#
      "item_id": "ITEM-2W-002",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "Deluxe (BS6)",
      "year_from": 2020,
      "year_to": 2026,$
       "notes": "Rear 130mm Drum"

    },	
    {
      "id": "IVC-05",#
      "item_id": "ITEM-2W-002",%
!      "manufacturer_id": "VM-03",
      "model_id": "MOD-06",&
"      "variant": "Self Cast XTEC",
      "year_from": 2018,
      "year_to": 2026,$
       "notes": "Rear 130mm Drum"

    },	
    {
      "id": "IVC-06",#
      "item_id": "ITEM-2W-003",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "All Variants",
      "year_from": 2020,
      "year_to": 2026,7
3      "notes": "Capacity 750ml, recommended 10W-30"

    },	
    {
      "id": "IVC-07",#
      "item_id": "ITEM-2W-003",%
!      "manufacturer_id": "VM-02",
      "model_id": "MOD-04",$
       "variant": "All Variants",
      "year_from": 2021,
      "year_to": 2026,7
3      "notes": "Capacity 800ml, recommended 10W-30"

    },	
    {
      "id": "IVC-08",#
      "item_id": "ITEM-2W-004",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "Deluxe (BS6)",
      "year_from": 2020,
      "year_to": 2026,+
'      "notes": "Pre-oiled foam element"

    },	
    {
      "id": "IVC-09",#
      "item_id": "ITEM-2W-005",%
!      "manufacturer_id": "VM-02",
      "model_id": "MOD-04",)
%      "variant": "Disc SmartXonnect",
      "year_from": 2021,
      "year_to": 2026,.
*      "notes": "High-flow paper cartridge"

    },	
    {
      "id": "IVC-10",#
      "item_id": "ITEM-2W-006",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "Deluxe (BS6)",
      "year_from": 2020,
      "year_to": 2026,1
-      "notes": "NGK CPR8EA-9 (0.8-0.9mm gap)"

    },	
    {
      "id": "IVC-11",#
      "item_id": "ITEM-2W-006",%
!      "manufacturer_id": "VM-02",
      "model_id": "MOD-04",)
%      "variant": "Disc SmartXonnect",
      "year_from": 2021,
      "year_to": 2026,!
      "notes": "NGK CPR8EA-9"

    },	
    {
      "id": "IVC-12",#
      "item_id": "ITEM-2W-007",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "Deluxe (BS6)",
      "year_from": 2020,
      "year_to": 2026,)
%      "notes": "12V 5Ah VRLA Battery"

    },	
    {
      "id": "IVC-13",#
      "item_id": "ITEM-2W-008",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "Deluxe (BS6)",
      "year_from": 2020,
      "year_to": 2026,*
&      "notes": "90/90-12 54J Tubeless"

    },	
    {
      "id": "IVC-14",#
      "item_id": "ITEM-2W-009",%
!      "manufacturer_id": "VM-05",
      "model_id": "MOD-08",%
!      "variant": "Twin Disc BS6",
      "year_from": 2018,
      "year_to": 2026,6
2      "notes": "Wet multi-plate 5-friction plates"

    },	
    {
      "id": "IVC-15",#
      "item_id": "ITEM-2W-010",%
!      "manufacturer_id": "VM-05",
      "model_id": "MOD-08",%
!      "variant": "Twin Disc BS6",
      "year_from": 2018,
      "year_to": 2026,0
,      "notes": "Chain pitch 428 / 124 links"

    },	
    {
      "id": "IVC-16",#
      "item_id": "ITEM-2W-011",%
!      "manufacturer_id": "VM-01",
      "model_id": "MOD-01",$
       "variant": "Deluxe (BS6)",
      "year_from": 2020,
      "year_to": 2026,(
$      "notes": "K0R-V-Belt 18.5x743"	
    }
  ],
  "storeItemMappings": [	
    {
      "id": "SIM-01",%
!      "store_id": "WH-PUN-SPARE",#
      "item_id": "ITEM-2W-001",
      "min_stock": 10,
      "max_stock": 80,
      "reorder_level": 25,!
      "reorder_quantity": 30,*
&      "default_bin_id": "BIN-PUN-A01",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-02",%
!      "store_id": "WH-PUN-SPARE",#
      "item_id": "ITEM-2W-002",
      "min_stock": 15,
      "max_stock": 100,
      "reorder_level": 30,!
      "reorder_quantity": 40,*
&      "default_bin_id": "BIN-PUN-A01",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-03",#
      "store_id": "WH-PUN-LUB",#
      "item_id": "ITEM-2W-003",
      "min_stock": 20,
      "max_stock": 200,
      "reorder_level": 50,!
      "reorder_quantity": 60,*
&      "default_bin_id": "BIN-PUN-B01",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-04",%
!      "store_id": "WH-PUN-SPARE",#
      "item_id": "ITEM-2W-004",
      "min_stock": 15,
      "max_stock": 80,
      "reorder_level": 20,!
      "reorder_quantity": 25,*
&      "default_bin_id": "BIN-PUN-A02",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-05",%
!      "store_id": "WH-PUN-SPARE",#
      "item_id": "ITEM-2W-006",
      "min_stock": 20,
      "max_stock": 100,
      "reorder_level": 30,!
      "reorder_quantity": 35,*
&      "default_bin_id": "BIN-PUN-A03",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-06",#
      "store_id": "WH-PUN-BAT",#
      "item_id": "ITEM-2W-007",
      "min_stock": 5,
      "max_stock": 40,
      "reorder_level": 10,!
      "reorder_quantity": 15,*
&      "default_bin_id": "BIN-PUN-A01",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-07",$
       "store_id": "WH-PUN-TYRE",#
      "item_id": "ITEM-2W-008",
      "min_stock": 4,
      "max_stock": 30,
      "reorder_level": 8,!
      "reorder_quantity": 12,*
&      "default_bin_id": "BIN-PUN-A01",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-08",$
       "store_id": "WH-PUN-WARR",#
      "item_id": "ITEM-2W-014",
      "min_stock": 0,
      "max_stock": 50,
      "reorder_level": 0, 
      "reorder_quantity": 0,*
&      "default_bin_id": "BIN-PUN-W01",
      "active_yn": "Y"

    },	
    {
      "id": "SIM-09",%
!      "store_id": "WH-PUN-SCRAP",#
      "item_id": "ITEM-2W-015",
      "min_stock": 0,
      "max_stock": 1000,
      "reorder_level": 0, 
      "reorder_quantity": 0,*
&      "default_bin_id": "BIN-PUN-W01",
      "active_yn": "Y"	
    }
  ],
  "inventoryRules": {&
"    "allow_negative_stock": false,.
*    "allow_backdated_transactions": false,'
#    "batch_tracking_enabled": true,(
$    "expiry_tracking_enabled": true,(
$    "serial_tracking_enabled": true,)
%    "barcode_scanning_enabled": true,%
!    "auto_reorder_enabled": true,*
&    "stock_reservation_enabled": true,&
"    "bin_mandatory_enabled": true,1
-    "physical_stock_approval_required": true,3
/    "stock_adjustment_approval_required": true,(
$    "scrap_approval_required": true,+
'    "warranty_approval_required": true,-
)    "high_value_approval_threshold": 5000
  },
  "customers": [],
  "jobCards": [],
  "warrantyClaims": [	
    {
      "id": "WAR-001",)
%      "claim_no": "CLM-HONDA-26-091",'
#      "job_card_id": "JC-2026-001",,
(      "vehicle_reg_no": "MH-12-AB-1234",*
&      "customer_name": "Ramesh Patil",$
       "store_id": "WH-PUN-WARR",H
D      "oem_manufacturer": "Honda Motorcycle & Scooter India (HMSI)",#
      "item_id": "ITEM-2W-014",C
?      "item_name": "Defective Brake Pad (Lining Delamination)",&
"      "batch_no": "LOT-WARR-2601",
      "qty": 1,
      "claim_amount": 380,Z
V      "defect_reason": "Premature lining friction material separation under 2,000 km",%
!      "claim_date": "2026-09-18",
      "status": "APPROVED",@
<      "resolution": "OEM Credit Note Issued (CN-HMSI-4491)",)
%      "settlement_date": "2026-09-21"

    },	
    {
      "id": "WAR-002",)
%      "claim_no": "CLM-EXIDE-26-042",'
#      "job_card_id": "JC-2026-002",,
(      "vehicle_reg_no": "MH-14-EF-5678",+
'      "customer_name": "Amit Deshmukh",$
       "store_id": "WH-PUN-WARR",6
2      "oem_manufacturer": "Exide Industries Ltd.",#
      "item_id": "ITEM-2W-007",.
*      "item_name": "VRLA Battery 12V 5Ah",%
!      "batch_no": "LOT-BAT-2603",
      "qty": 1,
      "claim_amount": 1350,T
P      "defect_reason": "Dead cell open circuit within 6 months warranty period",%
!      "claim_date": "2026-09-20",)
%      "status": "PENDING_INSPECTION",B
>      "resolution": "Awaiting OEM technical inspection visit",!
      "settlement_date": null	
    }
  ],
  "scrapDisposals": [	
    {
      "id": "SCRAP-001",,
(      "disposal_no": "SCRAP-PUN-26-018",%
!      "store_id": "WH-PUN-SCRAP",Q
M      "scrap_type": "Worn Brake Drums, Damaged Alloy Rims & Bent Fork Tubes",#
      "item_id": "ITEM-2W-015",$
       "category": "Scrap Parts",
      "qty_kg": 56.5,%
!      "valuation_amount": 1412.5,C
?      "reason": "Unusable workshop replacement salvage metals",;
7      "authorized_by": "Branch Manager (Pravin Patil)",>
:      "disposal_method": "Authorized Scrap Recycler Sale",<
8      "buyer_name": "Mahalaxmi Metal & Alloy Recyclers",*
&      "gate_pass_no": "GP-SCRAP-8821",(
$      "disposal_date": "2026-09-16",
      "status": "DISPOSED"

    },	
    {
      "id": "SCRAP-002",,
(      "disposal_no": "SCRAP-PUN-26-019",%
!      "store_id": "WH-PUN-SCRAP",O
K      "scrap_type": "Damaged V-Belts, Degraded Rubber Gaskets & Oil Seals",#
      "item_id": "ITEM-2W-015",+
'      "category": "Rubber Parts Scrap",
      "qty_kg": 18,"
      "valuation_amount": 270,9
5      "reason": "Perished and worn out rubber parts",;
7      "authorized_by": "Store Manager (Rajesh Sharma)",A
=      "disposal_method": "Safe Eco-Incineration & Shredding",=
9      "buyer_name": "EcoClean Waste Management Services",*
&      "gate_pass_no": "GP-SCRAP-8835",(
$      "disposal_date": "2026-09-22",&
"      "status": "PENDING_APPROVAL"	
    }
  ],
  "stockCountSessions": [	
    {
      "id": "CNT-2026-001",,
(      "session_no": "PHY-CNT-PUN-26-09",%
!      "store_id": "WH-PUN-SPARE",0
,      "store_name": "Spare Parts Sub Store",5
1      "freeze_timestamp": "2026-09-20T18:00:00Z", 
      "status": "FINALIZED",%
!      "auditor": "Rajesh Sharma",
      "items": [
	        {'
#          "item_id": "ITEM-2W-001",8
4          "item_name": "Front Brake Pad Set (Disc)",
          "system_qty": 45,!
          "physical_qty": 43,
          "variance": -2,
          "unit_cost": 280,%
!          "variance_value": -560,#
          "status": "ADJUSTED",7
3          "reason": "Physical Shortage / Misplaced"

        },
	        {'
#          "item_id": "ITEM-2W-002",1
-          "item_name": "Rear Brake Shoe Set",
          "system_qty": 60,!
          "physical_qty": 62,
          "variance": 2,
          "unit_cost": 180,$
           "variance_value": 360,#
          "status": "ADJUSTED",B
>          "reason": "Excess Found / Previous Count Correction"

        },
	        {'
#          "item_id": "ITEM-2W-004",5
1          "item_name": "Foam Air Filter Element",
          "system_qty": 30,!
          "physical_qty": 30,
          "variance": 0,
          "unit_cost": 95,"
          "variance_value": 0,"
          "status": "MATCHED",%
!          "reason": "Exact Match"
	        }
      ],$
       "adjustment_posted": true,)
%      "adjustment_id": "ADJ-2026-001"	
    }
  ],
  "common_masters": [‰
„    { "id": "CM-001", "type": "TITLE", "type_label": "Title", "code": "MR", "name": "Mr.", "description": "Formal title for adult male", "sort_order": 1, "status": "Active", "linked_gender_code": "MALE", "linked_gender_name": "Male", "is_gender_fixed": true },“
Ž    { "id": "CM-002", "type": "TITLE", "type_label": "Title", "code": "MRS", "name": "Mrs.", "description": "Formal title for married female", "sort_order": 2, "status": "Active", "linked_gender_code": "FEMALE", "linked_gender_name": "Female", "is_gender_fixed": true },¦
¡    { "id": "CM-003", "type": "TITLE", "type_label": "Title", "code": "MS", "name": "Ms.", "description": "Formal title for female regardless of marital status", "sort_order": 3, "status": "Active", "linked_gender_code": "FEMALE", "linked_gender_name": "Female", "is_gender_fixed": true },’
    { "id": "CM-004", "type": "TITLE", "type_label": "Title", "code": "DR", "name": "Dr.", "description": "Medical practitioner or doctorate holder", "sort_order": 4, "status": "Active", "linked_gender_code": "", "linked_gender_name": "Any", "is_gender_fixed": false },‹
†    { "id": "CM-005", "type": "TITLE", "type_label": "Title", "code": "PROF", "name": "Prof.", "description": "Academic professor or faculty", "sort_order": 5, "status": "Active", "linked_gender_code": "", "linked_gender_name": "Any", "is_gender_fixed": false },›
–    { "id": "CM-006", "type": "TITLE", "type_label": "Title", "code": "SHRI", "name": "Shri", "description": "Traditional Indian honorific title for men", "sort_order": 6, "status": "Active", "linked_gender_code": "MALE", "linked_gender_name": "Male", "is_gender_fixed": true },¨
£    { "id": "CM-007", "type": "TITLE", "type_label": "Title", "code": "SMT", "name": "Smt.", "description": "Traditional Indian honorific title for married women", "sort_order": 7, "status": "Active", "linked_gender_code": "FEMALE", "linked_gender_name": "Female", "is_gender_fixed": true },…
€    { "id": "CM-008", "type": "TITLE", "type_label": "Title", "code": "ADV", "name": "Adv.", "description": "Advocate or legal counsel", "sort_order": 8, "status": "Active", "linked_gender_code": "", "linked_gender_name": "Any", "is_gender_fixed": false },²
­    { "id": "CM-009", "type": "GENDER", "type_label": "Gender", "code": "MALE", "name": "Male", "description": "Male gender identity", "sort_order": 1, "status": "Active" },¸
³    { "id": "CM-010", "type": "GENDER", "type_label": "Gender", "code": "FEMALE", "name": "Female", "description": "Female gender identity", "sort_order": 2, "status": "Active" },º
µ    { "id": "CM-011", "type": "GENDER", "type_label": "Gender", "code": "TRANS", "name": "Transgender", "description": "Transgender identity", "sort_order": 3, "status": "Active" },È
Ã    { "id": "CM-012", "type": "GENDER", "type_label": "Gender", "code": "OTHER", "name": "Other", "description": "Non-binary / Other gender classification", "sort_order": 4, "status": "Active" },Ê
Å    { "id": "CM-013", "type": "GENDER", "type_label": "Gender", "code": "PND", "name": "Prefer Not to Say", "description": "Individual chose not to disclose", "sort_order": 5, "status": "Active" },‚
ý    { "id": "CM-014", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-WALK", "name": "Walk-in / Direct Visit", "description": "Visited workshop or showroom directly without prior referral", "sort_order": 1, "status": "Active" },ì
ç    { "id": "CM-015", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-CUST", "name": "Customer Referral", "description": "Referred by an existing registered customer", "sort_order": 2, "status": "Active" },ù
ô    { "id": "CM-016", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-ONLINE", "name": "Google / Web Search", "description": "Online portal, Google Maps, or organic web discovery", "sort_order": 3, "status": "Active" },ù
ô    { "id": "CM-017", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-SOCIAL", "name": "Social Media Campaign", "description": "Instagram, YouTube, Facebook, or digital campaigns", "sort_order": 4, "status": "Active" },Š
…    { "id": "CM-018", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-GARAGE", "name": "Affiliated Mechanic / Garage", "description": "Referred by a partner garage, mechanic, or puncture workshop", "sort_order": 5, "status": "Active" },ð
ë    { "id": "CM-019", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-DEALER", "name": "OEM Brand Dealership", "description": "Authorized two-wheeler dealership referral", "sort_order": 6, "status": "Active" },û
ö    { "id": "CM-020", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-CORP", "name": "Corporate Tie-up", "description": "Corporate fleet alliance or company employee welfare tie-up", "sort_order": 7, "status": "Active" },„
ÿ    { "id": "CM-021", "type": "REFERRAL_SOURCE", "type_label": "Referral Source", "code": "REF-PRINT", "name": "Print & Outdoor Ads", "description": "Newspaper leaflet, billboard hoarding, or automotive expo banner", "sort_order": 8, "status": "Active" },ù
ô    { "id": "CM-022", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-PROMO", "name": "Promotional Campaign", "description": "Seasonal sales promotion coupon or marketing scheme", "sort_order": 1, "status": "Active" },þ
ù    { "id": "CM-023", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-BULK", "name": "Bulk Volume Discount", "description": "Quantity discount for large corporate / fleet procurement", "sort_order": 2, "status": "Active" },ó
î    { "id": "CM-024", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-FESTIVE", "name": "Festive Offer", "description": "Diwali, Dussehra, Gudi Padwa, or New Year discount", "sort_order": 3, "status": "Active" },‡
‚    { "id": "CM-025", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-MGMT", "name": "Management Discretion", "description": "Special commercial approval from Branch Manager / General Manager", "sort_order": 4, "status": "Active" },
ü    { "id": "CM-026", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-LOYALTY", "name": "Customer Loyalty Reward", "description": "Tiered loyalty points redemption or membership benefit", "sort_order": 5, "status": "Active" },÷
ò    { "id": "CM-027", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-ROUND", "name": "Settlement Round-off", "description": "Cash billing round-off / minor rounding tolerance", "sort_order": 6, "status": "Active" },‰
„    { "id": "CM-028", "type": "DISCOUNT_REASON", "type_label": "Discount Reason", "code": "DISC-FLEET", "name": "Commercial Fleet Contract", "description": "Agreed contractual rate for logistics and delivery bike fleets", "sort_order": 7, "status": "Active" },…
€    { "id": "CM-029", "type": "CONCESSION_REASON", "type_label": "Concession Reason", "code": "CONC-EMP", "name": "Staff / Employee Benefit", "description": "Internal company employee and immediate family concession", "sort_order": 1, "status": "Active" },ú
õ    { "id": "CM-030", "type": "CONCESSION_REASON", "type_label": "Concession Reason", "code": "CONC-SNR", "name": "Senior Citizen Welfare", "description": "Concession for senior citizens aged 60 and above", "sort_order": 2, "status": "Active" },
ˆ    { "id": "CM-031", "type": "CONCESSION_REASON", "type_label": "Concession Reason", "code": "CONC-DEF", "name": "Defense & Armed Forces", "description": "Serving personnel and veterans of military, paramilitary, or police", "sort_order": 3, "status": "Active" },†
    { "id": "CM-032", "type": "CONCESSION_REASON", "type_label": "Concession Reason", "code": "CONC-GOVT", "name": "Government Quota", "description": "Public department, municipal, or institutional vehicle concession", "sort_order": 4, "status": "Active" },ƒ
þ    { "id": "CM-033", "type": "CONCESSION_REASON", "type_label": "Concession Reason", "code": "CONC-STUDENT", "name": "Student Concession", "description": "Active college / vocational university student concession", "sort_order": 5, "status": "Active" },‚
ý    { "id": "CM-034", "type": "CONCESSION_REASON", "type_label": "Concession Reason", "code": "CONC-CHARITY", "name": "Charity / NGO Alliance", "description": "Registered NGO and social service vehicle concession", "sort_order": 6, "status": "Active" },ˆ
ƒ    { "id": "CM-035", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-MIND", "name": "Customer Changed Mind", "description": "Customer voluntarily decided to cancel service or purchase", "sort_order": 1, "status": "Active" },‹
†    { "id": "CM-036", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-DELAY", "name": "Lead Time Delay", "description": "Part replenishment timeline exceeded customer acceptable timeframe", "sort_order": 2, "status": "Active" },†
    { "id": "CM-037", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-PRICE", "name": "Price Sensitivity", "description": "Customer located lower price elsewhere or estimate rejected", "sort_order": 3, "status": "Active" },†
    { "id": "CM-038", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-ERR", "name": "Duplicate / Order in Error", "description": "Requisition or invoice generated mistakenly in error", "sort_order": 4, "status": "Active" },
Š    { "id": "CM-039", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-DONE", "name": "Already Repaired Elsewhere", "description": "Customer got vehicle repaired elsewhere prior to fulfillment", "sort_order": 5, "status": "Active" },Š
…    { "id": "CM-040", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-BUDGET", "name": "Budget Constraints", "description": "Customer temporarily postponed repair due to liquidity issues", "sort_order": 6, "status": "Active" },ƒ
þ    { "id": "CM-041", "type": "CANCELLATION_REASON", "type_label": "Cancellation Reason", "code": "CANC-OOS", "name": "Part Out of Stock", "description": "Spare part discontinued or unavailable across supply chain", "sort_order": 7, "status": "Active" },Á
¼    { "id": "CM-042", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-SPOUSE", "name": "Spouse", "description": "Husband or Wife", "sort_order": 1, "status": "Active" },¸
³    { "id": "CM-043", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-FATHER", "name": "Father", "description": "Father", "sort_order": 2, "status": "Active" },¸
³    { "id": "CM-044", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-MOTHER", "name": "Mother", "description": "Mother", "sort_order": 3, "status": "Active" },¯
ª    { "id": "CM-045", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-SON", "name": "Son", "description": "Son", "sort_order": 4, "status": "Active" },¾
¹    { "id": "CM-046", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-DAUGHTER", "name": "Daughter", "description": "Daughter", "sort_order": 5, "status": "Active" },»
¶    { "id": "CM-047", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-BROTHER", "name": "Brother", "description": "Brother", "sort_order": 6, "status": "Active" },¸
³    { "id": "CM-048", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-SISTER", "name": "Sister", "description": "Sister", "sort_order": 7, "status": "Active" },Ñ
Ì    { "id": "CM-049", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-GUARDIAN", "name": "Guardian", "description": "Legal guardian or custodian", "sort_order": 8, "status": "Active" },Ì
Ç    { "id": "CM-050", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-NOMINEE", "name": "Nominee", "description": "Designated claim nominee", "sort_order": 9, "status": "Active" },ô
ï    { "id": "CM-051", "type": "RELATIONSHIP", "type_label": "Relationship", "code": "REL-REP", "name": "Authorized Representative", "description": "Designated commercial agent, driver, or caretaker", "sort_order": 10, "status": "Active" },Å
À    { "id": "CM-052", "type": "MARITAL_STATUS", "type_label": "Marital Status", "code": "MS-SINGLE", "name": "Single", "description": "Unmarried person", "sort_order": 1, "status": "Active" },Í
È    { "id": "CM-053", "type": "MARITAL_STATUS", "type_label": "Marital Status", "code": "MS-MARRIED", "name": "Married", "description": "Legally married person", "sort_order": 2, "status": "Active" },Ð
Ë    { "id": "CM-054", "type": "MARITAL_STATUS", "type_label": "Marital Status", "code": "MS-DIVORCED", "name": "Divorced", "description": "Legally divorced person", "sort_order": 3, "status": "Active" },Û
Ö    { "id": "CM-055", "type": "MARITAL_STATUS", "type_label": "Marital Status", "code": "MS-WIDOWED", "name": "Widowed", "description": "Surviving spouse of deceased partner", "sort_order": 4, "status": "Active" },Ý
Ø    { "id": "CM-056", "type": "MARITAL_STATUS", "type_label": "Marital Status", "code": "MS-SEPARATED", "name": "Separated", "description": "Separated but not legally divorced", "sort_order": 5, "status": "Active" },ø
ó    { "id": "CM-057", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-TRANSIT", "name": "Transit Damage", "description": "Damaged during freight transport or logistics handling", "sort_order": 1, "status": "Active" },þ
ù    { "id": "CM-058", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-EXPIRY", "name": "Expired / Shelf-Life", "description": "Oils, gaskets, chemicals, or rubber past shelf validity", "sort_order": 2, "status": "Active" },þ
ù    { "id": "CM-059", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-OBSOLETE", "name": "Obsolete Design", "description": "Legacy superseded part code no longer usable or returnable", "sort_order": 3, "status": "Active" },‰
„    { "id": "CM-060", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-VARIANCE", "name": "Inventory Audit Shortfall", "description": "Unaccounted physical variance approved for ledger write-off", "sort_order": 4, "status": "Active" },‡
‚    { "id": "CM-061", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-SCRAP", "name": "Workshop Scrap / Machining Defect", "description": "Irreparable core, stripped thread, or workshop scrap", "sort_order": 5, "status": "Active" },ˆ
ƒ    { "id": "CM-062", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-WEATHER", "name": "Water / Environmental Damage", "description": "Warehouse flooding, heavy rain, or corrosive rust damage", "sort_order": 6, "status": "Active" },„
ÿ    { "id": "CM-063", "type": "WRITE_OFF_REASON", "type_label": "Write-off Reason", "code": "WO-BADDEBT", "name": "Uncollectible Bad Debt", "description": "Irrecoverable receivables written off after audit approval", "sort_order": 7, "status": "Active" },÷
ò    { "id": "CM-064", "type": "TRANSFER_REASON", "type_label": "Transfer Reason", "code": "TR-BALANCE", "name": "Stock Balancing", "description": "Routine inter-store balancing based on demand velocity", "sort_order": 1, "status": "Active" },þ
ù    { "id": "CM-065", "type": "TRANSFER_REASON", "type_label": "Transfer Reason", "code": "TR-JOB", "name": "Urgent Job Card Need", "description": "Urgent part transfer required to complete active service job", "sort_order": 2, "status": "Active" },„
ÿ    { "id": "CM-066", "type": "TRANSFER_REASON", "type_label": "Transfer Reason", "code": "TR-REPLENISH", "name": "Central Restocking", "description": "Scheduled weekly replenishment from central distribution plant", "sort_order": 3, "status": "Active" },ÿ
ú    { "id": "CM-067", "type": "TRANSFER_REASON", "type_label": "Transfer Reason", "code": "TR-QUARANTINE", "name": "Quality Quarantine", "description": "Transfer of suspect lot to quality isolation / audit bay", "sort_order": 4, "status": "Active" },Œ
‡    { "id": "CM-068", "type": "TRANSFER_REASON", "type_label": "Transfer Reason", "code": "TR-SEASONAL", "name": "Seasonal Demand Pre-positioning", "description": "Relocating monsoon or summer parts to high-volume branches", "sort_order": 5, "status": "Active" },‡
‚    { "id": "CM-069", "type": "TRANSFER_REASON", "type_label": "Transfer Reason", "code": "TR-SURPLUS", "name": "Overstock / Slow-Moving Return", "description": "Returning excess inventory back to main mother warehouse", "sort_order": 6, "status": "Active" }
  ],
  "taxes": [	
    {
      "id": "TAX-001",
      "code": "GST0",
      "name": "GST 0%",
      "type": "GST",
      "rate": 0,
      "total_gst": 0,
      "cgst_rate": 0,
      "sgst_rate": 0,
      "igst_rate": 0,!
      "system_default": true,
      "editable": false,
      "deletable": false,
      "status": "Active",
      "is_global": true,)
%      "effective_from": "2017-07-01",
      "effective_to": "",8
4      "applicable_transactions": "All Transactions",\
X      "description": "Nil rated Goods and Services under GST (Exempt supplies & grain)","
      "transaction_count": 142

    },	
    {
      "id": "TAX-002",
      "code": "GST5",
      "name": "GST 5%",
      "type": "GST",
      "rate": 5,
      "total_gst": 5,
      "cgst_rate": 2.5,
      "sgst_rate": 2.5,
      "igst_rate": 5,!
      "system_default": true,
      "editable": false,
      "deletable": false,
      "status": "Active",
      "is_global": true,)
%      "effective_from": "2017-07-01",
      "effective_to": "",8
4      "applicable_transactions": "All Transactions",q
m      "description": "Standard Concessional GST 5% (Essential workshop supplies, freight & specified parts)","
      "transaction_count": 512

    },	
    {
      "id": "TAX-003",
      "code": "GST12",
      "name": "GST 12%",
      "type": "GST",
      "rate": 12,
      "total_gst": 12,
      "cgst_rate": 6,
      "sgst_rate": 6,
      "igst_rate": 12,!
      "system_default": true,
      "editable": false,
      "deletable": false,
      "status": "Active",
      "is_global": true,)
%      "effective_from": "2017-07-01",
      "effective_to": "",8
4      "applicable_transactions": "All Transactions",h
d      "description": "Standard GST 12% (Specified parts, mechanical assemblies, specialized tools)","
      "transaction_count": 840

    },	
    {
      "id": "TAX-004",
      "code": "GST18",
      "name": "GST 18%",
      "type": "GST",
      "rate": 18,
      "total_gst": 18,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "igst_rate": 18,!
      "system_default": true,
      "editable": false,
      "deletable": false,
      "status": "Active",
      "is_global": true,)
%      "effective_from": "2017-07-01",
      "effective_to": "",8
4      "applicable_transactions": "All Transactions",
{      "description": "Standard Automotive GST 18% (Most two-wheeler spare parts, lubricants, consumables & service labor)",#
      "transaction_count": 2450

    },	
    {
      "id": "TAX-005",
      "code": "GST28",
      "name": "GST 28%",
      "type": "GST",
      "rate": 28,
      "total_gst": 28,
      "cgst_rate": 14,
      "sgst_rate": 14,
      "igst_rate": 28,!
      "system_default": true,
      "editable": false,
      "deletable": false,
      "status": "Active",
      "is_global": true,)
%      "effective_from": "2017-07-01",
      "effective_to": "",8
4      "applicable_transactions": "All Transactions",y
u      "description": "Peak Luxury / Sin GST 28% (Automobiles, high-end performance components & premium assemblies)","
      "transaction_count": 670

    },	
    {
      "id": "TAX-006",!
      "code": "GST03-CUSTOM",#
      "name": "Special GST 3%",
      "type": "GST",
      "rate": 3,
      "total_gst": 3,
      "cgst_rate": 1.5,
      "sgst_rate": 1.5,
      "igst_rate": 3,"
      "system_default": false,
      "editable": true,
      "deletable": false,
      "status": "Active",
      "is_global": false,)
%      "effective_from": "2024-04-01",
      "effective_to": "",?
;      "applicable_transactions": "Spare Parts & Materials",l
h      "description": "Special concessional GST rate for precious metal contacts & catalytic substrates",!
      "transaction_count": 15

    },	
    {
      "id": "TAX-007",!
      "code": "CUST-CESS-01",*
&      "name": "Compensation Cess 12%",
      "type": "Custom Tax",
      "rate": 12,
      "total_gst": 12,
      "cgst_rate": 0,
      "sgst_rate": 0,
      "igst_rate": 12,"
      "system_default": false,
      "editable": true,
      "deletable": true,
      "status": "Active",
      "is_global": false,)
%      "effective_from": "2025-01-01",
      "effective_to": "",8
4      "applicable_transactions": "All Transactions",s
o      "description": "Specific compensation cess applicable on premium high-displacement (>350cc) motorcycles", 
      "transaction_count": 0	
    }
  ],!
  "document_number_series": [
      {"
          "id": "DNS-CIN-ALL",%
!          "doc_type_code": "CIN",F
B          "doc_type_name": "Customer Identification Number (CIN)",2
.          "module_name": "Customer / Journey",!
          "branch_id": "ALL",>
:          "branch_name": "All Facilities (Global Series)",#
          "branch_code": "ALL",
          "prefix": "CIN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",e
a          "description": "Global Customer Identification Number (CIN) series for all facilities",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-09T00:00:00Z"
      },
      {!
          "id": "DNS-JC-001",$
           "doc_type_code": "JC",*
&          "doc_type_name": "Job Card",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "JC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",J
F          "description": "Job Card series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-JC-002",$
           "doc_type_code": "JC",*
&          "doc_type_name": "Job Card",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "JC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",J
F          "description": "Job Card series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-JC-ALL",$
           "doc_type_code": "JC",*
&          "doc_type_name": "Job Card",(
$          "module_name": "Workshop",!
          "branch_id": "ALL",>
:          "branch_name": "All Facilities (Global Series)",#
          "branch_code": "ALL",
          "prefix": "JC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",I
E          "description": "Global Job Card series for all facilities",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {"
          "id": "DNS-EST-001",%
!          "doc_type_code": "EST",3
/          "doc_type_name": "Customer Estimate",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "EST",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",S
O          "description": "Customer Estimate series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {"
          "id": "DNS-EST-002",%
!          "doc_type_code": "EST",3
/          "doc_type_name": "Customer Estimate",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "EST",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",S
O          "description": "Customer Estimate series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {"
          "id": "DNS-EST-ALL",%
!          "doc_type_code": "EST",3
/          "doc_type_name": "Customer Estimate",(
$          "module_name": "Workshop",!
          "branch_id": "ALL",>
:          "branch_name": "All Facilities (Global Series)",#
          "branch_code": "ALL",
          "prefix": "EST",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",R
N          "description": "Global Customer Estimate series for all facilities",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-DB-001",$
           "doc_type_code": "DB",,
(          "doc_type_name": "Draft Bill",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "DB",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",L
H          "description": "Draft Bill series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-DB-002",$
           "doc_type_code": "DB",,
(          "doc_type_name": "Draft Bill",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "DB",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",L
H          "description": "Draft Bill series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-DB-ALL",$
           "doc_type_code": "DB",,
(          "doc_type_name": "Draft Bill",/
+          "module_name": "Sales / Billing",!
          "branch_id": "ALL",>
:          "branch_name": "All Facilities (Global Series)",#
          "branch_code": "ALL",
          "prefix": "DB",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",K
G          "description": "Global Draft Bill series for all facilities",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {"
          "id": "DNS-INV-001",%
!          "doc_type_code": "INV",4
0          "doc_type_name": "Tax Invoice / Bill",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "INV",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",T
P          "description": "Tax Invoice / Bill series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {"
          "id": "DNS-INV-002",%
!          "doc_type_code": "INV",4
0          "doc_type_name": "Tax Invoice / Bill",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "INV",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",T
P          "description": "Tax Invoice / Bill series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {"
          "id": "DNS-INV-ALL",%
!          "doc_type_code": "INV",4
0          "doc_type_name": "Tax Invoice / Bill",/
+          "module_name": "Sales / Billing",!
          "branch_id": "ALL",>
:          "branch_name": "All Facilities (Global Series)",#
          "branch_code": "ALL",
          "prefix": "INV",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",S
O          "description": "Global Tax Invoice / Bill series for all facilities",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-GP-001",$
           "doc_type_code": "GP",4
0          "doc_type_name": "Delivery Gate Pass",0
,          "module_name": "Vehicle Delivery",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "GP",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",T
P          "description": "Delivery Gate Pass series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-GP-002",$
           "doc_type_code": "GP",4
0          "doc_type_name": "Delivery Gate Pass",0
,          "module_name": "Vehicle Delivery",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "GP",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",T
P          "description": "Delivery Gate Pass series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {!
          "id": "DNS-GP-ALL",$
           "doc_type_code": "GP",4
0          "doc_type_name": "Delivery Gate Pass",0
,          "module_name": "Vehicle Delivery",!
          "branch_id": "ALL",>
:          "branch_name": "All Facilities (Global Series)",#
          "branch_code": "ALL",
          "prefix": "GP",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2030-03-31",!
          "status": "Active",S
O          "description": "Global Delivery Gate Pass series for all facilities",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-12T00:00:00Z"
      },
      {
          "id": "DNS-018",$
           "doc_type_code": "PO",0
,          "doc_type_name": "Purchase Order",(
$          "module_name": "Purchase",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "PO",
          "suffix": "",
          "separator": "/","
          "year_format": "FY",!
          "number_length": 4,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",P
L          "description": "Purchase Order series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-001",$
           "doc_type_code": "WO",,
(          "doc_type_name": "Work Order",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "WO",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",X
T          "description": "Standard Work Order numbering for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-004",%
!          "doc_type_code": "INV",-
)          "doc_type_name": "Tax Invoice",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "INV",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",[
W          "description": "Statutory GST Tax Invoice series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-005",$
           "doc_type_code": "CS",.
*          "doc_type_name": "Counter Sale",.
*          "module_name": "Sales / Retail",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "CS",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",W
S          "description": "Counter Sales receipt series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-006",$
           "doc_type_code": "PO",0
,          "doc_type_name": "Purchase Order",(
$          "module_name": "Purchase",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "PO",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",P
L          "description": "Purchase Order series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-007",%
!          "doc_type_code": "GRN",:
6          "doc_type_name": "Goods Receipt Note (GRN)",4
0          "module_name": "Purchase / Warehouse",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "GRN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",X
T          "description": "Inward Goods Receipt sequence for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-008",$
           "doc_type_code": "PR",1
-          "doc_type_name": "Purchase Return",(
$          "module_name": "Purchase",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "PR",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",g
c          "description": "Vendor debit memo and purchase return series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-009",$
           "doc_type_code": "SR",.
*          "doc_type_name": "Sales Return",%
!          "module_name": "Sales",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "SR",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",^
Z          "description": "Customer sales return documentation for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-002",$
           "doc_type_code": "WO",,
(          "doc_type_name": "Work Order",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "WO",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",X
T          "description": "Standard Work Order numbering for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-003",$
           "doc_type_code": "JC",*
&          "doc_type_name": "Job Card",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "JC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",V
R          "description": "Two-Wheeler Job Card series for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-010",$
           "doc_type_code": "ST",0
,          "doc_type_name": "Stock Transfer",)
%          "module_name": "Inventory",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "ST",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",T
P          "description": "Inter-facility and inter-store stock movement series",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-011",$
           "doc_type_code": "MI",0
,          "doc_type_name": "Material Issue",4
0          "module_name": "Inventory / Workshop",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "MI",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",L
H          "description": "Workshop store parts issuance voucher series",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-012",$
           "doc_type_code": "MR",1
-          "doc_type_name": "Material Return",4
0          "module_name": "Inventory / Workshop",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "MR",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",N
J          "description": "Unused material return to store voucher series",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-013",$
           "doc_type_code": "CN",-
)          "doc_type_name": "Credit Note",(
$          "module_name": "Accounts",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "CN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",M
I          "description": "Statutory Accounts Credit Note voucher series",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-014",$
           "doc_type_code": "DN",,
(          "doc_type_name": "Debit Note",(
$          "module_name": "Accounts",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "DN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",L
H          "description": "Statutory Accounts Debit Note voucher series",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-015",$
           "doc_type_code": "WC",0
,          "doc_type_name": "Warranty Claim",(
$          "module_name": "Warranty",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "WC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",M
I          "description": "OEM Warranty Claim settlement document series",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-016",$
           "doc_type_code": "JC",*
&          "doc_type_name": "Job Card",(
$          "module_name": "Workshop",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "JC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",V
R          "description": "Two-Wheeler Job Card series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-10-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-017",%
!          "doc_type_code": "INV",-
)          "doc_type_name": "Tax Invoice",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "INV",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",#
          "status": "Inactive",V
R          "description": "Archived tax invoice series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-019",%
!          "doc_type_code": "INV",-
)          "doc_type_name": "Tax Invoice",/
+          "module_name": "Sales / Billing",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "INV",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",X
T          "description": "Active GST Tax Invoice series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-020",$
           "doc_type_code": "CS",.
*          "doc_type_name": "Counter Sale",.
*          "module_name": "Sales / Retail",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "CS",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",W
S          "description": "Counter Sales receipt series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-021",%
!          "doc_type_code": "GRN",:
6          "doc_type_name": "Goods Receipt Note (GRN)",4
0          "module_name": "Purchase / Warehouse",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "GRN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",X
T          "description": "Inward Goods Receipt sequence for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-022",$
           "doc_type_code": "SR",.
*          "doc_type_name": "Sales Return",%
!          "module_name": "Sales",&
"          "branch_id": "PLANT-01",6
2          "branch_name": "Mauli Service Center 1",$
           "branch_code": "MSC1",
          "prefix": "SR",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",^
Z          "description": "Customer sales return documentation for Mauli Service Center 1",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-023",$
           "doc_type_code": "PR",1
-          "doc_type_name": "Purchase Return",(
$          "module_name": "Purchase",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "PR",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",g
c          "description": "Vendor debit memo and purchase return series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-024",$
           "doc_type_code": "ST",0
,          "doc_type_name": "Stock Transfer",)
%          "module_name": "Inventory",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "ST",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",o
k          "description": "Inter-facility and inter-store stock movement series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-025",$
           "doc_type_code": "MI",0
,          "doc_type_name": "Material Issue",4
0          "module_name": "Inventory / Workshop",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "MI",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",g
c          "description": "Workshop store parts issuance voucher series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-026",$
           "doc_type_code": "MR",1
-          "doc_type_name": "Material Return",4
0          "module_name": "Inventory / Workshop",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "MR",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",i
e          "description": "Unused material return to store voucher series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-027",$
           "doc_type_code": "CN",-
)          "doc_type_name": "Credit Note",(
$          "module_name": "Accounts",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "CN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",h
d          "description": "Statutory Accounts Credit Note voucher series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-028",$
           "doc_type_code": "DN",,
(          "doc_type_name": "Debit Note",(
$          "module_name": "Accounts",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "DN",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",g
c          "description": "Statutory Accounts Debit Note voucher series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      },
      {
          "id": "DNS-029",$
           "doc_type_code": "WC",0
,          "doc_type_name": "Warranty Claim",(
$          "module_name": "Warranty",&
"          "branch_id": "PLANT-02",6
2          "branch_name": "Mauli Service Center 2",$
           "branch_code": "MSC2",
          "prefix": "WC",
          "suffix": "",
          "separator": "/",$
           "year_format": "YYYY",!
          "number_length": 6,#
          "starting_number": 1,"
          "current_number": 0,
          "next_number": 1,2
.          "reset_frequency": "Financial Year",-
)          "effective_from": "2026-04-01",+
'          "effective_to": "2027-03-31",!
          "status": "Active",_
[          "description": "OEM Warranty Claim settlement series for Mauli Service Center 2",#
          "generated_count": 0,3
/          "created_by": "System Administrator",3
/          "created_at": "2026-04-01T09:00:00Z",2
.          "updated_at": "2026-10-07T00:00:00Z"
      }
  ],
  "financial_calendar": [	
    {
      "id": "FC-001",.
*      "financial_year_code": "FY 2026-27",<
8      "financial_year_name": "Financial Year 2026-2027",%
!      "start_date": "2026-04-01",#
      "end_date": "2027-03-31",'
#      "organization_id": "ORG-001",=
9      "organization_name": "Patil Auto Dynamics Pvt Ltd",
      "branch_id": "ALL",9
5      "branch_name": "All Facilities (Company-wide)",#
      "period_type": "Monthly",
      "status": "Open","
      "current_year_yn": true,$
       "transaction_count": 1450,_
[      "remarks": "Standard Operating Financial Year for Two-Wheeler Workshop & Dealership",/
+      "created_by": "System Administrator",/
+      "created_at": "2026-04-01T00:00:00Z",/
+      "updated_at": "2026-10-06T12:00:00Z",
      "periods": […
€        { "id": "FP-2026-04", "period_code": "2026-04", "period_name": "April 2026", "start_date": "2026-04-01", "end_date": "2026-04-30", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-05-02T18:00:00Z", "transaction_count": 210 },ƒ
þ        { "id": "FP-2026-05", "period_code": "2026-05", "period_name": "May 2026", "start_date": "2026-05-01", "end_date": "2026-05-31", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-06-02T18:00:00Z", "transaction_count": 235 },„
ÿ        { "id": "FP-2026-06", "period_code": "2026-06", "period_name": "June 2026", "start_date": "2026-06-01", "end_date": "2026-06-30", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-07-02T18:00:00Z", "transaction_count": 198 },„
ÿ        { "id": "FP-2026-07", "period_code": "2026-07", "period_name": "July 2026", "start_date": "2026-07-01", "end_date": "2026-07-31", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-08-02T18:00:00Z", "transaction_count": 240 },†
        { "id": "FP-2026-08", "period_code": "2026-08", "period_name": "August 2026", "start_date": "2026-08-01", "end_date": "2026-08-31", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-09-02T18:00:00Z", "transaction_count": 280 },‰
„        { "id": "FP-2026-09", "period_code": "2026-09", "period_name": "September 2026", "start_date": "2026-09-01", "end_date": "2026-09-30", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-10-02T18:00:00Z", "transaction_count": 212 },Ò
Í        { "id": "FP-2026-10", "period_code": "2026-10", "period_name": "October 2026", "start_date": "2026-10-01", "end_date": "2026-10-31", "status": "Open", "is_current": true, "transaction_count": 75 },À
»        { "id": "FP-2026-11", "period_code": "2026-11", "period_name": "November 2026", "start_date": "2026-11-01", "end_date": "2026-11-30", "status": "Future", "transaction_count": 0 },À
»        { "id": "FP-2026-12", "period_code": "2026-12", "period_name": "December 2026", "start_date": "2026-12-01", "end_date": "2026-12-31", "status": "Future", "transaction_count": 0 },¿
º        { "id": "FP-2027-01", "period_code": "2027-01", "period_name": "January 2027", "start_date": "2027-01-01", "end_date": "2027-01-31", "status": "Future", "transaction_count": 0 },À
»        { "id": "FP-2027-02", "period_code": "2027-02", "period_name": "February 2027", "start_date": "2027-02-01", "end_date": "2027-02-28", "status": "Future", "transaction_count": 0 },¼
·        { "id": "FP-2027-03", "period_code": "2027-03", "period_name": "March 2027", "start_date": "2027-03-01", "end_date": "2027-03-31", "status": "Future", "transaction_count": 0 }
      ]

    },	
    {
      "id": "FC-002",.
*      "financial_year_code": "FY 2025-26",<
8      "financial_year_name": "Financial Year 2025-2026",%
!      "start_date": "2025-04-01",#
      "end_date": "2026-03-31",'
#      "organization_id": "ORG-001",=
9      "organization_name": "Patil Auto Dynamics Pvt Ltd",
      "branch_id": "ALL",9
5      "branch_name": "All Facilities (Company-wide)",#
      "period_type": "Monthly",
      "status": "Closed",#
      "current_year_yn": false,$
       "transaction_count": 8920,G
C      "remarks": "Audited and finalized historical financial year",/
+      "created_by": "System Administrator",/
+      "created_at": "2025-04-01T00:00:00Z",/
+      "updated_at": "2026-04-05T10:00:00Z",
      "periods": [¿
º        { "id": "FP-2025-04", "period_code": "2025-04", "period_name": "April 2025", "start_date": "2025-04-01", "end_date": "2025-04-30", "status": "Closed", "transaction_count": 680 },½
¸        { "id": "FP-2025-05", "period_code": "2025-05", "period_name": "May 2025", "start_date": "2025-05-01", "end_date": "2025-05-31", "status": "Closed", "transaction_count": 710 },¾
¹        { "id": "FP-2025-06", "period_code": "2025-06", "period_name": "June 2025", "start_date": "2025-06-01", "end_date": "2025-06-30", "status": "Closed", "transaction_count": 740 },¾
¹        { "id": "FP-2025-07", "period_code": "2025-07", "period_name": "July 2025", "start_date": "2025-07-01", "end_date": "2025-07-31", "status": "Closed", "transaction_count": 690 },À
»        { "id": "FP-2025-08", "period_code": "2025-08", "period_name": "August 2025", "start_date": "2025-08-01", "end_date": "2025-08-31", "status": "Closed", "transaction_count": 780 },Ã
¾        { "id": "FP-2025-09", "period_code": "2025-09", "period_name": "September 2025", "start_date": "2025-09-01", "end_date": "2025-09-30", "status": "Closed", "transaction_count": 730 },Á
¼        { "id": "FP-2025-10", "period_code": "2025-10", "period_name": "October 2025", "start_date": "2025-10-01", "end_date": "2025-10-31", "status": "Closed", "transaction_count": 810 },Â
½        { "id": "FP-2025-11", "period_code": "2025-11", "period_name": "November 2025", "start_date": "2025-11-01", "end_date": "2025-11-30", "status": "Closed", "transaction_count": 790 },Â
½        { "id": "FP-2025-12", "period_code": "2025-12", "period_name": "December 2025", "start_date": "2025-12-01", "end_date": "2025-12-31", "status": "Closed", "transaction_count": 840 },Á
¼        { "id": "FP-2026-01", "period_code": "2026-01", "period_name": "January 2026", "start_date": "2026-01-01", "end_date": "2026-01-31", "status": "Closed", "transaction_count": 720 },Â
½        { "id": "FP-2026-02", "period_code": "2026-02", "period_name": "February 2026", "start_date": "2026-02-01", "end_date": "2026-02-28", "status": "Closed", "transaction_count": 690 },¾
¹        { "id": "FP-2026-03", "period_code": "2026-03", "period_name": "March 2026", "start_date": "2026-03-01", "end_date": "2026-03-31", "status": "Closed", "transaction_count": 740 }
      ]

    },	
    {
      "id": "FC-003",.
*      "financial_year_code": "FY 2027-28",<
8      "financial_year_name": "Financial Year 2027-2028",%
!      "start_date": "2027-04-01",#
      "end_date": "2028-03-31",'
#      "organization_id": "ORG-001",=
9      "organization_name": "Patil Auto Dynamics Pvt Ltd",
      "branch_id": "ALL",9
5      "branch_name": "All Facilities (Company-wide)",#
      "period_type": "Monthly",
      "status": "Future",#
      "current_year_yn": false,!
      "transaction_count": 0,Z
V      "remarks": "Pre-configured upcoming financial year ready for advance budgeting",/
+      "created_by": "System Administrator",/
+      "created_at": "2026-09-01T00:00:00Z",/
+      "updated_at": "2026-09-01T00:00:00Z",
      "periods": [½
¸        { "id": "FP-2027-04", "period_code": "2027-04", "period_name": "April 2027", "start_date": "2027-04-01", "end_date": "2027-04-30", "status": "Future", "transaction_count": 0 },»
¶        { "id": "FP-2027-05", "period_code": "2027-05", "period_name": "May 2027", "start_date": "2027-05-01", "end_date": "2027-05-31", "status": "Future", "transaction_count": 0 },¼
·        { "id": "FP-2027-06", "period_code": "2027-06", "period_name": "June 2027", "start_date": "2027-06-01", "end_date": "2027-06-30", "status": "Future", "transaction_count": 0 },¼
·        { "id": "FP-2027-07", "period_code": "2027-07", "period_name": "July 2027", "start_date": "2027-07-01", "end_date": "2027-07-31", "status": "Future", "transaction_count": 0 },¾
¹        { "id": "FP-2027-08", "period_code": "2027-08", "period_name": "August 2027", "start_date": "2027-08-01", "end_date": "2027-08-31", "status": "Future", "transaction_count": 0 },Á
¼        { "id": "FP-2027-09", "period_code": "2027-09", "period_name": "September 2027", "start_date": "2027-09-01", "end_date": "2027-09-30", "status": "Future", "transaction_count": 0 },¿
º        { "id": "FP-2027-10", "period_code": "2027-10", "period_name": "October 2027", "start_date": "2027-10-01", "end_date": "2027-10-31", "status": "Future", "transaction_count": 0 },À
»        { "id": "FP-2027-11", "period_code": "2027-11", "period_name": "November 2027", "start_date": "2027-11-01", "end_date": "2027-11-30", "status": "Future", "transaction_count": 0 },À
»        { "id": "FP-2027-12", "period_code": "2027-12", "period_name": "December 2027", "start_date": "2027-12-01", "end_date": "2027-12-31", "status": "Future", "transaction_count": 0 },¿
º        { "id": "FP-2028-01", "period_code": "2028-01", "period_name": "January 2028", "start_date": "2028-01-01", "end_date": "2028-01-31", "status": "Future", "transaction_count": 0 },À
»        { "id": "FP-2028-02", "period_code": "2028-02", "period_name": "February 2028", "start_date": "2028-02-01", "end_date": "2028-02-29", "status": "Future", "transaction_count": 0 },¼
·        { "id": "FP-2028-03", "period_code": "2028-03", "period_name": "March 2028", "start_date": "2028-03-01", "end_date": "2028-03-31", "status": "Future", "transaction_count": 0 }
      ]

    },	
    {
      "id": "FC-004",4
0      "financial_year_code": "FY 2026-27 (MUM)",_
[      "financial_year_name": "Financial Year 2026-2027 (Mumbai Central Workshop Override)",%
!      "start_date": "2026-04-01",#
      "end_date": "2027-03-31",'
#      "organization_id": "ORG-001",=
9      "organization_name": "Patil Auto Dynamics Pvt Ltd", 
      "branch_id": "BR-002",3
/      "branch_name": "Mumbai Central Workshop",#
      "period_type": "Monthly",
      "status": "Open","
      "current_year_yn": true,#
      "transaction_count": 420,\
X      "remarks": "Branch-specific financial calendar override as per Section 38 & 38.1",/
+      "created_by": "System Administrator",/
+      "created_at": "2026-04-01T00:00:00Z",/
+      "updated_at": "2026-10-06T11:00:00Z",
      "periods": [ˆ
ƒ        { "id": "FP-MUM-2026-04", "period_code": "2026-04", "period_name": "April 2026", "start_date": "2026-04-01", "end_date": "2026-04-30", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-05-02T18:00:00Z", "transaction_count": 65 },†
        { "id": "FP-MUM-2026-05", "period_code": "2026-05", "period_name": "May 2026", "start_date": "2026-05-01", "end_date": "2026-05-31", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-06-02T18:00:00Z", "transaction_count": 70 },‡
‚        { "id": "FP-MUM-2026-06", "period_code": "2026-06", "period_name": "June 2026", "start_date": "2026-06-01", "end_date": "2026-06-30", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-07-02T18:00:00Z", "transaction_count": 55 },‡
‚        { "id": "FP-MUM-2026-07", "period_code": "2026-07", "period_name": "July 2026", "start_date": "2026-07-01", "end_date": "2026-07-31", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-08-02T18:00:00Z", "transaction_count": 68 },‰
„        { "id": "FP-MUM-2026-08", "period_code": "2026-08", "period_name": "August 2026", "start_date": "2026-08-01", "end_date": "2026-08-31", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-09-02T18:00:00Z", "transaction_count": 82 },Œ
‡        { "id": "FP-MUM-2026-09", "period_code": "2026-09", "period_name": "September 2026", "start_date": "2026-09-01", "end_date": "2026-09-30", "status": "Closed", "closed_by": "Accounts Manager", "closed_at": "2026-10-02T18:00:00Z", "transaction_count": 58 },Ö
Ñ        { "id": "FP-MUM-2026-10", "period_code": "2026-10", "period_name": "October 2026", "start_date": "2026-10-01", "end_date": "2026-10-31", "status": "Open", "is_current": true, "transaction_count": 22 },Ä
¿        { "id": "FP-MUM-2026-11", "period_code": "2026-11", "period_name": "November 2026", "start_date": "2026-11-01", "end_date": "2026-11-30", "status": "Future", "transaction_count": 0 },Ä
¿        { "id": "FP-MUM-2026-12", "period_code": "2026-12", "period_name": "December 2026", "start_date": "2026-12-01", "end_date": "2026-12-31", "status": "Future", "transaction_count": 0 },Ã
¾        { "id": "FP-MUM-2027-01", "period_code": "2027-01", "period_name": "January 2027", "start_date": "2027-01-01", "end_date": "2027-01-31", "status": "Future", "transaction_count": 0 },Ä
¿        { "id": "FP-MUM-2027-02", "period_code": "2027-02", "period_name": "February 2027", "start_date": "2027-02-01", "end_date": "2027-02-28", "status": "Future", "transaction_count": 0 },À
»        { "id": "FP-MUM-2027-03", "period_code": "2027-03", "period_name": "March 2027", "start_date": "2027-03-01", "end_date": "2027-03-31", "status": "Future", "transaction_count": 0 }
      ]	
    }
  ],#
  "financial_calendar_audit": [	
    {
      "id": "FCA-001",(
$      "financial_year_id": "FC-001",.
*      "financial_year_code": "FY 2026-27",$
       "period_id": "FP-2026-04",&
"      "period_name": "April 2026",#
      "action": "CLOSE_PERIOD",
      "old_status": "Open",!
      "new_status": "Closed",5
1      "user_name": "Accounts Manager (Suresh K)",.
*      "timestamp": "2026-05-02T18:00:00Z",J
F      "reason": "Monthly accounting period end closure for April 2026"

    },	
    {
      "id": "FCA-002",(
$      "financial_year_id": "FC-001",.
*      "financial_year_code": "FY 2026-27",$
       "period_id": "FP-2026-09",*
&      "period_name": "September 2026",#
      "action": "CLOSE_PERIOD",
      "old_status": "Open",!
      "new_status": "Closed",5
1      "user_name": "Accounts Manager (Suresh K)",.
*      "timestamp": "2026-10-02T18:00:00Z",I
E      "reason": "Quarter-2 reconciliation and September book closing"

    },	
    {
      "id": "FCA-003",(
$      "financial_year_id": "FC-001",.
*      "financial_year_code": "FY 2026-27",$
       "period_id": "FP-2026-10",(
$      "period_name": "October 2026","
      "action": "OPEN_PERIOD",!
      "old_status": "Future",
      "new_status": "Open",.
*      "user_name": "System Administrator",.
*      "timestamp": "2026-10-01T00:00:00Z",F
B      "reason": "Commencement of October 2026 active transactions"	
    }
  ]
,
  "holiday_types": [
      {
          "id": "NAT",
          "code": "NAT",)
%          "name": "National Holiday",!
          "color": "#3b82f6",D
@          "description": "Nationwide gazetted statutory holiday"
      },
      {
          "id": "ST",
          "code": "ST",&
"          "name": "State Holiday",!
          "color": "#10b981",N
J          "description": "State government declared holiday (Maharashtra)"
      },
      {
          "id": "FEST",
          "code": "FEST",)
%          "name": "Festival Holiday",!
          "color": "#f59e0b",J
F          "description": "Religious and cultural festival celebration"
      },
      {
          "id": "LOC",
          "code": "LOC",&
"          "name": "Local Holiday",!
          "color": "#8b5cf6",I
E          "description": "City/district or regional specific holiday"
      },
      {
          "id": "COMP",
          "code": "COMP",(
$          "name": "Company Holiday",!
          "color": "#06b6d4",O
K          "description": "Corporate, foundation, or annual company holiday"
      },
      {
          "id": "SPEC",
          "code": "SPEC",(
$          "name": "Special Holiday",!
          "color": "#ec4899",M
I          "description": "Emergency or special one-time declared holiday"
      },
      {
          "id": "OTH",
          "code": "OTH",
          "name": "Other",!
          "color": "#64748b",A
=          "description": "Other unclassified non-working day"
      }
  ],
  "holidays": [
      {
          "id": "HOL-001",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-MAH-DAY",0
,          "holiday_name": "Maharashtra Day",+
'          "holiday_date": "2026-05-01",#
          "day_name": "Friday",&
"          "holiday_type_id": "ST",3
/          "holiday_type_name": "State Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,Y
U          "description": "Maharashtra State Formation Day - statutory state holiday", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-002",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-FOU-DAY",7
3          "holiday_name": "Company Foundation Day",+
'          "holiday_date": "2026-06-15",#
          "day_name": "Monday",(
$          "holiday_type_id": "COMP",5
1          "holiday_type_name": "Company Holiday",-
)          "holiday_category": "HALF_DAY",-
)          "half_day_type": "SECOND_HALF",#
          "from_time": "14:00",!
          "to_time": "18:30",#
          "recurring_yn": true,[
W          "description": "Annual Corporate Foundation celebration and awards function", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-003",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",-
)          "applicable_level": "FACILITY",(
$          "facility_id": "PLANT-01",8
4          "facility_name": "Mauli Service Center 1",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-PLK-PUN",8
4          "holiday_name": "Palkhi Festival Holiday",+
'          "holiday_date": "2026-07-06",#
          "day_name": "Monday",'
#          "holiday_type_id": "LOC",3
/          "holiday_type_name": "Local Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,$
           "recurring_yn": false,g
c          "description": "Local Sant Tukaram Maharaj Palkhi procession route closure in Pune area", 
          "active_yn": true,!
          "status": "Active",-
)          "created_by": "Facility Admin",5
1          "created_date": "2026-04-01T09:00:00Z",.
*          "modified_by": "Facility Admin",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-004",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",-
)          "applicable_level": "FACILITY",(
$          "facility_id": "PLANT-02",8
4          "facility_name": "Mauli Service Center 2",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-LOC-NAS",5
1          "holiday_name": "Local Market Holiday",+
'          "holiday_date": "2026-08-12",&
"          "day_name": "Wednesday",'
#          "holiday_type_id": "LOC",3
/          "holiday_type_name": "Local Holiday",-
)          "holiday_category": "HALF_DAY",,
(          "half_day_type": "FIRST_HALF",#
          "from_time": "09:00",!
          "to_time": "13:30",$
           "recurring_yn": false,m
i          "description": "Local commercial market half-day holiday applicable to Mauli Service Center 2", 
          "active_yn": true,!
          "status": "Active",-
)          "created_by": "Facility Admin",5
1          "created_date": "2026-04-01T09:00:00Z",.
*          "modified_by": "Facility Admin",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-005",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-IND-DAY",1
-          "holiday_name": "Independence Day",+
'          "holiday_date": "2026-08-15",%
!          "day_name": "Saturday",'
#          "holiday_type_id": "NAT",6
2          "holiday_type_name": "National Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,W
S          "description": "National Independence Day - mandatory statutory holiday", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-006",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-GAN-CHT",1
-          "holiday_name": "Ganesh Chaturthi",+
'          "holiday_date": "2026-09-14",#
          "day_name": "Monday",(
$          "holiday_type_id": "FEST",6
2          "holiday_type_name": "Festival Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,N
J          "description": "Ganesh Utsav - auspicious festival celebration", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-007",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",+
'          "holiday_code": "HOL-MG-JAY",7
3          "holiday_name": "Mahatma Gandhi Jayanti",+
'          "holiday_date": "2026-10-02",#
          "day_name": "Friday",'
#          "holiday_type_id": "NAT",6
2          "holiday_type_name": "National Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,I
E          "description": "Mahatma Gandhi Jayanti - National Holiday", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-10-02T09:00:00Z"
      },
      {
          "id": "HOL-008",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-DUS-SEH",9
5          "holiday_name": "Dussehra (Vijayadashami)",+
'          "holiday_date": "2026-10-20",$
           "day_name": "Tuesday",(
$          "holiday_type_id": "FEST",6
2          "holiday_type_name": "Festival Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,I
E          "description": "Vijayadashami / Ayudha Pooja in workshops", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-009",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-DIW-LAX",5
1          "holiday_name": "Diwali (Laxmi Pujan)",+
'          "holiday_date": "2026-11-09",#
          "day_name": "Monday",(
$          "holiday_type_id": "FEST",6
2          "holiday_type_name": "Festival Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,>
:          "description": "Deepavali Festival celebration", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-010",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-DIW-BAL",5
1          "holiday_name": "Diwali Balipratipada",+
'          "holiday_date": "2026-11-10",$
           "day_name": "Tuesday",(
$          "holiday_type_id": "FEST",6
2          "holiday_type_name": "Festival Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,H
D          "description": "Diwali Padwa / Balipratipada celebration", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-011",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-CHR-IST",*
&          "holiday_name": "Christmas",+
'          "holiday_date": "2026-12-25",#
          "day_name": "Friday",(
$          "holiday_type_id": "FEST",6
2          "holiday_type_name": "Festival Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,5
1          "description": "Christmas celebration", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-012",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-REP-DAY",-
)          "holiday_name": "Republic Day",+
'          "holiday_date": "2027-01-26",$
           "day_name": "Tuesday",'
#          "holiday_type_id": "NAT",6
2          "holiday_type_name": "National Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,#
          "recurring_yn": true,S
O          "description": "Republic Day of India - mandatory statutory holiday", 
          "active_yn": true,!
          "status": "Active",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-04-01T09:00:00Z"
      },
      {
          "id": "HOL-013",+
'          "organization_id": "ORG-001",D
@          "organization_name": "Mauli Service Center Pvt. Ltd.",1
-          "applicable_level": "ORGANIZATION","
          "facility_id": null,0
,          "facility_name": "All Facilities",,
(          "financial_year_id": "FC-001",2
.          "financial_year_code": "FY 2026-27",,
(          "holiday_code": "HOL-ANN-MNT",<
8          "holiday_name": "Annual Workshop Maintenance",+
'          "holiday_date": "2027-03-31",&
"          "day_name": "Wednesday",(
$          "holiday_type_id": "COMP",5
1          "holiday_type_name": "Company Holiday",-
)          "holiday_category": "FULL_DAY",$
           "half_day_type": null, 
          "from_time": null,
          "to_time": null,$
           "recurring_yn": false,\
X          "description": "Year-end physical count and plant overhaul - non-working day",!
          "active_yn": false,#
          "status": "Inactive",3
/          "created_by": "System Administrator",5
1          "created_date": "2026-04-01T09:00:00Z",4
0          "modified_by": "System Administrator",5
1          "modified_date": "2026-10-01T09:00:00Z"
      }
  ],
  "holiday_audit": [
      {
          "id": "HA-001",&
"          "holiday_id": "HOL-013",,
(          "holiday_code": "HOL-ANN-MNT",<
8          "holiday_name": "Annual Workshop Maintenance",%
!          "action": "DEACTIVATE",
          "old_value": {%
!              "status": "Active",#
              "active_yn": true
          },
          "new_value": {'
#              "status": "Inactive",$
               "active_yn": false
          },2
.          "user_name": "System Administrator",2
.          "timestamp": "2026-10-01T09:00:00Z",<
8          "reason": "Deactivated for operational review"
      },
      {
          "id": "HA-002",&
"          "holiday_id": "HOL-003",,
(          "holiday_code": "HOL-PLK-PUN",8
4          "holiday_name": "Palkhi Festival Holiday",!
          "action": "CREATE", 
          "old_value": null,
          "new_value": {0
,              "holiday_code": "HOL-PLK-PUN",1
-              "applicable_level": "FACILITY",;
7              "facility_name": "Mauli Service Center 1"
          },,
(          "user_name": "Facility Admin",2
.          "timestamp": "2026-04-01T09:00:00Z",0
,          "reason": "Initial calendar setup"
      }
  ],
  "organizations": [	
    {
      "id": "ORG-001",
      "code": "MAULI-01",3
/      "name": "Mauli Service Center Pvt. Ltd.",?
;      "legal_name": "Mauli Service Center Private Limited",(
$      "org_type": "Private Limited",5
1      "business_category": "Automobile Workshop",%
!      "gst_status": "Registered",%
!      "gstin": "27AAACM1234A1Z5",
      "pan": "AAACM1234A",3
/      "primary_contact_person": "Pravin Patil",(
$      "mobile_number": "9822012345",+
'      "email": "info@mauliservice.com",!
      "state": "Maharashtra",
      "district": "Pune",
      "city": "Pune",=
9      "address": "Plot No. 12, Sector 3, Pune Main Road",
      "pincode": "411001",&
"      "fy_start": "April - March",
      "currency": "INR",%
!      "timezone": "Asia/Kolkata",
      "status": "Active",
      "is_active": true,.
*      "created_at": "2026-04-01T09:00:00Z"	
    }
  ],
  "plants": [	
    {
      "id": "PLANT-01",'
#      "organization_id": "ORG-001","
      "company_id": "COMP-01",
      "code": "BRANCH-01", 
      "branch_code": "MSC1",+
'      "name": "Mauli Service Center 1",.
*      "plant_type": "AUTOMOBILE_WORKSHOP",+
'      "contact_person": "Pravin Patil",(
$      "mobile_number": "9822012345",=
9      "address": "Plot No. 12, Sector 3, Pune Main Road",
      "city": "Pune",!
      "state": "Maharashtra",
      "country": "India",
      "pincode": "411001",%
!      "gstin": "27AABCT2345M1Z9",
      "is_active": true,.
*      "created_at": "2026-04-01T09:00:00Z"

    },	
    {
      "id": "PLANT-02",'
#      "organization_id": "ORG-001","
      "company_id": "COMP-01",
      "code": "BRANCH-02", 
      "branch_code": "MSC2",+
'      "name": "Mauli Service Center 2",.
*      "plant_type": "AUTOMOBILE_WORKSHOP",,
(      "contact_person": "Sanket Borole",(
$      "mobile_number": "8765678765",;
7      "address": "Survey No. 45, Wakad Bypass Highway",
      "city": "Pune",!
      "state": "Maharashtra",
      "country": "India",
      "pincode": "411057",%
!      "gstin": "27AABCT2345M2Z8",
      "is_active": true,.
*      "created_at": "2026-04-01T09:00:00Z"	
    }
  ]
};2
.INITIAL_DATA.facilities = INITIAL_DATA.plants;(
$if (typeof window !== 'undefined') {)
%  window.INITIAL_DATA = INITIAL_DATA;
}:
6if (typeof module !== 'undefined' && module.exports) {(
$  module.exports = { INITIAL_DATA };