const clampDayToMonth = (year, monthIndex, day) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, daysInMonth);
};

const generateMonthlySchedule = ({ startDate, endDate, rentDueDay, agreementId, amount }) => {
  const schedule = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let year = start.getUTCFullYear();
  let month = start.getUTCMonth();

  while (new Date(Date.UTC(year, month, 1)) <= end) {
    const clampedDay = clampDayToMonth(year, month, rentDueDay);
    const dueDate = new Date(Date.UTC(year, month, clampedDay));
    if (dueDate >= start && dueDate <= end) {
      schedule.push({ agreementId, dueDate, amount });
    }

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return schedule;
};

module.exports = {
  clampDayToMonth,
  generateMonthlySchedule,
};
