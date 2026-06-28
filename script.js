const header = document.querySelector("[data-header]");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const reviewsStatus = document.querySelector("[data-google-status]");
const reviewsContainer = document.querySelector("[data-google-reviews]");
const googleRating = document.querySelector("[data-google-rating]");
const googleCount = document.querySelector("[data-google-count]");
const googleSummaryRating = document.querySelector("[data-google-summary-rating]");
const googleSummaryCount = document.querySelector("[data-google-summary-count]");

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

function setReviewsStatus(message) {
  if (reviewsStatus) {
    reviewsStatus.textContent = message;
  }
}

function setText(element, value) {
  if (element && value) {
    element.textContent = value;
  }
}

function formatRating(rating) {
  if (typeof rating !== "number") {
    return null;
  }

  return `${rating.toFixed(1).replace(".", ",")}/5`;
}

function formatReviewCount(count) {
  if (typeof count !== "number") {
    return null;
  }

  return `${count} avis`;
}

function createReviewAvatar(review) {
  if (review.profile_photo_url) {
    const image = document.createElement("img");
    image.src = review.profile_photo_url;
    image.alt = "";
    image.loading = "lazy";
    return image;
  }

  return document.createTextNode((review.author_name || "?").charAt(0).toUpperCase());
}

function renderGoogleReviews(place) {
  const rating = formatRating(place.rating);
  const count = formatReviewCount(place.user_ratings_total);

  setText(googleRating, rating);
  setText(googleSummaryRating, rating);
  setText(googleCount, count);
  setText(googleSummaryCount, count ? `${count} Google` : null);

  if (!Array.isArray(place.reviews) || place.reviews.length === 0 || !reviewsContainer) {
    setReviewsStatus("Note Google chargée automatiquement. Aucun commentaire n'est disponible via l'API.");
    return;
  }

  reviewsContainer.replaceChildren();

  place.reviews.slice(0, 5).forEach((review) => {
    const article = document.createElement("article");
    const avatar = document.createElement("div");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const origin = document.createElement("span");
    const body = document.createElement("p");

    avatar.className = "review-avatar";
    avatar.append(createReviewAvatar(review));

    title.textContent = review.author_name || "Avis Google";
    origin.className = "review-origin";
    origin.textContent = review.relative_time_description
      ? `Avis de Google - ${review.relative_time_description}`
      : "Avis de Google";
    const score = document.createElement("strong");
    score.textContent = `${review.rating}/5`;
    body.append(score, document.createTextNode(` ${review.text || "Avis sans commentaire."}`));

    content.append(title, origin, body);
    article.append(avatar, content);
    reviewsContainer.append(article);
  });

  setReviewsStatus("Avis Google chargés automatiquement depuis la fiche du cabinet.");
}

function fetchGooglePlaceDetails(service, placeId) {
  service.getDetails(
    {
      placeId,
      fields: ["name", "rating", "user_ratings_total", "reviews", "url"]
    },
    (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        renderGoogleReviews(place);
        return;
      }

      setReviewsStatus("Impossible de charger les avis Google pour le moment. Les avis affichés restent disponibles.");
    }
  );
}

window.initGoogleReviews = function initGoogleReviews() {
  const config = window.GOOGLE_REVIEWS_CONFIG || {};
  const service = new google.maps.places.PlacesService(document.createElement("div"));

  if (config.placeId) {
    fetchGooglePlaceDetails(service, config.placeId);
    return;
  }

  service.findPlaceFromQuery(
    {
      query: config.query,
      fields: ["place_id"]
    },
    (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.place_id) {
        fetchGooglePlaceDetails(service, results[0].place_id);
        return;
      }

      setReviewsStatus("Fiche Google introuvable automatiquement. Les avis intégrés au site restent affichés.");
    }
  );
};

function loadGoogleReviewsScript() {
  const config = window.GOOGLE_REVIEWS_CONFIG || {};

  if (!config.apiKey) {
    setReviewsStatus("Ajoutez la clé Google Maps dans config.js pour charger les avis automatiquement.");
    return;
  }

  const script = document.createElement("script");
  const params = new URLSearchParams({
    key: config.apiKey,
    libraries: "places",
    language: config.language || "fr",
    region: config.region || "FR",
    callback: "initGoogleReviews"
  });

  script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    setReviewsStatus("Impossible de joindre Google Maps. Les avis intégrés au site restent affichés.");
  };
  document.head.append(script);
}

loadGoogleReviewsScript();
