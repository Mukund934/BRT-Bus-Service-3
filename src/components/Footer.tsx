import { MapPin, Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

interface FooterProps {
	text?: string;
}

const FOOTER_LINKS = [
	{ to: "/", label: "Home" },
	{ to: "/map", label: "Live Map" },
	{ to: "/timetable", label: "Time Table" },
	{ to: "/fares", label: "Bus Fares" },
	{ to: "/contact", label: "Contact Us" },
];

/**
 * Social destinations.
 *
 * These are placeholders: the project has no social accounts yet, so they
 * point at "#". They are labelled so assistive technology can still announce
 * them, but they should be given real URLs or removed before launch.
 */
const SOCIAL_LINKS = [
	{ label: "BRT Bus Service on Facebook", href: "#", Icon: Facebook },
	{ label: "BRT Bus Service on Twitter", href: "#", Icon: Twitter },
	{ label: "BRT Bus Service on Instagram", href: "#", Icon: Instagram },
];

const Footer = ({
	text = "© BRT Bus Services. All Rights Reserved.",
}: FooterProps) => {
	return (
		<footer className="bg-gradient-to-br from-[#874f9c] to-[hsl(284,33%,28%)] text-primary-foreground mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
					{/* Brand Section */}
					<div className="space-y-4">
						<Link
							to="/"
							className="flex items-center gap-3 text-primary-foreground group"
						>
							<div className="bg-white/10 p-2 rounded-xl group-hover:bg-white/20 transition-all duration-300">
								{/* Decorative: the brand name is right beside it. */}
								<img
									src="/logo1.png"
									alt=""
									aria-hidden="true"
									className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
								/>
							</div>
							<div className="flex flex-col">
								<span className="text-lg lg:text-xl font-bold tracking-tight">
									BRT Bus Service
								</span>
								<span className="text-xs text-primary-foreground/80 hidden sm:block">
									Your Journey, Our Priority
								</span>
							</div>
						</Link>

						<p className="text-primary-foreground/80 text-sm leading-relaxed">
							Your trusted partner for reliable and comfortable
							bus transportation services.
						</p>
					</div>

					{/*
						Internal destinations use Link. The raw anchors these
						replaced triggered a full page reload, discarding the
						session and scroll position on every footer click.
					*/}
					<nav aria-labelledby="footer-links-heading">
						<h2 id="footer-links-heading" className="font-semibold text-lg mb-4">
							Quick Links
						</h2>
						<ul className="space-y-2 text-sm">
							{FOOTER_LINKS.map(({ to, label }) => (
								<li key={to}>
									<Link
										to={to}
										className="text-primary-foreground/80 hover:text-white transition-colors duration-200"
									>
										{label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					<div>
						<h2 className="font-semibold text-lg mb-4">Follow Us</h2>
						<ul className="flex gap-3 mb-4 list-none p-0">
							{SOCIAL_LINKS.map(({ label, href, Icon }) => (
								<li key={label}>
									{/*
										Icon-only links carry no text, so without an
										explicit name a screen reader announces only
										"link" (WCAG 2.4.4).
									*/}
									<a
										href={href}
										aria-label={label}
										className="flex items-center justify-center bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110 touch-target"
									>
										<Icon className="w-5 h-5" aria-hidden="true" />
									</a>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h2 className="font-semibold text-lg mb-4">Location</h2>
						<address className="flex items-start gap-2 text-primary-foreground/80 text-sm mt-4 not-italic">
							<MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
							<span>Sector 24, IIIT Naya Raipur, Chhattisgarh</span>
						</address>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-white/10 pt-6">
					<p className="text-center text-primary-foreground/70 text-sm">
						{text}
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
