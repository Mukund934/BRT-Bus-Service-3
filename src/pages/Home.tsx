import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RouteCard from "@/components/RouteCard";
import heroBus from "@/assets/hero-brts.webp";
import { Clock, MapPin, Shield, Zap } from "lucide-react";
import { getTripStops, getTrips, type Trip } from "@/domain/transit/schedule";

const rotatingTexts = [
  "Experience the Best BRT Service",
  "Plan Your Commute with Ease",
  "Stay Informed About Routes & Fares",
  "Welcome to the Bus Tracker",
];

/**
 * The first few weekday departures, read from the timetable.
 *
 * These were previously a hardcoded list next to a hand-written stop summary
 * that named a stop ("IIIM") the network does not have and misspelled two
 * others.
 */
const FEATURED_TRIPS = getTrips("weekday").slice(0, 5);

/** "A, B, C, … Z" - enough to convey the corridor without filling the card. */
const summariseStops = (trip: Trip): string => {
  const stops = getTripStops(trip);
  const last = stops[stops.length - 1];

  if (stops.length <= 5) return stops.join(", ");

  return `${stops.slice(0, 4).join(", ")}, … ${last}`;
};

const features = [
  {
    icon: Clock,
    title: "Real-Time Updates",
    description: "Track buses in real-time and get accurate arrival predictions",
  },
  {
    icon: MapPin,
    title: "Route Planning",
    description: "Plan your journey with detailed route information",
  },
  {
    icon: Shield,
    title: "Safe & Reliable",
    description: "Travel with confidence on our secure and maintained buses",
  },
  {
    icon: Zap,
    title: "Fast Service",
    description: "Quick and efficient transportation to your destination",
  },
];

const Home = () => {
  const [textIndex, setTextIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
      setAnimKey((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2ff]">

      <Header />

      <main id="main-content" tabIndex={-1}>

      <section className="relative w-full h-[420px] md:h-[520px] lg:h-[620px] overflow-hidden">

        {/*
          The largest-contentful-paint element. Intrinsic dimensions are
          declared so the browser reserves the space before the image arrives
          (no layout shift), and fetchPriority marks it as the one image worth
          competing for bandwidth.
        */}
        <img
          src={heroBus}
          alt="A BRT bus on the Raipur to Naya Raipur corridor"
          width={1080}
          height={572}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-[#874f9c]/80 via-[#874f9c]/70 to-[#5a3fa0]/85 flex items-center justify-center">

          <div className="text-center px-4 max-w-4xl">

            {/*
              The page's h1. The rotating strapline is decorative, so it is
              not placed in a live region - re-announcing it every three
              seconds would make the page unusable with a screen reader.
            */}
            <h1
              key={animKey}
              className="text-white text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight drop-shadow-lg transition-all duration-700"
            >
              {rotatingTexts[textIndex]}
            </h1>

            <p className="text-white/90 text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
              Your Journey, Our Priority — Fast, Safe, and Reliable
            </p>

          </div>

        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f4f2ff] to-transparent"></div>

      </section>

      <section className="py-20 px-4" aria-labelledby="features-heading">

        <h2 id="features-heading" className="sr-only">
          Why travel with us
        </h2>

        <div className="max-w-7xl mx-auto">

          <div className="relative rounded-[32px] bg-[#faf9ff] px-6 md:px-12 py-14 shadow-[0_30px_90px_rgba(0,0,0,0.06)]">

            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent blur-3xl opacity-70"></div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="group rounded-[22px] p-[1px] bg-gradient-to-br from-purple-200/40 via-purple-100/30 to-transparent transition-all duration-300 hover:-translate-y-[6px]"
                >
                  <div className="rounded-[22px] bg-white/95 backdrop-blur-xl p-6 border border-purple-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:shadow-[0_25px_70px_rgba(0,0,0,0.08)]">

                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-[#874f9c]" />
                    </div>

                    <h3 className="text-[17px] font-semibold text-[#874f9c] mb-2">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-[#7a6aa8] leading-relaxed">
                      {feature.description}
                    </p>

                  </div>
                </div>
              ))}

            </div>

          </div>

        </div>

      </section>

      <section className="pb-24 px-4">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-[34px] md:text-[40px] font-semibold text-[#874f9c] tracking-tight">
              Available buses
            </h2>

            <p className="text-[#7a6aa8] text-[15px] md:text-[16px] mt-3">
              Choose from our scheduled bus services
            </p>
          </div>

          <div className="relative rounded-[30px] bg-[#faf9ff] px-6 md:px-12 py-12 shadow-[0_25px_80px_rgba(0,0,0,0.06)]">

            <div className="absolute inset-0 rounded-[30px] bg-gradient-to-br from-purple-200/30 via-purple-100/20 to-transparent blur-3xl opacity-70"></div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {FEATURED_TRIPS.map((trip, index) => (
                <div
                  key={trip.id}
                  className="group transition-all duration-300 hover:-translate-y-[5px]"
                >
                  <RouteCard
                    title={`BUS ${index + 1} - ${trip.calls[0]?.time} Departure`}
                    stops={summariseStops(trip)}
                  />
                </div>
              ))}

            </div>

          </div>

        </div>

      </section>

      </main>

      <Footer />

    </div>
  );
};

export default Home;