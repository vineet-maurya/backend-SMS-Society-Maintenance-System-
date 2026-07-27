const Resident = require('../models/Resident.model');
const Settings = require('../models/Settings.model');

/**
 * Checks whether the calendar month has advanced since the last recorded
 * rollover, and if so:
 *   - residents who were 'paid' become 'pending' for the new month
 *   - residents who were 'pending' or 'overdue' become 'overdue'
 *   - lastPaymentId is cleared so the new month starts with a clean ledger
 *
 * Returns { rolledOver: boolean, month: string }
 */
const checkAndRolloverMonth = async () => {
  const systemMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"

  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) {
    settings = await Settings.create({ key: 'main', currentMonth: systemMonth });
    return { rolledOver: false, month: systemMonth };
  }

  if (settings.currentMonth === systemMonth) {
    return { rolledOver: false, month: systemMonth };
  }

  // Snapshot ids by current status BEFORE mutating, so a resident that was
  // 'paid' (-> becomes 'pending') is never also caught by the
  // pending/overdue (-> 'overdue') transition below.
  const paidIds = (await Resident.find({ status: 'paid' }, '_id')).map((r) => r._id);
  const dueIds = (await Resident.find({ status: { $in: ['pending', 'overdue'] } }, '_id')).map(
    (r) => r._id
  );

  if (paidIds.length) {
    await Resident.updateMany(
      { _id: { $in: paidIds } },
      { $set: { status: 'pending', lastPaymentId: null } }
    );
  }
  if (dueIds.length) {
    await Resident.updateMany(
      { _id: { $in: dueIds } },
      { $set: { status: 'overdue', lastPaymentId: null } }
    );
  }

  settings.currentMonth = systemMonth;
  await settings.save();

  return { rolledOver: true, month: systemMonth };
};

module.exports = { checkAndRolloverMonth };
