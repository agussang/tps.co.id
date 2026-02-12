import { convertDate, getBase64Image } from "server/lib";
import { log } from "server/log";
import { jadwalClosingKapal, jadwalSandarKapal } from "server/wsdl/jadwalkapal";
import { contentAnnualThroughput } from "./content/annualthroughput";
import { contentBannerHome } from "./content/bannerhome";
import { contentNews } from "./content/news/news";
import { contentPelangganKami } from "./content/pelanggankami";
import { contentTentangKami } from "./content/profile/tentangkami";
import { contentServices } from "./content/services";
import { contentSosmed } from "./content/sosmed";
import { contentPopup } from "./content/popup";
import * as dataIG from "./ig.json";

interface IIntargram {
  time: number;
  data: Array<{
    media: string;
    url: string;
    id: string;
  }>;
}
const cache = {
  ig: {} as IIntargram,
};

export const home = async function (this: any, lang: string) {
  let language = lang as string;
  if (lang === "id-id") {
    language = "id";
  }

  let igJSON = await dataIG;
  const minutesExec = 60000 * 10; // 10 minutes
  const timeExec = new Date().getTime() + minutesExec;
  let igData = [] as any;

  // disable fetchIG to prevent to many request isssue
  // if (!cache.ig.time) {
  //   cache.ig.time = timeExec;
  //   cache.ig.data = [];

  //   const fetchIG = await reCacheIG(timeExec);
  //   if (!fetchIG) {
  //     if (igJSON.data && igJSON.data.length > 0) {
  //       for (let ig of igJSON.data) {
  //         cache.ig.data.push(ig);
  //       }
  //     }
  //   }
  // } else {
  //   if (new Date().getTime() >= cache.ig.time) {
  //     reCacheIG(timeExec);
  //   }
  // }

  // load data ig from json file
  if (igJSON.data && igJSON.data.length > 0) {
    cache.ig.data = [];
    for (let igdata of igJSON.data) {
      cache.ig.data.push(igdata);
    }
  }
  
  log.now("result_00");

  igData = cache.ig.data;

  let latest_news = [];
  const { news } = await contentNews(0, 5, language, "press_release", this);
  latest_news = news.map((item, i) => {
    return { ...item, publish_date: convertDate(new Date(item.publish_date)) };
  });

  // re-order
  latest_news.unshift(
    latest_news.splice(
      latest_news.findIndex((item, i) => i === 4),
      1
    )[0]
  );

  log.now("result_01");

  const result_1 = {
    popup: (await contentPopup(language, "popup"))[0],
    banners: await contentBannerHome(language, "home_banner"),
    profile: (await contentTentangKami(language, "tentang_kami"))[0],
    service: await contentServices(language, "service"),
    throughput: await contentAnnualThroughput(
      language,
      "annual_throughput",
      this
    ),
  };
  log.now("result_1");

  const closing_kapal = await jadwalClosingKapal();
  const sandar_kapal = await jadwalSandarKapal();

  const result_2 = {
    jadwal_sandar_kapal: sandar_kapal,
    jadwal_closing_kapal: closing_kapal,
    latest_news,
    pelanggan: await contentPelangganKami(language, "pelanggan_kami", this),
    sosmed: await contentSosmed(language, "sosmed", this),
    ig: await igData,
  };
  log.now("result_2");

  const result = {
    ...result_1,
    ...result_2,
  };

  return result;
};

const reCacheIG = async (time: number) => {
  try {
    // const iG = await fetch(
    //   `https://www.instagram.com/graphql/query/?query_id=17888483320059182&variables=%7B%22id%22:%228530358125%22,%22first%22:3,%22after%22:null%7D`,
    //   {
    //     headers: {
    //       accept:
    //         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    //       "user-agent":
    //         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    //       "upgrade-insecure-requests": "1",
    //       "accept-encoding": "gzip, deflate, br",
    //       "accept-language": "en-US,en;q=0.9,en;q=0.8",
    //     },
    //   }
    // );
    // const iG = await fetch(
    //   `https://i.instagram.com/api/v1/users/web_profile_info/?username=pttps_official`,
    //   {
    //     headers: {
    //       // accept:
    //       //   "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    //       // "user-agent":
    //       //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    //       // "upgrade-insecure-requests": "1",
    //       // "accept-encoding": "gzip, deflate, br",
    //       // "accept-language": "en-US,en;q=0.9,en;q=0.8",
    //       'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    //         'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    //         'upgrade-insecure-requests': '1',
    //         'accept-encoding': 'gzip, deflate, br',
    //         'accept-language': 'en-US,en;q=0.9,en;q=0.8',
    //         'content-type': 'application/json; charset=utf-8',
    //       "x-ig-app-id": "936619743392459"
    //     },
    //   }
    // );
    const username = `pttps_official`;
    const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      "X-IG-App-ID": "936619743392459", // Common IG App ID (used by the web client)
      Referer: `https://www.instagram.com/${username}/`,
    };
    const iG = await fetch(url, { headers });

    // if (!iG.ok) {
    //   throw new Error(`HTTP error! Status: ${iG.statusText}`);
    // }
    let igJSON = await iG.json();

    console.log('checkIG : ', igJSON);

    if (igJSON) {
      if (igJSON?.data?.user?.edge_owner_to_timeline_media.edges.length > 0) {
        // reset cache data
        cache.ig.data = [];

        await Promise.all(
          (igJSON.data.user.edge_owner_to_timeline_media.edges || []).map(
            async (reels: any, i: number) => {
              const img = reels.node.thumbnail_resources[3].src;
              const imgBUffer = await getBase64Image(img);

              if (imgBUffer) {
                cache.ig.data.push({
                  media: imgBUffer,
                  url: `https://www.instagram.com/reel/${reels.node.shortcode}/`,
                  id: reels.node.id,
                });
              }
            }
          )
        );

        cache.ig.time = time;

        cache.ig.data = cache.ig.data.sort((a, b) => {
          return parseInt(b.id) - parseInt(a.id);
        });

        return true;
      }
    }
  } catch (error: any) {
    console.log("ERROR home", error.message);
    return false;
  }
};
