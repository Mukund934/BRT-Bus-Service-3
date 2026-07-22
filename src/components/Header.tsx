import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
	Clock,
	DollarSign,
	Home,
	LayoutDashboard,
	LogOut,
	MapPin,
	Menu,
	Phone,
	X,
} from "lucide-react";

const navLinks = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/map", label: "Live Map", icon: MapPin },
	{ to: "/timetable", label: "Time Table", icon: Clock },
	{ to: "/fares", label: "Bus Fares", icon: DollarSign },
	{ to: "/contact", label: "Contact Us", icon: Phone },
];

const getInitials = (name: string): string => {
	if (!name) return "U";

	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
};

const getShortName = (name: string): string =>
	name ? name.split(" ")[0] || "User" : "User";

const Header = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout } = useAuth();

	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const profileRef = useRef<HTMLDivElement>(null);
	const profileButtonRef = useRef<HTMLButtonElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);

	const ids = useId();
	const profileMenuId = `${ids}-profile-menu`;
	const mobileMenuId = `${ids}-mobile-menu`;

	useEffect(() => {
		const handleScroll = () => setIsScrolled(window.scrollY > 10);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const closeProfile = useCallback(({ restoreFocus = false } = {}) => {
		setIsProfileOpen(false);
		if (restoreFocus) profileButtonRef.current?.focus();
	}, []);

	const closeMenu = useCallback(({ restoreFocus = false } = {}) => {
		setIsMenuOpen(false);
		if (restoreFocus) menuButtonRef.current?.focus();
	}, []);

	// Dismiss the profile menu on an outside click or Escape. Escape returns
	// focus to the trigger so a keyboard user is not dropped on the body.
	useEffect(() => {
		if (!isProfileOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
				closeProfile();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeProfile({ restoreFocus: true });
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isProfileOpen, closeProfile]);

	useEffect(() => {
		if (!isMenuOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeMenu({ restoreFocus: true });
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isMenuOpen, closeMenu]);

	/**
	 * The drawer stays mounted so it can slide, which would otherwise leave
	 * its links tabbable while off-screen - a keyboard user tabbing through
	 * the page would land in an invisible menu. `inert` removes the whole
	 * subtree from the tab order and the accessibility tree while closed.
	 *
	 * Set imperatively because React 18's typings do not yet include `inert`.
	 */
	useEffect(() => {
		const element = mobileMenuRef.current;
		if (!element) return;

		if (isMenuOpen) element.removeAttribute("inert");
		else element.setAttribute("inert", "");
	}, [isMenuOpen]);

	/** Stops the page behind the drawer scrolling on touch devices. */
	useEffect(() => {
		if (!isMenuOpen) return;

		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previous;
		};
	}, [isMenuOpen]);

	// Close the drawer whenever navigation happens.
	useEffect(() => {
		setIsMenuOpen(false);
		setIsProfileOpen(false);
	}, [location.pathname]);

	const isActive = (path: string) => location.pathname === path;

	const handleDashboardClick = () => {
		closeProfile();
		closeMenu();
		navigate("/dashboard");
	};

	const handleLogout = async () => {
		setIsLoggingOut(true);
		closeProfile();
		closeMenu();

		try {
			await logout();
			navigate("/login", { replace: true });
		} catch (error) {
			console.error("Logout failed:", error);
			setIsLoggingOut(false);
		}
	};

	const displayName = user?.displayName || "User";

	return (
		<header
			className={`sticky top-0 z-50 w-full transition-all duration-500 ${
				isScrolled
					? "bg-[#874f9c]/95 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.18)]"
					: "bg-[#874f9c]"
			}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16 lg:h-20">

					<Link
						to="/"
						className="flex items-center gap-3 text-white group flex-shrink-0 rounded-xl"
						aria-label="BRT Bus Service, go to home page"
					>
						<div className="p-[2px] rounded-xl bg-white/20">
							<div className="bg-white/10 rounded-xl p-2 group-hover:bg-white/20 transition duration-300">
								<img
									src="/logo1.png"
									alt=""
									aria-hidden="true"
									className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
								/>
							</div>
						</div>
						<div className="hidden sm:flex flex-col">
							<span className="text-lg lg:text-xl font-semibold tracking-tight">
								BRT Bus Service
							</span>
							<span className="text-xs text-white/80">
								Your Journey, Our Priority
							</span>
						</div>
					</Link>

					<nav aria-label="Main" className="hidden lg:flex items-center gap-1">
						{navLinks.map(({ to, label, icon: Icon }) => {
							const active = isActive(to);

							return (
								<Link
									key={to}
									to={to}
									className="relative px-4 py-2.5 rounded-xl text-sm font-medium text-white/90 hover:text-white transition-all duration-300 group flex items-center gap-2 hover:bg-white/10"
									aria-current={active ? "page" : undefined}
								>
									<Icon className="w-4 h-4 opacity-80 group-hover:opacity-100 transition" aria-hidden="true" />
									<span className="relative z-10">{label}</span>
									<span
										aria-hidden="true"
										className={`absolute bottom-[6px] left-1/2 h-[2px] bg-white rounded-full transition-all duration-300 ease-out ${
											active
												? "w-[70%] -translate-x-1/2"
												: "w-0 group-hover:w-[70%] group-hover:-translate-x-1/2"
										}`}
									/>
								</Link>
							);
						})}
					</nav>

					<div className="flex items-center gap-4">
						<div className="hidden lg:block">
							{!user ? (
								<Link
									to="/login"
									className="px-6 py-2.5 rounded-xl bg-white text-[#874f9c] font-semibold shadow-[0_8px_25px_rgba(255,255,255,0.25)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_12px_35px_rgba(255,255,255,0.35)]"
								>
									Login
								</Link>
							) : (
								<div className="relative flex flex-col items-center gap-2" ref={profileRef}>
									<button
										type="button"
										ref={profileButtonRef}
										onClick={() => setIsProfileOpen((open) => !open)}
										className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#874f9c] font-semibold text-sm hover:scale-110 transition-transform duration-300 shadow-lg border-2 border-white/30 hover:border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#874f9c]"
										aria-expanded={isProfileOpen}
										aria-controls={profileMenuId}
										aria-label={`Account menu for ${displayName}`}
									>
										{user.photoURL ? (
											<img
												src={user.photoURL}
												alt=""
												aria-hidden="true"
												className="w-full h-full rounded-full object-cover"
											/>
										) : (
											<span aria-hidden="true">{getInitials(displayName)}</span>
										)}
									</button>

									<span className="text-xs font-medium text-white whitespace-nowrap" aria-hidden="true">
										{getShortName(displayName)}
									</span>

									{isProfileOpen && (
										<div
											id={profileMenuId}
											className="absolute top-full mt-3 right-0 w-56 bg-white text-gray-800 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200"
										>
											<div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
												<div className="flex items-center gap-3">
													<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#874f9c] text-white font-semibold text-sm flex-shrink-0">
														{user.photoURL ? (
															<img
																src={user.photoURL}
																alt=""
																aria-hidden="true"
																className="w-full h-full rounded-full object-cover"
															/>
														) : (
															<span aria-hidden="true">{getInitials(displayName)}</span>
														)}
													</div>
													<div className="min-w-0 flex-1">
														<p className="font-semibold text-sm text-gray-900 truncate">
															{displayName}
														</p>
														<p className="text-xs text-gray-600 truncate">{user.email}</p>
													</div>
												</div>
											</div>

											<button
												type="button"
												onClick={handleDashboardClick}
												className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 transition-colors duration-200 border-b border-gray-100 touch-target"
											>
												<LayoutDashboard className="w-4 h-4 text-[#874f9c] flex-shrink-0" aria-hidden="true" />
												<span>Dashboard</span>
											</button>

											<button
												type="button"
												onClick={handleLogout}
												disabled={isLoggingOut}
												className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-target"
											>
												<LogOut className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />
												<span>{isLoggingOut ? "Signing out…" : "Logout"}</span>
											</button>
										</div>
									)}
								</div>
							)}
						</div>

						<button
							type="button"
							ref={menuButtonRef}
							onClick={() => setIsMenuOpen((open) => !open)}
							className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#874f9c] touch-target"
							aria-expanded={isMenuOpen}
							aria-controls={mobileMenuId}
							aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
						>
							{isMenuOpen ? (
								<X className="w-6 h-6" aria-hidden="true" />
							) : (
								<Menu className="w-6 h-6" aria-hidden="true" />
							)}
						</button>
					</div>

				</div>
			</div>

			{isMenuOpen && (
				<div
					className="lg:hidden fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-40"
					onClick={() => closeMenu()}
					aria-hidden="true"
				/>
			)}

			<div
				id={mobileMenuId}
				ref={mobileMenuRef}
				className={`lg:hidden fixed inset-y-0 right-0 w-64 max-w-[85vw] bg-[#874f9c] transform transition-transform duration-300 z-50 ${
					isMenuOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex flex-col h-full pt-20 pb-6 px-4 overflow-y-auto">

					<nav aria-label="Mobile" className="space-y-1">
						{navLinks.map(({ to, label, icon: Icon }) => (
							<Link
								key={to}
								to={to}
								onClick={() => closeMenu()}
								className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 touch-target ${
									isActive(to)
										? "bg-white/20 text-white"
										: "text-white/80 hover:bg-white/10 hover:text-white"
								}`}
								aria-current={isActive(to) ? "page" : undefined}
							>
								<Icon className="w-5 h-5" aria-hidden="true" />
								{label}
							</Link>
						))}
					</nav>

					<div className="mt-auto pt-6 border-t border-white/20">
						{!user ? (
							<Link
								to="/login"
								onClick={() => closeMenu()}
								className="w-full flex justify-center px-5 py-3 rounded-xl bg-white text-[#874f9c] font-semibold transition-transform duration-200 hover:scale-105 active:scale-95 touch-target"
							>
								Login
							</Link>
						) : (
							<>
								<div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white/10 rounded-lg">
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#874f9c] font-semibold text-sm flex-shrink-0">
										{user.photoURL ? (
											<img
												src={user.photoURL}
												alt=""
												aria-hidden="true"
												className="w-full h-full rounded-full object-cover"
											/>
										) : (
											<span aria-hidden="true">{getInitials(displayName)}</span>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-semibold text-white truncate">
											{getShortName(displayName)}
										</p>
										<p className="text-xs text-white/70 truncate">{user.email}</p>
									</div>
								</div>

								<button
									type="button"
									onClick={handleDashboardClick}
									className="w-full flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-white/20 text-white font-semibold border border-white/30 hover:bg-white/30 transition-colors duration-200 mb-2 active:bg-white/40 touch-target"
								>
									<LayoutDashboard className="w-4 h-4" aria-hidden="true" />
									Dashboard
								</button>

								<button
									type="button"
									onClick={handleLogout}
									disabled={isLoggingOut}
									className="w-full flex justify-center items-center gap-2 px-5 py-3 rounded-xl bg-red-500/20 text-red-100 font-semibold border border-red-500/30 hover:bg-red-500/30 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-500/40 touch-target"
								>
									<LogOut className="w-4 h-4" aria-hidden="true" />
									<span>{isLoggingOut ? "Signing out…" : "Logout"}</span>
								</button>
							</>
						)}
					</div>

				</div>
			</div>
		</header>
	);
};

export default Header;
