import { TnsvesselSchedule } from "../definitions/TnsvesselSchedule";
import { TnsvesselScheduleResponse } from "../definitions/TnsvesselScheduleResponse";
import { TnsvesselClosingTime } from "../definitions/TnsvesselClosingTime";
import { TnsvesselClosingTimeResponse } from "../definitions/TnsvesselClosingTimeResponse";

export interface VesselPort {
    VesselSchedule(vesselSchedule: TnsvesselSchedule, callback: (err: any, result: TnsvesselScheduleResponse, rawResponse: any, soapHeader: any, rawRequest: any) => void): void;
    VesselClosingTime(vesselClosingTime: TnsvesselClosingTime, callback: (err: any, result: TnsvesselClosingTimeResponse, rawResponse: any, soapHeader: any, rawRequest: any) => void): void;
}
