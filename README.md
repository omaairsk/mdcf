Medical Pharmacy - Financial Management System

A professional, Excel-inspired web application designed specifically for pharmacies to track daily revenue, sales, expenses, and net profit. Built with React and powered by Firebase for real-time persistent storage.

✨ Key Features

Daily Ledger: Track 7 key financial columns: Sales, Expenses, Refunds, Dues, and Bank Deposits.

Automatic Calculations: Instant calculation of Cash in Hand and Daily Profit/Loss.

Reporting Dashboard: High-level summary cards showing total financial health at a glance.

Monthly & Yearly Summaries: Aggregated reports that automatically group data by month and year.

Dual-Layer Security:

General User Access: Daily entry and viewing.

Super Admin Panel: Restricted access to system settings and data deletion.

Export Options: Export your ledger to Excel (CSV) or generate a print-ready PDF.

Persistent Storage: Data is saved to a cloud database (Firestore), ensuring it survives page refreshes and device changes.

Localized for India: All currency values are formatted in INR (₹).

🚀 Tech Stack

Frontend: React.js

Styling: Tailwind CSS

Icons: Lucide React

Backend/Database: Firebase Authentication & Firestore

🔐 Private Credentials (NOT FOR PUBLIC USE)

[!CAUTION]
PRIVATE USE ONLY: Access credentials for this system are strictly confidential and stored securely. Do not share credentials or expose them in public repositories. Contact the system administrator for access.

🛠️ Installation & Setup

Clone the repository:

git clone [https://github.com/your-username/medical-pharmacy-tracker.git](https://github.com/your-username/medical-pharmacy-tracker.git)
cd medical-pharmacy-tracker


Install dependencies:

npm install


Configure Firebase:
Replace the firebaseConfig object in the source code with your own Firebase project credentials.

Run the application:

npm start


📊 Business Logic

Cash in Hand: Sales - Expenses - Refunds - Dues - Bank Deposit

Daily P/L: Sales - Expenses

📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.