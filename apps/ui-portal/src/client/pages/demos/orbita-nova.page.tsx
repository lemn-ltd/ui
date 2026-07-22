import { systemBrandingTemplates } from "@lemn-ltd/brand-contract/system-brandings";
import {
	Accordion,
	Badge,
	Brand,
	Button,
	Card,
	ContentLayout,
	Icon,
	SectionGrid,
	SelectNative,
	ThemeToggle,
} from "@lemn-ltd/ui";
import { type ReactElement, useEffect, useMemo } from "react";
import { usePortalBrand } from "../../branding/brand-runtime";
import "./orbita-nova.page.css";

const ATTRACTIONS = [
	{
		alt: "Una montaña rusa magnética recorre un cañón lunar bajo las estrellas",
		badge: "Alta intensidad",
		description:
			"Una aceleración magnética de 0 a órbita rasante entre cañones lunares y curvas sin gravedad.",
		image: "/demos/orbita-nova/comet-chase.jpg",
		meta: "Altura mínima 130 cm · 2 min 40 s",
		name: "Comet Chase",
		tone: "accent" as const,
	},
	{
		alt: "Una familia flota entre anillos luminosos dentro de una cúpula espacial",
		badge: "Para compartir",
		description:
			"Doce minutos de ingravidez guiada con una vista panorámica que cambia en cada sesión.",
		image: "/demos/orbita-nova/zero-g-dome.jpg",
		meta: "Desde 6 años · Sesiones cada 20 min",
		name: "Zero-G Dome",
		tone: "info" as const,
	},
	{
		alt: "Una familia explora un jardín bioluminiscente bajo una cúpula geodésica",
		badge: "Experiencia sensorial",
		description:
			"Un paseo elevado por un ecosistema vivo que responde a tus pasos con luz, aroma y sonido.",
		image: "/demos/orbita-nova/biolume-garden.jpg",
		meta: "Todos los públicos · Recorrido libre",
		name: "Biolume Gardens",
		tone: "success" as const,
	},
] as const;

const FAQ_ITEMS = [
	{
		value: "arrival",
		label: "¿Cuándo debo llegar?",
		content:
			"Recomendamos llegar 45 minutos antes de tu primera reserva. El pase de acceso incluye el transporte desde la terminal orbital hasta el parque.",
	},
	{
		value: "families",
		label: "¿Hay experiencias para familias?",
		content:
			"Sí. Más de dos tercios de las experiencias admiten visitantes desde los 4 años y todas las áreas cuentan con rutas tranquilas, salas de descanso y opciones de restauración.",
	},
	{
		value: "accessibility",
		label: "¿El parque es accesible?",
		content:
			"Las rutas principales, el transporte interior y las experiencias sensoriales están diseñados para acceso sin escalones. El equipo de misión puede preparar un itinerario personalizado.",
	},
	{
		value: "weather",
		label: "¿El clima afecta a la visita?",
		content:
			"No. Las experiencias principales se encuentran dentro de hábitats presurizados y el sistema de movilidad conecta todas las zonas protegidas.",
	},
] as const;

function scrollToSection(id: string): void {
	document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function OrbitaNovaPage(): ReactElement {
	const {
		compiling,
		mode,
		setModeByColorScheme,
		setSystemBrandingId,
		systemBrandingId,
	} = usePortalBrand();

	const availableBrandings = useMemo(
		() =>
			systemBrandingTemplates.filter(
				(template) => template.status === "available",
			),
		[],
	);
	const selectedBranding =
		availableBrandings.find((template) => template.id === systemBrandingId) ??
		availableBrandings[0];

	useEffect(() => {
		const previousTitle = document.title;
		document.title = "Órbita Nova — Más allá de la diversión";
		return () => {
			document.title = previousTitle;
		};
	}, []);

	return (
		<main className="orbita-site">
			<a className="orbita-skip-link" href="#main-content">
				Saltar al contenido
			</a>
			<header className="orbita-header">
				<div className="orbita-header__inner">
					<a
						aria-label="Órbita Nova, inicio"
						className="orbita-brand"
						href="#top"
					>
						<span className="orbita-brand__orbit" aria-hidden="true" />
						<Brand initials="ON" name="Órbita Nova" />
					</a>
					<nav aria-label="Navegación principal" className="orbita-nav">
						<a href="#atracciones">Atracciones</a>
						<a href="#experiencia">Experiencia</a>
						<a href="#visita">Planifica tu visita</a>
					</nav>
					<div className="orbita-header__actions">
						<Button
							onClick={() => scrollToSection("entradas")}
							size="sm"
							variant="primary"
						>
							Entradas
						</Button>
					</div>
				</div>
			</header>

			<section className="orbita-hero" id="top">
				<img
					alt="Vista panorámica de Órbita Nova, un parque espacial con montañas rusas y cúpulas bajo un planeta anillado"
					className="orbita-hero__image"
					fetchPriority="high"
					height="818"
					src="/demos/orbita-nova/hero.jpg"
					width="1923"
				/>
				<div className="orbita-hero__shade" />
				<ContentLayout className="orbita-hero__content" id="main-content">
					<Badge showDot tone="accent" variant="solid">
						Temporada 2086 · Reservas abiertas
					</Badge>
					<p className="orbita-kicker">El primer parque más allá del cielo</p>
					<h1>Tu próxima aventura no está en este mundo.</h1>
					<p className="orbita-hero__lede">
						Atracciones orbitales, paisajes imposibles y experiencias para toda
						la familia en una jornada que recordaréis para siempre.
					</p>
					<div className="orbita-hero__actions">
						<Button
							endIcon={<Icon name="arrow-right" size={16} />}
							onClick={() => scrollToSection("atracciones")}
						>
							Explorar el parque
						</Button>
						<Button
							onClick={() => scrollToSection("experiencia")}
							variant="outline"
						>
							Ver la experiencia
						</Button>
					</div>
					<dl aria-label="Información destacada" className="orbita-hero__facts">
						<div>
							<dd>42</dd>
							<dt>experiencias</dt>
						</div>
						<div>
							<dd>7</dd>
							<dt>hábitats</dt>
						</div>
						<div>
							<dd>1</dd>
							<dt>día inolvidable</dt>
						</div>
					</dl>
				</ContentLayout>
			</section>

			<section aria-labelledby="brand-lab-title" className="orbita-brand-lab">
				<ContentLayout className="orbita-brand-lab__inner">
					<div className="orbita-brand-lab__copy">
						<span className="orbita-section-kicker">Branding lab</span>
						<h2 id="brand-lab-title">
							Cambia la identidad del sitio en directo
						</h2>
						<p>
							Selecciona uno de los brandings reales del sistema. Componentes,
							superficies, estados y tipografía se adaptan al instante.
						</p>
					</div>
					<div className="orbita-brand-lab__controls">
						<label htmlFor="orbita-branding">Branding</label>
						<SelectNative
							aria-describedby="orbita-branding-description"
							disabled={compiling}
							id="orbita-branding"
							onValueChange={(value) => void setSystemBrandingId(value)}
							options={availableBrandings.map((template) => ({
								label: template.name,
								value: template.id,
							}))}
							value={systemBrandingId}
						/>
						<ThemeToggle
							mode={mode.colorScheme}
							onModeChange={setModeByColorScheme}
						/>
						<p id="orbita-branding-description">
							{compiling
								? "Aplicando identidad…"
								: selectedBranding?.description}
						</p>
					</div>
				</ContentLayout>
			</section>

			<ContentLayout className="orbita-section" id="atracciones">
				<header className="orbita-section__header">
					<div>
						<span className="orbita-section-kicker">
							Atracciones principales
						</span>
						<h2>Elige tu trayectoria</h2>
					</div>
					<p>
						Desde aceleración pura hasta paisajes vivos: cada zona propone una
						forma distinta de descubrir el universo.
					</p>
				</header>
				<SectionGrid className="orbita-attractions-grid">
					{ATTRACTIONS.map((attraction) => (
						<Card
							className="orbita-attraction-card"
							interactive
							key={attraction.name}
						>
							<img
								alt={attraction.alt}
								height="853"
								loading="lazy"
								src={attraction.image}
								width="1280"
							/>
							<div className="orbita-attraction-card__content">
								<Badge tone={attraction.tone}>{attraction.badge}</Badge>
								<h3>{attraction.name}</h3>
								<p>{attraction.description}</p>
								<span>{attraction.meta}</span>
							</div>
						</Card>
					))}
				</SectionGrid>
			</ContentLayout>

			<section className="orbita-experience" id="experiencia">
				<ContentLayout className="orbita-experience__inner">
					<div className="orbita-experience__copy">
						<span className="orbita-section-kicker">
							Diseñado como un viaje
						</span>
						<h2>Un parque. Siete mundos. Cero minutos perdidos.</h2>
						<p>
							Tu pase organiza las reservas, adapta el ritmo de la visita y
							conecta cada hábitat mediante el Orbit Loop, nuestro sistema de
							movilidad silenciosa.
						</p>
						<Button
							endIcon={<Icon name="arrow-right" size={16} />}
							onClick={() => scrollToSection("visita")}
							variant="secondary"
						>
							Planificar mi misión
						</Button>
					</div>
					<div className="orbita-experience__cards">
						<Card elevated title="Tu día, coordinado">
							<div className="orbita-feature-row">
								<Icon name="clock" size={20} />
								<div>
									<strong>Menos espera, más universo</strong>
									<p>Ventanas inteligentes y rutas sugeridas en tiempo real.</p>
								</div>
							</div>
						</Card>
						<Card elevated title="Hecho para todos">
							<div className="orbita-feature-row">
								<Icon name="users" size={20} />
								<div>
									<strong>Un itinerario para cada tripulación</strong>
									<p>Intensidad, accesibilidad y descansos a tu medida.</p>
								</div>
							</div>
						</Card>
					</div>
				</ContentLayout>
			</section>

			<ContentLayout className="orbita-visit" id="visita">
				<div className="orbita-visit__schedule">
					<span className="orbita-section-kicker">Planifica tu visita</span>
					<h2>Todo lo que necesitas antes del despegue</h2>
					<div className="orbita-schedule-grid">
						<Card title="Horario orbital">
							<strong>09:00 — 23:30</strong>
							<p>Acceso todos los días de la temporada.</p>
						</Card>
						<Card title="Terminal de salida">
							<strong>Puerta 04 · Plataforma L</strong>
							<p>Traslado orbital incluido con tu entrada.</p>
						</Card>
						<Card title="Tiempo recomendado">
							<strong>1 día completo</strong>
							<p>O dos jornadas para una visita sin prisas.</p>
						</Card>
					</div>
				</div>
				<div className="orbita-faq">
					<h2>Preguntas frecuentes</h2>
					<Accordion items={FAQ_ITEMS} type="single" />
				</div>
			</ContentLayout>

			<section className="orbita-cta" id="entradas">
				<ContentLayout className="orbita-cta__inner">
					<div>
						<Badge tone="accent" variant="solid">
							Pases desde 89 créditos
						</Badge>
						<h2>Tu lugar en la próxima misión te está esperando.</h2>
						<p>
							Selecciona fecha, tripulación y nivel de aventura. Nosotros
							hacemos el resto.
						</p>
					</div>
					<Button
						endIcon={<Icon name="arrow-right" size={16} />}
						onClick={() =>
							window.alert("Demo: el flujo de compra se conectaría aquí.")
						}
						size="md"
					>
						Elegir fecha
					</Button>
				</ContentLayout>
			</section>

			<footer className="orbita-footer">
				<ContentLayout className="orbita-footer__inner">
					<div className="orbita-footer__brand">
						<span className="orbita-brand__orbit" aria-hidden="true" />
						<Brand initials="ON" name="Órbita Nova" />
					</div>
					<p>Una experiencia conceptual creada con Lemn UI.</p>
					<div className="orbita-footer__links">
						<a href="#atracciones">Atracciones</a>
						<a href="#visita">Visita</a>
						<a href="#top">Volver arriba</a>
					</div>
				</ContentLayout>
			</footer>
		</main>
	);
}
