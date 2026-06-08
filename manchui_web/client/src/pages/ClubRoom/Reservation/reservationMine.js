export const DEFAULT_RESERVATION_QUOTA = { limit: 3, count: 0 };

/** GET /api/reservation/mine 응답 파싱 (구·신 형식 호환) */
export function parseMineResponse(data) {
  if (data && Array.isArray(data.reservations)) {
    const list = data.reservations;
    const q = data.quota || {};
    return {
      reservations: list,
      quota: {
        limit:
          Number(q.limit) >= 0 ? Number(q.limit) : DEFAULT_RESERVATION_QUOTA.limit,
        count:
          Number(q.count) >= 0 ? Number(q.count) : list.length,
      },
    };
  }
  if (Array.isArray(data)) {
    return {
      reservations: data,
      quota: { limit: DEFAULT_RESERVATION_QUOTA.limit, count: data.length },
    };
  }
  return { reservations: [], quota: { ...DEFAULT_RESERVATION_QUOTA } };
}
