import { Schedule } from "./Schedule";

/**
 * return
 * @targetNSAlias `tns`
 * @targetNamespace `http://wscbs/`
 */
export interface Return {
    /** schedule[] */
    schedule?: Array<Schedule>;
}
