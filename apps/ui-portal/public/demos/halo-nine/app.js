const experiences = {
	glide: {
		number: "01 / 03",
		kicker: "Velocidad solar",
		title: "Solar Glide",
		description:
			"Conduce tu propia cápsula por una cinta magnética abierta al horizonte. Elige el ritmo; la órbita pone las vistas.",
		image: "./assets/solar-glide.jpg",
		alt: "Dos visitantes recorren una cinta magnética coral sobre las nubes",
		facts: [
			["Altura", "2.400 m"],
			["Duración", "7 min"],
			["Intensidad", "Alta"],
		],
	},
	gardens: {
		number: "02 / 03",
		kicker: "Naturaleza suspendida",
		title: "Cloud Gardens",
		description:
			"Camina sobre agua y niebla en un hábitat que cambia con la luz. Una pausa viva entre el planeta y el cielo.",
		image: "./assets/cloud-gardens.jpg",
		alt: "Una familia recorre jardines luminosos con vistas a un planeta azul",
		facts: [
			["Ruta", "1,8 km"],
			["Duración", "Libre"],
			["Intensidad", "Suave"],
		],
	},
	eclipse: {
		number: "03 / 03",
		kicker: "Espectáculo inmersivo",
		title: "Eclipse Chamber",
		description:
			"Entra en una cámara de escala imposible y contempla un eclipse a pocos metros. Luz, sonido y silencio orbital.",
		image: "./assets/eclipse-chamber.jpg",
		alt: "Visitantes contemplan una gran esfera oscura rodeada por un halo coral",
		facts: [
			["Aforo", "240"],
			["Duración", "18 min"],
			["Intensidad", "Media"],
		],
	},
};

const brandingOptions = {
	original: {
		attribute: null,
		status: "Identidad original local",
		themeColor: "#fffaf0",
	},
	"solar-ink-light": {
		attribute: "solar-ink-light",
		status: "Borrador Solar Ink · validado",
		themeColor: "#f7f0d7",
	},
	"solar-ink-dark": {
		attribute: "solar-ink-dark",
		status: "Borrador Solar Ink · modo oscuro",
		themeColor: "#0d0b05",
	},
};

const brandingSelect = document.querySelector("[data-branding-select]");
const brandingStatus = document.querySelector("[data-branding-status]");
const themeColor = document.querySelector('meta[name="theme-color"]');

function applyBranding(brandingId) {
	const resolvedId = brandingOptions[brandingId] ? brandingId : "original";
	const option = brandingOptions[resolvedId];
	if (option.attribute) {
		document.documentElement.dataset.branding = option.attribute;
	} else {
		delete document.documentElement.dataset.branding;
	}
	if (brandingSelect) brandingSelect.value = resolvedId;
	if (brandingStatus) brandingStatus.textContent = option.status;
	themeColor?.setAttribute("content", option.themeColor);
	try {
		window.localStorage.setItem("halo-nine-branding", resolvedId);
	} catch {
		// Storage can be disabled without affecting the live selector.
	}
}

const requestedBranding = new URLSearchParams(window.location.search).get(
	"branding",
);
let initialBranding = brandingOptions[requestedBranding]
	? requestedBranding
	: "solar-ink-light";
if (!brandingOptions[requestedBranding]) {
	try {
		initialBranding =
			window.localStorage.getItem("halo-nine-branding") ?? "solar-ink-light";
	} catch {
		// Keep the Solar Ink default when storage access is unavailable.
	}
}
applyBranding(initialBranding);

brandingSelect?.addEventListener("change", () => {
	applyBranding(brandingSelect.value);
});

const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");

function setMenu(open) {
	menuToggle?.setAttribute("aria-expanded", String(open));
	menu?.classList.toggle("is-open", open);
	document.body.classList.toggle("menu-open", open);
	const label = menuToggle?.querySelector(".sr-only");
	if (label) label.textContent = open ? "Cerrar menú" : "Abrir menú";
}

menuToggle?.addEventListener("click", () => {
	setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
});

menu?.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => setMenu(false));
});

const experienceCard = document.querySelector("[data-experience-card]");
const experienceImage = document.querySelector("[data-experience-image]");
const experienceNumber = document.querySelector("[data-experience-number]");
const experienceKicker = document.querySelector("[data-experience-kicker]");
const experienceTitle = document.querySelector("[data-experience-title]");
const experienceDescription = document.querySelector(
	"[data-experience-description]",
);
const experienceFacts = document.querySelector("[data-experience-facts]");
const experienceTabs = Array.from(
	document.querySelectorAll("[data-experience]"),
);

experienceTabs.forEach((button, index) => {
	button.addEventListener("click", () => {
		const next = experiences[button.dataset.experience];
		if (
			!next ||
			!experienceCard ||
			!experienceImage ||
			!experienceNumber ||
			!experienceKicker ||
			!experienceTitle ||
			!experienceDescription ||
			!experienceFacts
		)
			return;

		experienceTabs.forEach((candidate) => {
			candidate.setAttribute("aria-selected", String(candidate === button));
			candidate.tabIndex = candidate === button ? 0 : -1;
		});
		experienceCard.setAttribute("aria-labelledby", button.id);

		experienceCard.classList.add("is-swapping");
		window.setTimeout(() => {
			experienceImage.src = next.image;
			experienceImage.alt = next.alt;
			experienceNumber.textContent = next.number;
			experienceKicker.textContent = next.kicker;
			experienceTitle.textContent = next.title;
			experienceDescription.textContent = next.description;
			experienceFacts.innerHTML = next.facts
				.map(
					([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`,
				)
				.join("");
			experienceCard.classList.remove("is-swapping");
		}, 160);
	});

	button.addEventListener("keydown", (event) => {
		let targetIndex;
		if (event.key === "Home") targetIndex = 0;
		if (event.key === "End") targetIndex = experienceTabs.length - 1;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			targetIndex = (index + 1) % experienceTabs.length;
		}
		if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			targetIndex = (index - 1 + experienceTabs.length) % experienceTabs.length;
		}
		if (targetIndex === undefined) return;
		event.preventDefault();
		experienceTabs[targetIndex].focus();
		experienceTabs[targetIndex].click();
	});
});

const bookingDialog = document.querySelector("[data-booking-dialog]");
const bookingForm = document.querySelector("[data-booking-form]");
const bookingSuccess = document.querySelector("[data-booking-success]");
const bookingDate = document.querySelector("[data-booking-date]");

if (bookingDate) {
	bookingDate.min = new Date().toISOString().slice(0, 10);
}

document.querySelectorAll("[data-open-booking]").forEach((button) => {
	button.addEventListener("click", () => bookingDialog?.showModal());
});

document.querySelectorAll("[data-close-booking]").forEach((button) => {
	button.addEventListener("click", () => bookingDialog?.close());
});

bookingDialog?.addEventListener("click", (event) => {
	if (event.target === bookingDialog) bookingDialog.close();
});

bookingDialog?.addEventListener("close", () => {
	window.setTimeout(() => {
		bookingForm.hidden = false;
		bookingSuccess.hidden = true;
		bookingForm.reset();
	}, 160);
});

bookingForm?.addEventListener("submit", (event) => {
	event.preventDefault();
	bookingForm.hidden = true;
	bookingSuccess.hidden = false;
	bookingSuccess.querySelector("button")?.focus();
});

const reducedMotion = window.matchMedia(
	"(prefers-reduced-motion: reduce)",
).matches;
if (reducedMotion || !("IntersectionObserver" in window)) {
	document.querySelectorAll(".reveal").forEach((item) => {
		item.classList.add("is-visible");
	});
} else {
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			}
		},
		{ threshold: 0.14 },
	);
	document.querySelectorAll(".reveal").forEach((item) => {
		observer.observe(item);
	});
}
