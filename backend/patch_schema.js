const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add to User
schema = schema.replace(/savedAddresses         SavedAddress\[\]/g, "savedAddresses         SavedAddress[]\n  timesheets             Timesheet[]\n  wageSlips              WageSlip[]");

// Add to Store
schema = schema.replace(/customerGroups       CustomerGroup\[\]/g, "customerGroups       CustomerGroup[]\n  expenses             StoreExpense[]\n  timesheets           Timesheet[]\n  wageSlips            WageSlip[]");

fs.writeFileSync('prisma/schema.prisma', schema);
