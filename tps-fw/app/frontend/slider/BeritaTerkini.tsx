import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/comps/ui/carousel";
import { icons } from "app/icons";
import { FC, useEffect, useState } from "react";

const TWEEN_FACTOR_BASE = 0.84;

export const BeritaTerkiniSlider: FC<{
  children: any;
  data: Array<{
    title: string;
    slug: string;
    image: string;
    publish_date: string;
    content: string;
    year: string;
    month: string;
    day: string;
  }>;
  showNavigation: boolean;
  isMobile: boolean;
}> = ({ children, data, showNavigation, isMobile }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("slidesInView", () => {});

    api.on("scroll", () => {});

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const onClickNav = (page: number) => {
    if (api) {
      api?.scrollTo(page);
    }
  };

  const onPrev = () => {
    if (api) {
      api.scrollPrev();
    }
  };

  const onNext = () => {
    if (api) {
      api?.scrollNext();
    }
  };

  return (
    <div
      className={cx(
        `c-overflow-hidden`,
        css`
          ${isMobile
            ? `padding-left: 15px; padding-right: 15px;`
            : `padding-left: 20px; padding-right: 20px;`}
        `
      )}
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
          // startIndex: 3
        }}
        className={cx(``, css``)}
      >
        <CarouselContent>
          {Array.isArray(data) &&
            data.map((item, i) => {
              return (
                <CarouselItem
                  key={i}
                  className={cx(
                    `c-justify-center c-py-2 md:c-basis-1/2 lg:c-basis-1/4 c-w-full c-cursor-pointer`,
                    css`
                      /* ${isMobile ? `flex-shrink: 1 !important;` : ``} */
                    `
                  )}
                >
                  <a
                    className={cx(
                      `${isMobile ? "" : "c-pl-4 c-pr-4"}`,
                      css`
                        ${isMobile ? `width: 22%;` : ``}
                      `
                    )}
                    href={`/news/latest-news/listing/${item.year}/${item.month}/${item.day}/${item.month}/${item.day}/${item.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(
                        `/news/latest-news/listing/${item.year}/${item.month}/${item.day}/${item.month}/${item.day}/${item.slug}`
                      );
                    }}
                  >
                    <div
                      className={cx(
                        "c-bg-white c-h-[423px] c-relative c-shadow-lg",
                        css`
                          border-radius: 30px;
                          ${item.image &&
                          `background-image: url("${siteurl(`/_img/${item.image}?w=500`)}")`};
                          background-size: cover;
                          background-position: center center;
                          min-width: 300px;
                        `
                      )}
                    >
                      <div
                        className={cx(
                          "c-p-6 c-bg-white c-bottom-0 c-absolute",
                          css`
                            border-radius: 30px;
                            min-height: 140px;
                            width: 100%;
                          `
                        )}
                      >
                        <div
                          className={cx(
                            `c-font-semibold c-color-[#5A5D66] c-overflow-hidden`,
                            css`
                              font-size: 15px;
                              -webkit-box-orient: vertical;
                              -webkit-line-clamp: 3;
                              display: -webkit-box;
                              line-height: 1.3;
                              min-height: 3.9em;
                            `
                          )}
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />
                        <div className="c-text-[#5A5D66] c-pt-4">
                          {item.publish_date}
                        </div>
                      </div>
                    </div>
                  </a>
                </CarouselItem>
              );
            })}
        </CarouselContent>
        {showNavigation && (
          <div
            className={`c-flex c-flex-row c-h-10 c-mt-8 ${isMobile ? `c-justify-start` : `c-justify-center`}`}
          >
            <div
              className="c-w-10 c-flex c-items-center c-justify-center c-cursor-pointer c-border c-border-[#0065A4] c-rounded-full c-text-[#0065A4] hover:c-bg-[#0065A4] hover:c-text-white"
              onClick={() => onPrev()}
            >
              <div className="c-w-3">{icons.berita_navi_prev}</div>
            </div>

            <div className="c-flex c-flex-row c-justify-between c-px-8">
              {Array.from({ length: count }).map((_, i) => {
                return (
                  <div
                    className={`c-text-xl c-flex c-items-center c-justify-center c-cursor-pointer c-w-10 c-rounded-full  ${current === i + 1 ? `c-border c-border-[#0065A4] c-text-white c-bg-[#0065A4]` : `c-text-[#0065A4]`} hover:c-bg-[#0065A4] hover:c-text-white hover:c-border hover:c-border-[#0065A4]`}
                    onClick={() => onClickNav(i)}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            <div
              className="c-w-10 c-flex c-items-center c-justify-center c-cursor-pointer c-border c-border-[#0065A4] c-rounded-full c-text-[#0065A4] hover:c-bg-[#0065A4] hover:c-text-white"
              onClick={() => onNext()}
            >
              <div className="c-w-3">{icons.berita_navi_next}</div>
            </div>
          </div>
        )}
      </Carousel>
    </div>
  );
};
