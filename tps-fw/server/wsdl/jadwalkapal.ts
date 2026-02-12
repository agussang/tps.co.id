import { createClientAsync } from "./tps";
const url = "http://www.tps.co.id:9090/WSCBS/Vessel?WSDL";

const cache = {
  timeout: 60 * 1000,
  sandar: {
    ts: 0,
    data: null as any,
  },
  closing: {
    ts: 0,
    data: null as any,
  },
};

export const jadwalSandarKapal = async () => {
  if (Date.now() - cache.sandar.ts < cache.timeout) return cache.sandar.data;

  const client = await createClientAsync(url);
  client.addSoapHeader(
    `\
<tns:authreq>
  <username>wsvessel</username>
  <password>wsvessel123</password>
</tns:authreq>`
  );

  const res = await client.VesselScheduleAsync({});
  const result = res[0] as any;

  if (result.return) {
    cache.sandar.ts = Date.now();
    cache.sandar.data = result.return.schedule;
    return result.return.schedule;
  } else {
    return [];
  }
};

export const jadwalClosingKapal = async () => {
  if (Date.now() - cache.closing.ts < cache.timeout) return cache.closing.data;

  const client = await createClientAsync(url);
  client.addSoapHeader(
    `\
<tns:authreq>
  <username>wsvessel</username>
  <password>wsvessel123</password>
</tns:authreq>`
  );

  const res = await client.VesselClosingTimeAsync({});
  const result = res[0] as any;

  if (result.return) {
    cache.closing.ts = Date.now();
    cache.closing.data = result.return.closing_time;
    return cache.closing.data;
  } else {
    return [];
  }
};
