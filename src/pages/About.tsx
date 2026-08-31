import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  OPERATOR,
  OPERATOR_SOURCE,
  SERVICE_FACTS,
  INFRASTRUCTURE_FACTS,
  PUBLISHED_STOPS,
  type OperatorFact,
} from "@/domain/transit/operator";
import { STOPS } from "@/domain/transit/stops";
import { SCHEDULED_STOPS } from "@/domain/transit/schedule";
import { ROUTE_IDS, NETWORK_ROUTE_IDS, INTERCHANGES } from "@/domain/transit/routes";
import { FARE_TABLE } from "@/domain/transit/fares";
import {
  DEFAULT_FRESHNESS,
  PASSENGER_VISIBLE,
  STATE_LABELS,
  STATE_DESCRIPTIONS,
} from "@/domain/fleet/state";
import { activePaymentProvider } from "@/services/payment/demoProvider";

/*
  Read from the fare chart rather than typed, for the same reason the fares
  page stopped hardcoding prices: a range quoted here would otherwise go on
  claiming a fare the chart no longer lists.
*/
const publishedFares = STOPS.flatMap((from) =>
  STOPS.map((to) => FARE_TABLE[from][to]).filter(
    (fare): fare is number => typeof fare === "number" && fare > 0
  )
);

const lowestFare = Math.min(...publishedFares);
const highestFare = Math.max(...publishedFares);

const staleMinutes = Math.round(DEFAULT_FRESHNESS.staleMs / 60_000);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
    <h2 className="text-2xl font-bold text-primary-deep mb-6">{title}</h2>
    <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
      {children}
    </div>
  </section>
);

const FactList = ({ facts }: { facts: readonly OperatorFact[] }) => (
  <dl className="divide-y divide-border">
    {facts.map(({ label, value, caveat }) => (
      <div key={label} className="py-3 sm:flex sm:justify-between sm:gap-6">
        <dt className="font-medium text-gray-900">{label}</dt>
        <dd className="sm:text-right sm:max-w-md">
          {value}
          {caveat ? (
            <span className="block text-xs text-gray-500 mt-1">{caveat}</span>
          ) : null}
        </dd>
      </div>
    ))}
  </dl>
);

const About = () => {
  const payments = activePaymentProvider();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-white">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-deep mb-3">
              About the BRT corridor
            </h1>
            <p className="text-gray-600">
              What Bus Rapid Transit is, what runs in Nava Raipur, and what this
              site can and cannot tell you about it.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="What Bus Rapid Transit is">
              <p>
                Bus Rapid Transit gives buses their own lane, so they are not held
                up by the traffic beside them. Passengers wait at fixed stations
                rather than at the roadside, board through a platform level with
                the bus floor, and travel to a published timetable.
              </p>
              <p>
                The point of it is that the service becomes predictable. A journey
                that takes twenty minutes today should take twenty minutes
                tomorrow, which is what makes a bus usable for getting to work.
              </p>
            </Section>

            <Section title="The Nava Raipur service">
              <p>
                The corridor is run by {OPERATOR.name} ({OPERATOR.abbreviation}).
                The figures below are the operator&rsquo;s own published numbers
                about their service, not ours.
              </p>

              <FactList facts={SERVICE_FACTS} />

              <h3 className="font-semibold text-gray-900 pt-2">
                Corridor infrastructure
              </h3>
              <FactList facts={INFRASTRUCTURE_FACTS} />

              <p className="text-xs text-gray-500 border-t border-border pt-4">
                Source: {OPERATOR_SOURCE.publication}, {OPERATOR_SOURCE.url}, read
                on {OPERATOR_SOURCE.retrievedOn}. That page has been unreachable
                since {OPERATOR_SOURCE.unreachableSince}, so these figures cannot
                currently be checked against it. They are reproduced as they were
                published and attributed to {OPERATOR.abbreviation}, rather than
                presented as our own.
              </p>
            </Section>

            <Section title="Stops: what is published, and what we list">
              <p>The operator publishes its stopping places in three groups:</p>

              <FactList facts={PUBLISHED_STOPS} />

              <p>
                Our own stop registry holds {STOPS.length} stops, of which{" "}
                {SCHEDULED_STOPS.size} have published departure times. Those
                numbers do not reconcile with the operator&rsquo;s, and we have not
                deleted stops to force a match. Where the two disagree the operator
                is the authority on what exists; we are reporting only what we
                hold.
              </p>
              <p>
                A stop with no departure times still appears in route listings and
                fare lookups. Nothing can be booked from it, because no times have
                been published for it.
              </p>
            </Section>

            <Section title="Routes and the network">
              <p>
                The network is a trunk corridor with feeder routes joining it. We
                list {NETWORK_ROUTE_IDS.length} network routes and{" "}
                {INTERCHANGES.length} interchanges where you can change between
                them. The timetable publishes {ROUTE_IDS.length} numbered workings,
                because one route is operated with more than one stopping pattern.
              </p>
              <p>
                <Link to="/routes" className="text-primary font-medium underline">
                  Browse the network diagram and every route
                </Link>
                .
              </p>
            </Section>

            <Section title="Fares">
              <p>
                Fares come from the official BRTS fare chart. They are not
                calculated from distance, and nothing is estimated: a pair the
                chart does not price is reported as unavailable rather than filled
                in. Published fares run from &#8377;{lowestFare} to &#8377;
                {highestFare}, and the same fare applies in both directions between
                any two stops.
              </p>
              <p>
                <Link to="/fares" className="text-primary font-medium underline">
                  Check the fare between any two stops
                </Link>
                .
              </p>
            </Section>

            <Section title="How to ride">
              <p>
                Find your stop, check when the next bus leaves, look up the fare,
                then board at the platform. Each step has its own page:{" "}
                <Link to="/plan" className="text-primary font-medium underline">
                  plan a journey
                </Link>
                ,{" "}
                <Link
                  to="/timetable"
                  className="text-primary font-medium underline"
                >
                  read the timetable
                </Link>
                , or{" "}
                <Link to="/nearby" className="text-primary font-medium underline">
                  find places near the corridor
                </Link>
                .
              </p>
            </Section>

            <Section title="Live tracking, and what it cannot tell you">
              <p>
                Live positions are published by the driver&rsquo;s own device while
                they are on duty. Coverage is therefore not guaranteed: a bus whose
                driver is not sharing a position is invisible to us even though it
                is running normally. An empty map means we are receiving no
                positions, not that no bus is coming.
              </p>
              <p>
                A reported position is not simply on or off. Every bus we show
                carries one of these states:
              </p>
              <dl className="divide-y divide-border">
                {PASSENGER_VISIBLE.map((state) => (
                  <div key={state} className="py-3">
                    <dt className="font-medium text-gray-900">
                      {STATE_LABELS[state]}
                    </dt>
                    <dd>{STATE_DESCRIPTIONS[state]}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Past about {staleMinutes} minutes we stop showing the bus at all,
                because a position that old says more about where it was than where
                it is. We do not turn any of this into an arrival time: we know
                where a bus reported itself, not what the road ahead of it is
                doing.
              </p>
            </Section>

            <Section title="Digital tickets">
              <p>
                A ticket booked here is kept on your device and on our servers,
                and shown as a code when you open it.{" "}
                {payments.settlesRealMoney
                  ? `Payment is taken through ${payments.label}.`
                  : "Booking is a demonstration: no money changes hands, and a ticket bought here is not accepted as a fare."}
              </p>
              <p>
                It needs a connection to load. Keeping tickets readable without one
                is planned and not yet built, so do not rely on opening a ticket
                where you have no signal.
              </p>
            </Section>

            <Section title="Service updates">
              <p>
                When a disruption is published it appears at the top of every page
                here, not only on the home page, so a bookmark or a deep link
                cannot hide it. Updates come from whoever is authorised to post
                them. We do not write them ourselves, and we do not infer a
                disruption from buses being quiet.
              </p>
            </Section>

            <Section title="Accessibility">
              <p>
                Every page can be reached and operated from the keyboard, with a
                visible focus outline and a skip link to the main content. Page
                changes are announced to screen readers, and the network is offered
                as a table as well as a diagram, so nothing here depends on reading
                a map.
              </p>
              <p>
                Colour is never the only way a state is communicated, and animation
                is reduced automatically when your system asks for that. If
                something here is unusable for you, that is a defect worth
                reporting on the{" "}
                <Link to="/contact" className="text-primary font-medium underline">
                  contact page
                </Link>
                .
              </p>
            </Section>

            <Section title="What we are planning next">
              <p>These are intentions, not features. None of them exists yet:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Publishing the corridor timetable as open transit data, so it can
                  appear in other journey planners rather than only here.
                </li>
                <li>Hindi alongside English.</li>
                <li>Keeping a saved ticket readable without a connection.</li>
              </ul>
            </Section>

            <Section title="Who we are">
              <p>
                This is an independent, student-built project. It is not an
                official {OPERATOR.abbreviation} product, it is not affiliated with
                the operator, and nothing here is endorsed by them. The service
                information is reproduced from published sources with attribution;
                the software is ours.
              </p>
              <p>
                <Link to="/contact" className="text-primary font-medium underline">
                  Who built this, and how to reach us
                </Link>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
