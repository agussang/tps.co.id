import { Client as SoapClient, createClientAsync as soapCreateClientAsync } from "soap";
import { TnsvesselSchedule } from "./definitions/TnsvesselSchedule";
import { TnsvesselScheduleResponse } from "./definitions/TnsvesselScheduleResponse";
import { TnsvesselClosingTime } from "./definitions/TnsvesselClosingTime";
import { TnsvesselClosingTimeResponse } from "./definitions/TnsvesselClosingTimeResponse";
import { Vessel } from "./services/Vessel";

export interface TpsClient extends SoapClient {
    Vessel: Vessel;
    VesselScheduleAsync(vesselSchedule: TnsvesselSchedule): Promise<[result: TnsvesselScheduleResponse, rawResponse: any, soapHeader: any, rawRequest: any]>;
    VesselClosingTimeAsync(vesselClosingTime: TnsvesselClosingTime): Promise<[result: TnsvesselClosingTimeResponse, rawResponse: any, soapHeader: any, rawRequest: any]>;
}

/** Create TpsClient */
export function createClientAsync(...args: Parameters<typeof soapCreateClientAsync>): Promise<TpsClient> {
    return soapCreateClientAsync(args[0], args[1], args[2]) as any;
}
