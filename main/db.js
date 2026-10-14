const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'pay_repay.db');

const db = new Database(dbPath);

// Create the transactions table if it doesn't exist
db.exec(`
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    payeur TEXT NOT NULL,
    beneficiaire TEXT NOT NULL,
    montant REAL NOT NULL,
    description TEXT
)
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
`);

function getAllTransactions() {
    const stmt = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC');
    return stmt.all();
}

function addTransaction({date, payeur, beneficiaire, montant, description}) {
    const stmt = db.prepare(`
    INSERT INTO transactions (date, payeur, beneficiaire, montant, description)
    VALUES (@date, @payeur, @beneficiaire, @montant, @description)
    `);
    const info = stmt.run({date, payeur, beneficiaire, montant, description});
    return info.lastInsertRowid;
}

function deleteTransaction(id) {
    const stmt = db.prepare(`
        DELETE FROM transactions WHERE id = ?
    `);
    const info = stmt.run(id);
    return info.changes; // Return the number of rows deleted
}

function deleteAllTransactions() {
    db.exec(`
        DELETE FROM transactions
    `);
}

function getSetting(key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
}

// Value: will be the month when the database was last reset
function setSetting(key, value) {
    db.prepare(`
        INSERT INTO settings (key, value) VALUES (@key, @value)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run({key, value});
    }



module.exports = {
    getAllTransactions,
    addTransaction,
    deleteTransaction,
    deleteAllTransactions,
    getSetting,
    setSetting
};

