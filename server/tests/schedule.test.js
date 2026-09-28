const { generateMonthlySchedule } = require('../utils/schedule');

describe('generateMonthlySchedule', () => {
  it('clamps rentDueDay to month end without rollover', () => {
    const schedule = generateMonthlySchedule({
      startDate: '2024-01-01',
      endDate: '2024-05-31',
      rentDueDay: 31,
      agreementId: '507f1f77bcf86cd799439011',
      amount: 10000,
    });

    const days = schedule.map((entry) => new Date(entry.dueDate).getUTCDate());
    const months = schedule.map((entry) => new Date(entry.dueDate).getUTCMonth() + 1);
    expect(days).toEqual([31, 29, 31, 30, 31]);
    expect(months).toEqual([1, 2, 3, 4, 5]);
  });
});
