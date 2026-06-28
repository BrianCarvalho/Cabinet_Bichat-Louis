const header = document.querySelector("[data-header]");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

function syncHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

toggle.addEventListener("click", () => {
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!isOpen));
  nav.classList.toggle("is-open", !isOpen);
  header.classList.toggle("is-open", !isOpen);
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
  }
});

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });
