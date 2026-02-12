export const PreviewBanner = () => {
  if (typeof new URL(location.href).searchParams.get("preview") !== "string")
    return null;

  const href = new URL(location.href);
  href.searchParams.delete("preview");

  return (
    <div
      className={css`
        .ribbon {
          width: 150px;
          height: 150px;
          overflow: hidden;
          position: fixed;
          z-index: 999;
        }
        .ribbon span {
          position: absolute;
          display: block;
          width: 225px;
          padding: 15px 0;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
          color: #fff;
          font:
            700 18px/1 "Lato",
            sans-serif;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
          text-transform: uppercase;
          text-align: center;
        }

        /* top right*/

        .ribbon-top-left {
          top: -10px;
          left: -10px;
          > span {
            background-color: #0c5808;
          }
        }
        .ribbon-top-left::before,
        .ribbon-top-left::after {
          border-top-color: transparent;
          border-left-color: transparent;
        }
        .ribbon-top-left::before {
          top: 0;
          right: 0;
        }
        .ribbon-top-left::after {
          bottom: 0;
          left: 0;
        }
        .ribbon-top-left span {
          right: -25px;
          top: 30px;
          transform: rotate(-45deg);
        }

        .ribbon-top-right {
          top: 0px;
          right: 0px;
          opacity: 0.3;
          > span {
            background-color: #0118c7;
          }
          &:hover {
            opacity: 1;
          }
        }
        .ribbon-top-right::before,
        .ribbon-top-right::after {
          border-top-color: transparent;
          border-right-color: transparent;
        }
        .ribbon-top-right::before {
          top: 0;
          left: 0;
        }
        .ribbon-top-right::after {
          bottom: 0;
          right: 0;
        }
        .ribbon-top-right span {
          left: -25px;
          top: 30px;
          transform: rotate(45deg);
        }
      `}
    >
      <div className="ribbon ribbon-top-left">
        <span>Preview</span>
      </div>

      <a
        className="ribbon ribbon-top-right"
        href={href.toString()}
        target="_blank"
      >
        <span className="c-transition-all">Go Live</span>
      </a>
    </div>
  );
};
