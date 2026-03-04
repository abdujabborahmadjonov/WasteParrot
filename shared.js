/* ═══════════════════════════════════════════════════════
   WasteParrot — Shared JS (included on every page)
   ═══════════════════════════════════════════════════════ */
(function () {
  /* ── Navbar scroll ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const tick = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', tick, { passive: true });
    tick();
  }

  /* ── Hamburger ── */
  const burger  = document.getElementById('hamburger');
  const navList = document.getElementById('nav-links');
  if (burger && navList) {
    burger.addEventListener('click', () => navList.classList.toggle('open'));
    navList.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navList.classList.remove('open'))
    );
  }

  /* ── Active nav link ── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const h = a.getAttribute('href');
    if (h === page || (page === '' && h === 'index.html')) a.classList.add('active');
  });

  /* ── Scroll-reveal ── */
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, idx) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'translateY(0)';
        }, (idx % 4) * 90);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(
    '.step-card,.ai-card,.feature-card,.impact-card,.team-card,.value-card,.service-card,.kf-item,.tl-item,.profile-award,.reveal'
  ).forEach(el => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition= 'opacity .55s ease, transform .55s ease';
    obs.observe(el);
  });
})();
