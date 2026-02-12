/**
 * WSDL Client untuk Jadwal Kapal TPS
 *
 * Endpoint: http://www.tps.co.id:9090/WSCBS/Vessel
 * Operations: VesselSchedule, VesselClosingTime
 */

const WSDL_URL = "http://www.tps.co.id:9090/WSCBS/Vessel";
const WSDL_USERNAME = "wsvessel";
const WSDL_PASSWORD = "wsvessel123";

// Cache untuk mengurangi request ke WSDL
const cache = {
  timeout: 60 * 1000, // 1 menit
  sandar: {
    ts: 0,
    data: null as any[] | null,
  },
  closing: {
    ts: 0,
    data: null as any[] | null,
  },
};

/**
 * Parse XML response dari WSDL
 */
function parseXmlValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, "g");
  const match = regex.exec(xml);
  return match ? match[1] : "";
}

/**
 * Parse schedule array dari XML response
 */
function parseScheduleArray(xml: string): any[] {
  const schedules: any[] = [];
  const scheduleRegex = /<schedule>([\s\S]*?)<\/schedule>/g;
  let match;

  while ((match = scheduleRegex.exec(xml)) !== null) {
    const scheduleXml = match[1];
    schedules.push({
      int_dom: parseXmlValue(scheduleXml, "int_dom"),
      ves_id: parseXmlValue(scheduleXml, "ves_id"),
      ves_name: parseXmlValue(scheduleXml, "ves_name"),
      in_voyage: parseXmlValue(scheduleXml, "in_voyage"),
      act_berth_ts: parseXmlValue(scheduleXml, "act_berth_ts"),
      est_dep_ts: parseXmlValue(scheduleXml, "est_dep_ts"),
      feeder_direct: parseXmlValue(scheduleXml, "feeder_direct"),
      berth_fr_metre: parseXmlValue(scheduleXml, "berth_fr_metre"),
      berth_to_metre: parseXmlValue(scheduleXml, "berth_to_metre"),
      new_est_dep_ts: parseXmlValue(scheduleXml, "new_est_dep_ts"),
    });
  }

  return schedules;
}

/**
 * Parse closing_time array dari XML response
 */
function parseClosingTimeArray(xml: string): any[] {
  const closingTimes: any[] = [];
  const closingRegex = /<closing_time>([\s\S]*?)<\/closing_time>/g;
  let match;

  while ((match = closingRegex.exec(xml)) !== null) {
    const closingXml = match[1];
    closingTimes.push({
      int_dom: parseXmlValue(closingXml, "int_dom"),
      ves_id: parseXmlValue(closingXml, "ves_id"),
      ves_name: parseXmlValue(closingXml, "ves_name"),
      in_voyage: parseXmlValue(closingXml, "in_voyage"),
      out_voyage: parseXmlValue(closingXml, "out_voyage"),
      eta_ts: parseXmlValue(closingXml, "eta_ts"),
      etd_ts: parseXmlValue(closingXml, "etd_ts"),
      closing_ts: parseXmlValue(closingXml, "closing_ts"),
      feeder_direct: parseXmlValue(closingXml, "feeder_direct"),
      service: parseXmlValue(closingXml, "service"),
      pol: parseXmlValue(closingXml, "pol"),
      pod: parseXmlValue(closingXml, "pod"),
      fpod: parseXmlValue(closingXml, "fpod"),
    });
  }

  return closingTimes;
}

/**
 * Fetch Jadwal Sandar Kapal dari WSDL
 */
export async function jadwalSandarKapal(): Promise<any[]> {
  // Return cached data if still valid
  if (Date.now() - cache.sandar.ts < cache.timeout && cache.sandar.data) {
    return cache.sandar.data;
  }

  try {
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://wscbs/">
  <soap:Header>
    <tns:authreq>
      <username>${WSDL_USERNAME}</username>
      <password>${WSDL_PASSWORD}</password>
    </tns:authreq>
  </soap:Header>
  <soap:Body>
    <tns:VesselSchedule/>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(WSDL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "",
      },
      body: soapRequest,
    });

    if (!response.ok) {
      console.error("WSDL VesselSchedule error:", response.status);
      return cache.sandar.data || [];
    }

    const xml = await response.text();
    const schedules = parseScheduleArray(xml);

    // Update cache
    cache.sandar.ts = Date.now();
    cache.sandar.data = schedules;

    return schedules;
  } catch (e) {
    console.error("jadwalSandarKapal error:", e);
    return cache.sandar.data || [];
  }
}

/**
 * Fetch Jadwal Closing Kapal dari WSDL
 */
export async function jadwalClosingKapal(): Promise<any[]> {
  // Return cached data if still valid
  if (Date.now() - cache.closing.ts < cache.timeout && cache.closing.data) {
    return cache.closing.data;
  }

  try {
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://wscbs/">
  <soap:Header>
    <tns:authreq>
      <username>${WSDL_USERNAME}</username>
      <password>${WSDL_PASSWORD}</password>
    </tns:authreq>
  </soap:Header>
  <soap:Body>
    <tns:VesselClosingTime/>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(WSDL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "",
      },
      body: soapRequest,
    });

    if (!response.ok) {
      console.error("WSDL VesselClosingTime error:", response.status);
      return cache.closing.data || [];
    }

    const xml = await response.text();
    const closingTimes = parseClosingTimeArray(xml);

    // Update cache
    cache.closing.ts = Date.now();
    cache.closing.data = closingTimes;

    return closingTimes;
  } catch (e) {
    console.error("jadwalClosingKapal error:", e);
    return cache.closing.data || [];
  }
}
