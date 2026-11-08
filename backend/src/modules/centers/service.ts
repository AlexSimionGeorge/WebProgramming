import { pool, type Queryable } from "../../db/pool.js";
import { HttpError } from "../../http/errors.js";
import { isIdentifier } from "../../shared/schemas.js";
import { findCenterById, listCenterSummaries, listCourts, listOpeningIntervals } from "./repository.js";
import type { CenterDetails, CenterSummary } from "./types.js";

export async function loadCenterDetails(db: Queryable, centerId: string): Promise<CenterDetails | undefined> {
  const center = await findCenterById(db, centerId);
  if (!center) {
    return undefined;
  }
  const courts = await listCourts(db, centerId);
  const openingIntervals = await listOpeningIntervals(db, centerId);
  return { ...center, courtCount: courts.length, courts, openingIntervals };
}

export async function requirePublicCenter(centerId: string): Promise<CenterDetails> {
  const center = isIdentifier(centerId) ? await loadCenterDetails(pool, centerId) : undefined;
  if (!center) {
    throw new HttpError(404, "CENTER_NOT_FOUND", "This centre does not exist");
  }
  return center;
}

export async function listCenters(): Promise<CenterSummary[]> {
  return listCenterSummaries(pool);
}
