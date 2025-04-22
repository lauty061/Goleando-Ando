// Dropdown en nav (modo escritorio)
document.querySelectorAll('.dropdown-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const dropdown = button.parentElement;
        dropdown.classList.toggle('open');

        document.querySelectorAll('.dropdown').forEach(other => {
            if (other !== dropdown) {
                other.classList.remove('open');
            }
        });
    });
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(drop => drop.classList.remove('open'));
    }
});

// Sidebar en móviles
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('close-sidebar');

hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});
closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

document.querySelectorAll('.sidebar-dropdown > button').forEach(btn => {
    btn.addEventListener('click', () => {
        const parent = btn.parentElement;
        parent.classList.toggle('open');

        document.querySelectorAll('.sidebar-dropdown').forEach(other => {
            if (other !== parent) other.classList.remove('open');
        });
    });
});
