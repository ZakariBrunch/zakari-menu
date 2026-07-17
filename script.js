const API_URL =
  "https://script.google.com/macros/s/AKfycby2hz5irpmlYtBPXsTNC4ThCFNBnRq9tLLtNdOPn7XswT_Q7JAuOYouBfAl5DDjPSAWAQ/exec";

let allMenuItems = [];
let basesSucrees = [];
let sides = [];

let currentCategory = "Salé";

/*
  On utilise d'abord la préférence déjà choisie par le client.
  Sinon, on détecte la langue de son téléphone ou navigateur.
*/
let currentLanguage =
  localStorage.getItem("zakariLanguage") ||
  (navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en");

const translations = {
  fr: {
    pageTitle: "Carte Zakari",

    intro:
      "Composez votre brunch selon vos envies en associant des créations salées et sucrées.",

    legend:
      "K : Kids (10 €) • V : Végétarien • ❤️ : Coup de cœur",

    savoryTab: "SALÉ",
    sweetTab: "SWEET",

    limited: "Quantité limitée",

    chooseBase: "JE CHOISIS UNE BASE (X2)",
    sidesTitle: "ON THE SIDE"
  },

  en: {
    pageTitle: "Zakari Menu",

    intro:
      "Create your brunch as you wish by pairing  savory creations with  sweet treats.",

    legend:
      "K: Kids version (€10) • V: Vegetarian • ❤️: House favorite",

    savoryTab: "SAVORY",
    sweetTab: "SWEET",

    limited: "Limited availability",

    chooseBase: "CHOOSE YOUR BASE (X2)",
    sidesTitle: "ON THE SIDE"
  }
};


/* =========================================================
   CHARGEMENT DES DONNÉES
========================================================= */

fetch(API_URL)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    return response.json();
  })
  .then(data => {
    allMenuItems = data.menu || [];
    basesSucrees = data.basesSucrees || [];
    sides = data.sides || [];

    setupTabs();
    setupLanguageSwitch();
    updateLanguageInterface();
    renderMenu(currentCategory);
  })
  .catch(error => {
    console.error("Erreur de chargement :", error);

    const container = document.getElementById("menuContainer");

    if (container) {
      container.innerHTML = `
        <p class="loading-error">
          Impossible de charger la carte pour le moment.
        </p>
      `;
    }
  });


/* =========================================================
   LANGUE
========================================================= */

/*
  Cette fonction lit automatiquement :
  - Nom en français
  - Nom EN en anglais

  Même logique pour :
  - Description / Description EN
  - Note / Note EN
  - Contenu / Contenu EN
  - Sous_catégorie / Sous_catégorie EN
*/
function getLocalizedValue(item, fieldName) {
  if (!item) return "";

  if (currentLanguage === "en") {
    const englishField = `${fieldName} EN`;
    const englishValue = item[englishField];

    if (
      englishValue !== undefined &&
      englishValue !== null &&
      String(englishValue).trim() !== ""
    ) {
      return englishValue;
    }
  }

  return item[fieldName] || "";
}


function setupLanguageSwitch() {
  const languageButtons = document.querySelectorAll(".lang");

  languageButtons.forEach(button => {
    button.addEventListener("click", () => {
      currentLanguage = button.dataset.language;

      localStorage.setItem("zakariLanguage", currentLanguage);

      updateLanguageInterface();
      renderMenu(currentCategory);
    });
  });
}


function updateLanguageInterface() {
  document.documentElement.lang = currentLanguage;
  document.title = translations[currentLanguage].pageTitle;

  const introText = document.getElementById("introText");
  const legend = document.getElementById("menuLegend");

  if (introText) {
    introText.textContent = translations[currentLanguage].intro;
  }

  if (legend) {
    legend.textContent = translations[currentLanguage].legend;
  }

  const savoryTab = document.querySelector(
    '.tab[data-category="Salé"]'
  );

  const sweetTab = document.querySelector(
    '.tab[data-category="Sweet"]'
  );

  if (savoryTab) {
    savoryTab.textContent = translations[currentLanguage].savoryTab;
  }

  if (sweetTab) {
    sweetTab.textContent = translations[currentLanguage].sweetTab;
  }

  document.querySelectorAll(".lang").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.language === currentLanguage
    );
  });

  updateLegendVisibility();
}


/* =========================================================
   ONGLETS SALÉ / SWEET
========================================================= */

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      currentCategory = tab.dataset.category;

      updateLegendVisibility();
      renderMenu(currentCategory);
    });
  });
}


function updateLegendVisibility() {
  const legend = document.getElementById("menuLegend");

  if (!legend) return;

  legend.style.display =
    currentCategory === "Salé" ? "block" : "none";
}


/* =========================================================
   AFFICHAGE DU MENU
========================================================= */

function renderMenu(category) {
  const container = document.getElementById("menuContainer");

  if (!container) return;

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
    const subCategory = getLocalizedValue(
      item,
      "Sous_catégorie"
    );

    if (subCategory !== currentSubCategory) {
      currentSubCategory = subCategory;

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


/* =========================================================
   CRÉATION D'UN PLAT
========================================================= */

function createMenuItem(item) {
  const article = document.createElement("article");
  article.className = "menu-item";

  const name = getLocalizedValue(item, "Nom");
  const description = getLocalizedValue(item, "Description");
  const note = getLocalizedValue(item, "Note");

  const badge = item.Badge
    ? `<span class="badge">${formatBadge(item.Badge)}</span>`
    : "";

  const limited =
    item["Quantité limitée"] === "Oui"
      ? `<span class="limited">${translations[currentLanguage].limited}</span>`
      : "";

  article.innerHTML = `
    <div class="item-main">
      ${badge}

      <div>
        <h3>${escapeHtml(name)}</h3>

        ${
          description
            ? `<p>${escapeHtml(description)}</p>`
            : ""
        }

        ${
          note
            ? `<em>${escapeHtml(note)}</em>`
            : ""
        }
      </div>
    </div>

    <div class="item-side">
      <strong>${formatPrice(item.Prix)} €</strong>
      ${limited}
    </div>
  `;

  return article;
}


/* =========================================================
   BADGES
========================================================= */

function formatBadge(value) {
  const badges = {
    Kids: "K",
    Végétarien: "V",
    Vegetarian: "V",
    New: "N",
    "Coup de coeur": "❤️",
    "Coup de cœur": "❤️"
  };

  return badges[value] || value;
}


/* =========================================================
   BASES SUCRÉES
========================================================= */

function createBasesSucreesBox() {
  const box = document.createElement("section");
  box.className = "bases-box";

  const visibleItems = basesSucrees
    .filter(item => item.Afficher === "Oui")
    .sort((a, b) => Number(a.Ordre) - Number(b.Ordre));

  const title = visibleItems.find(item => item.Type === "Titre");
  const options = visibleItems.filter(item => item.Type === "Option");
  const infos = visibleItems.filter(item => item.Type === "Info");

  const titleText = title
    ? getLocalizedValue(title, "Contenu")
    : translations[currentLanguage].chooseBase;

  box.innerHTML = `
    <h2>${escapeHtml(titleText)}</h2>

    <div class="base-options">
      ${options
        .map(option => {
          const optionText = getLocalizedValue(option, "Contenu");

          return `<span>${escapeHtml(optionText)}</span>`;
        })
        .join("")}
    </div>

    <div class="base-infos">
      ${infos
        .map(info => {
          const infoText = getLocalizedValue(info, "Contenu");

          return `
            <p>
              ${escapeHtml(infoText)}
              ${
                info.Prix
                  ? ` — ${formatPrice(info.Prix)} €`
                  : ""
              }
            </p>
          `;
        })
        .join("")}
    </div>
  `;

  return box;
}


/* =========================================================
   ON THE SIDE
========================================================= */

function createSidesBox() {
  const box = document.createElement("section");
  box.className = "sides-box";

  const visibleSides = sides
    .filter(item => item.Nom)
    .sort((a, b) => Number(a.Ordre) - Number(b.Ordre));

  box.innerHTML = `
    <h2>${translations[currentLanguage].sidesTitle}</h2>

    <div class="sides-list">
      ${visibleSides
        .map(side => {
          const sideName = getLocalizedValue(side, "Nom");

          return `
            <div class="side-line">
              <span>${escapeHtml(sideName)}</span>
              <strong>+${formatPrice(side.Prix)} €</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  return box;
}


/* =========================================================
   OUTILS
========================================================= */

function formatPrice(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value || "";
  }

  return new Intl.NumberFormat(
    currentLanguage === "fr" ? "fr-FR" : "en-GB",
    {
      minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
      maximumFractionDigits: 2
    }
  ).format(number);
}


function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}