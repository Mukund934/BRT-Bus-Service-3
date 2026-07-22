import { useId, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAnnounce } from "@/components/a11y/LiveAnnouncer";
import { useAuth } from "@/contexts/AuthContext";
import { fieldErrors, signInSchema, signUpSchema } from "@/domain/validation/schemas";
import { useIsMobile } from "@/hooks/use-mobile";

interface FieldProps {
	id: string;
	label: string;
	error?: string;
	children: React.ReactNode;
}

/**
 * A labelled field with its error message wired to the control.
 *
 * Every input previously relied on a placeholder for its name, which
 * disappears the moment the user types and is not reliably announced. A real
 * <label> fixes both (WCAG 3.3.2).
 */
const Field = ({ id, label, error, children }: FieldProps) => (
	<div className="w-full mb-3">
		<label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
			{label}
			<span className="text-red-500" aria-hidden="true">
				{" "}
				*
			</span>
			<span className="sr-only"> (required)</span>
		</label>

		{children}

		{error && (
			<p id={`${id}-error`} className="text-xs text-red-600 mt-1">
				{error}
			</p>
		)}
	</div>
);

const inputClass = (hasError: boolean) =>
	`w-full bg-secondary rounded-lg px-4 py-2.5 border-2 transition-colors ${
		hasError ? "border-red-500" : "border-transparent focus:border-purple-400"
	}`;

const Login = () => {
	// Redirecting an already-signed-in visitor is the route guard's job.
	const { signIn, signUp, signInWithGoogle } = useAuth();
	const announce = useAnnounce();

	/**
	 * Only one layout is mounted at a time.
	 *
	 * Rendering both and hiding one with CSS would put every field id in the
	 * document twice, which silently breaks the label/input associations and
	 * confuses password managers.
	 */
	const isMobile = useIsMobile();

	const [isSignUpView, setIsSignUpView] = useState(false);

	const [signInEmail, setSignInEmail] = useState("");
	const [signInPass, setSignInPass] = useState("");
	const [showSignInPass, setShowSignInPass] = useState(false);
	const [signInEmailError, setSignInEmailError] = useState("");
	const [signInPassError, setSignInPassError] = useState("");

	const [signUpName, setSignUpName] = useState("");
	const [signUpEmail, setSignUpEmail] = useState("");
	const [signUpPass, setSignUpPass] = useState("");
	const [showSignUpPass, setShowSignUpPass] = useState(false);
	const [signUpNameError, setSignUpNameError] = useState("");
	const [signUpEmailError, setSignUpEmailError] = useState("");
	const [signUpPassError, setSignUpPassError] = useState("");

	const [error, setError] = useState("");
	const [loadingAuth, setLoadingAuth] = useState(false);

	const ids = useId();
	const signInEmailId = `${ids}-signin-email`;
	const signInPassId = `${ids}-signin-password`;
	const signUpNameId = `${ids}-signup-name`;
	const signUpEmailId = `${ids}-signup-email`;
	const signUpPassId = `${ids}-signup-password`;

	const signInEmailRef = useRef<HTMLInputElement>(null);
	const signInPassRef = useRef<HTMLInputElement>(null);
	const signUpNameRef = useRef<HTMLInputElement>(null);
	const signUpEmailRef = useRef<HTMLInputElement>(null);
	const signUpPassRef = useRef<HTMLInputElement>(null);

	const handleSignIn = async (event: FormEvent) => {
		event.preventDefault();

		setSignInEmailError("");
		setSignInPassError("");
		setError("");

		const parsed = signInSchema.safeParse({ email: signInEmail, password: signInPass });

		if (!parsed.success) {
			const errors = fieldErrors(parsed.error);
			setSignInEmailError(errors.email ?? "");
			setSignInPassError(errors.password ?? "");

			// Focus the first field that failed, so a keyboard user lands on
			// the thing they need to fix rather than hunting for it.
			if (errors.email) signInEmailRef.current?.focus();
			else if (errors.password) signInPassRef.current?.focus();

			announce("There is a problem with the sign-in form.", "assertive");
			return;
		}

		setLoadingAuth(true);
		announce("Signing you in…");

		const message = await signIn(parsed.data.email, parsed.data.password);

		setLoadingAuth(false);

		if (message) {
			setError(message);
			announce(message, "assertive");
		}
	};

	const handleSignUp = async (event: FormEvent) => {
		event.preventDefault();

		setSignUpNameError("");
		setSignUpEmailError("");
		setSignUpPassError("");
		setError("");

		const parsed = signUpSchema.safeParse({
			name: signUpName,
			email: signUpEmail,
			password: signUpPass,
		});

		if (!parsed.success) {
			const errors = fieldErrors(parsed.error);
			setSignUpNameError(errors.name ?? "");
			setSignUpEmailError(errors.email ?? "");
			setSignUpPassError(errors.password ?? "");

			if (errors.name) signUpNameRef.current?.focus();
			else if (errors.email) signUpEmailRef.current?.focus();
			else if (errors.password) signUpPassRef.current?.focus();

			announce("There is a problem with the sign-up form.", "assertive");
			return;
		}

		setLoadingAuth(true);
		announce("Creating your account…");

		const message = await signUp(parsed.data.name, parsed.data.email, parsed.data.password);

		setLoadingAuth(false);

		if (message) {
			setError(message);
			announce(message, "assertive");
		}
	};

	const handleGoogleLogin = async () => {
		setError("");
		setLoadingAuth(true);

		const message = await signInWithGoogle();

		setLoadingAuth(false);

		if (message) {
			setError(message);
			announce(message, "assertive");
		}
	};

	const switchView = (toSignUp: boolean) => {
		setIsSignUpView(toSignUp);
		setError("");
		setSignInEmailError("");
		setSignInPassError("");
		setSignUpNameError("");
		setSignUpEmailError("");
		setSignUpPassError("");
	};

	const errorBanner = error ? (
		<div className="w-full mb-3 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
			<p className="text-xs text-red-700 text-center">{error}</p>
		</div>
	) : null;

	const passwordToggle = (shown: boolean, onToggle: () => void) => (
		<button
			type="button"
			onClick={onToggle}
			className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
			aria-label={shown ? "Hide password" : "Show password"}
			aria-pressed={shown}
		>
			{shown ? (
				<EyeOff className="w-4 h-4" aria-hidden="true" />
			) : (
				<Eye className="w-4 h-4" aria-hidden="true" />
			)}
		</button>
	);

	const signInForm = (
		<form onSubmit={handleSignIn} noValidate className="w-full flex flex-col items-center">
			<h1 className="text-2xl font-bold mb-3">Sign in</h1>

			{errorBanner}

			<Field id={signInEmailId} label="Email" error={signInEmailError}>
				<input
					ref={signInEmailRef}
					id={signInEmailId}
					type="email"
					inputMode="email"
					autoComplete="email"
					required
					aria-invalid={signInEmailError ? true : undefined}
					aria-describedby={signInEmailError ? `${signInEmailId}-error` : undefined}
					value={signInEmail}
					onChange={(e) => {
						setSignInEmail(e.target.value);
						setSignInEmailError("");
					}}
					className={inputClass(!!signInEmailError)}
				/>
			</Field>

			<Field id={signInPassId} label="Password" error={signInPassError}>
				<div className="relative">
					<input
						ref={signInPassRef}
						id={signInPassId}
						type={showSignInPass ? "text" : "password"}
						autoComplete="current-password"
						required
						aria-invalid={signInPassError ? true : undefined}
						aria-describedby={signInPassError ? `${signInPassId}-error` : undefined}
						value={signInPass}
						onChange={(e) => {
							setSignInPass(e.target.value);
							setSignInPassError("");
						}}
						className={`${inputClass(!!signInPassError)} pr-12`}
					/>
					{passwordToggle(showSignInPass, () => setShowSignInPass((v) => !v))}
				</div>
			</Field>

			<button
				type="submit"
				disabled={loadingAuth}
				className="w-full bg-primary text-primary-foreground px-10 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity touch-target inline-flex items-center justify-center gap-2"
			>
				{loadingAuth && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
				{loadingAuth ? "Signing in…" : "Sign in"}
			</button>

			<button
				type="button"
				onClick={handleGoogleLogin}
				disabled={loadingAuth}
				className="w-full mt-3 border-2 border-border px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition-colors flex items-center justify-center gap-2 touch-target"
			>
				<span aria-hidden="true">🔵</span>
				Continue with Google
			</button>
		</form>
	);

	const signUpForm = (
		<form onSubmit={handleSignUp} noValidate className="w-full flex flex-col items-center">
			<h1 className="text-2xl font-bold mb-3">Create account</h1>

			{errorBanner}

			<Field id={signUpNameId} label="Full name" error={signUpNameError}>
				<input
					ref={signUpNameRef}
					id={signUpNameId}
					type="text"
					autoComplete="name"
					required
					aria-invalid={signUpNameError ? true : undefined}
					aria-describedby={signUpNameError ? `${signUpNameId}-error` : undefined}
					value={signUpName}
					onChange={(e) => {
						setSignUpName(e.target.value);
						setSignUpNameError("");
					}}
					className={inputClass(!!signUpNameError)}
				/>
			</Field>

			<Field id={signUpEmailId} label="Email" error={signUpEmailError}>
				<input
					ref={signUpEmailRef}
					id={signUpEmailId}
					type="email"
					inputMode="email"
					autoComplete="email"
					required
					aria-invalid={signUpEmailError ? true : undefined}
					aria-describedby={signUpEmailError ? `${signUpEmailId}-error` : undefined}
					value={signUpEmail}
					onChange={(e) => {
						setSignUpEmail(e.target.value);
						setSignUpEmailError("");
					}}
					className={inputClass(!!signUpEmailError)}
				/>
			</Field>

			<Field id={signUpPassId} label="Password" error={signUpPassError}>
				<div className="relative">
					<input
						ref={signUpPassRef}
						id={signUpPassId}
						type={showSignUpPass ? "text" : "password"}
						autoComplete="new-password"
						required
						aria-invalid={signUpPassError ? true : undefined}
						aria-describedby={
							signUpPassError ? `${signUpPassId}-error` : `${signUpPassId}-hint`
						}
						value={signUpPass}
						onChange={(e) => {
							setSignUpPass(e.target.value);
							setSignUpPassError("");
						}}
						className={`${inputClass(!!signUpPassError)} pr-12`}
					/>
					{passwordToggle(showSignUpPass, () => setShowSignUpPass((v) => !v))}
				</div>
			</Field>

			{!signUpPassError && (
				<p id={`${signUpPassId}-hint`} className="w-full -mt-2 mb-3 text-xs text-muted-foreground">
					At least 6 characters.
				</p>
			)}

			<button
				type="submit"
				disabled={loadingAuth}
				className="w-full bg-primary text-primary-foreground px-10 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity touch-target inline-flex items-center justify-center gap-2"
			>
				{loadingAuth && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
				{loadingAuth ? "Creating account…" : "Sign up"}
			</button>
		</form>
	);

	return (
		<div
			className="login-font min-h-screen"
			style={{
				background: "linear-gradient(to right, hsl(284, 33%, 92%), hsl(284, 33%, 98%))",
			}}
		>
			<main
				id="main-content"
				tabIndex={-1}
				className="flex items-center justify-center min-h-screen px-4 py-10"
			>
				{/*
					Two layouts, one set of forms, only ever one mounted.

					Below md the sliding two-panel design leaves each half about
					107px wide on a 375px phone, so the small-screen layout is a
					single full-width column. The desktop presentation is unchanged.
				*/}

				{isMobile ? (
					<div className="w-full max-w-md bg-card rounded-3xl p-6 sm:p-8 shadow-lg">
						{isSignUpView ? signUpForm : signInForm}

						<p className="text-center text-sm text-muted-foreground mt-6">
							{isSignUpView ? "Already have an account?" : "Don't have an account?"}{" "}
							<button
								type="button"
								onClick={() => switchView(!isSignUpView)}
								className="font-semibold text-primary underline underline-offset-2"
							>
								{isSignUpView ? "Sign in" : "Sign up"}
							</button>
						</p>
					</div>
				) : (
				<div className="relative bg-card rounded-[30px] overflow-hidden w-full max-w-[768px] min-h-[520px] shadow-lg">
					{/*
						The off-screen panel keeps its fields out of the tab order.
						`pointer-events-none` alone would still leave them tabbable.
					*/}
					<div
						className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-10 transition-all duration-[600ms] ${
							isSignUpView ? "translate-x-full opacity-100 z-[5]" : "opacity-0 z-[1] pointer-events-none"
						}`}
					>
						{isSignUpView && signUpForm}
					</div>

					<div
						className={`absolute top-0 left-0 w-1/2 h-full flex flex-col items-center justify-center px-10 transition-all duration-[600ms] z-[2] ${
							isSignUpView ? "-translate-x-full opacity-0 pointer-events-none" : ""
						}`}
					>
						{!isSignUpView && signInForm}
					</div>

					<div
						className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden rounded-l-[150px] transition-all duration-[600ms] z-[100] ${
							isSignUpView ? "-translate-x-full rounded-l-none rounded-r-[150px]" : ""
						}`}
					>
						<div className="h-full flex items-center justify-center px-8 text-center text-white bg-primary">
							{!isSignUpView ? (
								<div>
									<h2 className="text-2xl font-bold mb-3">Hello, friend!</h2>
									<p className="text-sm mb-4 text-white/90">
										Don't have an account? Sign up now to book bus tickets and enjoy
										seamless travel.
									</p>
									<button
										type="button"
										onClick={() => switchView(true)}
										className="border border-white px-10 py-2.5 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors duration-300 touch-target"
									>
										Sign up
									</button>
								</div>
							) : (
								<div>
									<h2 className="text-2xl font-bold mb-3">Welcome back!</h2>
									<p className="text-sm mb-4 text-white/90">
										Already have an account? Sign in to continue booking your tickets.
									</p>
									<button
										type="button"
										onClick={() => switchView(false)}
										className="border border-white px-10 py-2.5 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors duration-300 touch-target"
									>
										Sign in
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
				)}
			</main>
		</div>
	);
};

export default Login;
