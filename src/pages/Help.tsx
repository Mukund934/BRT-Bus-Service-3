import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ARRIVAL_RULES, TICKET_RULES } from "@/constants/config";
import { ROUTE_IDS, getRoute } from "@/domain/transit/routes";
import { STOPS } from "@/domain/transit/stops";
import { SCHEDULED_STOPS } from "@/domain/transit/schedule";
import { STATUS_LABELS } from "@/domain/ticket/status";
import { BOOKING_FAILURE_MESSAGES } from "@/services/ticketService";
import { DEFAULT_FRESHNESS } from "@/domain/fleet/state";

/*
  Read from the freshness ladder rather than typed as prose, so the page
  cannot claim a window the map no longer applies. It was a single 120-second
  cut-off; a bus is now classified across five states, and the number a
  passenger cares about is the one past which we stop showing it at all.
*/
const staleMinutes = Math.round(DEFAULT_FRESHNESS.staleMs / 60_000);

const Answer = ({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) => (
  <div className="border-t border-border pt-5">
    <h3 className="font-semibold text-gray-900 mb-2">{question}</h3>
    <div className="text-gray-600 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
    <h2 className="text-2xl font-bold text-primary-deep mb-6">{title}</h2>
    <div className="space-y-5">{children}</div>
  </section>
);

const Help = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-white">
      <Header />

      <main id="main-content" tabIndex={-1} className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-deep mb-3">
              Passenger Help
            </h1>
            <p className="text-gray-600">
              How this service works, what your ticket means, and what to do when
              something looks wrong.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Planning a journey">
              <Answer question="Which routes are running?">
                <p>
                  {ROUTE_IDS.length} routes carry passengers on this corridor:{" "}
                  {ROUTE_IDS.map((id) => getRoute(id).name).join(" and ")}.{" "}
                  {getRoute("102").name} is the express variant and skips two
                  stops that {getRoute("101").name} calls at.
                </p>
                <p>
                  <Link to="/routes" className="text-primary font-medium underline">
                    Browse every route and the stops it serves
                  </Link>
                  .
                </p>
              </Answer>

              <Answer question="Why does my stop show no departures?">
                <p>
                  The published timetable covers {SCHEDULED_STOPS.size} of the{" "}
                  {STOPS.length} stops in the network. The rest appear on route maps
                  and in fare lookups, but no departure times have been published for
                  them yet, so nothing can be booked from them.
                </p>
              </Answer>

              <Answer question="Where do the times come from?">
                <p>
                  Departures come from the published weekday and weekend timetables.
                  Weekday and weekend services differ, so a journey that exists on a
                  Monday may not exist on a Sunday.
                </p>
              </Answer>
            </Section>

            <Section title="Fares">
              <Answer question="How is my fare calculated?">
                <p>
                  Fares come from the official BRTS fare chart, not from distance
                  measured on the map. The same fare applies in both directions
                  between any two stops.
                </p>
                <p>
                  <Link to="/fares" className="text-primary font-medium underline">
                    Check the fare between any two stops
                  </Link>
                  .
                </p>
              </Answer>

              <Answer question="Some pairs show no price. Why?">
                <p>
                  A fare is only shown when the official chart lists one for that pair.
                  Nothing is estimated or filled in, so an unpriced pair is reported as
                  unavailable rather than guessed.
                </p>
              </Answer>
            </Section>

            <Section title="Booking a ticket">
              <Answer question="What stops a booking from going through?">
                <p>These are the reasons a booking is refused:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{BOOKING_FAILURE_MESSAGES.NOT_AUTHENTICATED}</li>
                  <li>{BOOKING_FAILURE_MESSAGES.ALREADY_DEPARTED}</li>
                  <li>{BOOKING_FAILURE_MESSAGES.OVERLAPPING_TICKET}</li>
                  <li>{BOOKING_FAILURE_MESSAGES.STORAGE_FAILED}</li>
                </ul>
              </Answer>

              <Answer question="Can I hold two tickets at once?">
                <p>
                  Only if the journeys do not overlap in time. A second ticket covering
                  the same window as one you already hold is refused.
                </p>
              </Answer>
            </Section>

            <Section title="Your ticket">
              <Answer question="What do the ticket states mean?">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-medium">{STATUS_LABELS.ACTIVE}</span> — booked
                    and waiting, more than {TICKET_RULES.BOARDING_WINDOW_MINUTES} minutes
                    before departure.
                  </li>
                  <li>
                    <span className="font-medium">{STATUS_LABELS.BOARDING_SOON}</span> —
                    within {TICKET_RULES.BOARDING_WINDOW_MINUTES} minutes of departure.
                  </li>
                  <li>
                    <span className="font-medium">{STATUS_LABELS.IN_TRANSIT}</span> — the
                    scheduled journey is under way.
                  </li>
                  <li>
                    <span className="font-medium">{STATUS_LABELS.COMPLETED}</span> — the
                    bus has reached your destination.
                  </li>
                  <li>
                    <span className="font-medium">{STATUS_LABELS.CANCELLED}</span> — you
                    cancelled it. This cannot be undone.
                  </li>
                </ul>
                <p>
                  States follow the clock, so a ticket moves through them on its own
                  without you refreshing anything.
                </p>
              </Answer>

              <Answer question="How long does my ticket stay valid?">
                <p>
                  It remains valid for {TICKET_RULES.GRACE_MINUTES} minutes after the
                  scheduled arrival, so a late-running bus does not leave you holding an
                  expired ticket.
                </p>
              </Answer>

              <Answer question="Will my ticket work without a signal?">
                <p>
                  Not reliably. Your ticket is stored on this device, but the app itself
                  has to load before it can show you anything, and loading it needs a
                  connection. Keeping a saved ticket readable without one is planned and
                  not yet built, so do not count on showing a ticket where you have no
                  signal.
                </p>
              </Answer>

              <Answer question="Can I see my tickets on another device?">
                <p>
                  Yes. Sign in with the same account and your tickets and journey history
                  follow you.
                </p>
              </Answer>
            </Section>

            <Section title="Live tracking">
              <Answer question="Which buses appear on the live map?">
                <p>
                  Only buses whose driver is sharing their position. A bus that has not
                  reported for {staleMinutes} minutes is removed, because a position that
                  old no longer tells you where it is.
                </p>
                <p>
                  <Link to="/map" className="text-primary font-medium underline">
                    Open the live map
                  </Link>
                  .
                </p>
              </Answer>

              <Answer question="The map is empty. Is the service running?">
                <p>
                  An empty map means no driver is currently sharing a position. It does
                  not mean the service is suspended — check the timetable for scheduled
                  departures.
                </p>
              </Answer>

              <Answer question="Is the driver identified?">
                <p>
                  No. Each vehicle is shown under a short label such as BUS-4K2P. No
                  driver name, email address or account is published.
                </p>
              </Answer>
            </Section>

            <Section title="Arrival alerts">
              <Answer question="When am I told my bus is close?">
                <p>
                  When a bus that is reporting its position comes within{" "}
                  {ARRIVAL_RULES.ALERT_RADIUS_KM} km of your boarding stop in a straight
                  line, and you are holding a live ticket for that journey.
                </p>
                <p>
                  This is a proximity alert, not an arrival time. It does not know which
                  route that bus is running, which direction it is travelling, or how
                  long the road between you takes, so it never tells you how many minutes
                  away it is. For a time, use the scheduled departure on the timetable.
                </p>
              </Answer>

              <Answer question="How do I turn alerts off?">
                <p>
                  Open your dashboard and switch Arrival Alerts off. Your browser may
                  also ask for permission the first time you switch them on; refusing
                  that only stops the desktop notification, not the in-app one.
                </p>
              </Answer>
            </Section>

            <Section title="Your data">
              <Answer question="What is stored about me?">
                <p>
                  Your name and email address, so your tickets can be shown to you
                  and nobody else. Your tickets are stored with the journey, the
                  fare and the time you booked.
                </p>
                <p>
                  Tickets are kept both on this device and on our servers, so losing
                  one copy does not lose your ticket.
                </p>
              </Answer>

              <Answer question="Is my location tracked?">
                <p>
                  No. Passengers are never located. A bus position comes from the
                  driver's own device, and only while they have chosen to share it
                  for their shift.
                </p>
              </Answer>

              <Answer question="What can other people see?">
                <p>
                  Live bus positions are public, because the map is a public page.
                  Each vehicle appears under a short label such as BUS-4K2P — no
                  driver name, email address or account is published with it.
                </p>
                <p>
                  Your own tickets and journey history are visible only to you when
                  signed in.
                </p>
              </Answer>

              <Answer question="Can I delete my account?">
                <p>
                  Not from inside the app. Accounts are removed on request — please{" "}
                  <Link to="/contact" className="text-primary font-medium underline">
                    contact the team
                  </Link>
                  .
                </p>
              </Answer>
            </Section>

            <Section title="Your account and support">
              <Answer question="I have forgotten my password.">
                <p>
                  Use{" "}
                  <Link to="/login" className="text-primary font-medium underline">
                    Forgot password
                  </Link>{" "}
                  on the sign-in page. A reset link is sent to your email address. For
                  your protection the same confirmation is shown whether or not an
                  account exists for that address.
                </p>
              </Answer>

              <Answer question="Something here looks wrong.">
                <p>
                  Timetable, route and fare data follow the official published sources.
                  If something does not match what you saw at the stop, please{" "}
                  <Link to="/contact" className="text-primary font-medium underline">
                    tell the team
                  </Link>{" "}
                  so it can be checked.
                </p>
              </Answer>
            </Section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
