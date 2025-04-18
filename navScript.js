document.querySelectorAll('.dropdown-toggle').forEach(button => {
button.addEventListener('click', () => {
    const dropdown = button.parentElement;
    dropdown.classList.toggle('open');

    // Cierra los otros menús abiertos
    document.querySelectorAll('.dropdown').forEach(other => {
    if (other !== dropdown) {
        other.classList.remove('open');
    }
    });
});
});

// Cierra los menús si se hace clic afuera
document.addEventListener('click', (e) => {
if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown').forEach(drop => drop.classList.remove('open'));
}
});
