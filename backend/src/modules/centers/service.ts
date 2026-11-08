import type { Queryable } from "../../db/pool.js";
import { findCenterById, listCourts, listOpeningIntervals } from "./repository.js";
import type { CenterDetails } from "./types.js";

export async function loadCenterDetails(db: Queryable, centerId: string): Promise<CenterDetails | undefined> {
  const center = await findCenterById(db, centerId);
  if (!center) {
    return undefined;
  }
  const courts = await listCourts(db, centerId);
  const openingIntervals = await listOpeningIntervals(db, centerId);
  return { ...center, courtCount: courts.length, courts, openingIntervals };
}
