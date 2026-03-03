/**
 * All IANA timezones with their current GMT offset for the select dropdown.
 * Uses Intl.supportedValuesOf('timeZone') when available, with fallback list.
 */

export interface TimezoneOption {
  value: string
  label: string
  offsetMinutes: number
}

/** Get GMT offset string for a timezone (e.g. "GMT+5:30", "GMT-8") */
function getGmtOffsetString(timeZone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    })
    const parts = formatter.formatToParts(date)
    const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value
    return offsetPart ?? "GMT+0"
  } catch {
    return "GMT+0"
  }
}

/** Get offset in minutes from UTC for a timezone (positive = east of UTC) */
function getOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    })
    const parts = formatter.formatToParts(date)
    const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0"
    // Parse "GMT+5:30" or "GMT-8" or "GMT+0"
    const match = offsetPart.match(/GMT([+-])(\d+)(?::(\d+))?/)
    if (!match) return 0
    const sign = match[1] === "+" ? 1 : -1
    const hours = parseInt(match[2], 10)
    const minutes = parseInt(match[3] ?? "0", 10)
    return sign * (hours * 60 + minutes)
  } catch {
    return 0
  }
}

/** Format timezone id as readable label (e.g. "America/New_York" -> "America/New York") */
function formatTimezoneName(value: string): string {
  return value.replace(/_/g, " ")
}

/** Get all supported IANA timezone IDs (with fallback list for older envs) */
function getSupportedTimeZoneIds(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    try {
      return (Intl as IntlSupportedValuesOf).supportedValuesOf("timeZone")
    } catch {
      // fall through to fallback
    }
  }
  // Fallback: common timezones if supportedValuesOf is missing
  return FALLBACK_TIMEZONE_IDS
}

// Type for Intl.supportedValuesOf (ES2022)
interface IntlSupportedValuesOf {
  supportedValuesOf(key: "timeZone"): string[]
}

/**
 * Preferred canonical IANA ID for each unique DST rule.
 * When multiple zones share identical winter+summer offsets, the first match here wins.
 */
const CANONICAL_PREFERENCES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Pacific/Niue",
  "Pacific/Pago_Pago",
  "America/St_Johns",
  "America/Halifax",
  "America/Puerto_Rico",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "America/Noronha",
  "Atlantic/Cape_Verde",
  "Atlantic/Azores",
  "Europe/London",
  "Europe/Paris",
  "Europe/Helsinki",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Asia/Tehran",
  "Asia/Dubai",
  "Asia/Kabul",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Yangon",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Darwin",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Sydney",
  "Pacific/Guadalcanal",
  "Pacific/Auckland",
  "Pacific/Tongatapu",
  "Pacific/Apia",
  "Pacific/Kiritimati",
]

/**
 * Returns a string that uniquely identifies a timezone's DST rules.
 * Two zones with the same signature behave identically all year.
 */
function getDstSignature(timeZone: string): string {
  const year = new Date().getFullYear()
  const winter = getOffsetMinutes(timeZone, new Date(year, 0, 15))
  const summer = getOffsetMinutes(timeZone, new Date(year, 6, 15))
  return `${winter},${summer}`
}

/** Build deduplicated timezone options: one canonical representative per unique DST rule */
function buildTimezoneOptions(): TimezoneOption[] {
  const date = new Date()
  const ids = getSupportedTimeZoneIds()

  // Group all IDs by DST signature
  const groups = new Map<string, string[]>()
  for (const id of ids) {
    const sig = getDstSignature(id)
    const group = groups.get(sig)
    if (group) group.push(id)
    else groups.set(sig, [id])
  }

  // Priority lookup: lower index = higher priority
  const priorityMap = new Map(CANONICAL_PREFERENCES.map((id, i) => [id, i]))

  // Pick one representative per group
  const options: TimezoneOption[] = []
  for (const group of groups.values()) {
    let representative: string | undefined
    let bestPriority = Infinity
    for (const id of group) {
      const p = priorityMap.get(id)
      if (p !== undefined && p < bestPriority) {
        bestPriority = p
        representative = id
      }
    }
    // Fallback: first alphabetically
    if (!representative) representative = group.slice().sort()[0]

    const offsetMinutes = getOffsetMinutes(representative, date)
    const gmtOffset = getGmtOffsetString(representative, date)
    const name = formatTimezoneName(representative)
    options.push({ value: representative, label: `${name} (${gmtOffset})`, offsetMinutes })
  }

  return options.sort((a, b) =>
    a.offsetMinutes !== b.offsetMinutes
      ? a.offsetMinutes - b.offsetMinutes
      : a.label.localeCompare(b.label)
  )
}

/** Cached list of all timezone options (built once) */
let cachedTimezones: TimezoneOption[] | null = null

export function getTimezoneOptions(): TimezoneOption[] {
  if (!cachedTimezones) {
    cachedTimezones = buildTimezoneOptions()
  }
  return cachedTimezones
}

/** For backwards compatibility: array of { value, label } used as TIMEZONES */
export const TIMEZONES: { value: string; label: string }[] = (() => {
  if (typeof window === "undefined") {
    return getInitialTimezonesForSSR()
  }
  return getTimezoneOptions().map(({ value, label }) => ({ value, label }))
})()

/** Get display label for a timezone value (e.g. for person cards). Works for any IANA string. */
export function getTimezoneLabel(value: string): string {
  const opts = typeof window !== "undefined" ? getTimezoneOptions() : getInitialTimezonesForSSR()
  const found = opts.find((t) => t.value === value)
  if (found) return found.label
  const name = formatTimezoneName(value)
  const gmt = getGmtOffsetString(value)
  return `${name} (${gmt})`
}

/** Initial TIMEZONES for SSR / first render before we have Intl.supportedValuesOf */
function getInitialTimezonesForSSR(): { value: string; label: string }[] {
  const date = new Date()
  return FALLBACK_TIMEZONE_IDS.map((value) => {
    const name = formatTimezoneName(value)
    const gmt = getGmtOffsetString(value, date)
    const offsetMinutes = getOffsetMinutes(value, date)
    return { value, label: `${name} (${gmt})`, offsetMinutes }
  })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label))
    .map(({ value, label }) => ({ value, label }))
}

/** Fallback list when Intl.supportedValuesOf('timeZone') is not available */
const FALLBACK_TIMEZONE_IDS = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Addis_Ababa",
  "Africa/Algiers",
  "Africa/Asmara",
  "Africa/Bamako",
  "Africa/Bangui",
  "Africa/Banjul",
  "Africa/Bissau",
  "Africa/Blantyre",
  "Africa/Brazzaville",
  "Africa/Bujumbura",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Ceuta",
  "Africa/Conakry",
  "Africa/Dakar",
  "Africa/Dar_es_Salaam",
  "Africa/Djibouti",
  "Africa/Douala",
  "Africa/El_Aaiun",
  "Africa/Freetown",
  "Africa/Gaborone",
  "Africa/Harare",
  "Africa/Johannesburg",
  "Africa/Juba",
  "Africa/Kampala",
  "Africa/Khartoum",
  "Africa/Kigali",
  "Africa/Kinshasa",
  "Africa/Lagos",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Luanda",
  "Africa/Lubumbashi",
  "Africa/Lusaka",
  "Africa/Malabo",
  "Africa/Maputo",
  "Africa/Maseru",
  "Africa/Mbabane",
  "Africa/Mogadishu",
  "Africa/Monrovia",
  "Africa/Nairobi",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Nouakchott",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Sao_Tome",
  "Africa/Tripoli",
  "Africa/Tunis",
  "Africa/Windhoek",
  "America/Adak",
  "America/Anchorage",
  "America/Anguilla",
  "America/Antigua",
  "America/Araguaina",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Catamarca",
  "America/Argentina/Cordoba",
  "America/Argentina/Jujuy",
  "America/Argentina/La_Rioja",
  "America/Argentina/Mendoza",
  "America/Argentina/Rio_Gallegos",
  "America/Argentina/Salta",
  "America/Argentina/San_Juan",
  "America/Argentina/San_Luis",
  "America/Argentina/Tucuman",
  "America/Argentina/Ushuaia",
  "America/Aruba",
  "America/Asuncion",
  "America/Atikokan",
  "America/Bahia",
  "America/Bahia_Banderas",
  "America/Barbados",
  "America/Belem",
  "America/Belize",
  "America/Blanc-Sablon",
  "America/Boa_Vista",
  "America/Bogota",
  "America/Boise",
  "America/Cambridge_Bay",
  "America/Campo_Grande",
  "America/Cancun",
  "America/Caracas",
  "America/Cayenne",
  "America/Cayman",
  "America/Chicago",
  "America/Chihuahua",
  "America/Ciudad_Juarez",
  "America/Costa_Rica",
  "America/Creston",
  "America/Cuiaba",
  "America/Curacao",
  "America/Danmarkshavn",
  "America/Dawson",
  "America/Dawson_Creek",
  "America/Denver",
  "America/Detroit",
  "America/Dominica",
  "America/Edmonton",
  "America/Eirunepe",
  "America/El_Salvador",
  "America/Fort_Nelson",
  "America/Fortaleza",
  "America/Glace_Bay",
  "America/Goose_Bay",
  "America/Grand_Turk",
  "America/Grenada",
  "America/Guadeloupe",
  "America/Guatemala",
  "America/Guayaquil",
  "America/Guyana",
  "America/Halifax",
  "America/Havana",
  "America/Hermosillo",
  "America/Indiana/Indianapolis",
  "America/Indiana/Knox",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Tell_City",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Inuvik",
  "America/Iqaluit",
  "America/Jamaica",
  "America/Juneau",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Kralendijk",
  "America/La_Paz",
  "America/Lima",
  "America/Los_Angeles",
  "America/Lower_Princes",
  "America/Maceio",
  "America/Managua",
  "America/Manaus",
  "America/Marigot",
  "America/Martinique",
  "America/Matamoros",
  "America/Mazatlan",
  "America/Menominee",
  "America/Merida",
  "America/Metlakatla",
  "America/Mexico_City",
  "America/Miquelon",
  "America/Moncton",
  "America/Monterrey",
  "America/Montevideo",
  "America/Montserrat",
  "America/Nassau",
  "America/New_York",
  "America/Nipigon",
  "America/Nome",
  "America/Noronha",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Nuuk",
  "America/Ojinaga",
  "America/Panama",
  "America/Pangnirtung",
  "America/Paramaribo",
  "America/Phoenix",
  "America/Port-au-Prince",
  "America/Port_of_Spain",
  "America/Porto_Velho",
  "America/Puerto_Rico",
  "America/Punta_Arenas",
  "America/Rainy_River",
  "America/Rankin_Inlet",
  "America/Recife",
  "America/Regina",
  "America/Resolute",
  "America/Rio_Branco",
  "America/Santarem",
  "America/Santiago",
  "America/Santo_Domingo",
  "America/Sao_Paulo",
  "America/Scoresbysund",
  "America/Sitka",
  "America/St_Barthelemy",
  "America/St_Johns",
  "America/St_Kitts",
  "America/St_Lucia",
  "America/St_Thomas",
  "America/St_Vincent",
  "America/Swift_Current",
  "America/Tegucigalpa",
  "America/Thule",
  "America/Tijuana",
  "America/Toronto",
  "America/Tortola",
  "America/Vancouver",
  "America/Whitehorse",
  "America/Winnipeg",
  "America/Yakutat",
  "America/Yellowknife",
  "Antarctica/Casey",
  "Antarctica/Davis",
  "Antarctica/DumontDUrville",
  "Antarctica/Macquarie",
  "Antarctica/Mawson",
  "Antarctica/McMurdo",
  "Antarctica/Palmer",
  "Antarctica/Rothera",
  "Antarctica/Syowa",
  "Antarctica/Troll",
  "Antarctica/Vostok",
  "Arctic/Longyearbyen",
  "Asia/Aden",
  "Asia/Almaty",
  "Asia/Amman",
  "Asia/Anadyr",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Ashgabat",
  "Asia/Atyrau",
  "Asia/Baghdad",
  "Asia/Bahrain",
  "Asia/Baku",
  "Asia/Bangkok",
  "Asia/Barnaul",
  "Asia/Beirut",
  "Asia/Bishkek",
  "Asia/Brunei",
  "Asia/Chita",
  "Asia/Choibalsan",
  "Asia/Colombo",
  "Asia/Damascus",
  "Asia/Dhaka",
  "Asia/Dili",
  "Asia/Dubai",
  "Asia/Dushanbe",
  "Asia/Famagusta",
  "Asia/Gaza",
  "Asia/Hebron",
  "Asia/Ho_Chi_Minh",
  "Asia/Hong_Kong",
  "Asia/Hovd",
  "Asia/Irkutsk",
  "Asia/Jakarta",
  "Asia/Jayapura",
  "Asia/Jerusalem",
  "Asia/Kabul",
  "Asia/Kamchatka",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Khandyga",
  "Asia/Kolkata",
  "Asia/Krasnoyarsk",
  "Asia/Kuala_Lumpur",
  "Asia/Kuching",
  "Asia/Macau",
  "Asia/Magadan",
  "Asia/Makassar",
  "Asia/Manila",
  "Asia/Muscat",
  "Asia/Nicosia",
  "Asia/Novokuznetsk",
  "Asia/Novosibirsk",
  "Asia/Omsk",
  "Asia/Oral",
  "Asia/Phnom_Penh",
  "Asia/Pontianak",
  "Asia/Pyongyang",
  "Asia/Qatar",
  "Asia/Qostanay",
  "Asia/Qyzylorda",
  "Asia/Riyadh",
  "Asia/Sakhalin",
  "Asia/Samarkand",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Srednekolymsk",
  "Asia/Taipei",
  "Asia/Tashkent",
  "Asia/Tbilisi",
  "Asia/Tehran",
  "Asia/Thimphu",
  "Asia/Tokyo",
  "Asia/Tomsk",
  "Asia/Ulaanbaatar",
  "Asia/Urumqi",
  "Asia/Ust-Nera",
  "Asia/Vientiane",
  "Asia/Vladivostok",
  "Asia/Yakutsk",
  "Asia/Yangon",
  "Asia/Yekaterinburg",
  "Asia/Yerevan",
  "Atlantic/Azores",
  "Atlantic/Bermuda",
  "Atlantic/Canary",
  "Atlantic/Cape_Verde",
  "Atlantic/Faroe",
  "Atlantic/Madeira",
  "Atlantic/Reykjavik",
  "Atlantic/South_Georgia",
  "Atlantic/St_Helena",
  "Atlantic/Stanley",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Broken_Hill",
  "Australia/Darwin",
  "Australia/Eucla",
  "Australia/Hobart",
  "Australia/Lindeman",
  "Australia/Lord_Howe",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Andorra",
  "Europe/Astrakhan",
  "Europe/Athens",
  "Europe/Belgrade",
  "Europe/Berlin",
  "Europe/Bratislava",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Busingen",
  "Europe/Chisinau",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Gibraltar",
  "Europe/Guernsey",
  "Europe/Helsinki",
  "Europe/Isle_of_Man",
  "Europe/Istanbul",
  "Europe/Jersey",
  "Europe/Kaliningrad",
  "Europe/Kirov",
  "Europe/Kyiv",
  "Europe/Lisbon",
  "Europe/Ljubljana",
  "Europe/London",
  "Europe/Luxembourg",
  "Europe/Madrid",
  "Europe/Malta",
  "Europe/Mariehamn",
  "Europe/Minsk",
  "Europe/Monaco",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Podgorica",
  "Europe/Prague",
  "Europe/Riga",
  "Europe/Rome",
  "Europe/Samara",
  "Europe/San_Marino",
  "Europe/Sarajevo",
  "Europe/Saratov",
  "Europe/Simferopol",
  "Europe/Skopje",
  "Europe/Sofia",
  "Europe/Stockholm",
  "Europe/Tallinn",
  "Europe/Tirane",
  "Europe/Ulyanovsk",
  "Europe/Vaduz",
  "Europe/Vatican",
  "Europe/Vienna",
  "Europe/Vilnius",
  "Europe/Volgograd",
  "Europe/Warsaw",
  "Europe/Zagreb",
  "Europe/Zurich",
  "Indian/Antananarivo",
  "Indian/Chagos",
  "Indian/Christmas",
  "Indian/Cocos",
  "Indian/Comoro",
  "Indian/Kerguelen",
  "Indian/Mahe",
  "Indian/Maldives",
  "Indian/Mauritius",
  "Indian/Mayotte",
  "Indian/Reunion",
  "Pacific/Apia",
  "Pacific/Auckland",
  "Pacific/Bougainville",
  "Pacific/Chatham",
  "Pacific/Easter",
  "Pacific/Efate",
  "Pacific/Fakaofo",
  "Pacific/Fiji",
  "Pacific/Funafuti",
  "Pacific/Galapagos",
  "Pacific/Gambier",
  "Pacific/Guadalcanal",
  "Pacific/Guam",
  "Pacific/Honolulu",
  "Pacific/Kanton",
  "Pacific/Kiritimati",
  "Pacific/Kosrae",
  "Pacific/Kwajalein",
  "Pacific/Majuro",
  "Pacific/Marquesas",
  "Pacific/Midway",
  "Pacific/Nauru",
  "Pacific/Niue",
  "Pacific/Norfolk",
  "Pacific/Noumea",
  "Pacific/Pago_Pago",
  "Pacific/Palau",
  "Pacific/Pitcairn",
  "Pacific/Pohnpei",
  "Pacific/Port_Moresby",
  "Pacific/Rarotonga",
  "Pacific/Saipan",
  "Pacific/Tahiti",
  "Pacific/Tarawa",
  "Pacific/Tongatapu",
  "Pacific/Wake",
  "Pacific/Wallis",
  "UTC",
]
