const cron = require('node-cron');
const RentPayment = require('../models/RentPayment');

// Runs every day at 8:00 AM server time.
// Marks any 'pending' payment whose dueDate has passed as 'overdue'.
// (Actual reminder dispatch - email/SMS - hooks in here once a provider like
// Nodemailer/Twilio/WhatsApp Business API is wired up.)
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date();
      const result = await RentPayment.updateMany(
        { status: 'pending', dueDate: { $lt: today } },
        { status: 'overdue' }
      );
      if (result.modifiedCount > 0) {
        console.log(`[rentReminderJob] Flagged ${result.modifiedCount} payments as overdue`);
      }
      // TODO: fetch newly-overdue payments and dispatch reminder notifications
    } catch (err) {
      console.error('[rentReminderJob] failed:', err.message);
    }
  });
}
