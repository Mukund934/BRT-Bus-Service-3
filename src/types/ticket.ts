export type TicketStatus =
  | "PENDING"
  | "ACTIVE"
  | "BOARDING_SOON"
  | "IN_TRANSIT"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";

export interface Ticket {
  ticketId: string;
  paymentId: string;
  userId: string;
  userEmail: string;
  route: string;
  fromStop: string;
  toStop: string;
  fare: number;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  bookingTime: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  status: TicketStatus;
  paymentStatus: PaymentStatus;
  qrData: string;
  validationToken: string;
}

export interface TicketDraft {
  userId: string;
  userEmail: string;
  route: string;
  fromStop: string;
  toStop: string;
  fare: number;
  departureTime: string;
  arrivalTime: string;
  bookingTime: string;
}

export const GRACE_MINUTES = 15;
export const MIDNIGHT_ROLLOVER_HOURS = 12;
export const BOARDING_WINDOW_MINUTES = 15;
export const ARRIVAL_ALERT_MINUTES = 5;

export const STOPS = [
  "HNLU",
  "Balco Medical Center",
  "Sector 30",
  "Sector 29",
  "Sector 27",
  "South Block",
  "Indravati Bhavan",
  "Mahanadi Bhavan",
  "North Block",
  "Ekatm Path",
  "CBD",
  "Sector 15",
  "Telibandha",
  "DKS Bhawan",
  "Raipur Railway Station"
];

export const STOP_COORDS: Record<string, { lat: number; lng: number }> = {
  "HNLU": { lat: 21.2514, lng: 81.6296 },
  "Balco Medical Center": { lat: 21.2480, lng: 81.6350 },
  "Sector 30": { lat: 21.2460, lng: 81.6400 },
  "Sector 29": { lat: 21.2420, lng: 81.6450 },
  "Sector 27": { lat: 21.2400, lng: 81.6480 },
  "South Block": { lat: 21.2380, lng: 81.6510 },
  "Indravati Bhavan": { lat: 21.2360, lng: 81.6540 },
  "Mahanadi Bhavan": { lat: 21.2340, lng: 81.6560 },
  "North Block": { lat: 21.2320, lng: 81.6580 },
  "Ekatm Path": { lat: 21.2300, lng: 81.6600 },
  "CBD": { lat: 21.2280, lng: 81.6620 },
  "Sector 15": { lat: 21.2260, lng: 81.6650 },
  "Telibandha": { lat: 21.2230, lng: 81.6680 },
  "DKS Bhawan": { lat: 21.2200, lng: 81.6710 },
  "Raipur Railway Station": { lat: 21.2100, lng: 81.6300 }
};

export const FARE_MATRIX: Record<string, Record<string, number>> = {
  "Raipur Railway Station": {
    "Raipur Railway Station": 0,
    "DKS Bhawan": 5,
    "Telibandha": 10,
    "Sector 15": 25,
    "CBD": 25,
    "Ekatm Path": 25,
    "North Block": 25,
    "Mahanadi Bhavan": 30,
    "Indravati Bhavan": 30,
    "South Block": 25,
    "Sector 27": 30,
    "Sector 29": 30,
    "HNLU": 35
  },

  "DKS Bhawan": {
    "Raipur Railway Station": 5,
    "DKS Bhawan": 0,
    "Telibandha": 5,
    "Sector 15": 20,
    "CBD": 25,
    "Ekatm Path": 25,
    "North Block": 25,
    "Mahanadi Bhavan": 30,
    "Indravati Bhavan": 30,
    "South Block": 25,
    "Sector 27": 25,
    "Sector 29": 25,
    "HNLU": 30
  },

  "Telibandha": {
    "Raipur Railway Station": 10,
    "DKS Bhawan": 5,
    "Telibandha": 0,
    "Sector 15": 15,
    "CBD": 20,
    "Ekatm Path": 20,
    "North Block": 20,
    "Mahanadi Bhavan": 25,
    "Indravati Bhavan": 25,
    "South Block": 20,
    "Sector 27": 25,
    "Sector 29": 25,
    "HNLU": 25
  },

  "Sector 15": {
    "Raipur Railway Station": 25,
    "DKS Bhawan": 20,
    "Telibandha": 15,
    "Sector 15": 0,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 10,
    "South Block": 5,
    "Sector 27": 10,
    "Sector 29": 10,
    "HNLU": 10
  },

  "CBD": {
    "Raipur Railway Station": 25,
    "DKS Bhawan": 25,
    "Telibandha": 20,
    "Sector 15": 5,
    "CBD": 0,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 5,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 10
  },

  "Ekatm Path": {
    "Raipur Railway Station": 25,
    "DKS Bhawan": 25,
    "Telibandha": 20,
    "Sector 15": 5,
    "CBD": 5,
    "Ekatm Path": 0,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 5,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 5
  },

  "North Block": {
    "Raipur Railway Station": 25,
    "DKS Bhawan": 25,
    "Telibandha": 20,
    "Sector 15": 5,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 0,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 5,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 10
  },

  "Mahanadi Bhavan": {
    "Raipur Railway Station": 30,
    "DKS Bhawan": 30,
    "Telibandha": 25,
    "Sector 15": 5,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 0,
    "Indravati Bhavan": 5,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 10
  },

  "Indravati Bhavan": {
    "Raipur Railway Station": 30,
    "DKS Bhawan": 30,
    "Telibandha": 25,
    "Sector 15": 10,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 0,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 10
  },

  "South Block": {
    "Raipur Railway Station": 25,
    "DKS Bhawan": 25,
    "Telibandha": 20,
    "Sector 15": 5,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 5,
    "South Block": 0,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 5
  },

  "Sector 27": {
    "Raipur Railway Station": 30,
    "DKS Bhawan": 25,
    "Telibandha": 25,
    "Sector 15": 10,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 5,
    "South Block": 5,
    "Sector 27": 0,
    "Sector 29": 5,
    "HNLU": 5
  },

  "Sector 29": {
    "Raipur Railway Station": 30,
    "DKS Bhawan": 25,
    "Telibandha": 25,
    "Sector 15": 10,
    "CBD": 5,
    "Ekatm Path": 5,
    "North Block": 5,
    "Mahanadi Bhavan": 5,
    "Indravati Bhavan": 5,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 0,
    "HNLU": 5
  },


  "Sector 30": {
  "Sector 30": 0,
  "Balco Medical Center": 5,
  "Sector 29": 5,
  "Sector 27": 5,
  "South Block": 5,
  "Indravati Bhavan": 10,
  "Mahanadi Bhavan": 10,
  "North Block": 10,
  "Ekatm Path": 10,
  "CBD": 10,
  "Sector 15": 15,
  "Telibandha": 20,
  "DKS Bhawan": 25,
  "Raipur Railway Station": 30,
  "HNLU": 5
},



  "Balco Medical Center": {
  "Balco Medical Center": 0,
  "Sector 30": 5,
  "Sector 29": 5,
  "Sector 27": 5,
  "South Block": 5,
  "Indravati Bhavan": 10,
  "Mahanadi Bhavan": 10,
  "North Block": 10,
  "Ekatm Path": 10,
  "CBD": 10,
  "Sector 15": 15,
  "Telibandha": 20,
  "DKS Bhawan": 25,
  "Raipur Railway Station": 30,
  "HNLU": 5
},

  "HNLU": {
    "Raipur Railway Station": 35,
    "DKS Bhawan": 30,
    "Telibandha": 25,
    "Sector 15": 10,
    "CBD": 10,
    "Ekatm Path": 5,
    "North Block": 10,
    "Mahanadi Bhavan": 10,
    "Indravati Bhavan": 10,
    "South Block": 5,
    "Sector 27": 5,
    "Sector 29": 5,
    "HNLU": 0
  }
};

export const calculateFare = (from: string, to: string) => {
  if (!from || !to) return 0;
  if (from === to) return 0;

  const fare = FARE_MATRIX[from]?.[to] ?? FARE_MATRIX[to]?.[from];

  if (fare === undefined) {
    console.warn(`Fare not found for ${from} → ${to}`);
    return 0;
  }

  return fare;
};

export const parseTimeToDate = (timeStr: string, baseDate?: string) => {
  const [time = "", modifier] = timeStr.split(" ");
  let [hours = 0, minutes = 0] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const date = baseDate ? new Date(baseDate) : new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

export const getDepartureAt = (ticket: Ticket) =>
  parseTimeToDate(ticket.departureTime, ticket.travelDate);

export const getArrivalAt = (ticket: Ticket) => {
  const departure = getDepartureAt(ticket);
  const arrival = parseTimeToDate(ticket.arrivalTime, ticket.travelDate);

  if (arrival < departure) {
    const gap = departure.getTime() - arrival.getTime();

    if (gap <= MIDNIGHT_ROLLOVER_HOURS * 3600000) return new Date(departure);

    arrival.setDate(arrival.getDate() + 1);
  }

  return arrival;
};

const generateId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

const buildQrPayload = (ticket: Ticket) =>
  JSON.stringify({
    v: 1,
    tid: ticket.ticketId,
    pid: ticket.paymentId,
    uid: ticket.userId,
    route: ticket.route,
    from: ticket.fromStop,
    to: ticket.toStop,
    dep: ticket.departureTime,
    arr: ticket.arrivalTime,
    date: ticket.travelDate,
    fare: ticket.fare,
    exp: ticket.expiresAt,
    tok: ticket.validationToken
  });

export const createTicket = (draft: TicketDraft, now = new Date()): Ticket => {
  const travelDate = new Date(draft.bookingTime).toISOString();

  const base: Ticket = {
    ticketId: generateId("TICKET"),
    paymentId: generateId("PAY"),
    userId: draft.userId,
    userEmail: draft.userEmail,
    route: draft.route,
    fromStop: draft.fromStop,
    toStop: draft.toStop,
    fare: draft.fare,
    departureTime: draft.departureTime,
    arrivalTime: draft.arrivalTime,
    travelDate,
    bookingTime: draft.bookingTime,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: now.toISOString(),
    status: "PENDING",
    paymentStatus: "SUCCESS",
    qrData: "",
    validationToken: generateId("VAL"),
  };

  const expiry = getArrivalAt(base);
  expiry.setMinutes(expiry.getMinutes() + GRACE_MINUTES);
  base.expiresAt = expiry.toISOString();

  base.qrData = buildQrPayload(base);
  base.status = resolveTicketStatus(base, now);

  return base;
};

export const resolveTicketStatus = (ticket: Ticket, now: Date): TicketStatus => {
  if (ticket.status === "CANCELLED") return "CANCELLED";
  if (ticket.paymentStatus !== "SUCCESS") return "PENDING";

  const time = now.getTime();
  const departureAt = getDepartureAt(ticket).getTime();
  const arrivalAt = getArrivalAt(ticket).getTime();

  if (time >= arrivalAt) return "COMPLETED";
  if (time >= departureAt) return "IN_TRANSIT";

  if (departureAt - time <= BOARDING_WINDOW_MINUTES * 60000) return "BOARDING_SOON";

  return "ACTIVE";
};

export const isLiveStatus = (status: TicketStatus) =>
  status === "ACTIVE" || status === "BOARDING_SOON" || status === "IN_TRANSIT";

export const findConflictingTicket =(tickets: Ticket[], departureAt: Date, arrivalAt: Date) => {
  const start = departureAt.getTime();
  const end = arrivalAt.getTime();

  return (
    tickets.find((t) => {
      if (!isLiveStatus(t.status)) return false;

      const existingStart = getDepartureAt(t).getTime();
      const existingEnd = getArrivalAt(t).getTime();

      return start < existingEnd && end > existingStart;
    }) || null
  );
};