import { pathQuery } from "app/admin/query/path-query";
import { queryContent } from "server/query/query-content";
import { PrasiArg } from "server/type";

export const contentAnnualThroughput = async (
  lang: string,
  path: string,
  arg: PrasiArg
) => {
  let throughput = [] as Array<{
    icon: string;
    title: string;
    value: string;
    url: string;
  }>;

  let result = (
    await pathQuery({ path, lang, status: "published", sort: { year: "desc" } })
  ).find((item, i) => item) as any;

  let totalTEUs = 0;

  if (result) {
    totalTEUs = parseInt(result?.domestics) + parseInt(result.international);

    for (let i = 0; i < 3; i++) {
      if (i === 0) {
        throughput.push({
          icon: result.icon
            ? result.icon
            : "/annualthroughput/o2shi0q7bvuhc3velymk.svg",
          title: `TEUs/${result?.year}`,
          value: new Intl.NumberFormat("id-ID").format(totalTEUs),
          url: "/throughput",
        });
      }

      if (i === 1) {
        throughput.push({
          icon: result.icon
            ? result.icon
            : "/annualthroughput/b8hr9ba1xgtnbkpy9uip.svg",
          title: `International TEUs/${result?.year}`,
          value: new Intl.NumberFormat("id-ID").format(
            parseInt(result.international)
          ),
          url: "/throughput",
        });
      }

      if (i === 2) {
        throughput.push({
          icon: result.icon
            ? result.icon
            : "/annualthroughput/eeuar4iusy84ubstk6a7.svg",
          title: `Domestic TEUs/${result?.year}`,
          value: new Intl.NumberFormat("id-ID").format(
            parseInt(result.domestics)
          ),
          url: "/throughput",
        });
      }
    }
  }

  return throughput;
};
