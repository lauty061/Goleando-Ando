document.addEventListener('DOMContentLoaded', () => {
    let baseUrl = window.location.pathname.includes("/src/pages/") ? "../../" : "./";
    const headerEl = document.getElementById("main-header");

    if (headerEl) {
        fetch(`${baseUrl}src/components/header.html`)
            .then(r => r.text())
            .then(html => {
                headerEl.innerHTML = html.replace(/{{BASE_URL}}/g, baseUrl);
                initNav();
            })
            .catch(err => {
                console.error("Error loading header:", err);
                initNav();
            });
    } else {
        initNav();
    }
});

function initNav() {
    document.querySelectorAll('.dropdown-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const dropdown = button.parentElement;
            const isOpen = dropdown.classList.contains('open');
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
            if (!isOpen) dropdown.classList.add('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
        }
    });

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    if (hamburgerBtn && sidebar && closeSidebarBtn) {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.classList.add('sidebar-overlay');
            document.body.appendChild(overlay);
        }

        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        }

        hamburgerBtn.addEventListener('click', openSidebar);
        closeSidebarBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);     
    }

    document.querySelectorAll('.sidebar-dropdown > button').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.classList.toggle('open');
            document.querySelectorAll('.sidebar-dropdown').forEach(other => {
                if (other !== parent) other.classList.remove('open');
            });
        });
    });

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const hasActive = Array.from(dropdown.querySelectorAll('a')).some(a => {
            const linkPage = a.getAttribute('href').split('/').pop();
            return linkPage === currentPage;
        });
        if (hasActive) {
            dropdown.querySelector('.dropdown-toggle')?.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const fixtureTable = document.getElementById('fixture-table');
    if (!fixtureTable) return;
    new MutationObserver(() => {
        fixtureTable.classList.remove('table-update-anim');
        void fixtureTable.offsetWidth;
        fixtureTable.classList.add('table-update-anim');
    }).observe(fixtureTable, { childList: true });
});

document.addEventListener('mouseover', e => {
    const img = e.target.closest('img.team-logo-mini, img.team-logo, img.player-img, img.piloto-img');
    if (img && img.alt && !img.title) img.title = img.alt;
});
