
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 5000;

// ==========================================
// 1. MIDDLEWARE
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==========================================
// 2. MONGODB CONNECTION
// ==========================================
mongoose.connect('mongodb://127.0.0.1:27017/todo_db')
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==========================================
// 3. TASK MODEL
// ==========================================
const TodoSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: String,
    default: ''
  },
  reminderTime: {
    type: String,
    default: ''
  },
  lastNotifiedFor: {
    type: String,
    default: ''
  }
});

const Todo = mongoose.model('Todo', TodoSchema);

// ==========================================
// 4. HTML ESCAPE
// ==========================================
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

// ==========================================
// 5. HOME PAGE
// ==========================================
app.get('/', async (req, res) => {
  try {
    const tasks = await Todo.find().sort({ _id: -1 });

    const taskHTML = tasks.map(task => {
      const id = task._id.toString();

      return `
        <div class="task-card">
          <div class="task-info">
            <div class="task-name ${task.isCompleted ? 'completed' : ''}">
              ${escapeHtml(task.task)}
            </div>

            ${task.reminderTime ? `
              <div class="reminder-info">
                ⏰ Reminder:
                ${task.reminderDate
                  ? escapeHtml(task.reminderDate)
                  : 'Daily'}
                at <b>${escapeHtml(task.reminderTime)}</b>
              </div>
            ` : ''}
          </div>

          <div class="actions">
            <form action="/toggle-task/${id}" method="POST">
              <button class="done-btn" type="submit">
                ${task.isCompleted ? '↩ Undo' : '✓ Done'}
              </button>
            </form>

            <form action="/delete-task/${id}" method="POST"
              onsubmit="return confirm('Delete this task?')">
              <button class="delete-btn" type="submit">
                🗑 Delete
              </button>
            </form>
          </div>
        </div>
      `;
    }).join('');

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task &amp; Reminder Manager</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 40px 16px;
      font-family: Arial, sans-serif;
      background: #f6f9fc;
      color: #243447;
    }

    .container {
      max-width: 700px;
      margin: auto;
    }

    h2 {
      text-align: center;
      margin: 15px 0 28px;
      font-size: 28px;
    }

    .form-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      margin-bottom: 25px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    input {
      width: 100%;
      padding: 14px;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      font-size: 16px;
    }

    .fields {
      display: flex;
      gap: 14px;
      margin-top: 14px;
    }

    .fields > div {
      flex: 1;
      min-width: 0;
    }

    label {
      display: block;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 7px;
    }

    .hint {
      font-size: 13px;
      color: #64748b;
      margin: 13px 0;
    }

    button {
      cursor: pointer;
      border: none;
      border-radius: 6px;
      padding: 10px 12px;
      color: white;
      font-size: 14px;
    }

    .save-btn {
      width: 100%;
      padding: 14px;
      background: #35a16b;
      font-size: 16px;
      font-weight: bold;
    }

    .notification-area {
      text-align: center;
      margin: 25px 0;
    }

    .notify-btn {
      background: #3182ce;
      padding: 13px 18px;
      font-weight: 600;
      transition: background 0.2s, opacity 0.2s;
    }

    .notify-btn:hover {
      opacity: 0.95;
    }

    #notificationStatus {
      color: #64748b;
      font-size: 13px;
      margin-top: 12px;
      min-height: 18px;
    }

    #clockStatus {
      color: #64748b;
      font-size: 12px;
      margin-top: 6px;
    }

    .reminder-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 380px;
      width: calc(100% - 40px);
      pointer-events: none;
    }

    .reminder-toast {
      pointer-events: auto;
      background: #ffffff;
      border-left: 5px solid #3182ce;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: slideInToast 0.3s ease-out;
    }

    @keyframes slideInToast {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .reminder-toast-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: bold;
      color: #243447;
    }

    .reminder-toast-body {
      font-size: 15px;
      color: #243447;
      overflow-wrap: anywhere;
    }

    .reminder-toast-time {
      font-size: 12px;
      color: #64748b;
    }

    .reminder-toast-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .toast-dismiss-btn {
      background: #3182ce;
      padding: 7px 14px;
      font-size: 13px;
    }

    .task-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: white;
      padding: 16px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .task-info {
      flex: 1;
      min-width: 0;
    }

    .task-name {
      font-size: 16px;
      overflow-wrap: anywhere;
    }

    .completed {
      color: #94a3b8;
      text-decoration: line-through;
    }

    .reminder-info {
      margin-top: 6px;
      font-size: 12px;
      color: #64748b;
    }

    .actions {
      display: flex;
      gap: 7px;
      flex-shrink: 0;
    }

    .done-btn {
      background: #3182ce;
    }

    .delete-btn {
      background: #e53e3e;
    }

    .empty {
      text-align: center;
      color: #94a3b8;
    }

    @media (max-width: 520px) {
      body {
        padding: 24px 12px;
      }

      h2 {
        font-size: 22px;
      }

      .form-card {
        padding: 16px;
      }

      .fields {
        flex-direction: column;
      }

      .task-card {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <h2>📝 Task &amp; Reminder Manager</h2>

    <section class="form-card">
      <form action="/add-task" method="POST">
        <input
          name="task"
          type="text"
          maxlength="300"
          required
          placeholder="e.g., Take morning medicine or anniversary"
        >

        <div class="fields">
          <div>
            <label for="reminderDate">DATE (OPTIONAL)</label>
            <input
              id="reminderDate"
              name="reminderDate"
              type="date"
            >
          </div>

          <div>
            <label for="reminderTime">TIME (OPTIONAL)</label>
            <input
              id="reminderTime"
              name="reminderTime"
              type="time"
            >
          </div>
        </div>

        <input type="hidden" name="clientDate" id="clientDate">
        <input type="hidden" name="clientTime" id="clientTime">

        <p class="hint">
          Select a time for a reminder. Leave the date blank for a daily reminder.
        </p>

        <button class="save-btn" type="submit">Save Task</button>
      </form>
    </section>

    <div class="notification-area">
      <button id="enableNotifications" class="notify-btn" type="button">
        🔔 Enable Browser Notifications
      </button>

      <p id="notificationStatus" role="status"></p>
      <p id="clockStatus"></p>
    </div>

    <div id="reminderToastContainer" class="reminder-toast-container" aria-live="assertive"></div>

    <section id="taskList">
      ${taskHTML || '<p class="empty">Your to-do list is empty!</p>'}
    </section>
  </main>

  <script>
    // ==========================================
    // 6. BROWSER NOTIFICATION PERMISSION & STATUS
    // ==========================================
    const statusElement =
      document.getElementById('notificationStatus');

    const clockStatus =
      document.getElementById('clockStatus');

    const enableButton =
      document.getElementById('enableNotifications');

    const toastContainer =
      document.getElementById('reminderToastContainer');

    function updateNotificationStatus() {
      if (!('Notification' in window)) {
        statusElement.textContent =
          'Desktop notifications not supported in this browser. In-app alerts are active while page is open.';
        enableButton.disabled = true;
        enableButton.style.opacity = '0.6';
        return;
      }

      if (Notification.permission === 'granted') {
        statusElement.textContent =
          'Browser notifications are enabled. In-app alerts are also active.';
        enableButton.textContent = '🔔 Browser Notifications Enabled';
        enableButton.style.background = '#35a16b';
      } else if (Notification.permission === 'denied') {
        statusElement.textContent =
          'Notifications are blocked in site settings. In-app alerts will display while this page is open.';
        enableButton.textContent = '🔕 Notifications Blocked in Browser';
        enableButton.style.background = '#94a3b8';
      } else {
        statusElement.textContent =
          'Click Enable Browser Notifications and allow permission. (In-app alerts are active).';
        enableButton.textContent = '🔔 Enable Browser Notifications';
        enableButton.style.background = '#3182ce';
      }
    }

    enableButton.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        updateNotificationStatus();
        return;
      }

      if (Notification.permission === 'denied') {
        alert(
          'Notifications are blocked in your browser site settings.\\n\\n' +
          'To enable desktop alerts:\\n' +
          '1. Click the site settings icon (padlock or tune) on the left of http://localhost:5000 in your address bar.\\n' +
          '2. Change Notifications to "Allow".\\n' +
          '3. Reload this page.'
        );
        return;
      }

      try {
        const result = await Notification.requestPermission();
        updateNotificationStatus();

        if (result === 'granted') {
          try {
            new Notification('⏰ Task & Reminder Manager', {
              body: 'Browser notifications are now working!',
              tag: 'permission_test'
            });
          } catch (e) {
            console.warn('Test notification note:', e);
          }
        }
        await checkReminders();
      } catch (error) {
        console.error('Notification permission error:', error);
      }
    });

    // ==========================================
    // 7. GET COMPUTER'S LOCAL DATE AND TIME
    // ==========================================
    function getLocalDateTime() {
      const now = new Date();

      const date =
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');

      const time =
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

      return { date, time };
    }

    // ==========================================
    // 8. AUDIO CHIME AND IN-APP TOAST ALERTS
    // ==========================================
    function playReminderChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        // Audio might be constrained before user gesture; non-fatal
      }
    }

    function showDesktopNotification(item, key) {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return false;
      }

      try {
        const notification = new Notification('⏰ TASK REMINDER', {
          body: item.task + (item.reminderTime ? ' (' + item.reminderTime + ')' : ''),
          tag: key,
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return true;
      } catch (notificationError) {
        console.error('Desktop notification could not be shown:', notificationError);
        return false;
      }
    }

    function showInAppToast(item, key) {
      if (!toastContainer) return;

      const toast = document.createElement('div');
      toast.className = 'reminder-toast';
      toast.setAttribute('role', 'alert');

      const header = document.createElement('div');
      header.className = 'reminder-toast-header';
      header.textContent = '⏰ Task Reminder';

      const body = document.createElement('div');
      body.className = 'reminder-toast-body';
      body.textContent = item.task;

      const timeInfo = document.createElement('div');
      timeInfo.className = 'reminder-toast-time';
      const timeStr = item.reminderTime || '';
      const dateStr = item.reminderDate || 'Daily';
      timeInfo.textContent = 'Scheduled: ' + dateStr + ' at ' + timeStr;

      const actions = document.createElement('div');
      actions.className = 'reminder-toast-actions';

      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'toast-dismiss-btn';
      dismissBtn.type = 'button';
      dismissBtn.textContent = 'Dismiss';

      dismissBtn.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.2s ease-out';
        setTimeout(() => toast.remove(), 200);
      };

      actions.appendChild(dismissBtn);

      toast.appendChild(header);
      toast.appendChild(body);
      toast.appendChild(timeInfo);
      toast.appendChild(actions);

      toastContainer.appendChild(toast);

      // Auto dismiss after 60 seconds if untouched
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 60000);
    }

    // ==========================================
    // 9. CHECK REMINDERS & ACKNOWLEDGE DELIVERY
    // ==========================================
    let checking = false;
    const shownNotifications = new Set();

    async function checkReminders() {
      if (checking) return;

      checking = true;

      try {
        const { date, time } = getLocalDateTime();

        const url =
          '/api/check-reminders?date=' +
          encodeURIComponent(date) +
          '&time=' +
          encodeURIComponent(time);

        const response = await fetch(url, {
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Reminder API error:', errorText);
          clockStatus.textContent =
            'Check failed at ' + new Date().toLocaleTimeString() + ' (Server error, retrying...)';
          clockStatus.style.color = '#e53e3e';
          return;
        }

        const reminders = await response.json();

        clockStatus.textContent =
          'Last checked: ' + new Date().toLocaleTimeString();
        clockStatus.style.color = '#64748b';

        for (const item of reminders) {
          const key = item._id + '_' + item.occurrenceKey;

          if (shownNotifications.has(key)) continue;

          // Prevent duplicate display in this browser session
          shownNotifications.add(key);

          console.log(
            'REMINDER DUE:',
            item.task,
            item.occurrenceKey
          );

          // Trigger audible chime, desktop notification and in-app toast
          playReminderChime();
          showDesktopNotification(item, key);
          showInAppToast(item, key);

          // Acknowledge delivery to server so it is recorded in MongoDB
          try {
            await fetch('/api/acknowledge-reminder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: item._id,
                occurrenceKey: item.occurrenceKey
              })
            });
          } catch (ackError) {
            console.error('Failed to acknowledge reminder delivery:', ackError);
          }
        }
      } catch (error) {
        console.error('Reminder check failed:', error);
        clockStatus.textContent =
          'Check failed at ' + new Date().toLocaleTimeString() + ' (Network error, retrying...)';
        clockStatus.style.color = '#e53e3e';
      } finally {
        checking = false;
      }
    }

    updateNotificationStatus();

    // Check immediately, then every five seconds.
    checkReminders();
    setInterval(checkReminders, 5000);

    // Check again when the user returns to the tab.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkReminders();
      }
    });

    window.addEventListener('focus', checkReminders);

    // ==========================================
    // 10. PREVENT REMINDERS FOR PAST DATE / TIME
    // ==========================================
    const dateInput = document.getElementById('reminderDate');
    const timeInput = document.getElementById('reminderTime');
    const clientDateInput = document.getElementById('clientDate');
    const clientTimeInput = document.getElementById('clientTime');
    const taskForm = document.querySelector('.form-card form');

    function syncDateMin() {
      const { date: todayDate, time: todayTime } = getLocalDateTime();
      if (dateInput) {
        dateInput.min = todayDate;
      }
      if (clientDateInput) clientDateInput.value = todayDate;
      if (clientTimeInput) clientTimeInput.value = todayTime;
    }

    syncDateMin();

    if (taskForm) {
      taskForm.addEventListener('submit', (e) => {
        syncDateMin();
        const selectedDate = dateInput ? dateInput.value.trim() : '';
        const selectedTime = timeInput ? timeInput.value.trim() : '';
        const { date: todayDate, time: todayTime } = getLocalDateTime();

        if (selectedDate) {
          if (selectedDate < todayDate) {
            e.preventDefault();
            alert('Cannot set a reminder for a past date (' + selectedDate + '). Please select today or a future date.');
            return;
          }
          if (selectedDate === todayDate && selectedTime && selectedTime < todayTime) {
            e.preventDefault();
            alert('Cannot set a reminder for a past time today (' + selectedTime + '). Current time is ' + todayTime + '. Please select a future time.');
            return;
          }
        }
      });
    }
  </script>
</body>
</html>`);
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).send('Could not load tasks.');
  }
});

// ==========================================
// 9. ADD TASK
// ==========================================
app.post('/add-task', async (req, res) => {
  try {
    const task = String(req.body.task || '').trim();
    const reminderDate = String(req.body.reminderDate || '').trim();
    const reminderTime = String(req.body.reminderTime || '').trim();

    if (!task || task.length > 300) {
      return res.status(400).send('Please enter a valid task.');
    }

    let normalizedDate = '';

    if (reminderDate) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(reminderDate)) {
        normalizedDate = reminderDate;
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(reminderDate)) {
        const [day, month, year] = reminderDate.split('-');
        normalizedDate = `${year}-${month}-${day}`;
      } else {
        return res.status(400).send(
          'Invalid reminder date: ' + reminderDate
        );
      }

      const [year, month, day] =
        normalizedDate.split('-').map(Number);

      const checkDate = new Date(year, month - 1, day);

      if (
        checkDate.getFullYear() !== year ||
        checkDate.getMonth() !== month - 1 ||
        checkDate.getDate() !== day
      ) {
        return res.status(400).send('Invalid calendar date.');
      }
    }

    if (
      reminderTime &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)
    ) {
      return res.status(400).send('Invalid reminder time.');
    }

    if (normalizedDate && !reminderTime) {
      return res.status(400).send(
        'Please select a time for the selected date.'
      );
    }

    // Validate that dated reminders are not set for past date or past time
    if (normalizedDate) {
      const clientDate = String(req.body.clientDate || '').trim();
      const clientTime = String(req.body.clientTime || '').trim();

      const now = new Date();
      const currentDate = (/^\d{4}-\d{2}-\d{2}$/.test(clientDate))
        ? clientDate
        : (now.getFullYear() + '-' +
           String(now.getMonth() + 1).padStart(2, '0') + '-' +
           String(now.getDate()).padStart(2, '0'));

      const currentTime = (/^([01]\d|2[0-3]):[0-5]\d$/.test(clientTime))
        ? clientTime
        : (String(now.getHours()).padStart(2, '0') + ':' +
           String(now.getMinutes()).padStart(2, '0'));

      if (normalizedDate < currentDate) {
        return res.status(400).send(
          'Cannot set a reminder for a past date: ' + normalizedDate + '. Please select today or a future date.'
        );
      }

      if (normalizedDate === currentDate && reminderTime && reminderTime < currentTime) {
        return res.status(400).send(
          'Cannot set a reminder for a past time today (' + reminderTime + '). Current time is ' + currentTime + '. Please select a future time.'
        );
      }
    }

    await Todo.create({
      task,
      reminderDate: normalizedDate,
      reminderTime
    });

    res.redirect('/');
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).send('Could not save task: ' + error.message);
  }
});

// ==========================================
// 10. REAL-TIME REMINDER API
// ==========================================
app.get('/api/check-reminders', async (req, res) => {
  try {
    const date = String(req.query.date || '');
    const time = String(req.query.time || '');

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
      return res.status(400).json({
        error: 'Invalid local date or time',
        receivedDate: date,
        receivedTime: time
      });
    }

    const tasks = await Todo.find({
      isCompleted: false,
      reminderTime: { $nin: ['', null] },
      $or: [
        { reminderDate: date },
        { reminderDate: '' },
        { reminderDate: null },
        { reminderDate: { $exists: false } }
      ]
    });

    const reminders = [];

    for (const task of tasks) {
      // Do not fire before the scheduled time.
      if (task.reminderTime > time) continue;

      // One reminder per task per day.
      const occurrenceKey = `${date}_${task.reminderTime}`;

      if (task.lastNotifiedFor === occurrenceKey) continue;

      // If client requests autoAck (e.g. for scripted queries), mark it.
      // Otherwise browser acknowledges via /api/acknowledge-reminder upon receipt.
      if (req.query.autoAck === 'true') {
        task.lastNotifiedFor = occurrenceKey;
        await task.save();
      }

      reminders.push({
        _id: task._id.toString(),
        task: task.task,
        reminderDate: task.reminderDate || '',
        reminderTime: task.reminderTime,
        occurrenceKey
      });
    }

    res.set('Cache-Control', 'no-store');
    res.json(reminders);
  } catch (error) {
    console.error('Reminder API error:', error);
    res.status(500).json({
      error: 'Could not check reminders.'
    });
  }
});

// ==========================================
// 11. ACKNOWLEDGE REMINDER DELIVERY
// ==========================================
app.post('/api/acknowledge-reminder', async (req, res) => {
  try {
    const { id, occurrenceKey } = req.body || {};

    if (!id || !occurrenceKey) {
      return res.status(400).json({
        error: 'Missing task id or occurrenceKey'
      });
    }

    const task = await Todo.findById(id);
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }

    task.lastNotifiedFor = occurrenceKey;
    await task.save();

    res.json({ success: true, id, occurrenceKey });
  } catch (error) {
    console.error('Acknowledge reminder error:', error);
    res.status(500).json({
      error: 'Could not acknowledge reminder.'
    });
  }
});

// ==========================================
// 12. COMPLETE OR UNDO TASK
// ==========================================
app.post('/toggle-task/:id', async (req, res) => {
  try {
    const task = await Todo.findById(req.params.id);

    if (!task) {
      return res.status(404).send('Task not found.');
    }

    task.isCompleted = !task.isCompleted;
    await task.save();

    res.redirect('/');
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(400).send('Could not update task.');
  }
});

// ==========================================
// 13. DELETE TASK
// ==========================================
app.post('/delete-task/:id', async (req, res) => {
  try {
    const task = await Todo.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).send('Task not found.');
    }

    res.redirect('/');
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(400).send('Could not delete task.');
  }
});

// ==========================================
// 14. START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log('===================================');
  console.log('Task & Reminder Manager is running!');
  console.log('Open http://localhost:' + PORT);
  console.log('===================================');
});
