import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/comps/ui/carousel";
import { FC, useEffect, useState } from "react";

export const OurCustomerSlider: FC<{
  children: any;
  data: Array<{
    name: string;
    media: string;
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

  return (
    <div
      className={cx(
        `c-overflow-hidden`,
        css`
          ${isMobile
            ? `padding-left: 15px; padding-right: 15px; width: 100%;`
            : ``}
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
                    `c-justify-center c-py-2 md:c-basis-1/2 lg:c-basis-1/12 c-w-full c-cursor-pointer`,
                    css`
                      /* ${isMobile ? `flex-shrink: 1 !important;` : `width:fit-content;`} */
        
                    `
                  )}
                >
                  <div
                    className={cx(
                      `${isMobile ? "c-h-[100px]" : "c-pl-4 c-pr-4 c-h-[100px] c-w-[150px]"}`,
                      `c-flex c-justify-center `,
                      css``
                    )}
                  >
                    <div
                      className={cx(
                        `${isMobile ? "" : "c-pl-4 c-pr-4"}`,
                        `c-w-full`,
                        css`
                          ${isMobile ? `width: 22% !important;` : ``}
                          background-image: url(${siteurl(`/_img/${item.media}?w=200`)});
                          background-size: contain;
                          background-position: center center;
                          background-repeat: no-repeat;
                        `
                      )}
                    ></div>
                  </div>
                </CarouselItem>
              );
            })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};
