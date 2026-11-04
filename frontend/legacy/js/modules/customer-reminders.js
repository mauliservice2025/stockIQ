/* ==========================================================================
   ENTERPRISE ISCM - CUSTOMER REMINDER MANAGEMENT SYSTEM (CRM)
   Two-Wheeler Garage / Service Center Scheduled WhatsApp & SMS Reminders
   Conforming to Customer Reminder Management System Functional Requirements v1.0
   ========================================================================== */

(function() {
  'use strict';

  window.CustomerRemindersModule = {
    activeTab: 'DASHBOARD', // DASHBOARD | CONFIGURATION | PROCESSING | HISTORY | TEMPLATES | REPORTS
    
    // Filter & Search states
    selectedFacilityId: 'ALL',
    selectedReminderType: 'ALL',
    selectedStage: 'ALL',
    selectedChannel: 'ALL',
    selectedStatus: 'ALL',
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    selectedReportType: 'UPCOMING_SERVICE',
    
    _seeded: false,

    // -------------------------------------------------------------------------
    // INITIALIZATION & DEFAULT SEED DATA
    // -------------------------------------------------------------------------
    init() {
      this.ensureSeedData();
    },

    getTodayDateStr() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },

    formatDateDisplay(dateStr) {
      if (typeof window.formatDate === 'function') {
        return window.formatDate(dateStr);
      }
      if (!dateStr) return '--';
      const clean = String(dateStr).split('T')[0];
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    },

    ensureSeedData() {
      if (this._seeded) return;
      this._seeded = true;

      if (!window.DB || !window.DB.data) return;

      // 1. Pre-seed Default Message Templates (BRD Section 8)
      if (!Array.isArray(window.DB.data.reminder_templates) || window.DB.data.reminder_templates.length === 0) {
        window.DB.data.reminder_templates = [
          {
            id: 'TMPL-001',
            code: 'UPCOMING-7D',
            name: 'Upcoming Service Reminder – 7 Days Before',
            category: 'PERIODIC_SERVICE',
            stage: 'ADVANCE_7D',
            channel: 'BOTH',
            subject: 'Upcoming Service Reminder (7 Days)',
            body: 'Dear {{CustomerName}},\n\nYour {{VehicleModel}} ({{RegistrationNumber}}) is due for its next service on {{NextServiceDate}}.\n\nPlease plan your service visit in advance.\n\nTo book an appointment, contact {{FacilityName}} at {{FacilityContactNumber}}.\n\nThank you for choosing {{FacilityName}}!',
            is_active: true,
            is_system: true
          },
          {
            id: 'TMPL-002',
            code: 'UPCOMING-2D',
            name: 'Upcoming Service Reminder – 2 Days Before',
            category: 'PERIODIC_SERVICE',
            stage: 'ADVANCE_2D',
            channel: 'BOTH',
            subject: 'Service Reminder in 2 Days',
            body: 'Dear {{CustomerName}},\n\nThis is a friendly reminder that your {{VehicleModel}} ({{RegistrationNumber}}) is due for service on {{NextServiceDate}}, in 2 days.\n\nPlease contact {{FacilityName}} at {{FacilityContactNumber}} to schedule your service appointment.\n\nWe look forward to serving you!',
            is_active: true,
            is_system: true
          },
          {
            id: 'TMPL-003',
            code: 'UPCOMING-1D',
            name: 'Final Advance Reminder – 1 Day Before',
            category: 'PERIODIC_SERVICE',
            stage: 'ADVANCE_1D',
            channel: 'BOTH',
            subject: 'Service Due Tomorrow',
            body: 'Dear {{CustomerName}},\n\nYour {{VehicleModel}} ({{RegistrationNumber}}) is due for its next service tomorrow, {{NextServiceDate}}.\n\nPlease contact {{FacilityName}} at {{FacilityContactNumber}} to book your service appointment.\n\nThank you for choosing {{FacilityName}}!',
            is_active: true,
            is_system: true
          },
          {
            id: 'TMPL-004',
            code: 'DUE-TODAY',
            name: 'Service Due Today',
            category: 'PERIODIC_SERVICE',
            stage: 'DUE_TODAY',
            channel: 'BOTH',
            subject: 'Service Due Today',
            body: 'Dear {{CustomerName}},\n\nYour {{VehicleModel}} ({{RegistrationNumber}}) is due for service today, {{NextServiceDate}}.\n\nPlease contact {{FacilityName}} at {{FacilityContactNumber}} to arrange your visit.\n\nWe look forward to assisting you!',
            is_active: true,
            is_system: true
          },
          {
            id: 'TMPL-005',
            code: 'OVERDUE-3D',
            name: 'Overdue Service Reminder – 3 Days After Due Date',
            category: 'OVERDUE_SERVICE',
            stage: 'OVERDUE_3D',
            channel: 'BOTH',
            subject: 'Service Overdue Notice (3 Days)',
            body: 'Dear {{CustomerName}},\n\nOur records indicate that your {{VehicleModel}} ({{RegistrationNumber}}) was due for service on {{NextServiceDate}}.\n\nYour vehicle may be overdue for its scheduled maintenance. Please contact {{FacilityName}} at {{FacilityContactNumber}} to arrange a convenient service visit.\n\nThank you!',
            is_active: true,
            is_system: true
          },
          {
            id: 'TMPL-006',
            code: 'OVERDUE-7D',
            name: 'Second Overdue Service Reminder – 7 Days After Due Date',
            category: 'OVERDUE_SERVICE',
            stage: 'OVERDUE_7D',
            channel: 'BOTH',
            subject: 'Urgent Service Overdue Reminder (7 Days)',
            body: 'Dear {{CustomerName}},\n\nYour {{VehicleModel}} ({{RegistrationNumber}}) is now 7 days overdue for scheduled maintenance (Due: {{NextServiceDate}}).\n\nTimely servicing prevents breakdown and maintains optimal engine performance. Call {{FacilityName}} at {{FacilityContactNumber}} to secure priority bay booking.',
            is_active: true,
            is_system: true
          },
          {
            id: 'TMPL-007',
            code: 'VEHICLE-READY',
            name: 'Vehicle Ready for Delivery Notification',
            category: 'VEHICLE_READY',
            stage: 'READY_NOW',
            channel: 'BOTH',
            subject: 'Vehicle Ready for Collection',
            body: 'Dear {{CustomerName}},\n\nGood news! Servicing for your {{VehicleModel}} ({{RegistrationNumber}}) has been completed and quality inspection is passed.\n\nYour vehicle is ready for collection at {{FacilityName}}.\n\nWe look forward to seeing you!',
            is_active: true,
            is_system: true
          }
        ];
      }

      // 2. Pre-seed Recommended Configurations (BRD Section 3 & 5)
      if (!Array.isArray(window.DB.data.reminder_configurations) || window.DB.data.reminder_configurations.length === 0) {
        window.DB.data.reminder_configurations = [
          {
            id: 'CFG-001',
            code: 'REM-CFG-7D-ADV',
            name: 'Upcoming Periodic Service (7 Days Advance)',
            facility_id: 'PLANT-01',
            reminder_type: 'PERIODIC_SERVICE',
            trigger_basis: 'NEXT_SERVICE_DATE',
            advance_days: 7,
            overdue_days: 0,
            channel: 'WHATSAPP',
            template_id: 'TMPL-001',
            processing_time: '10:00',
            max_retries: 2,
            retry_interval_hours: 12,
            is_active: true,
            effective_from: '2026-01-01',
            effective_to: ''
          },
          {
            id: 'CFG-002',
            code: 'REM-CFG-2D-ADV',
            name: 'Upcoming Periodic Service (2 Days Advance)',
            facility_id: 'PLANT-01',
            reminder_type: 'PERIODIC_SERVICE',
            trigger_basis: 'NEXT_SERVICE_DATE',
            advance_days: 2,
            overdue_days: 0,
            channel: 'WHATSAPP',
            template_id: 'TMPL-002',
            processing_time: '10:00',
            max_retries: 2,
            retry_interval_hours: 12,
            is_active: true,
            effective_from: '2026-01-01',
            effective_to: ''
          },
          {
            id: 'CFG-003',
            code: 'REM-CFG-1D-ADV',
            name: 'Final Advance Reminder (1 Day Before)',
            facility_id: 'PLANT-01',
            reminder_type: 'PERIODIC_SERVICE',
            trigger_basis: 'NEXT_SERVICE_DATE',
            advance_days: 1,
            overdue_days: 0,
            channel: 'BOTH',
            template_id: 'TMPL-003',
            processing_time: '10:00',
            max_retries: 2,
            retry_interval_hours: 12,
            is_active: true,
            effective_from: '2026-01-01',
            effective_to: ''
          },
          {
            id: 'CFG-004',
            code: 'REM-CFG-DUE-TODAY',
            name: 'Service Due Today Notification',
            facility_id: 'PLANT-01',
            reminder_type: 'PERIODIC_SERVICE',
            trigger_basis: 'NEXT_SERVICE_DATE',
            advance_days: 0,
            overdue_days: 0,
            channel: 'WHATSAPP',
            template_id: 'TMPL-004',
            processing_time: '09:30',
            max_retries: 2,
            retry_interval_hours: 12,
            is_active: true,
            effective_from: '2026-01-01',
            effective_to: ''
          },
          {
            id: 'CFG-005',
            code: 'REM-CFG-3D-OVD',
            name: 'First Overdue Reminder (3 Days After Due Date)',
            facility_id: 'PLANT-01',
            reminder_type: 'OVERDUE_SERVICE',
            trigger_basis: 'NEXT_SERVICE_DATE',
            advance_days: 0,
            overdue_days: 3,
            channel: 'WHATSAPP',
            template_id: 'TMPL-005',
            processing_time: '10:30',
            max_retries: 2,
            retry_interval_hours: 24,
            is_active: true,
            effective_from: '2026-01-01',
            effective_to: ''
          },
          {
            id: 'CFG-006',
            code: 'REM-CFG-7D-OVD',
            name: 'Second Overdue Reminder (7 Days After Due Date)',
            facility_id: 'PLANT-01',
            reminder_type: 'OVERDUE_SERVICE',
            trigger_basis: 'NEXT_SERVICE_DATE',
            advance_days: 0,
            overdue_days: 7,
            channel: 'BOTH',
            template_id: 'TMPL-006',
            processing_time: '11:00',
            max_retries: 2,
            retry_interval_hours: 24,
            is_active: true,
            effective_from: '2026-01-01',
            effective_to: ''
          }
        ];
      }

      // 3. Pre-seed Logs & Reminder History
      if (!Array.isArray(window.DB.data.reminder_logs)) {
        window.DB.data.reminder_logs = [];
      }

      if (typeof window.DB.saveData === 'function') {
        window.DB.saveData(window.DB.data);
      }
    },

    // -------------------------------------------------------------------------
    // CORE REMINDER DISCOVERY & EVALUATION ENGINE (BRD §6, §7 & §10)
    // -------------------------------------------------------------------------
    getServiceTargets() {
      if (!window.DB || typeof window.DB.getAll !== 'function') return [];
      const jobCards = window.DB.getAll('jobCards') || [];
      const vehicleDeliveries = window.DB.getAll('vehicleDeliveries') || [];
      const customers = window.DB.getAll('customers') || [];
      const vehicles = window.DB.getAll('vehicles') || [];
      const plants = window.DB.getAll('plants') || [];

      const targetMap = new Map();

      // Collect from Vehicle Deliveries (source of truth for completed cycles)
      vehicleDeliveries.forEach(del => {
        const regNo = (del.vehicle_reg_no || del.registration_no || '').trim().toUpperCase();
        const nextDate = del.next_service_due_date || del.next_service_date;
        if (!regNo || !nextDate) return;

        const cust = customers.find(c => c.id === del.customer_id || (c.mobile && c.mobile === del.customer_mobile)) || {};
        const veh = vehicles.find(v => (v.reg_no && v.reg_no.toUpperCase() === regNo) || v.id === del.vehicle_id) || {};
        const plant = plants.find(p => p.id === (del.plant_id || del.facility_id || 'PLANT-01')) || plants[0] || {};

        targetMap.set(regNo, {
          vehicle_reg_no: regNo,
          customer_name: del.customer_name || cust.name || 'Valued Customer',
          customer_mobile: del.customer_mobile || cust.mobile || cust.phone || '',
          vehicle_model: del.vehicle_model || veh.model || 'Two-Wheeler',
          facility_id: del.plant_id || del.facility_id || 'PLANT-01',
          facility_name: plant.name || 'Mauli Service Center 1',
          facility_phone: plant.phone || '9876543210',
          last_service_date: del.delivery_date || del.date || '',
          last_odometer_km: del.odometer_km || 0,
          next_service_due_date: nextDate,
          source: 'DELIVERY',
          ref_id: del.id,
          reminder_eligible: (cust.opt_out !== true && cust.status !== 'INACTIVE')
        });
      });

      // Augment from Job Cards
      jobCards.forEach(jc => {
        const regNo = (jc.vehicle_reg_no || '').trim().toUpperCase();
        const nextDate = jc.next_service_due_date;
        if (!regNo) return;

        const existing = targetMap.get(regNo);
        if (!existing && nextDate) {
          const cust = customers.find(c => c.id === jc.customer_id || (c.mobile && c.mobile === jc.customer_mobile)) || {};
          const veh = vehicles.find(v => (v.reg_no && v.reg_no.toUpperCase() === regNo) || v.id === jc.vehicle_id) || {};
          const plant = plants.find(p => p.id === (jc.plant_id || jc.facility_id || 'PLANT-01')) || plants[0] || {};

          targetMap.set(regNo, {
            vehicle_reg_no: regNo,
            customer_name: jc.customer_name || cust.name || 'Valued Customer',
            customer_mobile: jc.customer_mobile || cust.mobile || '',
            vehicle_model: jc.vehicle_model || veh.model || 'Two-Wheeler',
            facility_id: jc.plant_id || jc.facility_id || 'PLANT-01',
            facility_name: plant.name || 'Mauli Service Center 1',
            facility_phone: plant.phone || '9876543210',
            last_service_date: jc.date || '',
            last_odometer_km: jc.odometer_km || 0,
            next_service_due_date: nextDate,
            source: 'JOBCARD',
            ref_id: jc.id,
            reminder_eligible: (cust.opt_out !== true && cust.status !== 'INACTIVE')
          });
        }
      });

      return Array.from(targetMap.values());
    },

    computeOffsetDate(daysOffset) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },

    computeDaysDiff(targetDateStr) {
      if (!targetDateStr) return 0;
      const today = new Date(this.getTodayDateStr() + 'T00:00:00');
      const target = new Date(targetDateStr.split('T')[0] + 'T00:00:00');
      const diffTime = target - today;
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    },

    determineReminderStage(daysDiff) {
      if (daysDiff === 7) return { key: 'ADVANCE_7D', label: '7 Days Before', type: 'PERIODIC_SERVICE', badgeClass: 'badge-info' };
      if (daysDiff === 2) return { key: 'ADVANCE_2D', label: '2 Days Before', type: 'PERIODIC_SERVICE', badgeClass: 'badge-primary' };
      if (daysDiff === 1) return { key: 'ADVANCE_1D', label: '1 Day Before', type: 'PERIODIC_SERVICE', badgeClass: 'badge-warning' };
      if (daysDiff === 0) return { key: 'DUE_TODAY', label: 'Due Today', type: 'PERIODIC_SERVICE', badgeClass: 'badge-danger' };
      if (daysDiff === -3) return { key: 'OVERDUE_3D', label: '3 Days Overdue', type: 'OVERDUE_SERVICE', badgeClass: 'badge-danger' };
      if (daysDiff === -7) return { key: 'OVERDUE_7D', label: '7 Days Overdue', type: 'OVERDUE_SERVICE', badgeClass: 'badge-danger' };
      if (daysDiff <= -15) return { key: 'OVERDUE_15D', label: '15+ Days Overdue', type: 'OVERDUE_SERVICE', badgeClass: 'badge-danger' };
      if (daysDiff > 0) return { key: 'UPCOMING', label: `In ${daysDiff} Days`, type: 'PERIODIC_SERVICE', badgeClass: 'badge-subtle' };
      return { key: 'OVERDUE', label: `${Math.abs(daysDiff)} Days Overdue`, type: 'OVERDUE_SERVICE', badgeClass: 'badge-danger' };
    },

    renderMessageBody(templateText, target) {
      if (!templateText) return '';
      let msg = templateText;
      msg = msg.replace(/\{\{CustomerName\}\}/g, target.customer_name || 'Customer');
      msg = msg.replace(/\{\{VehicleModel\}\}/g, target.vehicle_model || 'Vehicle');
      msg = msg.replace(/\{\{RegistrationNumber\}\}/g, target.vehicle_reg_no || '');
      msg = msg.replace(/\{\{NextServiceDate\}\}/g, this.formatDateDisplay(target.next_service_due_date));
      msg = msg.replace(/\{\{FacilityName\}\}/g, target.facility_name || 'Service Center');
      msg = msg.replace(/\{\{FacilityContactNumber\}\}/g, target.facility_phone || 'Customer Care');
      return msg;
    },

    // -------------------------------------------------------------------------
    // DISPATCH / SEND REMINDER (SIMULATED WHATSAPP API & SMS GATEWAY)
    // -------------------------------------------------------------------------
    sendReminder(target, stageKey, channel = 'WHATSAPP') {
      const templates = window.DB.getAll('reminder_templates') || [];
      const tmpl = templates.find(t => t.stage === stageKey) || templates[0];
      const messageBody = this.renderMessageBody(tmpl ? tmpl.body : '', target);

      const logId = 'REM-LOG-' + Date.now().toString(36).toUpperCase();
      const newLog = {
        id: logId,
        vehicle_reg_no: target.vehicle_reg_no,
        customer_name: target.customer_name,
        customer_mobile: target.customer_mobile,
        vehicle_model: target.vehicle_model,
        facility_id: target.facility_id,
        facility_name: target.facility_name,
        reminder_type: stageKey.startsWith('OVERDUE') ? 'OVERDUE_SERVICE' : 'PERIODIC_SERVICE',
        stage: stageKey,
        next_service_due_date: target.next_service_due_date,
        channel: channel,
        template_id: tmpl ? tmpl.id : 'TMPL-001',
        message_body: messageBody,
        status: 'DELIVERED', // Simulated instant delivery
        provider_message_id: 'WAMG-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
        retry_count: 0,
        appointment_booked: false
      };

      if (!Array.isArray(window.DB.data.reminder_logs)) {
        window.DB.data.reminder_logs = [];
      }
      window.DB.data.reminder_logs.unshift(newLog);
      if (typeof window.DB.saveData === 'function') {
        window.DB.saveData(window.DB.data);
      }

      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast(`✓ Reminder sent successfully via ${channel} to ${target.customer_name} (${target.vehicle_reg_no})`, 'success');
      }

      this.refresh();
      return newLog;
    },

    runAutomatedEngine() {
      const targets = this.getServiceTargets();
      let sentCount = 0;
      let suppressedCount = 0;

      targets.forEach(t => {
        const diff = this.computeDaysDiff(t.next_service_due_date);
        const stage = this.determineReminderStage(diff);

        // Check eligibility per BRD Section 7 & 10
        if (!t.reminder_eligible || !t.customer_mobile) {
          suppressedCount++;
          return;
        }

        // Active stages for automatic trigger: 7d, 2d, 1d, 0d, -3d, -7d
        if ([7, 2, 1, 0, -3, -7].includes(diff)) {
          // Check duplicate prevention: don't send if already sent today for this cycle/stage
          const logs = window.DB.getAll('reminder_logs') || [];
          const alreadySent = logs.some(l => 
            l.vehicle_reg_no === t.vehicle_reg_no && 
            l.stage === stage.key && 
            (l.status === 'SENT' || l.status === 'DELIVERED') &&
            l.next_service_due_date === t.next_service_due_date
          );

          if (!alreadySent) {
            this.sendReminder(t, stage.key, 'WHATSAPP');
            sentCount++;
          } else {
            suppressedCount++;
          }
        }
      });

      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast(`Automated Reminder Engine completed: ${sentCount} messages sent, ${suppressedCount} duplicate/ineligible checks verified.`, 'info');
      }
      this.refresh();
      return { dispatched: sentCount, suppressed: suppressedCount, totalScanned: targets.length };
    },

    bookAppointmentFromReminder(logId) {
      const logs = window.DB.getAll('reminder_logs') || [];
      const log = logs.find(l => l.id === logId);
      if (log) {
        log.appointment_booked = true;
        log.appointment_booked_at = new Date().toISOString();
        if (typeof window.DB.saveData === 'function') {
          window.DB.saveData(window.DB.data);
        }
        if (window.State && typeof window.State.showToast === 'function') {
          window.State.showToast(`✓ Appointment booked for ${log.customer_name} (${log.vehicle_reg_no}). Reminders suppressed for this cycle.`, 'success');
        }
        this.refresh();
      }
    },

    previewMessageModal(target, stageKey) {
      const templates = window.DB.getAll('reminder_templates') || [];
      const tmpl = templates.find(t => t.stage === stageKey) || templates[0];
      const messageBody = this.renderMessageBody(tmpl ? tmpl.body : '', target);

      const contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${target.customer_name} &bull; ${target.vehicle_reg_no}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${target.vehicle_model} &bull; Next Service: <strong style="color: var(--primary-300);">${this.formatDateDisplay(target.next_service_due_date)}</strong></div>
            </div>
            <span class="badge badge-primary">Stage: ${stageKey}</span>
          </div>

          <!-- Simulated WhatsApp Bubble Preview -->
          <div style="background: #0b141a; border-radius: 12px; padding: 16px; border: 1px solid rgba(37, 211, 102, 0.3); box-shadow: var(--shadow-md);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #25D366; font-size: 13px; font-weight: 700;">
              <span>💬 WhatsApp Verified Message Preview</span>
            </div>
            <div style="background: #1f2c34; border-radius: 10px 10px 10px 2px; padding: 12px 14px; color: #e9edef; font-size: 13px; line-height: 1.5; white-space: pre-wrap; font-family: var(--font-sans);">
${messageBody}
            </div>
            <div style="text-align: right; margin-top: 6px; font-size: 10.5px; color: #8696a0;">
              10:00 AM &bull; Double Tick ✓✓
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
            <button type="button" class="btn btn-primary" onclick="window.CustomerRemindersModule.sendReminder(window.CustomerRemindersModule.currentTargetPreview, '${stageKey}', 'WHATSAPP'); window.State.closeModal();">
              <span>🚀 Send via WhatsApp Now</span>
            </button>
            <button type="button" class="btn btn-outline" onclick="window.CustomerRemindersModule.sendReminder(window.CustomerRemindersModule.currentTargetPreview, '${stageKey}', 'SMS'); window.State.closeModal();">
              <span>📱 Send via SMS</span>
            </button>
          </div>
        </div>
      `;

      this.currentTargetPreview = target;
      if (window.State && typeof window.State.showModal === 'function') {
        window.State.showModal({ title: 'Reminder Message Preview & Dispatch', contentHtml, maxWidth: '580px' });
      }
    },

    // -------------------------------------------------------------------------
    // NAVIGATION & TAB SWITCHING
    // -------------------------------------------------------------------------
    switchTab(tabKey) {
      this.activeTab = tabKey;
      const tabToRoute = {
        'DASHBOARD': '#/reminder-dashboard',
        'CONFIGURATION': '#/reminder-configuration',
        'PROCESSING': '#/reminder-processing',
        'HISTORY': '#/reminder-history',
        'TEMPLATES': '#/message-templates',
        'REPORTS': '#/reminder-reports'
      };
      const targetHash = tabToRoute[tabKey] || '#/reminder-dashboard';
      if (window.location.hash !== targetHash) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', targetHash);
        } else {
          window.location.hash = targetHash;
        }
      }

      // Update sidebar active highlights if App exists
      document.querySelectorAll('.nav-item').forEach(el => {
        const href = el.getAttribute('href');
        if (href === targetHash) {
          el.classList.add('active');
        } else if (href && (href.startsWith('#/reminder') || href === '#/message-templates' || href === '#/customer-reminders')) {
          el.classList.remove('active');
        }
      });

      const subview = document.getElementById('reminder-subview-container');
      if (subview) {
        subview.innerHTML = this.renderActiveSubView();
      } else {
        this.render();
      }
      this.updateTabStyles();
    },

    updateTabStyles() {
      document.querySelectorAll('.reminder-nav-tab').forEach(btn => {
        const t = btn.getAttribute('data-tab');
        if (t === this.activeTab) {
          btn.classList.add('btn-primary');
          btn.classList.remove('btn-ghost');
        } else {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        }
      });
    },

    // -------------------------------------------------------------------------
    // MASTER MODULE SHELL RENDER
    // -------------------------------------------------------------------------
    render(container) {
      if (!container) container = document.getElementById('view-container');
      if (!container) return;

      const hash = window.location.hash || '';
      if (hash === '#/reminder-configuration') this.activeTab = 'CONFIGURATION';
      else if (hash === '#/reminder-processing') this.activeTab = 'PROCESSING';
      else if (hash === '#/reminder-history') this.activeTab = 'HISTORY';
      else if (hash === '#/reminder-reports') this.activeTab = 'REPORTS';
      else if (hash === '#/message-templates') this.activeTab = 'TEMPLATES';
      else if (hash === '#/customer-reminders' || hash === '#/reminder-dashboard') this.activeTab = 'DASHBOARD';

      this.ensureSeedData();

      const plants = (window.DB && typeof window.DB.getAll === 'function') ? (window.DB.getAll('plants') || []) : [];

      container.innerHTML = `
        <div class="billing-module-container reminder-module-container" style="display: flex; flex-direction: column; gap: 0; flex: 1 1 auto; min-height: 0; width: 100%;">
          
          <!-- Top Sub-Navigation Tabs Strip -->
          <div class="billing-top-nav-card" style="padding: 4px 16px 0 16px; margin-bottom: 0; border-bottom: 1px solid var(--border-subtle); border-bottom-left-radius: 0; border-bottom-right-radius: 0; background: var(--bg-card); flex: 0 0 auto; min-height: auto; height: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; width: 100%;">
              <div class="tabs-header billing-tabs-header" style="display: flex; gap: 4px; border-bottom: none; overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin-bottom: 0; flex: 1;">
                <button 
                  type="button" 
                  class="btn btn-sm reminder-nav-tab ${this.activeTab === 'DASHBOARD' ? 'btn-primary' : 'btn-ghost'}" 
                  data-tab="DASHBOARD"
                  style="border-radius: 6px 6px 0 0; padding: 8px 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
                  onclick="window.CustomerRemindersModule.switchTab('DASHBOARD')"
                >
                  <span>📊 Service Reminder Dashboard</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-sm reminder-nav-tab ${this.activeTab === 'CONFIGURATION' ? 'btn-primary' : 'btn-ghost'}" 
                  data-tab="CONFIGURATION"
                  style="border-radius: 6px 6px 0 0; padding: 8px 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
                  onclick="window.CustomerRemindersModule.switchTab('CONFIGURATION')"
                >
                  <span>⚙️ Reminder Configuration</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-sm reminder-nav-tab ${this.activeTab === 'PROCESSING' ? 'btn-primary' : 'btn-ghost'}" 
                  data-tab="PROCESSING"
                  style="border-radius: 6px 6px 0 0; padding: 8px 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
                  onclick="window.CustomerRemindersModule.switchTab('PROCESSING')"
                >
                  <span>⚡ Reminder Processing & Engine</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-sm reminder-nav-tab ${this.activeTab === 'HISTORY' ? 'btn-primary' : 'btn-ghost'}" 
                  data-tab="HISTORY"
                  style="border-radius: 6px 6px 0 0; padding: 8px 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
                  onclick="window.CustomerRemindersModule.switchTab('HISTORY')"
                >
                  <span>📜 Reminder History</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-sm reminder-nav-tab ${this.activeTab === 'TEMPLATES' ? 'btn-primary' : 'btn-ghost'}" 
                  data-tab="TEMPLATES"
                  style="border-radius: 6px 6px 0 0; padding: 8px 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
                  onclick="window.CustomerRemindersModule.switchTab('TEMPLATES')"
                >
                  <span>💬 Message Template Master</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-sm reminder-nav-tab ${this.activeTab === 'REPORTS' ? 'btn-primary' : 'btn-ghost'}" 
                  data-tab="REPORTS"
                  style="border-radius: 6px 6px 0 0; padding: 8px 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
                  onclick="window.CustomerRemindersModule.switchTab('REPORTS')"
                >
                  <span>📈 Reminder Reports</span>
                </button>
              </div>

              <!-- Pin Option -->
              <div id="reminder-header-pin-container" style="display: flex; align-items: center; flex-shrink: 0; padding-bottom: 6px; margin-left: auto;">
                <!-- Auto-mounted by PinnedSubmodulesModule if applicable -->
              </div>
            </div>
          </div>

          <!-- Subview Container -->
          <div id="reminder-subview-container" style="margin-top: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; width: 100%;">
            ${this.renderActiveSubView()}
          </div>
        </div>
      `;

      if (window.PinnedSubmodulesModule && typeof window.PinnedSubmodulesModule.updateScreenHeaderPinButton === 'function') {
        window.PinnedSubmodulesModule.updateScreenHeaderPinButton();
      }
    },

    renderActiveSubView() {
      switch (this.activeTab) {
        case 'CONFIGURATION':
          return this.renderConfigurationTab();
        case 'PROCESSING':
          return this.renderProcessingTab();
        case 'HISTORY':
          return this.renderHistoryTab();
        case 'TEMPLATES':
          return this.renderTemplatesTab();
        case 'REPORTS':
          return this.renderReportsTab();
        case 'DASHBOARD':
        default:
          return this.renderDashboardTab();
      }
    },

    refresh() {
      const subview = document.getElementById('reminder-subview-container');
      if (subview) {
        subview.innerHTML = this.renderActiveSubView();
      } else {
        this.render();
      }
    },

    // -------------------------------------------------------------------------
    // 1. SERVICE REMINDER DASHBOARD (BRD Section 11)
    // -------------------------------------------------------------------------
    renderDashboardTab() {
      const targets = this.getServiceTargets();
      const logs = window.DB.getAll('reminder_logs') || [];
      const plants = window.DB.getAll('plants') || [];

      // Calculate KPI metrics
      let upcomingCount = 0;
      let dueTodayCount = 0;
      let overdueCount = 0;

      targets.forEach(t => {
        const diff = this.computeDaysDiff(t.next_service_due_date);
        if (diff > 0 && diff <= 15) upcomingCount++;
        else if (diff === 0) dueTodayCount++;
        else if (diff < 0) overdueCount++;
      });

      const sentCount = logs.filter(l => l.status === 'SENT' || l.status === 'DELIVERED').length;
      const deliveredCount = logs.filter(l => l.status === 'DELIVERED').length;
      const failedCount = logs.filter(l => l.status === 'FAILED').length;
      const appointmentsBooked = logs.filter(l => l.appointment_booked === true).length;
      const servicesCompleted = targets.filter(t => t.last_service_date && this.computeDaysDiff(t.last_service_date) >= -30).length;

      // Filter targets
      let filteredTargets = targets.filter(t => {
        if (this.selectedFacilityId !== 'ALL' && t.facility_id !== this.selectedFacilityId) return false;
        const diff = this.computeDaysDiff(t.next_service_due_date);
        const stage = this.determineReminderStage(diff);
        if (this.selectedStage !== 'ALL' && stage.key !== this.selectedStage) return false;
        if (this.selectedReminderType !== 'ALL' && stage.type !== this.selectedReminderType) return false;
        if (this.searchTerm) {
          const q = this.searchTerm.toLowerCase();
          const match = (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
                        (t.vehicle_reg_no && t.vehicle_reg_no.toLowerCase().includes(q)) ||
                        (t.customer_mobile && t.customer_mobile.includes(q)) ||
                        (t.vehicle_model && t.vehicle_model.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });

      return `
        <div class="content-card" style="margin-top: 0; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; padding: 12px 16px;">
          
          <!-- Master Header Bar with Run Engine & Export -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Service Reminder Management & Dispatch</span>
              <span class="badge badge-success" style="font-size: 10px;">Automated 10:00 AM Engine Active</span>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.CustomerRemindersModule.runAutomatedEngine()" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 600;">
                <span>⚡ Run Reminder Engine Now</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.CustomerRemindersModule.exportDashboardCSV()" style="display: inline-flex; align-items: center; gap: 5px;">
                <span>📥 Export Reminders CSV</span>
              </button>
            </div>
          </div>

          <!-- 8 Summary Metric Cards (BRD Section 11) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 12px;">
            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid var(--primary-500); cursor: pointer;" onclick="window.CustomerRemindersModule.filterByKpi('UPCOMING')">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Upcoming Services</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: var(--primary-300); margin-top: 2px;">${upcomingCount}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Next 15 Days</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid #ef4444; cursor: pointer;" onclick="window.CustomerRemindersModule.filterByKpi('DUE_TODAY')">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: #ef4444;">Due Today</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: #ef4444; margin-top: 2px;">${dueTodayCount}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Action Required</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid #f59e0b; cursor: pointer;" onclick="window.CustomerRemindersModule.filterByKpi('OVERDUE')">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: #f59e0b;">Overdue Services</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: #f59e0b; margin-top: 2px;">${overdueCount}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Follow-up Pending</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid #10b981;">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Messages Sent</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: #10b981; margin-top: 2px;">${sentCount}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">WhatsApp & SMS</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid #06b6d4;">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Delivered</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: #06b6d4; margin-top: 2px;">${deliveredCount}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Confirmed Double-Tick</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid ${failedCount > 0 ? '#ef4444' : 'var(--border-subtle)'};">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Failed Messages</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: ${failedCount > 0 ? '#ef4444' : 'var(--text-muted)'}; margin-top: 2px;">${failedCount}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Eligible for Retry</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid #8b5cf6;">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Appointments</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: #8b5cf6; margin-top: 2px;">${appointmentsBooked}</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Converted from Reminder</div>
            </div>

            <div class="kpi-card" style="padding: 10px 12px; border-left: 3px solid #10b981;">
              <div style="font-size: 10.5px; text-transform: uppercase; font-weight: 700; color: var(--text-muted);">Repeat Retention</div>
              <div class="cell-mono" style="font-size: 20px; font-weight: 800; color: #10b981; margin-top: 2px;">${targets.length > 0 ? Math.round((appointmentsBooked / (sentCount || 1)) * 100) : 0}%</div>
              <div style="font-size: 9.5px; color: var(--text-secondary); margin-top: 2px;">Conversion Rate</div>
            </div>
          </div>

          <!-- Comprehensive Dashboard Filter Toolbar (BRD §11) -->
          <div class="toolbar" style="padding: 8px 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); margin-bottom: 8px; gap: 8px;">
            <!-- Search Input -->
            <div style="position: relative; flex: 1 1 200px;">
              <input 
                type="text" 
                class="form-control form-control-sm search-input"
                placeholder="Search customer, vehicle reg, mobile..." 
                value="${this.searchTerm}"
                oninput="window.CustomerRemindersModule.setSearchTerm(this.value)"
                style="padding-left: 32px !important; height: 28px; font-size: 11.5px;"
              />
              <span style="position: absolute; left: 8px; top: 6px; font-size: 11px; opacity: 0.6; pointer-events: none;">🔍</span>
            </div>

            <!-- Facility Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 140px; height: 28px; font-size: 11.5px;" onchange="window.CustomerRemindersModule.setFacilityFilter(this.value)">
              <option value="ALL" ${this.selectedFacilityId === 'ALL' ? 'selected' : ''}>All Facilities</option>
              ${plants.map(p => `
                <option value="${p.id}" ${this.selectedFacilityId === p.id ? 'selected' : ''}>${p.name || p.code}</option>
              `).join('')}
            </select>

            <!-- Reminder Stage Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 140px; height: 28px; font-size: 11.5px;" onchange="window.CustomerRemindersModule.setStageFilter(this.value)">
              <option value="ALL" ${this.selectedStage === 'ALL' ? 'selected' : ''}>All Reminder Stages</option>
              <option value="ADVANCE_7D" ${this.selectedStage === 'ADVANCE_7D' ? 'selected' : ''}>7 Days Before</option>
              <option value="ADVANCE_2D" ${this.selectedStage === 'ADVANCE_2D' ? 'selected' : ''}>2 Days Before</option>
              <option value="ADVANCE_1D" ${this.selectedStage === 'ADVANCE_1D' ? 'selected' : ''}>1 Day Before</option>
              <option value="DUE_TODAY" ${this.selectedStage === 'DUE_TODAY' ? 'selected' : ''}>Due Today</option>
              <option value="OVERDUE_3D" ${this.selectedStage === 'OVERDUE_3D' ? 'selected' : ''}>3 Days Overdue</option>
              <option value="OVERDUE_7D" ${this.selectedStage === 'OVERDUE_7D' ? 'selected' : ''}>7 Days Overdue</option>
            </select>

            <!-- Reminder Type Filter -->
            <select class="form-control form-control-sm" style="width: auto; min-width: 130px; height: 28px; font-size: 11.5px;" onchange="window.CustomerRemindersModule.setTypeFilter(this.value)">
              <option value="ALL" ${this.selectedReminderType === 'ALL' ? 'selected' : ''}>All Types</option>
              <option value="PERIODIC_SERVICE" ${this.selectedReminderType === 'PERIODIC_SERVICE' ? 'selected' : ''}>Periodic Service</option>
              <option value="OVERDUE_SERVICE" ${this.selectedReminderType === 'OVERDUE_SERVICE' ? 'selected' : ''}>Overdue Service</option>
            </select>

            <button type="button" class="btn btn-secondary btn-xs" style="height: 28px;" onclick="window.CustomerRemindersModule.resetFilters()">Reset</button>
          </div>

          <!-- Table Scroll Container (Full Height Utilization) -->
          <div class="table-responsive table-scroll-container" style="flex: 1 1 auto; margin-bottom: 4px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 1%; white-space: nowrap;">Vehicle Reg No</th>
                  <th>Customer Name & Contact</th>
                  <th>Vehicle Model</th>
                  <th>Last Service</th>
                  <th>Next Service Due</th>
                  <th style="text-align: center;">Due Stage</th>
                  <th>Facility</th>
                  <th>Reminder Status</th>
                  <th class="text-right" style="padding-right: 12px;">Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTargets.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                      <div style="font-size: 28px; margin-bottom: 6px;">🔔</div>
                      <div style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">No Reminders Matching Filters</div>
                      <div style="font-size: 12px;">All customer vehicles are up to date or no records match the selected stage.</div>
                    </td>
                  </tr>
                ` : filteredTargets.map(t => {
                  const diff = this.computeDaysDiff(t.next_service_due_date);
                  const stage = this.determineReminderStage(diff);
                  const lastLog = logs.find(l => l.vehicle_reg_no === t.vehicle_reg_no && l.stage === stage.key);
                  const isSent = !!lastLog;
                  const isBooked = lastLog && lastLog.appointment_booked;

                  return `
                    <tr>
                      <td style="white-space: nowrap;"><span class="cell-mono cell-strong" style="color: var(--primary-300); font-weight: 700;">${t.vehicle_reg_no}</span></td>
                      <td>
                        <div style="font-weight: 600; font-size: 12px;">${t.customer_name}</div>
                        <div style="font-size: 10.5px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 1px;">
                          <span>📞 ${t.customer_mobile || '--'}</span>
                        </div>
                      </td>
                      <td>
                        <div style="font-size: 12px; font-weight: 500;">${t.vehicle_model}</div>
                        <div style="font-size: 10.5px; color: var(--text-muted);">${t.last_odometer_km.toLocaleString()} km</div>
                      </td>
                      <td style="white-space: nowrap; font-size: 11.5px;">${this.formatDateDisplay(t.last_service_date)}</td>
                      <td style="white-space: nowrap;">
                        <span class="cell-mono" style="font-weight: 700; font-size: 12px; color: ${diff <= 0 ? '#ef4444' : 'var(--text-primary)'};">${this.formatDateDisplay(t.next_service_due_date)}</span>
                      </td>
                      <td style="text-align: center; white-space: nowrap;">
                        <span class="badge ${stage.badgeClass}" style="font-size: 9px; padding: 2px 6px; font-weight: 600;">${stage.label}</span>
                      </td>
                      <td style="white-space: nowrap; font-size: 11.5px; color: var(--text-secondary);">${t.facility_name}</td>
                      <td style="white-space: nowrap;">
                        ${isBooked ? `
                          <span class="badge badge-success" style="font-size: 9px;">📅 Appointment Booked</span>
                        ` : isSent ? `
                          <span class="badge badge-primary" style="font-size: 9px;" title="Sent at ${this.formatDateDisplay(lastLog.sent_at)}">✓ Sent (${lastLog.channel})</span>
                        ` : `
                          <span class="badge badge-warning" style="font-size: 9px;">⏳ Pending Dispatch</span>
                        `}
                      </td>
                      <td class="text-right" style="white-space: nowrap;">
                        <div style="display: inline-flex; gap: 4px; align-items: center;">
                          <button type="button" class="btn btn-xs btn-secondary" onclick="window.CustomerRemindersModule.previewMessageModal(window.CustomerRemindersModule.getServiceTargets().find(x => x.vehicle_reg_no === '${t.vehicle_reg_no}'), '${stage.key}')" title="Preview Rendered Template">
                            👁️ Preview
                          </button>
                          <button type="button" class="btn btn-xs btn-primary" onclick="window.CustomerRemindersModule.sendReminder(window.CustomerRemindersModule.getServiceTargets().find(x => x.vehicle_reg_no === '${t.vehicle_reg_no}'), '${stage.key}', 'WHATSAPP')" title="Send WhatsApp Message">
                            💬 Send
                          </button>
                          ${!isBooked ? `
                            <button type="button" class="btn btn-xs btn-outline" onclick="window.CustomerRemindersModule.quickBookAppointment('${t.vehicle_reg_no}')" title="Record Booked Appointment">
                              📅 Book
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Bottom Summary Bar -->
          <div class="user-pagination-bar" style="margin-top: auto; padding: 6px 4px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); font-size: 11.5px; color: var(--text-muted);">
            <div>Showing <strong>${filteredTargets.length}</strong> target vehicles due for service reminders</div>
            <div style="display: flex; gap: 8px;">
              <span>WhatsApp API: <strong style="color: #25D366;">Connected ✓</strong></span>
              <span>&bull;</span>
              <span>SMS Gateway: <strong style="color: #06b6d4;">Active ✓</strong></span>
            </div>
          </div>
        </div>
      `;
    },

    filterByKpi(kpiType) {
      if (kpiType === 'UPCOMING') {
        this.selectedStage = 'ALL';
        this.selectedReminderType = 'PERIODIC_SERVICE';
      } else if (kpiType === 'DUE_TODAY') {
        this.selectedStage = 'DUE_TODAY';
        this.selectedReminderType = 'ALL';
      } else if (kpiType === 'OVERDUE') {
        this.selectedStage = 'ALL';
        this.selectedReminderType = 'OVERDUE_SERVICE';
      }
      this.refresh();
    },

    setSearchTerm(val) {
      this.searchTerm = val;
      this.refresh();
    },

    setFacilityFilter(val) {
      this.selectedFacilityId = val;
      this.refresh();
    },

    setStageFilter(val) {
      this.selectedStage = val;
      this.refresh();
    },

    setTypeFilter(val) {
      this.selectedReminderType = val;
      this.refresh();
    },

    resetFilters() {
      this.searchTerm = '';
      this.selectedFacilityId = 'ALL';
      this.selectedStage = 'ALL';
      this.selectedReminderType = 'ALL';
      this.refresh();
    },

    quickBookAppointment(regNo) {
      const targets = this.getServiceTargets();
      const target = targets.find(t => t.vehicle_reg_no === regNo);
      if (target) {
        // Find existing log or create appointment record
        let logs = window.DB.getAll('reminder_logs') || [];
        let log = logs.find(l => l.vehicle_reg_no === regNo);
        if (!log) {
          log = this.sendReminder(target, 'DUE_TODAY', 'WHATSAPP');
        }
        if (log) {
          this.bookAppointmentFromReminder(log.id);
        }
      }
    },

    exportDashboardCSV() {
      const targets = this.getServiceTargets();
      let csv = 'Vehicle Reg No,Customer Name,Customer Mobile,Vehicle Model,Next Service Due,Days Diff,Stage,Facility\n';
      targets.forEach(t => {
        const diff = this.computeDaysDiff(t.next_service_due_date);
        const stage = this.determineReminderStage(diff);
        csv += `"${t.vehicle_reg_no}","${t.customer_name}","${t.customer_mobile}","${t.vehicle_model}","${t.next_service_due_date}",${diff},"${stage.label}","${t.facility_name}"\n`;
      });
      this.downloadBlob(csv, `Service_Reminders_${this.getTodayDateStr()}.csv`, 'text/csv');
    },

    downloadBlob(content, filename, mimeType) {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // -------------------------------------------------------------------------
    // 2. REMINDER CONFIGURATION (BRD Section 5)
    // -------------------------------------------------------------------------
    renderConfigurationTab() {
      const configs = window.DB.getAll('reminder_configurations') || [];
      const plants = window.DB.getAll('plants') || [];
      const templates = window.DB.getAll('reminder_templates') || [];

      return `
        <div class="content-card" style="margin-top: 0; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; padding: 12px 16px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Facility-Wise Reminder Rules Configuration</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">Define reminder intervals, communication channels, execution times, and retry policies (BRD §5)</div>
            </div>

            <button type="button" class="btn btn-primary btn-sm" onclick="window.CustomerRemindersModule.showAddConfigModal()" style="display: inline-flex; align-items: center; gap: 4px;">
              <span>+ Add Reminder Configuration</span>
            </button>
          </div>

          <div class="table-responsive table-scroll-container" style="flex: 1 1 auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 1%;">Code</th>
                  <th>Configuration Name</th>
                  <th>Facility</th>
                  <th>Reminder Type</th>
                  <th>Trigger / Stage</th>
                  <th>Channel</th>
                  <th>Processing Time</th>
                  <th>Retry Policy</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${configs.map(c => {
                  const plant = plants.find(p => p.id === c.facility_id) || { name: c.facility_id || 'All Facilities' };
                  const tmpl = templates.find(t => t.id === c.template_id) || {};

                  return `
                    <tr>
                      <td style="white-space: nowrap;"><span class="cell-mono cell-strong" style="color: var(--primary-300);">${c.code}</span></td>
                      <td style="font-weight: 600; font-size: 12px;">${c.name}</td>
                      <td style="font-size: 11.5px; color: var(--text-secondary);">${plant.name}</td>
                      <td><span class="badge badge-subtle" style="font-size: 9.5px;">${c.reminder_type.replace(/_/g, ' ')}</span></td>
                      <td style="font-size: 11.5px;">
                        ${c.advance_days > 0 ? `<strong>${c.advance_days} Days Advance</strong>` : (c.overdue_days > 0 ? `<strong style="color: #ef4444;">${c.overdue_days} Days Overdue</strong>` : 'Due Date')}
                      </td>
                      <td>
                        <span class="badge ${c.channel === 'WHATSAPP' ? 'badge-success' : (c.channel === 'BOTH' ? 'badge-primary' : 'badge-info')}" style="font-size: 9.5px;">
                          ${c.channel}
                        </span>
                      </td>
                      <td class="cell-mono" style="font-size: 11.5px;">${c.processing_time || '10:00'} AM</td>
                      <td style="font-size: 11px; color: var(--text-muted);">${c.max_retries} Retries (${c.retry_interval_hours}h)</td>
                      <td>
                        <button type="button" class="btn btn-xs ${c.is_active ? 'btn-success' : 'btn-secondary'}" style="font-size: 9.5px; padding: 2px 6px;" onclick="window.CustomerRemindersModule.toggleConfigActive('${c.id}')">
                          ${c.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td class="text-right" style="white-space: nowrap;">
                        <button type="button" class="btn btn-xs btn-secondary" onclick="window.CustomerRemindersModule.showEditConfigModal('${c.id}')">Edit</button>
                        <button type="button" class="btn btn-xs btn-danger" onclick="window.CustomerRemindersModule.deleteConfig('${c.id}')">Delete</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    toggleConfigActive(cfgId) {
      const configs = window.DB.getAll('reminder_configurations') || [];
      const cfg = configs.find(c => c.id === cfgId);
      if (cfg) {
        cfg.is_active = !cfg.is_active;
        if (typeof window.DB.saveData === 'function') {
          window.DB.saveData(window.DB.data);
        }
        this.refresh();
      }
    },

    deleteConfig(cfgId) {
      if (!confirm('Are you sure you want to delete this reminder configuration?')) return;
      if (window.DB && Array.isArray(window.DB.data.reminder_configurations)) {
        window.DB.data.reminder_configurations = window.DB.data.reminder_configurations.filter(c => c.id !== cfgId);
        if (typeof window.DB.saveData === 'function') {
          window.DB.saveData(window.DB.data);
        }
        this.refresh();
      }
    },

    showAddConfigModal() {
      this.showConfigModal();
    },

    showEditConfigModal(cfgId) {
      const configs = window.DB.getAll('reminder_configurations') || [];
      const cfg = configs.find(c => c.id === cfgId);
      this.showConfigModal(cfg);
    },

    showConfigModal(existing) {
      const plants = window.DB.getAll('plants') || [];
      const templates = window.DB.getAll('reminder_templates') || [];
      const isEdit = !!existing;

      const contentHtml = `
        <form id="reminder-config-form" onsubmit="event.preventDefault(); window.CustomerRemindersModule.saveConfigForm(this, '${existing ? existing.id : ''}')" style="display: flex; flex-direction: column; gap: 12px; padding: 4px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Configuration Code *</label>
              <input type="text" name="code" class="form-control" required value="${existing ? existing.code : 'REM-CFG-' + Math.floor(100 + Math.random() * 900)}" />
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Configuration Name *</label>
              <input type="text" name="name" class="form-control" required value="${existing ? existing.name : ''}" placeholder="e.g. 7 Days Advance Periodic Service" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Applicable Facility *</label>
              <select name="facility_id" class="form-control" required>
                ${plants.map(p => `
                  <option value="${p.id}" ${existing && existing.facility_id === p.id ? 'selected' : ''}>${p.name || p.code}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Reminder Type *</label>
              <select name="reminder_type" class="form-control" required>
                <option value="PERIODIC_SERVICE" ${existing && existing.reminder_type === 'PERIODIC_SERVICE' ? 'selected' : ''}>Periodic Service Reminder</option>
                <option value="OVERDUE_SERVICE" ${existing && existing.reminder_type === 'OVERDUE_SERVICE' ? 'selected' : ''}>Overdue Service Reminder</option>
                <option value="INSURANCE_EXPIRY" ${existing && existing.reminder_type === 'INSURANCE_EXPIRY' ? 'selected' : ''}>Insurance & Document Expiry</option>
                <option value="VEHICLE_READY" ${existing && existing.reminder_type === 'VEHICLE_READY' ? 'selected' : ''}>Vehicle Ready for Delivery</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Advance Days</label>
              <input type="number" name="advance_days" class="form-control" min="0" max="30" value="${existing ? (existing.advance_days || 0) : 7}" />
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Overdue Days</label>
              <input type="number" name="overdue_days" class="form-control" min="0" max="60" value="${existing ? (existing.overdue_days || 0) : 0}" />
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Channel *</label>
              <select name="channel" class="form-control" required>
                <option value="WHATSAPP" ${existing && existing.channel === 'WHATSAPP' ? 'selected' : ''}>WhatsApp Only</option>
                <option value="SMS" ${existing && existing.channel === 'SMS' ? 'selected' : ''}>SMS Only</option>
                <option value="BOTH" ${existing && existing.channel === 'BOTH' ? 'selected' : ''}>Both WhatsApp & SMS</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Message Template *</label>
              <select name="template_id" class="form-control" required>
                ${templates.map(t => `
                  <option value="${t.id}" ${existing && existing.template_id === t.id ? 'selected' : ''}>${t.name} (${t.code})</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Daily Processing Time *</label>
              <input type="time" name="processing_time" class="form-control" value="${existing ? existing.processing_time : '10:00'}" required />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Max Retries</label>
              <input type="number" name="max_retries" class="form-control" min="0" max="5" value="${existing ? existing.max_retries : 2}" />
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Retry Interval (Hrs)</label>
              <input type="number" name="retry_interval_hours" class="form-control" min="1" max="48" value="${existing ? existing.retry_interval_hours : 12}" />
            </div>

            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Status</label>
              <select name="is_active" class="form-control">
                <option value="true" ${!existing || existing.is_active ? 'selected' : ''}>Active</option>
                <option value="false" ${existing && !existing.is_active ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Configuration'}</button>
          </div>
        </form>
      `;

      if (window.State && typeof window.State.showModal === 'function') {
        window.State.showModal({ title: isEdit ? 'Edit Reminder Configuration' : 'New Reminder Configuration Rule', contentHtml, maxWidth: '640px' });
      }
    },

    saveConfigForm(formEl, cfgId) {
      const formData = new FormData(formEl);
      const isEdit = !!cfgId;
      const configs = window.DB.getAll('reminder_configurations') || [];

      const cfgObj = {
        id: isEdit ? cfgId : 'CFG-' + Date.now().toString(36).toUpperCase(),
        code: formData.get('code'),
        name: formData.get('name'),
        facility_id: formData.get('facility_id'),
        reminder_type: formData.get('reminder_type'),
        trigger_basis: 'NEXT_SERVICE_DATE',
        advance_days: Number(formData.get('advance_days') || 0),
        overdue_days: Number(formData.get('overdue_days') || 0),
        channel: formData.get('channel'),
        template_id: formData.get('template_id'),
        processing_time: formData.get('processing_time') || '10:00',
        max_retries: Number(formData.get('max_retries') || 2),
        retry_interval_hours: Number(formData.get('retry_interval_hours') || 12),
        is_active: formData.get('is_active') === 'true',
        effective_from: this.getTodayDateStr(),
        effective_to: ''
      };

      if (isEdit) {
        const idx = configs.findIndex(c => c.id === cfgId);
        if (idx !== -1) configs[idx] = cfgObj;
      } else {
        configs.push(cfgObj);
      }

      window.DB.data.reminder_configurations = configs;
      if (typeof window.DB.saveData === 'function') {
        window.DB.saveData(window.DB.data);
      }

      if (window.State && typeof window.State.closeModal === 'function') {
        window.State.closeModal();
      }
      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast(`✓ Reminder Configuration "${cfgObj.name}" saved successfully`, 'success');
      }
      this.refresh();
    },

    // -------------------------------------------------------------------------
    // 3. REMINDER PROCESSING ENGINE & LIVE QUEUE (BRD Section 7)
    // -------------------------------------------------------------------------
    renderProcessingTab() {
      const targets = this.getServiceTargets();
      const logs = window.DB.getAll('reminder_logs') || [];

      const dueQueue = targets.filter(t => {
        const diff = this.computeDaysDiff(t.next_service_due_date);
        return [7, 2, 1, 0, -3, -7, -15].includes(diff);
      });

      return `
        <div class="content-card" style="margin-top: 0; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; padding: 12px 16px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Automated Daily Dispatch Engine & Live Queue</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">Processes facility reminders at 10:00 AM daily with anti-duplicate validation (BRD §7)</div>
            </div>

            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-primary btn-sm" onclick="window.CustomerRemindersModule.runAutomatedEngine()">
                <span>⚡ Process All Due Reminders Now</span>
              </button>
            </div>
          </div>

          <!-- Live Status Bar -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🤖</span>
              <div>
                <div style="font-size: 12.5px; font-weight: 700; color: var(--text-primary);">Automated Reminder Scheduler: ACTIVE</div>
                <div style="font-size: 11px; color: var(--text-muted);">Configured Schedule: Daily at 10:00 AM IST &bull; Next Execution: Tomorrow 10:00 AM</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; font-size: 11.5px;">
              <span>Queued Due Today: <strong style="color: var(--primary-300);">${dueQueue.length}</strong></span>
              <span>Total Processed: <strong style="color: #10b981;">${logs.length}</strong></span>
            </div>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Live Eligible Queue for Today's Cycle</div>
          
          <div class="table-responsive table-scroll-container" style="flex: 1 1 auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle Reg</th>
                  <th>Customer Name & Phone</th>
                  <th>Vehicle Model</th>
                  <th>Service Due</th>
                  <th>Trigger Stage</th>
                  <th>Eligibility Verification</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${dueQueue.length === 0 ? `
                  <tr><td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">No reminders currently in queue. All eligible vehicles processed.</td></tr>
                ` : dueQueue.map(t => {
                  const diff = this.computeDaysDiff(t.next_service_due_date);
                  const stage = this.determineReminderStage(diff);
                  const lastLog = logs.find(l => l.vehicle_reg_no === t.vehicle_reg_no && l.stage === stage.key);
                  const alreadySent = !!lastLog;

                  return `
                    <tr>
                      <td style="white-space: nowrap;"><span class="cell-mono cell-strong" style="color: var(--primary-300);">${t.vehicle_reg_no}</span></td>
                      <td>
                        <div style="font-weight: 600; font-size: 12px;">${t.customer_name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${t.customer_mobile}</div>
                      </td>
                      <td style="font-size: 12px;">${t.vehicle_model}</td>
                      <td class="cell-mono" style="font-size: 12px; font-weight: 600;">${this.formatDateDisplay(t.next_service_due_date)}</td>
                      <td><span class="badge ${stage.badgeClass}" style="font-size: 9.5px;">${stage.label}</span></td>
                      <td style="font-size: 11px;">
                        ${alreadySent ? `
                          <span style="color: #10b981; font-weight: 600;">✓ Dispatched (${this.formatDateDisplay(lastLog.sent_at)})</span>
                        ` : `
                          <span style="color: var(--primary-400); font-weight: 600;">✓ Verified & Ready</span>
                        `}
                      </td>
                      <td class="text-right">
                        <button type="button" class="btn btn-xs ${alreadySent ? 'btn-secondary' : 'btn-primary'}" onclick="window.CustomerRemindersModule.sendReminder(window.CustomerRemindersModule.getServiceTargets().find(x => x.vehicle_reg_no === '${t.vehicle_reg_no}'), '${stage.key}', 'WHATSAPP')">
                          ${alreadySent ? '↻ Re-Send' : '⚡ Dispatch Now'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    // -------------------------------------------------------------------------
    // 4. REMINDER HISTORY & AUDIT LOGS (BRD Section 9)
    // -------------------------------------------------------------------------
    renderHistoryTab() {
      const logs = window.DB.getAll('reminder_logs') || [];

      return `
        <div class="content-card" style="margin-top: 0; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; padding: 12px 16px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Audit Trail & Delivery History Log</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">Comprehensive record of all messages submitted, provider delivery statuses, and retry records (BRD §9)</div>
            </div>

            <button type="button" class="btn btn-secondary btn-sm" onclick="window.CustomerRemindersModule.exportHistoryCSV()">
              <span>📥 Export Delivery Log CSV</span>
            </button>
          </div>

          <div class="table-responsive table-scroll-container" style="flex: 1 1 auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Log ID / Provider Ref</th>
                  <th>Vehicle & Customer</th>
                  <th>Channel</th>
                  <th>Stage</th>
                  <th>Service Due</th>
                  <th>Message Preview</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                  <th class="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                ${logs.length === 0 ? `
                  <tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">No reminder delivery logs recorded yet. Run the reminder engine to dispatch messages.</td></tr>
                ` : logs.map(l => `
                  <tr>
                    <td>
                      <div class="cell-mono cell-strong" style="font-size: 11px; color: var(--primary-300);">${l.id}</div>
                      <div class="cell-mono" style="font-size: 10px; color: var(--text-muted);">${l.provider_message_id || '--'}</div>
                    </td>
                    <td>
                      <div style="font-weight: 600; font-size: 12px;">${l.customer_name} &bull; ${l.vehicle_reg_no}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${l.customer_mobile} &bull; ${l.vehicle_model}</div>
                    </td>
                    <td><span class="badge ${l.channel === 'WHATSAPP' ? 'badge-success' : 'badge-info'}" style="font-size: 9.5px;">${l.channel}</span></td>
                    <td style="font-size: 11.5px;">${l.stage}</td>
                    <td class="cell-mono" style="font-size: 11.5px;">${this.formatDateDisplay(l.next_service_due_date)}</td>
                    <td style="max-width: 250px; font-size: 11px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${l.message_body}">
                      ${l.message_body ? l.message_body.replace(/\n/g, ' ') : '--'}
                    </td>
                    <td>
                      <span class="badge ${l.status === 'DELIVERED' ? 'badge-success' : (l.status === 'SENT' ? 'badge-primary' : 'badge-danger')}" style="font-size: 9px;">
                        ${l.status}
                      </span>
                    </td>
                    <td style="font-size: 10.5px; color: var(--text-muted); white-space: nowrap;">${this.formatDateDisplay(l.sent_at)}</td>
                    <td class="text-right">
                      <button type="button" class="btn btn-xs btn-secondary" onclick="window.CustomerRemindersModule.viewLogDetailsModal('${l.id}')">Inspect</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    viewLogDetailsModal(logId) {
      const logs = window.DB.getAll('reminder_logs') || [];
      const l = logs.find(x => x.id === logId);
      if (!l) return;

      const contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12.5px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <div><strong>Log ID:</strong> <span class="cell-mono">${l.id}</span></div>
            <div><strong>Provider Message ID:</strong> <span class="cell-mono">${l.provider_message_id}</span></div>
            <div><strong>Customer:</strong> ${l.customer_name} (${l.customer_mobile})</div>
            <div><strong>Vehicle:</strong> ${l.vehicle_reg_no} (${l.vehicle_model})</div>
            <div><strong>Channel:</strong> ${l.channel}</div>
            <div><strong>Status:</strong> <span class="badge badge-success">${l.status}</span></div>
            <div><strong>Due Date:</strong> ${this.formatDateDisplay(l.next_service_due_date)}</div>
            <div><strong>Sent Timestamp:</strong> ${l.sent_at}</div>
          </div>

          <div>
            <div style="font-weight: 700; margin-bottom: 6px;">Delivered Payload Text:</div>
            <div style="background: var(--bg-surface); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); white-space: pre-wrap; font-family: var(--font-sans); font-size: 12px; line-height: 1.5;">
${l.message_body}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
          </div>
        </div>
      `;

      if (window.State && typeof window.State.showModal === 'function') {
        window.State.showModal({ title: `Delivery Log Inspection: ${l.id}`, contentHtml, maxWidth: '600px' });
      }
    },

    exportHistoryCSV() {
      const logs = window.DB.getAll('reminder_logs') || [];
      let csv = 'Log ID,Customer Name,Mobile,Vehicle Reg,Model,Stage,Channel,Status,Sent At,Provider Msg ID\n';
      logs.forEach(l => {
        csv += `"${l.id}","${l.customer_name}","${l.customer_mobile}","${l.vehicle_reg_no}","${l.vehicle_model}","${l.stage}","${l.channel}","${l.status}","${l.sent_at}","${l.provider_message_id}"\n`;
      });
      this.downloadBlob(csv, `Reminder_Delivery_History_${this.getTodayDateStr()}.csv`, 'text/csv');
    },

    // -------------------------------------------------------------------------
    // 5. MESSAGE TEMPLATE MASTER (BRD Section 8)
    // -------------------------------------------------------------------------
    renderTemplatesTab() {
      const templates = window.DB.getAll('reminder_templates') || [];

      return `
        <div class="content-card" style="margin-top: 0; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; padding: 12px 16px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Approved Reminder Message Templates Master</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">Standardized WhatsApp & SMS templates with dynamic vehicle & customer placeholders (BRD §8)</div>
            </div>

            <button type="button" class="btn btn-primary btn-sm" onclick="window.CustomerRemindersModule.showAddTemplateModal()">
              <span>+ Add Message Template</span>
            </button>
          </div>

          <div class="table-responsive table-scroll-container" style="flex: 1 1 auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 1%;">Code</th>
                  <th>Template Name</th>
                  <th>Category</th>
                  <th>Trigger Stage</th>
                  <th>Channel</th>
                  <th>Sample Message Body</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${templates.map(t => `
                  <tr>
                    <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${t.code}</span></td>
                    <td style="font-weight: 600; font-size: 12px;">${t.name}</td>
                    <td><span class="badge badge-subtle" style="font-size: 9.5px;">${t.category.replace(/_/g, ' ')}</span></td>
                    <td><span class="badge badge-primary" style="font-size: 9.5px;">${t.stage}</span></td>
                    <td><span class="badge badge-success" style="font-size: 9.5px;">${t.channel}</span></td>
                    <td style="max-width: 320px; font-size: 11px; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${t.body}">
                      ${t.body.replace(/\n/g, ' ')}
                    </td>
                    <td><span class="badge ${t.is_active ? 'badge-success' : 'badge-subtle'}">${t.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td class="text-right" style="white-space: nowrap;">
                      <button type="button" class="btn btn-xs btn-secondary" onclick="window.CustomerRemindersModule.previewTemplateDetailsModal('${t.id}')">Inspect & Preview</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    previewTemplateDetailsModal(tmplId) {
      const templates = window.DB.getAll('reminder_templates') || [];
      const tmpl = templates.find(t => t.id === tmplId);
      if (!tmpl) return;

      const dummyTarget = {
        customer_name: 'Customer Name',
        vehicle_model: 'Two-Wheeler',
        vehicle_reg_no: 'MH12XX0000',
        next_service_due_date: this.computeOffsetDate(7),
        facility_name: 'Mauli Service Center 1',
        facility_phone: '9822012345'
      };
      const renderedPreview = this.renderMessageBody(tmpl.body, dummyTarget);

      const contentHtml = `
        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 12.5px;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${tmpl.name} (${tmpl.code})</div>
            <div style="font-size: 11.5px; color: var(--text-muted);">Category: ${tmpl.category} &bull; Stage: ${tmpl.stage} &bull; Channel: ${tmpl.channel}</div>
          </div>

          <div>
            <div style="font-weight: 700; margin-bottom: 4px; color: var(--text-secondary);">Template Raw Content (with Placeholders):</div>
            <div style="background: var(--bg-surface); border: 1px solid var(--border-medium); border-radius: var(--radius-sm); padding: 12px; font-size: 12px; white-space: pre-wrap; font-family: var(--font-mono); color: var(--primary-300);">
${tmpl.body}
            </div>
          </div>

          <div>
            <div style="font-weight: 700; margin-bottom: 4px; color: #25D366;">Live Sample Render (Sample Preview):</div>
            <div style="background: #1f2c34; border-radius: var(--radius-sm); padding: 12px; color: #e9edef; font-size: 12.5px; white-space: pre-wrap; line-height: 1.5;">
${renderedPreview}
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Close</button>
          </div>
        </div>
      `;

      if (window.State && typeof window.State.showModal === 'function') {
        window.State.showModal({ title: 'Template Inspection & Live Sample Preview', contentHtml, maxWidth: '600px' });
      }
    },

    showAddTemplateModal() {
      const contentHtml = `
        <form onsubmit="event.preventDefault(); window.CustomerRemindersModule.saveNewTemplate(this);" style="display: flex; flex-direction: column; gap: 12px; padding: 4px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Template Code *</label>
              <input type="text" name="code" class="form-control" required placeholder="e.g. CUSTOM-SERVICE-10D" />
            </div>
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Template Name *</label>
              <input type="text" name="name" class="form-control" required placeholder="e.g. 10 Days Advance Service Notification" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Category</label>
              <select name="category" class="form-control">
                <option value="PERIODIC_SERVICE">Periodic Service</option>
                <option value="OVERDUE_SERVICE">Overdue Service</option>
                <option value="INSURANCE_EXPIRY">Insurance Expiry</option>
                <option value="VEHICLE_READY">Vehicle Ready</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Stage Key</label>
              <input type="text" name="stage" class="form-control" required placeholder="e.g. ADVANCE_10D" />
            </div>
            <div>
              <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Channel</label>
              <select name="channel" class="form-control">
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; display: block;">Message Template Body *</label>
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Available placeholders: {{CustomerName}}, {{VehicleModel}}, {{RegistrationNumber}}, {{NextServiceDate}}, {{FacilityName}}, {{FacilityContactNumber}}</div>
            <textarea name="body" class="form-control" rows="6" required style="font-family: var(--font-sans); font-size: 12px;"></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <button type="button" class="btn btn-secondary" onclick="window.State.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Template</button>
          </div>
        </form>
      `;

      if (window.State && typeof window.State.showModal === 'function') {
        window.State.showModal({ title: 'Create New Message Template', contentHtml, maxWidth: '620px' });
      }
    },

    saveNewTemplate(formEl) {
      const formData = new FormData(formEl);
      const newTmpl = {
        id: 'TMPL-' + Date.now().toString(36).toUpperCase(),
        code: formData.get('code'),
        name: formData.get('name'),
        category: formData.get('category'),
        stage: formData.get('stage'),
        channel: formData.get('channel'),
        body: formData.get('body'),
        is_active: true,
        is_system: false
      };

      if (!Array.isArray(window.DB.data.reminder_templates)) {
        window.DB.data.reminder_templates = [];
      }
      window.DB.data.reminder_templates.push(newTmpl);
      if (typeof window.DB.saveData === 'function') {
        window.DB.saveData(window.DB.data);
      }

      if (window.State && typeof window.State.closeModal === 'function') {
        window.State.closeModal();
      }
      if (window.State && typeof window.State.showToast === 'function') {
        window.State.showToast(`✓ Template "${newTmpl.name}" created successfully`, 'success');
      }
      this.refresh();
    },

    // -------------------------------------------------------------------------
    // 6. REMINDER REPORTS (BRD Section 12)
    // -------------------------------------------------------------------------
    renderReportsTab() {
      const targets = this.getServiceTargets();
      const logs = window.DB.getAll('reminder_logs') || [];
      const plants = window.DB.getAll('plants') || [];

      return `
        <div class="content-card" style="margin-top: 0; border-top: none; border-top-left-radius: 0; border-top-right-radius: 0; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; padding: 12px 16px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Customer Reminder Analytics & MIS Reports</div>
              <div style="font-size: 11.5px; color: var(--text-muted);">8 Standardized Two-Wheeler Service Retention & Reminder Reports (BRD §12)</div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <select class="form-control form-control-sm" style="width: auto; min-width: 220px; height: 30px; font-weight: 600;" onchange="window.CustomerRemindersModule.setReportType(this.value)">
                <option value="UPCOMING_SERVICE" ${this.selectedReportType === 'UPCOMING_SERVICE' ? 'selected' : ''}>1. Upcoming Service Reminder Report</option>
                <option value="OVERDUE_SERVICE" ${this.selectedReportType === 'OVERDUE_SERVICE' ? 'selected' : ''}>2. Overdue Service Reminder Report</option>
                <option value="DELIVERY_FAILURE" ${this.selectedReportType === 'DELIVERY_FAILURE' ? 'selected' : ''}>3. Reminder Delivery & Failure Report</option>
                <option value="CUSTOMER_HISTORY" ${this.selectedReportType === 'CUSTOMER_HISTORY' ? 'selected' : ''}>4. Customer-Wise Reminder History</option>
                <option value="VEHICLE_HISTORY" ${this.selectedReportType === 'VEHICLE_HISTORY' ? 'selected' : ''}>5. Vehicle-Wise Reminder History</option>
                <option value="FACILITY_SUMMARY" ${this.selectedReportType === 'FACILITY_SUMMARY' ? 'selected' : ''}>6. Facility-Wise Reminder Summary</option>
                <option value="CONVERSION_REPORT" ${this.selectedReportType === 'CONVERSION_REPORT' ? 'selected' : ''}>7. Appointment Conversion Report</option>
                <option value="RETENTION_REPORT" ${this.selectedReportType === 'RETENTION_REPORT' ? 'selected' : ''}>8. Service Retention & Repeat Visit Report</option>
              </select>

              <button type="button" class="btn btn-secondary btn-sm" onclick="window.CustomerRemindersModule.exportActiveReportCSV()">
                <span>📥 Export Report CSV</span>
              </button>
            </div>
          </div>

          <!-- Report Data Content -->
          <div class="table-responsive table-scroll-container" style="flex: 1 1 auto;">
            ${this.renderActiveReportTable(targets, logs, plants)}
          </div>
        </div>
      `;
    },

    setReportType(val) {
      this.selectedReportType = val;
      this.refresh();
    },

    renderActiveReportTable(targets, logs, plants) {
      switch (this.selectedReportType) {
        case 'OVERDUE_SERVICE': {
          const overdue = targets.filter(t => this.computeDaysDiff(t.next_service_due_date) < 0);
          return `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle Reg</th>
                  <th>Customer Name & Phone</th>
                  <th>Vehicle Model</th>
                  <th>Last Service</th>
                  <th>Service Due Date</th>
                  <th>Days Overdue</th>
                  <th>Facility</th>
                </tr>
              </thead>
              <tbody>
                ${overdue.map(t => `
                  <tr>
                    <td><span class="cell-mono cell-strong" style="color: #ef4444;">${t.vehicle_reg_no}</span></td>
                    <td>${t.customer_name} &bull; ${t.customer_mobile}</td>
                    <td>${t.vehicle_model}</td>
                    <td>${this.formatDateDisplay(t.last_service_date)}</td>
                    <td class="cell-mono">${this.formatDateDisplay(t.next_service_due_date)}</td>
                    <td><span class="badge badge-danger">${Math.abs(this.computeDaysDiff(t.next_service_due_date))} Days Overdue</span></td>
                    <td>${t.facility_name}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
        case 'CONVERSION_REPORT': {
          return `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle Reg</th>
                  <th>Customer Name</th>
                  <th>Service Due</th>
                  <th>Reminder Sent At</th>
                  <th>Channel</th>
                  <th>Appointment Converted</th>
                  <th>Conversion Status</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map(l => `
                  <tr>
                    <td><span class="cell-mono cell-strong">${l.vehicle_reg_no}</span></td>
                    <td>${l.customer_name}</td>
                    <td>${this.formatDateDisplay(l.next_service_due_date)}</td>
                    <td>${this.formatDateDisplay(l.sent_at)}</td>
                    <td><span class="badge badge-info">${l.channel}</span></td>
                    <td>${l.appointment_booked ? '✓ YES' : 'Pending'}</td>
                    <td><span class="badge ${l.appointment_booked ? 'badge-success' : 'badge-subtle'}">${l.appointment_booked ? 'CONVERTED' : 'UNCONVERTED'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
        case 'FACILITY_SUMMARY': {
          return `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Facility ID</th>
                  <th>Facility Name</th>
                  <th>Vehicles Due</th>
                  <th>Upcoming Reminders</th>
                  <th>Overdue Followups</th>
                  <th>Messages Dispatched</th>
                  <th>Appointments Booked</th>
                </tr>
              </thead>
              <tbody>
                ${plants.map(p => {
                  const facTargets = targets.filter(t => t.facility_id === p.id);
                  const facLogs = logs.filter(l => l.facility_id === p.id);
                  const upcoming = facTargets.filter(t => this.computeDaysDiff(t.next_service_due_date) > 0).length;
                  const overdue = facTargets.filter(t => this.computeDaysDiff(t.next_service_due_date) < 0).length;
                  const booked = facLogs.filter(l => l.appointment_booked).length;

                  return `
                    <tr>
                      <td><span class="cell-mono cell-strong">${p.id}</span></td>
                      <td style="font-weight: 600;">${p.name || p.code}</td>
                      <td>${facTargets.length}</td>
                      <td><span class="badge badge-info">${upcoming}</span></td>
                      <td><span class="badge badge-danger">${overdue}</span></td>
                      <td><strong style="color: #10b981;">${facLogs.length}</strong></td>
                      <td><strong style="color: #8b5cf6;">${booked}</strong></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }
        case 'UPCOMING_SERVICE':
        default: {
          const upcoming = targets.filter(t => this.computeDaysDiff(t.next_service_due_date) >= 0);
          return `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle Reg</th>
                  <th>Customer Name & Phone</th>
                  <th>Vehicle Model</th>
                  <th>Last Service</th>
                  <th>Next Service Due</th>
                  <th>Days Remaining</th>
                  <th>Facility</th>
                </tr>
              </thead>
              <tbody>
                ${upcoming.map(t => {
                  const diff = this.computeDaysDiff(t.next_service_due_date);
                  return `
                    <tr>
                      <td><span class="cell-mono cell-strong" style="color: var(--primary-300);">${t.vehicle_reg_no}</span></td>
                      <td>${t.customer_name} &bull; ${t.customer_mobile}</td>
                      <td>${t.vehicle_model}</td>
                      <td>${this.formatDateDisplay(t.last_service_date)}</td>
                      <td class="cell-mono">${this.formatDateDisplay(t.next_service_due_date)}</td>
                      <td><span class="badge ${diff === 0 ? 'badge-danger' : (diff <= 2 ? 'badge-warning' : 'badge-primary')}">${diff === 0 ? 'DUE TODAY' : `In ${diff} Days`}</span></td>
                      <td>${t.facility_name}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `;
        }
      }
    },

    exportActiveReportCSV() {
      const targets = this.getServiceTargets();
      let csv = 'Vehicle Reg,Customer Name,Mobile,Model,Service Due Date,Facility\n';
      targets.forEach(t => {
        csv += `"${t.vehicle_reg_no}","${t.customer_name}","${t.customer_mobile}","${t.vehicle_model}","${t.next_service_due_date}","${t.facility_name}"\n`;
      });
      this.downloadBlob(csv, `CRM_Report_${this.selectedReportType}_${this.getTodayDateStr()}.csv`, 'text/csv');
    }
  };

  // Auto-register on DOMContentLoaded
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => window.CustomerRemindersModule.init());
    } else {
      window.CustomerRemindersModule.init();
    }
  }

})();
