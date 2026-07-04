"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const storeId = '5981f6aa-23ee-4acf-bd1d-8ceb2a92ea0c';
    const staffId = 'de283b71-1972-47b7-996f-6633d0f7b7f5';
    console.log('--- Seeding HR and Financials ---');
    await prisma.storeExpense.deleteMany({ where: { storeId } });
    await prisma.storeExpense.createMany({
        data: [
            { storeId, type: client_1.ExpenseType.RENT, amount: 25000, date: new Date('2026-06-01T10:00:00Z'), notes: 'June Rent' },
            { storeId, type: client_1.ExpenseType.MAINTENANCE, amount: 1500, date: new Date('2026-06-15T12:00:00Z'), notes: 'AC Repair' },
            { storeId, type: client_1.ExpenseType.UTILITIES, amount: 4500, date: new Date('2026-06-20T10:00:00Z'), notes: 'Electricity Bill' },
            { storeId, type: client_1.ExpenseType.MISCELLANEOUS, amount: 500, date: new Date('2026-07-01T10:00:00Z'), notes: 'Cleaning supplies' },
        ]
    });
    console.log('✅ Seeded Expenses');
    await prisma.timesheet.deleteMany({ where: { storeId } });
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const activeClockIn = new Date(today);
    const yesterdayIn = new Date(today);
    yesterdayIn.setDate(yesterdayIn.getDate() - 1);
    const yesterdayOut = new Date(yesterdayIn);
    yesterdayOut.setHours(17, 0, 0, 0);
    const dayBeforeIn = new Date(today);
    dayBeforeIn.setDate(dayBeforeIn.getDate() - 2);
    const dayBeforeOut = new Date(dayBeforeIn);
    dayBeforeOut.setHours(18, 0, 0, 0);
    await prisma.timesheet.createMany({
        data: [
            { storeId, staffId, clockIn: dayBeforeIn, clockOut: dayBeforeOut, status: client_1.TimesheetStatus.COMPLETED },
            { storeId, staffId, clockIn: yesterdayIn, clockOut: yesterdayOut, status: client_1.TimesheetStatus.COMPLETED },
            { storeId, staffId, clockIn: activeClockIn, clockOut: null, status: client_1.TimesheetStatus.ACTIVE },
        ]
    });
    console.log('✅ Seeded Timesheets');
    await prisma.wageSlip.deleteMany({ where: { storeId } });
    await prisma.wageSlip.create({
        data: {
            storeId,
            staffId,
            month: '2026-06',
            totalHours: 160,
            hourlyRate: 150,
            totalAmount: 160 * 150,
            status: client_1.WageSlipStatus.PAID
        }
    });
    console.log('✅ Seeded Wage Slips');
    console.log('--- HR Seeding Complete ---');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed_hr.js.map