let transactions = [];
let selectedTransactionId = null; // Variable to store the selected transaction ID

const form = document.getElementById('expenses-form');
const deleteAllButton = document.getElementById('delete-all-button');
const deleteOneButton = document.getElementById('delete-one-button');
const submitButton = document.getElementById('submit-button')




// Function to compute the balance between "Elle" and "Lui"
function computeBalance() {
    let elleDoitALui = 0;
    let luiDoitAElle = 0;

    transactions.forEach(transaction => {
        if (transaction.payeur === 'Elle') {
            if (transaction.beneficiaire === 'Lui') {
                luiDoitAElle += transaction.montant;
            }
            else if (transaction.beneficiaire === 'Nous') {
                luiDoitAElle += transaction.montant/2;
            }
        } else if (transaction.payeur === 'Lui') {
            if (transaction.beneficiaire === 'Elle') {
                elleDoitALui += transaction.montant;
            }
            else if (transaction.beneficiaire === 'Nous') {
                elleDoitALui += transaction.montant/2;
            }
        }
    });

   return luiDoitAElle - elleDoitALui;
}


// Function to format the amount as a string with two decimal places and a € symbol
function formatMoney(amount) {
    return amount.toFixed(2).replace('.', ',') + ' €';
}


// Function that considers an expression and return the result
function evaluateAmount(expression){

    expression = expression.replace(',', '.'); // Replace comma with dot for decimal point

    const isSafe = /^[0-9+\-*/.() ]+$/.test(expression);
    if (!isSafe) {
        return NaN; // Return NaN for unsafe expressions
    }

    try {
        const result = Function(`"use strict"; return (${expression});`)();
        return typeof result === 'number' && isFinite(result) ? result : NaN;
        } catch (error) {
    return NaN; // Expression not written correctly, e.g. "12++" ou "12/"
  }

}


// Function to render the Summary part
function renderSummary(){
    const balance = computeBalance(transactions);
    summary_text = document.getElementById('balance-summary-text');
    if (balance > 0) {
        summary_text.textContent = `Il doit ${formatMoney(balance)} à Elle`;
    } else if (balance < 0) {
        summary_text.textContent = `Elle doit ${formatMoney(-balance)} à Lui`;
    } else {
        summary_text.textContent = 'Les soldes sont équilibrés !';
    }
}


// Function to render the Form
function renderForm(){
    let payerSelect = document.getElementById('payeur');
    let beneficiarySelect = document.getElementById('beneficiaire');

    if (payerSelect.value === 'Elle') {
        // Remove 'Elle' from the beneficiary options
        beneficiarySelect.innerHTML = `
            <option value = "Lui">Lui</option>
            <option value = "Nous">Nous</option>
        `;
    } else if (payerSelect.value === 'Lui') {
        // Remove 'Lui' from the beneficiary options
        beneficiarySelect.innerHTML = `
            <option value = "Elle">Elle</option>
            <option value = "Nous">Nous</option>
        `;
    }
}


// Function to render the expenses table (history)
function renderExpensesTable() {
    const tableBody = document.getElementById('expenses-table-body');
    tableBody.innerHTML = ''; // Clear existing rows

    selectedTransactionId = null; // Reset the selected transaction ID when re-rendering the table
    deleteOneButton.classList.add('hidden'); // Hide the delete button

    transactions.forEach((transaction) => {
        const row = document.createElement('tr');
        row.dataset.id = transaction.id; // Store the transaction ID in a data attribute

        const values = [
            transaction.date, 
            transaction.payeur, 
            transaction.beneficiaire, 
            formatMoney(transaction.montant), 
            transaction.description
        ];
    
        values.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            if (value === transaction.date) {
                const [year, month, day] = value.split('-');
                cell.textContent = `${day}/${month}/${year}`; // Format date as DD/MM/YYYY
            }
            row.appendChild(cell);
        });

        row.addEventListener('click', () => selectRow(transaction.id, row)); // Add click event listener to select the row

        tableBody.appendChild(row); // Add new rows at the top of the table

        selectedTransactionId = null;
        deleteOneButton.classList.add('hidden');
    });
}


// Function to delete all the expenses within the table
async function deleteAllExpenses() {
        try {
            await window.api.deleteAllDepenses();
            transactions = [];
            loadExpensesFromDatabase();
        } catch (error) {
            console.error('Error deleting all expenses:', error);
        }   
    
}

async function resetDatabaseEachMonth(){
    const today = new Date();
    if (today.getDate() !== 1) {
        return; // Not the first day of the month, exit the function

    } else {
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`; // Format: YYYY-MM (padStart: ensures two digits for the month)
        try {
            const lastResetMonth = await window.api.getSetting('lastResetMonth');
            if (lastResetMonth === currentMonth){
                return; // Database has already been reset this month, exit the function
            }
            else {
                const balance = computeBalance();
                await window.api.deleteAllDepenses();

                if (Math.abs(balance) > 0.005) { // Only add a new transaction if the balance is significant
                    const lastDayOfPreviousMonth = new Date(today);
                    lastDayOfPreviousMonth.setDate(0); // Set to the last day of the previous month (1: first day of the current month, then subtract one day)
                    const previousMonthLabel = lastDayOfPreviousMonth.toLocaleDateString('fr-FR', 
                        { month: 'long', year: 'numeric' }); // e.g., "février 2024"
                    
                    const payeur = balance > 0 ? 'Elle' : 'Lui';
                    const beneficiaire = balance > 0 ? 'Lui' : 'Elle';
                    const montant = Math.round(Math.abs(balance) * 100) / 100; // Round to two decimal places
                    const description = `Solde du mois de ${previousMonthLabel}`;
                    const date = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

                    await window.api.addDepense({ date, payeur, beneficiaire, montant, description });
                    }
                await window.api.setSetting('lastResetMonth', currentMonth); // Update the last reset month in the settings
                await loadExpensesFromDatabase(); // Reload expenses from the database after resetting
            }
        } catch (error) {
            console.error('Error resetting the database at the beginning of the month:', error);
        }
}
}

// Function to select a row within the table
function selectRow(transactionId, rowElement) {
    const alreadySelectedRow = rowElement.classList.contains('selected-row');
    document.querySelectorAll('#expenses-table-body tr').forEach(row => {
        row.classList.remove('selected-row'); // Remove the highlight from all rows
    });

    if (alreadySelectedRow) {
        selectedTransactionId = null; // Deselect the transaction
        deleteOneButton.classList.add('hidden'); // Hide the delete button
    } else {
        rowElement.classList.add('selected-row'); // Highlight the selected row
        selectedTransactionId = transactionId; // Store the selected transaction ID
        deleteOneButton.classList.remove('hidden'); // Show the delete button
    }
}


// Function to load the expenses from the database
async function loadExpensesFromDatabase() {
    try {
        transactions = await window.api.getDepenses();
        renderExpensesTable();
        renderSummary();
    } catch (error) {
        console.error('Error loading expenses from database:', error);
    }   
}


// Listener for the "delete" button
deleteOneButton.addEventListener('click', async () => {
    if (selectedTransactionId === null) {
        return; // No transaction selected, do nothing
    }
    try {
        await window.api.deleteDepense(selectedTransactionId);
        await loadExpensesFromDatabase(); // Reload expenses from the database
    } catch (error) {
        console.error('Error deleting the selected expense:', error);
    }
});


// Add event listener for form submission
form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const payeur = document.getElementById('payeur').value;
    const beneficiaire = document.getElementById('beneficiaire').value;
    const montant_input = document.getElementById('montant');
    const montant = montant_input.value.trim();
    const evaluatedAmount = evaluateAmount(montant);
    const description = document.getElementById('description').value.trim();
    

    if (isNaN(evaluatedAmount)) {
        // alert("Veuillez entrer un montant valide pour la dépense.");
        return;
    }

    const date = document.getElementById('date').value;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    if (date > today) {
        // alert("La date de la dépense ne peut pas être dans le futur.");
        return;
    }
    await window.api.addDepense({ date, payeur: payeur, beneficiaire: beneficiaire, montant: evaluatedAmount, description });
    await loadExpensesFromDatabase(); // Reload expenses from the database  

    montant_input.value = ''; // Clear the amount input field

    });



document.getElementById('payeur').addEventListener('change', renderForm);
renderForm();

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').value =
        new Date().toISOString().split('T')[0];
});

deleteAllButton.addEventListener('click', deleteAllExpenses);

async function initializeApp() {
    // Initial rendering of the summary and expenses table
    await loadExpensesFromDatabase(); // Load expenses from the database on initial load (await: ensures that the expenses are loaded before proceeding)
    await resetDatabaseEachMonth(); // Reset the database at the beginning of each month (await: ensures that the reset is completed before proceeding)
}

initializeApp();
