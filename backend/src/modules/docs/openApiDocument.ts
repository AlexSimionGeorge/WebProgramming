/**
 * The OpenAPI 3.1 description of the REST API, written from the contract in AGENTS.md and the zod
 * schemas each module validates with. Served as JSON and rendered by Swagger UI at /api/docs.
 */

type JsonObject = { [key: string]: unknown };

const schemaRef = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const listOf = (name: string) => ({ type: "array", items: schemaRef(name) });

const jsonContent = (schema: JsonObject) => ({ "application/json": { schema } });

const jsonBody = (name: string) => ({ required: true, content: jsonContent(schemaRef(name)) });

const ok = (description: string, schema: JsonObject) => ({ description, content: jsonContent(schema) });

const noContent = { description: "Done, nothing to return" };

/** One response per status; the description names every error code that status can carry. */
function failure(status: number, codes: string[]) {
  return { [status]: { description: codes.map((code) => `\`${code}\``).join(", "), content: jsonContent(schemaRef("Error")) } };
}

const validationFailure = failure(400, ["VALIDATION_ERROR", "INVALID_JSON"]);
const signedOut = failure(401, ["UNAUTHENTICATED"]);
const wrongRole = failure(403, ["FORBIDDEN"]);

const bearer = [{ bearerAuth: [] }];

const uuidParameter = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});

const indexParameter = (name: string, description: string, maximum?: number) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "integer", minimum: 1, ...(maximum ? { maximum } : {}) },
});

const dateQuery = {
  name: "date",
  in: "query",
  required: true,
  description: "Centre-local calendar day",
  schema: { type: "string", format: "date", example: "2026-12-05" },
};

const calendarDate = { type: "string", format: "date", example: "2026-12-05" };
const wallClockTime = { type: "string", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$", example: "18:00" };
const uuid = { type: "string", format: "uuid" };

const schemas = {
  Error: {
    type: "object",
    required: ["error"],
    properties: {
      error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string", example: "SLOT_TAKEN" },
          message: { type: "string", example: "Someone already booked this court at this time" },
        },
      },
    },
  },

  AccountRole: { type: "string", enum: ["centerAdmin", "player"] },
  Account: {
    type: "object",
    required: ["id", "email", "displayName", "role"],
    properties: { id: uuid, email: { type: "string", format: "email" }, displayName: { type: "string" }, role: schemaRef("AccountRole") },
  },
  Registration: {
    type: "object",
    required: ["email", "password", "displayName", "role"],
    properties: {
      email: { type: "string", format: "email", example: "ana@example.com" },
      password: { type: "string", minLength: 8, example: "padel-1234" },
      displayName: { type: "string", minLength: 1, maxLength: 100, example: "Ana" },
      role: schemaRef("AccountRole"),
    },
  },
  LoginCredentials: {
    type: "object",
    required: ["email", "password"],
    properties: { email: { type: "string", format: "email", example: "ana@example.com" }, password: { type: "string", example: "padel-1234" } },
  },
  Session: {
    type: "object",
    required: ["token", "account"],
    properties: { token: { type: "string", description: "Send it as `Authorization: Bearer <token>`" }, account: schemaRef("Account") },
  },

  Court: { type: "object", required: ["id", "name"], properties: { id: uuid, name: { type: "string", example: "Court 1" } } },
  OpeningInterval: {
    type: "object",
    required: ["weekday", "opensAt", "closesAt"],
    properties: {
      weekday: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7], description: "ISO weekday: 1 = Monday … 7 = Sunday" },
      opensAt: { ...wallClockTime, example: "08:00" },
      closesAt: { type: "string", description: "HH:MM or 24:00, after opensAt", example: "22:00" },
    },
  },
  CenterConfiguration: {
    type: "object",
    required: ["name", "address", "city", "courtCount", "slotMinutes", "openingIntervals"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 200, example: "Padel Arena" },
      address: { type: "string", minLength: 1, maxLength: 200, example: "Strada Lungă 12" },
      city: { type: "string", minLength: 1, maxLength: 200, example: "Brașov" },
      courtCount: { type: "integer", minimum: 1, maximum: 20, example: 4 },
      slotMinutes: { type: "integer", enum: [60, 90, 120], example: 90 },
      openingIntervals: {
        type: "array",
        description: "Several per weekday allowed; intervals on the same weekday must not overlap",
        items: schemaRef("OpeningInterval"),
      },
    },
  },
  CenterDetails: {
    allOf: [
      schemaRef("CenterConfiguration"),
      { type: "object", required: ["id", "courts"], properties: { id: uuid, courts: listOf("Court") } },
    ],
  },
  CenterSummary: {
    type: "object",
    required: ["id", "name", "address", "city", "courtCount"],
    properties: { id: uuid, name: { type: "string" }, address: { type: "string" }, city: { type: "string" }, courtCount: { type: "integer" } },
  },
  CenterAddress: {
    type: "object",
    required: ["id", "name", "address", "city"],
    properties: { id: uuid, name: { type: "string" }, address: { type: "string" }, city: { type: "string" } },
  },

  Slot: {
    type: "object",
    required: ["startsAt", "endsAt", "freeCourtIds"],
    properties: { startsAt: wallClockTime, endsAt: wallClockTime, freeCourtIds: { type: "array", items: uuid } },
  },
  DayAvailability: {
    type: "object",
    required: ["date", "slotMinutes", "slots"],
    properties: { date: calendarDate, slotMinutes: { type: "integer" }, slots: listOf("Slot") },
  },
  CityAvailability: {
    type: "object",
    required: ["date", "centers"],
    properties: {
      date: calendarDate,
      centers: {
        type: "array",
        description: "Sorted by centre name; closed centres are included with `slots: []`",
        items: {
          type: "object",
          required: ["center", "slotMinutes", "courts", "slots"],
          properties: { center: schemaRef("CenterSummary"), slotMinutes: { type: "integer" }, courts: listOf("Court"), slots: listOf("Slot") },
        },
      },
    },
  },

  Person: { type: "object", required: ["id", "displayName"], properties: { id: uuid, displayName: { type: "string" } } },
  BookingRequest: {
    type: "object",
    required: ["courtId", "date", "startsAt"],
    properties: { courtId: uuid, date: calendarDate, startsAt: wallClockTime },
  },
  PlayerBooking: {
    type: "object",
    required: ["id", "date", "startsAt", "endsAt", "court", "center", "gameId"],
    properties: {
      id: uuid,
      date: calendarDate,
      startsAt: wallClockTime,
      endsAt: wallClockTime,
      court: schemaRef("Court"),
      center: schemaRef("CenterAddress"),
      gameId: uuid,
    },
  },
  AdminBooking: {
    type: "object",
    required: ["id", "date", "startsAt", "endsAt", "court", "player", "players"],
    properties: {
      id: uuid,
      date: calendarDate,
      startsAt: wallClockTime,
      endsAt: wallClockTime,
      court: schemaRef("Court"),
      player: {
        type: "object",
        description: "Who booked",
        required: ["displayName", "email"],
        properties: { displayName: { type: "string" }, email: { type: "string", format: "email" } },
      },
      players: { ...listOf("Person"), description: "The filled seats, host first" },
    },
  },

  Friendship: {
    type: "object",
    required: ["id", "person", "status", "direction"],
    properties: {
      id: uuid,
      person: { ...schemaRef("Person"), description: "Always the other side" },
      status: { type: "string", enum: ["pending", "accepted"] },
      direction: { type: "string", enum: ["incoming", "outgoing"], description: "Who asked; kept after acceptance" },
    },
  },
  PersonSearchResult: {
    allOf: [
      schemaRef("Person"),
      { type: "object", required: ["friendship"], properties: { friendship: { oneOf: [schemaRef("Friendship"), { type: "null" }] } } },
    ],
  },
  PersonReference: { type: "object", required: ["personId"], properties: { personId: uuid } },

  GameSeat: {
    type: "object",
    required: ["index", "status", "person"],
    properties: {
      index: { type: "integer", enum: [1, 2, 3, 4], description: "Seats 1 + 2 are team A, 3 + 4 team B" },
      status: { type: "string", enum: ["empty", "invited", "filled"] },
      person: { oneOf: [schemaRef("Person"), { type: "null" }] },
    },
  },
  SetScore: {
    type: "object",
    required: ["teamA", "teamB"],
    properties: { teamA: { type: "integer", minimum: 0, maximum: 15, example: 6 }, teamB: { type: "integer", minimum: 0, maximum: 15, example: 4 } },
  },
  GameSet: { allOf: [{ type: "object", required: ["index"], properties: { index: { type: "integer", minimum: 1 } } }, schemaRef("SetScore")] },
  Game: {
    type: "object",
    required: ["id", "bookingId", "date", "startsAt", "endsAt", "center", "court", "host", "seats", "sets", "setsWon", "finishedAt", "viewer"],
    properties: {
      id: uuid,
      bookingId: uuid,
      date: calendarDate,
      startsAt: wallClockTime,
      endsAt: wallClockTime,
      center: schemaRef("CenterAddress"),
      court: schemaRef("Court"),
      host: schemaRef("Person"),
      seats: { ...listOf("GameSeat"), description: "Always four, ordered by index" },
      sets: { ...listOf("GameSet"), description: "Ordered by index, contiguous from 1" },
      setsWon: {
        type: "object",
        description: "A drawn set counts for nobody; the last set counts only once the game is finished",
        required: ["teamA", "teamB"],
        properties: { teamA: { type: "integer" }, teamB: { type: "integer" } },
      },
      finishedAt: { type: ["string", "null"], format: "date-time" },
      viewer: {
        type: "object",
        required: ["isHost", "seatIndex", "isInvited", "canScore"],
        properties: {
          isHost: { type: "boolean" },
          seatIndex: { type: ["integer", "null"] },
          isInvited: { type: "boolean" },
          canScore: { type: "boolean" },
        },
      },
    },
  },
};

const gameId = uuidParameter("gameId", "The game");
const gameResponse = (description: string) => ({ 200: ok(description, schemaRef("Game")) });
const gameNotFound = failure(404, ["GAME_NOT_FOUND"]);

const paths = {
  "/api/health": {
    get: {
      tags: ["Health"],
      summary: "Is the API up",
      responses: { 200: ok("Up", { type: "object", properties: { status: { type: "string", example: "ok" } } }) },
    },
  },

  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Create an account and sign in",
      requestBody: jsonBody("Registration"),
      responses: { 201: ok("Signed in as the new account", schemaRef("Session")), ...validationFailure, ...failure(409, ["EMAIL_TAKEN"]) },
    },
  },
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Sign in",
      description: "Copy the returned `token` into **Authorize** to call the protected endpoints.",
      requestBody: jsonBody("LoginCredentials"),
      responses: { 200: ok("Signed in", schemaRef("Session")), ...validationFailure, ...failure(401, ["INVALID_CREDENTIALS"]) },
    },
  },
  "/api/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "The signed-in account",
      security: bearer,
      responses: { 200: ok("The account", { type: "object", required: ["account"], properties: { account: schemaRef("Account") } }), ...signedOut },
    },
  },

  "/api/admin/center": {
    get: {
      tags: ["Centre admin"],
      summary: "Read your centre",
      security: bearer,
      responses: { 200: ok("Your centre", schemaRef("CenterDetails")), ...signedOut, ...wrongRole, ...failure(404, ["CENTER_NOT_CONFIGURED"]) },
    },
    put: {
      tags: ["Centre admin"],
      summary: "Create or update your centre",
      description: "Creates the centre on the first call and updates it after. Courts and opening intervals are synced in one transaction.",
      security: bearer,
      requestBody: jsonBody("CenterConfiguration"),
      responses: {
        200: ok("The saved centre", schemaRef("CenterDetails")),
        ...validationFailure,
        ...signedOut,
        ...wrongRole,
        ...failure(409, ["COURT_HAS_BOOKINGS"]),
      },
    },
  },
  "/api/admin/bookings": {
    get: {
      tags: ["Centre admin"],
      summary: "Your centre's bookings on one day",
      security: bearer,
      parameters: [dateQuery],
      responses: { 200: ok("Bookings of that day", listOf("AdminBooking")), ...validationFailure, ...signedOut, ...wrongRole, ...failure(404, ["CENTER_NOT_CONFIGURED"]) },
    },
  },

  "/api/centers": {
    get: { tags: ["Public"], summary: "Every centre", responses: { 200: ok("All centres", listOf("CenterSummary")) } },
  },
  "/api/centers/{centerId}": {
    get: {
      tags: ["Public"],
      summary: "One centre with its courts and opening hours",
      parameters: [uuidParameter("centerId", "The centre")],
      responses: { 200: ok("The centre", schemaRef("CenterDetails")), ...failure(404, ["CENTER_NOT_FOUND"]) },
    },
  },
  "/api/centers/{centerId}/availability": {
    get: {
      tags: ["Public"],
      summary: "Free courts per slot for one centre and day",
      description: "Slots that already started today are omitted. A closed day returns `slots: []`.",
      parameters: [uuidParameter("centerId", "The centre"), dateQuery],
      responses: { 200: ok("The day", schemaRef("DayAvailability")), ...validationFailure, ...failure(404, ["CENTER_NOT_FOUND"]) },
    },
  },
  "/api/availability": {
    get: {
      tags: ["Public"],
      summary: "Every centre's free courts on one day",
      parameters: [dateQuery],
      responses: { 200: ok("Every centre's day", schemaRef("CityAvailability")), ...validationFailure },
    },
  },

  "/api/bookings": {
    post: {
      tags: ["Bookings"],
      summary: "Book a court",
      description: "Also creates the game behind the booking, with the booker in seat 1 as host.",
      security: bearer,
      requestBody: jsonBody("BookingRequest"),
      responses: {
        201: ok("The booking", schemaRef("PlayerBooking")),
        ...failure(400, ["VALIDATION_ERROR", "NOT_A_SLOT", "SLOT_IN_PAST"]),
        ...signedOut,
        ...wrongRole,
        ...failure(404, ["COURT_NOT_FOUND"]),
        ...failure(409, ["SLOT_TAKEN"]),
      },
    },
  },
  "/api/bookings/mine": {
    get: {
      tags: ["Bookings"],
      summary: "Your bookings, newest date first",
      security: bearer,
      responses: { 200: ok("Your bookings", listOf("PlayerBooking")), ...signedOut, ...wrongRole },
    },
  },
  "/api/bookings/{bookingId}": {
    delete: {
      tags: ["Bookings"],
      summary: "Cancel your booking before it starts",
      description: "Cancelling the booking also cancels its game.",
      security: bearer,
      parameters: [uuidParameter("bookingId", "The booking")],
      responses: { 204: noContent, ...failure(400, ["BOOKING_ALREADY_STARTED"]), ...signedOut, ...wrongRole, ...failure(404, ["BOOKING_NOT_FOUND"]) },
    },
  },

  "/api/people": {
    get: {
      tags: ["People and friends"],
      summary: "Find players by display name or exact email",
      description: "Matches anywhere in the display name (case-insensitive) or a whole email. Never returns yourself; at most 20.",
      security: bearer,
      parameters: [{ name: "query", in: "query", required: true, schema: { type: "string", minLength: 2, maxLength: 200, example: "an" } }],
      responses: { 200: ok("Matching players", listOf("PersonSearchResult")), ...validationFailure, ...signedOut, ...wrongRole },
    },
  },
  "/api/friends": {
    get: {
      tags: ["People and friends"],
      summary: "Your friendships, accepted and pending, both directions",
      security: bearer,
      responses: { 200: ok("Your friendships", listOf("Friendship")), ...signedOut, ...wrongRole },
    },
    post: {
      tags: ["People and friends"],
      summary: "Ask someone to be friends",
      description: "If they had already asked you, their request is accepted instead and the answer is `200`.",
      security: bearer,
      requestBody: jsonBody("PersonReference"),
      responses: {
        200: ok("Their pending request to you was accepted", schemaRef("Friendship")),
        201: ok("Request sent", schemaRef("Friendship")),
        ...failure(400, ["VALIDATION_ERROR", "CANNOT_FRIEND_YOURSELF"]),
        ...signedOut,
        ...wrongRole,
        ...failure(404, ["PERSON_NOT_FOUND"]),
        ...failure(409, ["ALREADY_FRIENDS", "REQUEST_PENDING"]),
      },
    },
  },
  "/api/friends/{friendshipId}/accept": {
    post: {
      tags: ["People and friends"],
      summary: "Accept an incoming request",
      security: bearer,
      parameters: [uuidParameter("friendshipId", "The friendship")],
      responses: {
        200: ok("Now friends", schemaRef("Friendship")),
        ...signedOut,
        ...failure(403, ["FORBIDDEN", "NOT_YOUR_REQUEST_TO_ACCEPT"]),
        ...failure(404, ["FRIENDSHIP_NOT_FOUND"]),
        ...failure(409, ["ALREADY_FRIENDS"]),
      },
    },
  },
  "/api/friends/{friendshipId}": {
    delete: {
      tags: ["People and friends"],
      summary: "Decline, withdraw or unfriend",
      security: bearer,
      parameters: [uuidParameter("friendshipId", "The friendship")],
      responses: { 204: noContent, ...signedOut, ...wrongRole, ...failure(404, ["FRIENDSHIP_NOT_FOUND"]) },
    },
  },

  "/api/games/mine": {
    get: {
      tags: ["Games"],
      summary: "Games you host, sit in or are invited to",
      description: "Upcoming first (soonest), then past (newest).",
      security: bearer,
      responses: { 200: ok("Your games", listOf("Game")), ...signedOut, ...wrongRole },
    },
  },
  "/api/games/{gameId}": {
    get: {
      tags: ["Games"],
      summary: "One game",
      description: "Only for the host, a seated player or an invitee.",
      security: bearer,
      parameters: [gameId],
      responses: { ...gameResponse("The game"), ...signedOut, ...wrongRole, ...gameNotFound },
    },
  },
  "/api/games/{gameId}/invitations": {
    post: {
      tags: ["Games"],
      summary: "Invite a friend into the lowest empty seat (host only)",
      security: bearer,
      parameters: [gameId],
      requestBody: jsonBody("PersonReference"),
      responses: {
        ...gameResponse("The game with the friend invited"),
        ...validationFailure,
        ...signedOut,
        ...failure(403, ["FORBIDDEN", "NOT_HOST", "NOT_A_FRIEND"]),
        ...gameNotFound,
        ...failure(409, ["GAME_FULL", "ALREADY_IN_GAME"]),
      },
    },
  },
  "/api/games/{gameId}/invitation/accept": {
    post: {
      tags: ["Games"],
      summary: "Accept your invitation: your seat becomes filled",
      security: bearer,
      parameters: [gameId],
      responses: { ...gameResponse("The game"), ...signedOut, ...wrongRole, ...failure(404, ["GAME_NOT_FOUND", "INVITATION_NOT_FOUND"]) },
    },
  },
  "/api/games/{gameId}/invitation/decline": {
    post: {
      tags: ["Games"],
      summary: "Decline your invitation: the seat becomes empty",
      security: bearer,
      parameters: [gameId],
      responses: { ...gameResponse("The game"), ...signedOut, ...wrongRole, ...failure(404, ["GAME_NOT_FOUND", "INVITATION_NOT_FOUND"]) },
    },
  },
  "/api/games/{gameId}/seats/{seatIndex}": {
    delete: {
      tags: ["Games"],
      summary: "Free a seat",
      description: "The host withdraws an invitation or removes a player (never their own seat). A seated player may free their own seat to leave.",
      security: bearer,
      parameters: [gameId, indexParameter("seatIndex", "Seat 1–4", 4)],
      responses: {
        ...gameResponse("The game"),
        ...failure(400, ["VALIDATION_ERROR", "HOST_CANNOT_LEAVE"]),
        ...signedOut,
        ...failure(403, ["FORBIDDEN", "NOT_YOUR_SEAT"]),
        ...gameNotFound,
        ...failure(409, ["SEAT_ALREADY_EMPTY"]),
      },
    },
  },
  "/api/games/{gameId}/sets/{setIndex}": {
    put: {
      tags: ["Games"],
      summary: "Record or change a set's score",
      description: "Needs `viewer.canScore` (host or a filled seat). The index may be at most `sets.length + 1`.",
      security: bearer,
      parameters: [gameId, indexParameter("setIndex", "Set number, from 1")],
      requestBody: jsonBody("SetScore"),
      responses: {
        ...gameResponse("The game"),
        ...failure(400, ["VALIDATION_ERROR", "SET_OUT_OF_RANGE"]),
        ...signedOut,
        ...failure(403, ["FORBIDDEN", "CANNOT_SCORE"]),
        ...gameNotFound,
      },
    },
    delete: {
      tags: ["Games"],
      summary: "Remove a set; the higher sets move down one",
      security: bearer,
      parameters: [gameId, indexParameter("setIndex", "Set number, from 1")],
      responses: {
        ...gameResponse("The game"),
        ...validationFailure,
        ...signedOut,
        ...failure(403, ["FORBIDDEN", "CANNOT_SCORE"]),
        ...failure(404, ["GAME_NOT_FOUND", "SET_NOT_FOUND"]),
      },
    },
  },
  "/api/games/{gameId}/finish": {
    post: {
      tags: ["Games"],
      summary: "Mark the game finished",
      security: bearer,
      parameters: [gameId],
      responses: { ...gameResponse("The game"), ...signedOut, ...failure(403, ["FORBIDDEN", "CANNOT_SCORE"]), ...gameNotFound },
    },
  },
  "/api/games/{gameId}/reopen": {
    post: {
      tags: ["Games"],
      summary: "Clear finishedAt",
      security: bearer,
      parameters: [gameId],
      responses: { ...gameResponse("The game"), ...signedOut, ...failure(403, ["FORBIDDEN", "CANNOT_SCORE"]), ...gameNotFound },
    },
  },
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Padel Booking API",
    version: "0.1.0",
    description:
      "Padel centres describe their courts and opening hours; players find a free slot, book it, and every booking is a game of four with friends and a score.\n\n" +
      "Times are centre-local wall-clock: dates `YYYY-MM-DD`, times `HH:MM`. Errors look like `{ \"error\": { \"code\", \"message\" } }`.\n\n" +
      "**To try the protected endpoints:** register or log in, copy the `token`, press **Authorize** and paste it.",
  },
  servers: [{ url: "/", description: "This server" }],
  tags: [
    { name: "Health" },
    { name: "Auth", description: "Accounts and bearer tokens" },
    { name: "Centre admin", description: "Role `centerAdmin`" },
    { name: "Public", description: "No sign-in needed" },
    { name: "Bookings", description: "Role `player`" },
    { name: "People and friends", description: "Role `player`" },
    { name: "Games", description: "Role `player`. Every booking is a game; seats 1 + 2 are team A, 3 + 4 team B" },
  ],
  paths,
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas,
  },
} as const;
