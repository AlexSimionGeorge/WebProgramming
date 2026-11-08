import type { PoolClient } from "pg";
import { pool, withTransaction } from "../../db/pool.js";
import { HttpError } from "../../http/errors.js";
import { currentCenterTime, toTimestamp } from "../../shared/clock.js";
import {
  deleteCourtsBeyond,
  findCenterIdByOwner,
  hasUpcomingBookingsOnCourtsBeyond,
  insertNumberedCourts,
  listCourts,
  replaceOpeningIntervals,
  upsertCenter,
} from "../centers/repository.js";
import { loadCenterDetails } from "../centers/service.js";
import type { CenterConfiguration, CenterDetails } from "../centers/types.js";

const centerNotConfigured = () =>
  new HttpError(404, "CENTER_NOT_CONFIGURED", "Set up your centre before using this page");

export async function findOwnCenterId(ownerAccountId: string): Promise<string> {
  const centerId = await findCenterIdByOwner(pool, ownerAccountId);
  if (!centerId) {
    throw centerNotConfigured();
  }
  return centerId;
}

export async function getOwnCenter(ownerAccountId: string): Promise<CenterDetails> {
  const centerId = await findOwnCenterId(ownerAccountId);
  const center = await loadCenterDetails(pool, centerId);
  if (!center) {
    throw centerNotConfigured();
  }
  return center;
}

function positionsBetween(firstPosition: number, lastPosition: number): number[] {
  return Array.from({ length: lastPosition - firstPosition + 1 }, (_, index) => firstPosition + index);
}

async function syncCourts(client: PoolClient, centerId: string, courtCount: number) {
  const existingCourtCount = (await listCourts(client, centerId)).length;

  if (courtCount > existingCourtCount) {
    await insertNumberedCourts(client, centerId, positionsBetween(existingCourtCount + 1, courtCount));
    return;
  }
  if (courtCount < existingCourtCount) {
    const now = toTimestamp(currentCenterTime());
    if (await hasUpcomingBookingsOnCourtsBeyond(client, centerId, courtCount, now)) {
      throw new HttpError(
        409,
        "COURT_HAS_BOOKINGS",
        "A court you are removing still has upcoming bookings",
      );
    }
    await deleteCourtsBeyond(client, centerId, courtCount);
  }
}

export async function configureOwnCenter(
  ownerAccountId: string,
  configuration: CenterConfiguration,
): Promise<CenterDetails> {
  return withTransaction(async (client) => {
    const centerId = await upsertCenter(client, ownerAccountId, configuration);
    await syncCourts(client, centerId, configuration.courtCount);
    await replaceOpeningIntervals(client, centerId, configuration.openingIntervals);
    return (await loadCenterDetails(client, centerId))!;
  });
}
