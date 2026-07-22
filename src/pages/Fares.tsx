import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getFareBandsFrom } from "@/domain/transit/fares";

const ORIGIN = "HNLU" as const;

/**
 * Derived from the fare table rather than restated.
 *
 * The hardcoded list this replaced had drifted: it advertised ₹30 to
 * Telibandha and ₹40 to the railway station, while the fare actually charged
 * at booking was ₹25 and ₹35. It also omitted several stops entirely.
 */
const fareBands = getFareBandsFrom(ORIGIN);

/** "A, B, and C" - matching how the page has always read. */
const formatDestinations = (stops: readonly string[]): string => {
	if (stops.length === 1) return stops[0]!;

	return `${stops.slice(0, -1).join(", ")}, and ${stops[stops.length - 1]}`;
};

const Fares = () => {
	return (
		<div className="min-h-screen bg-[#f5f3ff]">
			<Header />

			<main id="main-content" tabIndex={-1} className="py-24 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="bg-[#fbfaff] rounded-[28px] px-6 md:px-12 py-14 shadow-[0_25px_80px_rgba(0,0,0,0.06)]">
						<div className="text-center mb-14">
							<h1 className="text-[40px] md:text-[48px] font-semibold text-[#6b4fa3] tracking-tight">
								Fare Details
							</h1>

							<p className="mt-5 text-[#7c6aa6] text-[15px] md:text-base max-w-2xl mx-auto leading-relaxed">
								Explore the affordable bus fares from HNLU to
								various destinations. Enjoy a comfortable and
								convenient travel experience.
							</p>
						</div>

						<div className="relative">
							<div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent blur-2xl opacity-70"></div>

							<div className="relative bg-white rounded-[24px] px-6 md:px-10 py-8 border border-purple-100 shadow-[0_15px_50px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_25px_70px_rgba(0,0,0,0.12)]">
								<h2 className="text-[22px] md:text-[24px] font-semibold text-[#6b4fa3] mb-6 pb-3 border-b border-purple-200">
									From {ORIGIN} to:
								</h2>

								<div className="space-y-0">
									{fareBands.map((band) => (
										<div
											key={band.fare}
											className="group flex justify-between items-center py-4 px-3 border-b border-purple-200 last:border-none transition-all duration-200 hover:bg-purple-50/60"
										>
											<span className="font-semibold text-gray-800 text-[15px] md:text-[16px] transition-transform duration-200 group-hover:translate-x-[2px]">
												{formatDestinations(band.destinations)}
											</span>

											<span className="text-[#6b4fa3] font-semibold text-[16px] md:text-[18px]">
												₹ {band.fare} /-
											</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default Fares;
