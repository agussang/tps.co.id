import { contentNews } from "server/data/content/news/news";
import { contentThroughput } from "server/data/content/throughput";
import { convertDate } from "server/lib";
import { PrasiArg } from "server/type";

export const templateThroughput = async function (
  this: any,
  lang: string
) {
  type IThroughput = {
    year: string;
    month: string;
    domestics: string;
    internaional: string;
  };
  let content = await contentThroughput(lang, "throughput", this);
  content = content.map((ct, x) => {
    let month = parseInt(ct.month);
    return {...ct, month: month < 10 ? `0${month}`: `${month}`}
  }).sort((a, b) => (a.month > b.month ? 1 : -1));

  let groupByYear = content.reduce((init: any, next) => {
    init[next.year] = {
      ...next,
      domestics: new Intl.NumberFormat("id-ID").format(
        parseInt(next.domestics)
      ),
      international: new Intl.NumberFormat("id-ID").format(
        parseInt(next.international)
      ),
      total: new Intl.NumberFormat("id-ID").format(
        parseInt(next.domestics) + parseInt(next.international)
      ),
      last_update:
        new Date(`${next.month} 01 ${next.year}`).toLocaleString("default", {
          month: "long",
        }) +
        " " +
        next.year,
    };

    return init;
  }, {} as IThroughput) as Array<IThroughput>;

  let contentByYear = content.reduce((init: any, next) => {
    const keys = next.year;
    if (!init[keys]) {
      init[keys] = { year: next.year, months: [] };
    }
    init[keys].months.push({
      month: next.month,
      domestics: new Intl.NumberFormat("id-ID").format(
        parseInt(next.domestics)
      ),
      international: new Intl.NumberFormat("id-ID").format(
        parseInt(next.international)
      ),
      total: new Intl.NumberFormat("id-ID").format(
        parseInt(next.domestics) + parseInt(next.international)
      ),
      last_update:
        new Date(`${next.month} 01 ${next.year}`).toLocaleString("default", {
          month: "long",
        }) +
        " " +
        next.year,
    });

    init[keys].months.sort((a: any, b: any) => (b.month > a.month ? -1 : 1));

    return init;
  }, {} as IThroughput) as Array<IThroughput>;

  let annual_report = Object.values(groupByYear).sort((a, b) =>
    b.year > a.year ? -1 : 1
  );

  let annual_report_monthly = Object.values(contentByYear).sort((a, b) =>
    b.year > a.year ? 1 : -1
  );

  let filter_year = [{ label: "All", value: "all" }];
  filter_year = [
    ...filter_year,
    ...Object.keys(groupByYear)
      .sort((a, b) => (b > a ? 1 : -1))
      .map((item, i) => {
        return {
          label: item,
          value: item,
        };
      }),
  ];
  let { news } = await contentNews(0, 5, lang, "latest_news", this);

  let latest_news = news.map((item, i) => {
    return {
      ...item,
      publish_date: convertDate(new Date(item.publish_date), "short"),
    };
  });

  return {
    annual_report,
    annual_report_monthly,
    filter_year,
    latest_news,
  };
};
