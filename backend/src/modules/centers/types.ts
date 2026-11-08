export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type OpeningInterval = { weekday: Weekday; opensAt: string; closesAt: string };

export type Court = { id: string; name: string };

export type CenterProfile = {
  name: string;
  address: string;
  city: string;
  slotMinutes: 60 | 90 | 120;
};

export type CenterConfiguration = CenterProfile & {
  courtCount: number;
  openingIntervals: OpeningInterval[];
};

export type CenterDetails = CenterConfiguration & { id: string; courts: Court[] };

export type CenterSummary = { id: string; name: string; address: string; city: string; courtCount: number };
