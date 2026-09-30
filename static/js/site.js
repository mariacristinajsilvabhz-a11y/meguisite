(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("open", !isOpen);
    });
  }

  const search = document.querySelector("#catalog-search");
  const grid = document.querySelector("#product-grid");
  const empty = document.querySelector("#empty-search");

  if (search && grid) {
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;

      grid.querySelectorAll(":scope > [data-search]").forEach((item) => {
        const match = item.dataset.search.includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });

      if (empty) empty.hidden = visible !== 0;
    });
  }

  document.querySelectorAll(".mini-quote.is-added").forEach((button) => {
    button.setAttribute("title", "Este produto já está no orçamento. Clique para manter/atualizar.");
  });
})();