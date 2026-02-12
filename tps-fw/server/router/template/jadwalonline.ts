import { jadwalClosingKapal, jadwalSandarKapal } from "server/wsdl/jadwalkapal";

export const templateJadwalOnline = async () => {
    
  return {
    jadwal_sandar_kapal: await jadwalSandarKapal(),
    jadwal_closing_kapal: await jadwalClosingKapal(),
  };
};
