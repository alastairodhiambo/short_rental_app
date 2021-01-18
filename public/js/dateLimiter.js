// Alastair Odhiambo

const today = new Date().toISOString().substr(0, 10);
document.querySelector('#check-in').min = today;
document.querySelector('#checkout').min = today;
