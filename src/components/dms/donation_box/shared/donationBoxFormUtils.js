/** Normalize API dates for <input type="date" /> (YYYY-MM-DD). */
export function toDateInputValue(value) {
  if (value == null || value === '') return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function toSelectValue(value) {
  if (value == null || value === '') return '';
  return String(value);
}

export function getDonationBoxCityName(box) {
  if (!box) return '—';
  return (
    box.city?.name ||
    box.route?.cities?.find((city) => Number(city.id) === Number(box.city_id))?.name ||
    '—'
  );
}

export function getDonationBoxRegionId(box) {
  return toSelectValue(
    box?.city?.region?.id ||
      box?.route?.region?.id ||
      box?.route?.region_id ||
      box?.city?.region_id ||
      '',
  );
}

export function getDonationBoxCityId(box) {
  return toSelectValue(box?.city_id || box?.city?.id || '');
}

export function getDonationBoxRouteId(box) {
  return toSelectValue(box?.route_id || box?.route?.id || '');
}

export function getDonationBoxMapLocation(box) {
  const lat = box?.registration_latitude != null ? Number(box.registration_latitude) : null;
  const lng = box?.registration_longitude != null ? Number(box.registration_longitude) : null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    latitude: lat,
    longitude: lng,
    location_name: box.registration_location_name || null,
    location_details: box.registration_location_details || null,
  };
}
