let display = document.getElementById('display');
let buttons = document.querySelectorAll('#buttons button');
let premiumButton = document.getElementById('premium');
let currentInput = '';
let expression = '';
let lastButtonWasEqual = false;
let lastResult = ''; // Variabile per memorizzare il risultato dell'ultima operazione
let isManualInput = false; // Variabile per tenere traccia dell'input manuale
let premiumUnlocked = false; // Variabile per tenere traccia se la feature premium è sbloccata

// Configura Stripe
const stripe = Stripe('YOUR_PUBLIC_STRIPE_KEY'); // Sostituisci con la tua chiave pubblica di Stripe

buttons.forEach(button => {
    button.addEventListener('click', () => {
        isManualInput = false; // L'input non è manuale
        handleInput(button.textContent);
    });
});

display.addEventListener('input', () => {
    if (!isManualInput) {
        isManualInput = true; // L'input è manuale
        return;
    }
    expression = display.value.replace(/÷/g, '/'); // Replace '÷' with '/' for evaluation
    currentInput = display.value; // Aggiorna currentInput con il valore dell'input
});

premiumButton.addEventListener('click', () => {
    if (premiumUnlocked) {
        alert('Feature premium già sbloccata!');
    } else {
        handlePremiumPayment();
    }
});

function handleInput(value) {
    switch (value) {
        case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': case '.':
            if (lastButtonWasEqual) {
                expression = '';
                lastButtonWasEqual = false;
            }
            currentInput += value;
            expression += value;
            display.value = expression.replace(/\//g, '÷'); // Replace '/' with '÷' for display
            display.style.color = 'black'; // Reset display color
            break;
        case '+': case '-': case '*': case '/':
            if (lastButtonWasEqual) {
                expression = lastResult + ` ${value} `;
                lastButtonWasEqual = false;
            } else if (currentInput !== '' || expression.endsWith(')')) {
                expression += ` ${value} `;
            }
            display.value = expression.replace(/\//g, '÷'); // Replace '/' with '÷' for display
            currentInput = '';
            break;
        case '(':
        case ')':
            expression += value;
            display.value = expression.replace(/\//g, '÷'); // Replace '/' with '÷' for display
            break;
        case 'Enter':
        case '=':
            if (currentInput !== '' || expression.includes('(') || expression.includes(')')) {
                try {
                    let evalExpression = expression.replace(/Ans/g, lastResult); // Sostituisci 'Ans' con lastResult
                    let result = eval(evalExpression);
                    display.value = toFraction(result);
                    display.style.color = 'black'; // Reset display color
                    lastResult = result.toString(); // Memorizza il risultato
                    expression = result.toString();
                    currentInput = '';
                    lastButtonWasEqual = true;
                } catch (error) {
                    display.value = "Err :("; 
                    display.style.color = 'red'; // Set display color to red for errors
                    expression = '';
                    currentInput = '';
                }
            }
            break;
        case 'Escape':
        case 'C':
            currentInput = '';
            expression = '';
            display.value = '';
            display.style.color = 'black'; // Reset display color
            lastButtonWasEqual = false;
            break;
        case 'Backspace':
            if (expression.length > 0) {
                expression = expression.slice(0, -1);
                display.value = expression.replace(/\//g, '÷'); // Replace '/' with '÷' for display
            }
            break;
        case 'Ans':
            if (lastResult !== '') {
                if (lastButtonWasEqual) {
                    expression = 'Ans';
                    display.value = expression.replace(/\//g, '÷'); // Replace '/' with '÷' for display
                    lastButtonWasEqual = false;
                } else {
                    expression += 'Ans';
                    display.value = expression.replace(/\//g, '÷'); // Replace '/' with '÷' for display
                    currentInput = lastResult;
                }
            }
            break;
        default:
            break;
    }
}

function toFraction(decimal) {
    if (decimal % 1 === 0) return decimal.toString(); // Se è un numero intero, restituisci il numero come stringa
    let gcd = function(a, b) {
        if (!b) return a;
        return gcd(b, a % b);
    };
    let len = decimal.toString().length - 2;
    let denominator = Math.pow(10, len);
    let numerator = decimal * denominator;
    let divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
    return Math.floor(numerator) + '/' + Math.floor(denominator);
}

function handlePremiumPayment() {
    // Crea un checkout session con Stripe
    fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            items: [{ id: 'premium-feature' }],
        }),
    })
    .then(response => response.json())
    .then(session => {
        return stripe.redirectToCheckout({ sessionId: session.id });
    })
    .then(result => {
        if (result.error) {
            alert(result.error.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}