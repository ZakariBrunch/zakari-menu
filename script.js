const API_URL = "https://script.google.com/macros/s/AKfycby2hz5irpmlYtBPXsTNC4ThCFNBnRq9tLLtNdOPn7XswT_Q7JAuOYouBfAl5DDjPSAWAQ/exec";

let allMenuItems = [];
let basesSucrees = [];
let sides = [];
let currentCategory = "Salé";

fetch(API_URL)
  .then(response => response.json())
  .then(data => {
 allMenuItems = data.menu || [];
basesSucrees = data.basesSucrees || [];
sides = data.sides || [];

renderMenu(currentCategory);
setupTabs();
  })
  .catch(error => {
    console.error("Erreur de chargement :", error);
  });


function setupTabs() {
    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            currentCategory =
                tab.textContent.trim() === "SWEET" ? "Sweet" : "Salé";

            const legend = document.getElementById("menuLegend");

            if (legend) {
                legend.style.display =
                    currentCategory === "Salé" ? "block" : "none";
            }

            renderMenu(currentCategory);
        });
    });
}

function renderMenu(category) {
  const container = document.getElementById("menuContainer");
  container.innerHTML = "";
  if (category === "Sweet") {
  container.appendChild(createBasesSucreesBox());
}

  const items = allMenuItems
    .filter(item => item.Catégorie === category)
    .filter(item => item.Afficher === "Oui")
    .filter(item => item.Disponible === "Oui")
    .sort((a, b) => Number(a.Ordre) - Number(b.Ordre));

  let currentSubCategory = "";

    items.forEach(item => {
        if (item.Sous_catégorie !== currentSubCategory) {
            currentSubCategory = item.Sous_catégorie;

            const title = document.createElement("h2");
            title.className = "section-title";
            title.textContent = currentSubCategory.toUpperCase();
            container.appendChild(title);
        }

        container.appendChild(createMenuItem(item));
    });

    if (category === "Salé") {
        container.appendChild(createSidesBox());
    }
}


function createMenuItem(item) {
  const article = document.createElement("article");
  article.className = "menu-item";

  const badge = item.Badge
    ? `<span class="badge">${formatBadge(item.Badge)}</span>`
    : "";

  const limited = item["Quantité limitée"] === "Oui"
    ? `<span class="limited">Quantité limitée</span>`
    : "";

  article.innerHTML = `
    <div class="item-main">
      ${badge}
      <div>
        <h3>${item.Nom || ""}</h3>
        <p>${item.Description || ""}</p>
        ${item.Note ? `<em>${item.Note}</em>` : ""}
      </div>
    </div>

    <div class="item-side">
      <strong>${item.Prix} €</strong>
      ${limited}
    </div>
  `;

  return article;
}

function formatBadge(value) {
  const badges = {
    "Kids": "K",
    "Fish": "F",
    "Végétarien": "V",
    "New": "N",
    "Coup de coeur": "★",
    "Coup de cœur": "★"
  };

  return badges[value] || value;
}
function createBasesSucreesBox() {
  const box = document.createElement("section");
  box.className = "bases-box";

  const visibleItems = basesSucrees
    .filter(item => item.Afficher === "Oui")
    .sort((a, b) => Number(a.Ordre) - Number(b.Ordre));

  const title = visibleItems.find(item => item.Type === "Titre");
  const options = visibleItems.filter(item => item.Type === "Option");
  const infos = visibleItems.filter(item => item.Type === "Info");

  box.innerHTML = `
    <h2>${title ? title.Contenu : "JE CHOISIS UNE BASE (X2)"}</h2>

    <div class="base-options">
      ${options.map(option => `<span>${option.Contenu}</span>`).join("")}
    </div>

    <div class="base-infos">
      ${infos.map(info => `
        <p>
          ${info.Contenu}
          ${info.Prix ? ` — ${info.Prix} €` : ""}
        </p>
      `).join("")}
    </div>
  `;

  return box;
}
function createSidesBox() {
    const box = document.createElement("section");
    box.className = "sides-box";

    const visibleSides = sides
        .filter(item => item.Nom)
        .sort((a, b) => Number(a.Ordre) - Number(b.Ordre));

    box.innerHTML = `
        <h2>ON THE SIDE</h2>

        <div class="sides-list">
            ${visibleSides.map(side => `
                <div class="side-line">
                    <span>${side.Nom}</span>
                    <strong>+${side.Prix} €</strong>
                </div>
            `).join("")}
        </div>
    `;

    return box;
}