function normalizeTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function normalizePlaceCountryResolutionMap(value) {
  const rawEntries = value?.entries;
  if (!rawEntries || typeof rawEntries !== 'object') {
    return {
      updated_at: null,
      entries: {},
    };
  }

  const entries = Object.fromEntries(
    Object.entries(rawEntries)
      .filter(([, row]) => row?.country_code && row?.country_name)
      .map(([placeId, row]) => [String(placeId), {
        country_code: String(row.country_code || '').toUpperCase(),
        country_name: String(row.country_name || '').trim(),
        area_id: Number(row.area_id) || null,
        resolved_at: row.resolved_at ? String(row.resolved_at) : null,
      }]),
  );

  return {
    updated_at: value?.updated_at ? String(value.updated_at) : null,
    entries,
  };
}

export function getFeatureCountryCode(feature) {
  const primary = String(feature?.properties?.ISO_A2 || feature?.properties?.iso_a2 || feature?.properties?.['ISO3166-1-Alpha-2'] || '').toUpperCase();
  const fallback = String(feature?.properties?.ISO_A2_EH || feature?.properties?.ADM0_A3_US || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(primary)) return primary;
  if (/^[A-Z]{2}$/.test(fallback)) return fallback;
  return primary || fallback;
}

export function getFeatureCountryName(feature, idx) {
  return String(
    feature?.properties?.ADMIN
    || feature?.properties?.NAME
    || feature?.properties?.name
    || `Country ${idx + 1}`,
  ).trim();
}

export function createBbox() {
  return {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity,
  };
}

export function updateBbox(bbox, lon, lat) {
  bbox.minLon = Math.min(bbox.minLon, lon);
  bbox.minLat = Math.min(bbox.minLat, lat);
  bbox.maxLon = Math.max(bbox.maxLon, lon);
  bbox.maxLat = Math.max(bbox.maxLat, lat);
}

export function computeRingBbox(ring) {
  const bbox = createBbox();
  ring.forEach((point) => {
    const lon = Number(point?.[0]);
    const lat = Number(point?.[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    updateBbox(bbox, lon, lat);
  });
  return bbox;
}

export function bboxContainsPoint(bbox, lon, lat) {
  return lon >= bbox.minLon && lon <= bbox.maxLon && lat >= bbox.minLat && lat <= bbox.maxLat;
}

export function normalizeRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const normalized = ring
    .map((point) => {
      const lon = Number(point?.[0]);
      const lat = Number(point?.[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return [lon, lat];
    })
    .filter(Boolean);

  if (normalized.length < 4) return null;

  const bbox = computeRingBbox(normalized);
  return {
    points: normalized,
    bbox,
    centroid: getPolygonCentroid(normalized, bbox),
    planarArea: getRingPlanarArea(normalized),
  };
}

export function getRingPlanarArea(points) {
  if (!Array.isArray(points) || points.length < 4) return 0;
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    area += (xj * yi) - (xi * yj);
  }
  return Math.abs(area / 2);
}

export function getPolygonCentroid(points, fallbackBbox = null) {
  if (!Array.isArray(points) || points.length < 4) {
    const bbox = fallbackBbox || createBbox();
    return {
      lon: (bbox.minLon + bbox.maxLon) / 2,
      lat: (bbox.minLat + bbox.maxLat) / 2,
    };
  }

  let areaTwice = 0;
  let centroidLon = 0;
  let centroidLat = 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const factor = (xj * yi) - (xi * yj);
    areaTwice += factor;
    centroidLon += (xj + xi) * factor;
    centroidLat += (yj + yi) * factor;
  }

  if (Math.abs(areaTwice) < 1e-9) {
    const bbox = fallbackBbox || computeRingBbox(points);
    return {
      lon: (bbox.minLon + bbox.maxLon) / 2,
      lat: (bbox.minLat + bbox.maxLat) / 2,
    };
  }

  return {
    lon: centroidLon / (3 * areaTwice),
    lat: centroidLat / (3 * areaTwice),
  };
}

export function normalizePolygonSet(coordinates) {
  if (!Array.isArray(coordinates) || !coordinates.length) return null;
  const rings = coordinates.map(normalizeRing).filter(Boolean);
  if (!rings.length) return null;

  const bbox = createBbox();
  rings.forEach((ring) => {
    updateBbox(bbox, ring.bbox.minLon, ring.bbox.minLat);
    updateBbox(bbox, ring.bbox.maxLon, ring.bbox.maxLat);
  });

  const outerRing = rings[0];
  return {
    bbox,
    rings,
    centroid: outerRing?.centroid || getPolygonCentroid([], bbox),
    planarArea: Math.max(outerRing?.planarArea || 0, 0),
  };
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = (Math.sin(dLat / 2) ** 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * (Math.sin(dLon / 2) ** 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildCountryGeometryIndex(geoJson) {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  return features
    .map((feature, idx) => {
      const geometry = feature?.geometry;
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (!code || !geometry) return null;

      const polygonSets = [];
      if (geometry.type === 'Polygon') {
        const polygon = normalizePolygonSet(geometry.coordinates);
        if (polygon) polygonSets.push(polygon);
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonCoords) => {
          const polygon = normalizePolygonSet(polygonCoords);
          if (polygon) polygonSets.push(polygon);
        });
      }

      if (!polygonSets.length) return null;

      const bbox = createBbox();
      polygonSets.forEach((polygon) => {
        updateBbox(bbox, polygon.bbox.minLon, polygon.bbox.minLat);
        updateBbox(bbox, polygon.bbox.maxLon, polygon.bbox.maxLat);
      });

      return {
        code,
        name,
        bbox,
        polygons: polygonSets,
        centroid: getPolygonCentroid([], bbox),
      };
    })
    .filter(Boolean);
}

export function isPointOnSegment(lon, lat, lon1, lat1, lon2, lat2) {
  const cross = (lat - lat1) * (lon2 - lon1) - (lon - lon1) * (lat2 - lat1);
  if (Math.abs(cross) > 1e-10) return false;

  const dot = (lon - lon1) * (lon2 - lon1) + (lat - lat1) * (lat2 - lat1);
  if (dot < 0) return false;

  const squaredLength = ((lon2 - lon1) ** 2) + ((lat2 - lat1) ** 2);
  return dot <= squaredLength;
}

export function pointInRing(lon, lat, ring) {
  if (!bboxContainsPoint(ring.bbox, lon, lat)) return false;

  let inside = false;
  const points = ring.points;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];

    if (isPointOnSegment(lon, lat, xi, yi, xj, yj)) {
      return true;
    }

    const intersects = ((yi > lat) !== (yj > lat))
      && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

export function pointInPolygon(lon, lat, polygon) {
  if (!bboxContainsPoint(polygon.bbox, lon, lat)) return false;
  const [outerRing, ...holes] = polygon.rings;
  if (!outerRing || !pointInRing(lon, lat, outerRing)) return false;
  return !holes.some((hole) => pointInRing(lon, lat, hole));
}

export function bboxArea(bbox) {
  if (!bbox) return Infinity;
  const width = Math.max(0, bbox.maxLon - bbox.minLon);
  const height = Math.max(0, bbox.maxLat - bbox.minLat);
  return width * height;
}

export function locateCountryCandidates(countryIndex, lon, lat) {
  const matches = [];
  for (const country of countryIndex) {
    if (!bboxContainsPoint(country.bbox, lon, lat)) continue;

    for (const polygon of country.polygons) {
      if (!pointInPolygon(lon, lat, polygon)) continue;
      matches.push({
        country_code: country.code,
        country_name: country.name,
        polygon_bbox_area: bboxArea(polygon.bbox),
        polygon_planar_area: polygon.planarArea || bboxArea(polygon.bbox),
        centroid_distance_km: haversineKm(lat, lon, polygon.centroid.lat, polygon.centroid.lon),
      });
      break;
    }
  }

  matches.sort((a, b) => {
    if (a.centroid_distance_km !== b.centroid_distance_km) {
      return a.centroid_distance_km - b.centroid_distance_km;
    }
    if (a.polygon_planar_area !== b.polygon_planar_area) {
      return a.polygon_planar_area - b.polygon_planar_area;
    }
    return a.polygon_bbox_area - b.polygon_bbox_area;
  });

  return matches;
}

export function getResolutionConfidence(matches) {
  if (!matches.length) return 'none';
  if (matches.length === 1) return 'high';

  const [best, second] = matches;
  const bestDistance = Math.max(best.centroid_distance_km, 0.0001);
  const secondDistance = Math.max(second.centroid_distance_km, 0.0001);
  const distanceRatio = secondDistance / bestDistance;
  const areaRatio = Math.max(second.polygon_planar_area || 0.0001, 0.0001) / Math.max(best.polygon_planar_area || 0.0001, 0.0001);

  if (distanceRatio >= 3 || areaRatio >= 8) return 'high';
  if (distanceRatio >= 1.5 || areaRatio >= 3) return 'medium';
  return 'low';
}

export async function getBtcMapPlaceCountryResolutionMap({ memCache, cacheGetJson, cacheKey }) {
  const fromMemory = memCache.get(cacheKey);
  if (fromMemory?.entries) return normalizePlaceCountryResolutionMap(fromMemory);

  const shared = await cacheGetJson(cacheKey);
  const normalized = normalizePlaceCountryResolutionMap(shared);
  memCache.set(cacheKey, normalized);
  return normalized;
}

export async function saveBtcMapPlaceCountryResolutionMap(mapPayload, { memCache, cacheSetJson, cacheKey, cacheTtlSeconds }) {
  const normalized = normalizePlaceCountryResolutionMap(mapPayload);
  normalized.updated_at = normalizeTimestamp();
  memCache.set(cacheKey, normalized);
  await cacheSetJson(cacheKey, normalized, { ttlSeconds: cacheTtlSeconds });
  return normalized;
}

export async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function resolveBtcMapFallbackCountries(candidates, cachedResolutionMap, {
  fetchBtcMapCountryAreaForPlace,
  saveBtcMapPlaceCountryResolutionMap,
  areaLookupConcurrency,
}) {
  const resolvedMap = new Map();
  candidates.forEach((candidate) => {
    const cached = cachedResolutionMap.entries[String(candidate.place.id)];
    if (cached?.country_code && cached?.country_name) {
      resolvedMap.set(candidate.place.id, cached);
    }
  });

  const missingCandidates = candidates.filter((candidate) => !resolvedMap.has(candidate.place.id));
  if (!missingCandidates.length) {
    return {
      resolvedMap,
      updatedResolutionMap: cachedResolutionMap,
      cache_hits: resolvedMap.size,
      cache_misses: 0,
      new_entries: 0,
    };
  }

  const fallbackRows = await mapWithConcurrency(
    missingCandidates,
    areaLookupConcurrency,
    async (candidate) => {
      try {
        const resolved = await fetchBtcMapCountryAreaForPlace(candidate.place.id);
        return resolved ? [candidate.place.id, resolved] : null;
      } catch {
        return null;
      }
    },
  );

  const newEntries = fallbackRows.filter(Boolean);
  newEntries.forEach(([placeId, resolved]) => {
    resolvedMap.set(placeId, resolved);
    cachedResolutionMap.entries[String(placeId)] = resolved;
  });

  const updatedResolutionMap = newEntries.length
    ? await saveBtcMapPlaceCountryResolutionMap(cachedResolutionMap)
    : cachedResolutionMap;

  return {
    resolvedMap,
    updatedResolutionMap,
    cache_hits: candidates.length - missingCandidates.length,
    cache_misses: missingCandidates.length,
    new_entries: newEntries.length,
  };
}

export function buildCountryAccumulator(map, countryCode, countryName) {
  return map.get(countryCode) || {
    country_code: countryCode,
    country_name: countryName,
    businesses: 0,
    verified_businesses: 0,
  };
}

export function addCountryAggregate(map, countryCode, countryName, verified) {
  const existing = buildCountryAccumulator(map, countryCode, countryName);
  existing.businesses += 1;
  if (verified) existing.verified_businesses += 1;
  map.set(countryCode, existing);
}

export function buildBtcMapCountryDiagnostics(places, precomputedMatches, fallbackMap, fallbackStats, resolutionMap) {
  const diagnostics = {
    zero_match_places: 0,
    exact_match_places: 0,
    ambiguous_match_places: 0,
    low_confidence_places: 0,
    fallback_candidates: 0,
    fallback_hits: 0,
    fallback_misses: 0,
    exact_country_cache_size: Object.keys(resolutionMap?.entries || {}).length,
    exact_country_cache_hits: fallbackStats?.cache_hits || 0,
    exact_country_cache_misses: fallbackStats?.cache_misses || 0,
    exact_country_cache_new_entries: fallbackStats?.new_entries || 0,
    overlapping_country_pairs: {},
    sample_ambiguous_places: [],
    sample_unmatched_places: [],
  };

  places.forEach((place, index) => {
    const matches = precomputedMatches[index] || [];
    const confidence = getResolutionConfidence(matches);
    if (!matches.length) diagnostics.zero_match_places += 1;
    if (matches.length === 1) diagnostics.exact_match_places += 1;
    if (matches.length > 1) diagnostics.ambiguous_match_places += 1;
    if (confidence === 'low') diagnostics.low_confidence_places += 1;

    const needsFallback = !matches.length || confidence === 'low';
    if (needsFallback) diagnostics.fallback_candidates += 1;
    if (needsFallback && fallbackMap.has(place.id)) diagnostics.fallback_hits += 1;
    if (needsFallback && !fallbackMap.has(place.id)) diagnostics.fallback_misses += 1;

    if (matches.length > 1) {
      const pairKey = matches.slice(0, 3).map((row) => row.country_code).join(' > ');
      diagnostics.overlapping_country_pairs[pairKey] = (diagnostics.overlapping_country_pairs[pairKey] || 0) + 1;
      if (diagnostics.sample_ambiguous_places.length < 20) {
        diagnostics.sample_ambiguous_places.push({
          id: place.id,
          name: place.name || `Place ${place.id}`,
          lat: place.lat,
          lon: place.lon,
          confidence,
          candidates: matches.slice(0, 3).map((row) => ({
            country_code: row.country_code,
            country_name: row.country_name,
            centroid_distance_km: Number(row.centroid_distance_km.toFixed(2)),
          })),
          fallback_country_code: fallbackMap.get(place.id)?.country_code || null,
        });
      }
    }

    if (!matches.length && diagnostics.sample_unmatched_places.length < 20) {
      diagnostics.sample_unmatched_places.push({
        id: place.id,
        name: place.name || `Place ${place.id}`,
        lat: place.lat,
        lon: place.lon,
        fallback_country_code: fallbackMap.get(place.id)?.country_code || null,
      });
    }
  });

  diagnostics.top_overlaps = Object.entries(diagnostics.overlapping_country_pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pair, count]) => ({ pair, count }));
  delete diagnostics.overlapping_country_pairs;

  return diagnostics;
}

export function getCandidateDistanceMargin(matches) {
  if (!matches.length) return -1;
  if (matches.length === 1) return Number.POSITIVE_INFINITY;
  return matches[1].centroid_distance_km - matches[0].centroid_distance_km;
}

export function buildFallbackCandidateQueue(places, precomputedMatches, maxFallbackLookups) {
  const allCandidates = places
    .map((place, index) => {
      const matches = precomputedMatches[index] || [];
      const confidence = getResolutionConfidence(matches);
      const needsFallback = !matches.length || confidence === 'low';
      if (!needsFallback) return null;
      return {
        place,
        matches,
        confidence,
        top_country_code: matches[0]?.country_code || null,
        distance_margin_km: getCandidateDistanceMargin(matches),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aUnmatched = a.matches.length === 0 ? 0 : 1;
      const bUnmatched = b.matches.length === 0 ? 0 : 1;
      if (aUnmatched !== bUnmatched) return aUnmatched - bUnmatched;
      if (a.distance_margin_km !== b.distance_margin_km) return a.distance_margin_km - b.distance_margin_km;
      return b.matches.length - a.matches.length;
    });

  const queue = [];
  const coveredCodes = new Set();

  allCandidates.forEach((candidate) => {
    if (candidate.top_country_code && !coveredCodes.has(candidate.top_country_code) && queue.length < maxFallbackLookups) {
      queue.push(candidate);
      coveredCodes.add(candidate.top_country_code);
    }
  });

  for (const candidate of allCandidates) {
    if (queue.length >= maxFallbackLookups) break;
    if (queue.some((row) => row.place.id === candidate.place.id)) continue;
    queue.push(candidate);
  }

  return queue;
}

export async function aggregateBtcMapBusinessesByCountry(places, countriesGeoJson, {
  getBtcMapPlaceCountryResolutionMap,
  resolveBtcMapFallbackCountries,
  maxFallbackLookups,
}) {
  const countryIndex = buildCountryGeometryIndex(countriesGeoJson);
  const countryMap = new Map();
  let matchedBusinesses = 0;
  let verifiedBusinesses = 0;
  let unmatchedBusinesses = 0;
  let latestUpdatedAt = null;

  const precomputedMatches = places.map((place) => locateCountryCandidates(countryIndex, place.lon, place.lat));
  const fallbackCandidates = buildFallbackCandidateQueue(places, precomputedMatches, maxFallbackLookups);
  const cachedResolutionMap = await getBtcMapPlaceCountryResolutionMap();
  const fallbackResolution = await resolveBtcMapFallbackCountries(fallbackCandidates, cachedResolutionMap);
  const fallbackMap = fallbackResolution.resolvedMap;

  places.forEach((place, index) => {
    const matches = precomputedMatches[index];
    const fallback = fallbackMap.get(place.id) || null;
    const country = fallback || matches[0] || null;
    const verified = Boolean(place.verified_at);
    const updatedAtMs = Date.parse(place.updated_at || '');
    if (Number.isFinite(updatedAtMs)) {
      latestUpdatedAt = latestUpdatedAt == null ? updatedAtMs : Math.max(latestUpdatedAt, updatedAtMs);
    }

    if (!country) {
      unmatchedBusinesses += 1;
      return;
    }

    matchedBusinesses += 1;
    if (verified) verifiedBusinesses += 1;

    addCountryAggregate(
      countryMap,
      country.country_code || country.code,
      country.country_name || country.name,
      verified,
    );
  });

  const countryCounts = [...countryMap.values()].sort((a, b) => b.businesses - a.businesses);
  const countryLeader = countryCounts[0] || null;
  const diagnostics = buildBtcMapCountryDiagnostics(
    places,
    precomputedMatches,
    fallbackMap,
    fallbackResolution,
    fallbackResolution.updatedResolutionMap,
  );

  return {
    summary: {
      total_places: places.length,
      matched_places: matchedBusinesses,
      unmatched_places: unmatchedBusinesses,
      verified_places: verifiedBusinesses,
      countries_covered: countryCounts.length,
      leader_country_code: countryLeader?.country_code || null,
      leader_country_name: countryLeader?.country_name || null,
      leader_businesses: countryLeader?.businesses || 0,
      latest_place_update_at: latestUpdatedAt ? normalizeTimestamp(new Date(latestUpdatedAt)) : null,
      resolution_method: 'polygon-perimeter + selective btcmap country-area fallback',
    },
    diagnostics,
    country_counts: countryCounts,
  };
}

// Filter out non-European polygons from France's MultiPolygon feature.
// Natural Earth includes French Guiana, Martinique, Réunion, etc. as part of
// France's geometry, causing those overseas territories to be labelled "France"
// on the map. We keep only polygons whose centroid falls within Europe bounds.
function _polygonCentroid(ring) {
  let sumLon = 0, sumLat = 0;
  for (const [lon, lat] of ring) { sumLon += lon; sumLat += lat; }
  return [sumLon / ring.length, sumLat / ring.length];
}
export function _patchFranceOverseas(geoJson) {
  if (!Array.isArray(geoJson?.features)) return geoJson;
  return {
    ...geoJson,
    features: geoJson.features.map((feature) => {
      const iso2eh = String(feature?.properties?.ISO_A2_EH || '').toUpperCase();
      const admin  = String(feature?.properties?.ADMIN || '').toLowerCase();
      if (iso2eh !== 'FR' && admin !== 'france') return feature;
      const geom = feature.geometry;
      if (geom?.type !== 'MultiPolygon') return feature;
      const european = geom.coordinates.filter((poly) => {
        const [lon, lat] = _polygonCentroid(poly[0]);
        return lon > -15 && lon < 20 && lat > 35 && lat < 56;
      });
      if (european.length === 0) return feature; // safety — keep all if nothing matched
      return { ...feature, geometry: { ...geom, coordinates: european } };
    }),
  };
}
