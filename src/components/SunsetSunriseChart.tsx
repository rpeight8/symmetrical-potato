// @ts-nocheck

import * as d3 from "d3";
import type { Weather } from "@/utils/constants";
import { startOfDay, endOfDay, format } from "date-fns";
import getMedianDate from "@/utils/medianDate";
import React, { useRef, useEffect, useState, useCallback } from "react";
import WeatherIcon from "@/components/ui/WeatherIcon";
import interpolateTimeToLinear from "@/utils/interpolateTimeToLinear";

interface SunsetSunriseChartProps {
  sunsetDateMs: number;
  sunriseDateMs: number;
  currentDateMs: number;
  weather: Weather;
}

const margin = { top: 40, right: 0, bottom: 40, left: 0 };
const xType = d3.scaleTime;
const yType = d3.scaleLinear;

const SunsetSunriseChart = ({
  sunsetDateMs,
  sunriseDateMs,
  currentDateMs,
  weather,
}: SunsetSunriseChartProps) => {
  const [size, setSize] = useState([0, 0]);
  const svgRef = useRef<SVGSVGElement>(null);

  const placeSunsetSunrise = useCallback(
    ({
      svg,
      xScale,
      yScale,
      timeSelector,
      textSelector,
      groupSelector,
      date,
      highest,
    }) => {
      const sunriseTime = svg.select(timeSelector);
      const sunriseTimeBounds = sunriseTime.node().getBBox();

      sunriseTime
        .attr("x", xScale(date) - sunriseTimeBounds.width / 2)
        .attr("y", yScale(highest));
      const sunriseText = svg.select(textSelector);
      const sunriseTextBounds = sunriseText.node().getBBox();
      sunriseText
        .attr("x", xScale(date) - sunriseTextBounds.width / 2)
        .attr("y", yScale(highest) - sunriseTextBounds.height);
      svg.select(groupSelector).attr("transform", "translate(0, -10)");
    },
    []
  );

  const handleResize = useCallback(() => {
    if (svgRef.current) {
      const svgBounds = svgRef.current.getBoundingClientRect();

      setSize([svgBounds.width, svgBounds.height]);
    }
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg) return;
    const svgBoundings = svgRef.current.getBoundingClientRect();
    if (svgBoundings.width !== size[0] || svgBoundings.height !== size[1]) {
      handleResize();
      return;
    }

    window.addEventListener("resize", handleResize);

    const width = size[0];
    const height = size[1];

    const xRange = [0, width];
    const yRange = [height - margin.bottom, margin.top];

    const startDate = startOfDay(currentDateMs);
    const endDate = endOfDay(currentDateMs);
    const sunriseDate = new Date(sunriseDateMs);
    const sunsetDate = new Date(sunsetDateMs);
    // let currentDate = new Date(currentDateMs);
    // currentDate = new Date(currentDate.setHours(0));
    // currentDateMs = currentDate.getTime();

    const xDomain = [startDate, endDate];
    const domainHighest = 100;
    const domainLowest = -100;

    const sunriseHighest = domainHighest;
    const sunriseLowest = domainLowest;
    const sunsetHighest = domainHighest;

    const medianStartSunrise = getMedianDate(startDate, sunriseDate);
    const medianSunriseSunset = getMedianDate(sunriseDate, sunsetDate);
    const medianSunsetEnd = getMedianDate(sunsetDate, endDate);

    const yDomain = [domainLowest, domainHighest];
    const sunriseLineData = [
      {
        x: sunriseDate,
        y: 0,
      },
      {
        x: sunriseDate,
        y: sunriseHighest,
      },
    ];
    const sunsetLineData = [
      {
        x: sunsetDate,
        y: 0,
      },
      {
        x: sunsetDate,
        y: sunsetHighest,
      },
    ];
    const horizontalLineData = [
      {
        x: startDate,
        y: 0,
      },
      {
        x: endDate,
        y: 0,
      },
    ];
    const startToSunriseData = [
      {
        x: startDate,
        y: 0,
      },
      {
        x: medianStartSunrise,
        y: sunriseLowest,
      },
      {
        x: sunriseDate,
        y: 0,
      },
    ];
    const sunriseToSunsetData = [
      {
        x: sunriseDate,
        y: 0,
      },
      {
        x: medianSunriseSunset,
        y: sunriseHighest,
      },
      {
        x: sunsetDate,
        y: 0,
      },
    ];
    const sunsetToEndData = [
      {
        x: sunsetDate,
        y: 0,
      },
      {
        x: medianSunsetEnd,
        y: sunriseLowest,
      },
      {
        x: endDate,
        y: 0,
      },
    ];
    type Data = typeof data[number];
    const xGetter = (d: Data) => d.x;
    const yGetter = (d: Data) => d.y;

    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);

    const area = d3
      .area()
      .curve(d3.curveCatmullRom.alpha(0.5))
      .x((d) => xScale(xGetter(d)))
      .y0(yScale(0))
      .y1((d) => yScale(yGetter(d)));

    const line = d3
      .line()
      .x((d) => xScale(xGetter(d)))

      .y((d) => yScale(yGetter(d)));

    svg.select("#startToSunrise").datum(startToSunriseData).attr("d", area);
    svg.select("#sunriseToSunset").datum(sunriseToSunsetData).attr("d", area);
    svg.select("#sunsetToEnd").datum(sunsetToEndData).attr("d", area);
    svg.select("#horizontalLine").datum(horizontalLineData).attr("d", line);
    svg.select("#sunriseLine").datum(sunriseLineData).attr("d", line);
    svg.select("#sunsetLine").datum(sunsetLineData).attr("d", line);

    // Placenment of sunriseDateMs time and text
    placeSunsetSunrise({
      svg,
      xScale,
      yScale,
      timeSelector: "#sunriseTime",
      textSelector: "#sunriseDateMs",
      groupSelector: "#sunriseDateMs-g",
      date: sunriseDate,
      highest: sunriseHighest,
    });

    // Placenment of sunsetDateMs time and text
    placeSunsetSunrise({
      svg,
      xScale,
      yScale,
      timeSelector: "#sunsetTime",
      textSelector: "#sunsetDateMs",
      groupSelector: "#sunsetDateMs-g",
      date: sunsetDate,
      highest: sunsetHighest,
    });

    const horizon = svg.select("#horizon");
    const horizonBounds = horizon.node().getBBox();
    horizon.attr(
      "transform",
      `translate(${width - horizonBounds.width}, ${yScale(0) - 10})`
    );

    // let interpolatedY = 0;
    // let interpolateArguments = {
    //   timeScale: xScale,
    //   linearScale: yScale,
    //   leftTimeValue: null,
    //   rightTimeValue: null,
    //   leftLinearValue: null,
    //   rightLinearValue: null,
    //   timeToBeInterpolated: null,
    // };

    // if (currentDate < sunriseDate) {
    //   if (currentDate < medianStartSunrise) {
    //     interpolateArguments = {
    //       ...interpolateArguments,
    //       leftTimeValue: startDate.getTime(),
    //       rightTimeValue: medianStartSunrise.getTime(),
    //       leftLinearValue: 0,
    //       rightLinearValue: sunriseLowest,
    //       timeToBeInterpolated: currentDateMs,
    //       extra: 10,
    //     };
    //   } else {
    //     interpolateArguments = {
    //       ...interpolateArguments,
    //       leftTimeValue: medianStartSunrise.getTime(),
    //       rightTimeValue: sunriseDateMs,
    //       leftLinearValue: sunriseLowest,
    //       rightLinearValue: 0,
    //       timeToBeInterpolated: currentDateMs,
    //     };
    //   }
    // } else if (currentDate > sunsetDate) {
    //   if (currentDate < medianSunsetEnd) {
    //     interpolateArguments = {
    //       ...interpolateArguments,
    //       leftTimeValue: sunsetDateMs,
    //       rightTimeValue: medianSunsetEnd.getTime(),
    //       leftLinearValue: 0,
    //       rightLinearValue: sunriseLowest,
    //       timeToBeInterpolated: currentDateMs,
    //     };
    //   } else {
    //     interpolateArguments = {
    //       ...interpolateArguments,
    //       leftTimeValue: medianSunsetEnd.getTime(),
    //       rightTimeValue: endDate.getTime(),
    //       leftLinearValue: sunriseLowest,
    //       rightLinearValue: 0,
    //       timeToBeInterpolated: currentDateMs,
    //     };
    //   }
    // } else {
    //   if (currentDate < medianSunriseSunset) {
    //     interpolateArguments = {
    //       ...interpolateArguments,
    //       leftTimeValue: sunriseDateMs,
    //       rightTimeValue: medianSunriseSunset.getTime(),
    //       leftLinearValue: 0,
    //       rightLinearValue: sunriseHighest,
    //       timeToBeInterpolated: currentDateMs,
    //     };
    //   } else {
    //     interpolateArguments = {
    //       ...interpolateArguments,
    //       leftTimeValue: medianSunriseSunset.getTime(),
    //       rightTimeValue: sunsetDateMs,
    //       leftLinearValue: sunriseHighest,
    //       rightLinearValue: 0,
    //       timeToBeInterpolated: currentDateMs,
    //     };
    //   }
    // }

    // interpolatedY = interpolateTimeToLinear(interpolateArguments);

    // svg
    //   .select("#currentIcon")
    //   .attr("transform", `translate(${xScale(currentDate)}, ${interpolatedY})`);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [
    sunsetDateMs,
    sunriseDateMs,
    currentDateMs,
    handleResize,
    size,
    placeSunsetSunrise,
  ]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={[0, 0, size[0], size[1]]}
    >
      <g id="sunriseDateMs-g">
        <text id="sunriseDateMs" className="text-sm fill-gray-c2">
          sunriseDateMs
        </text>
        <text id="sunriseTime" className="text-md fill-gray-c3">
          {format(sunriseDateMs, "hh:mm a")}
        </text>
      </g>
      <g id="sunsetDateMs-g">
        <text id="sunsetDateMs" className="text-sm fill-gray-c2">
          sunsetDateMs
        </text>
        <text id="sunsetTime" className="text-md fill-gray-c3">
          {format(sunsetDateMs, "hh:mm a")}
        </text>
      </g>
      <text id="horizon" className="text-sm fill-gray-c2">
        Horizon
      </text>
      <path id="startToSunrise" className="fill-blue-900"></path>
      <path id="sunriseToSunset" className=" fill-blue-300"></path>
      <path id="sunsetToEnd" className="fill-blue-900"></path>
      <path
        id="horizontalLine"
        className=" stroke-gray-c2 stroke-dash-line stroke-2"
      ></path>
      <path
        id="sunriseLine"
        className=" stroke-gray-c2 stroke-dash-line stroke-2"
      ></path>
      <path
        id="sunsetLine"
        className=" stroke-gray-c2 stroke-dash-line stroke-2"
      ></path>
      {/* <g id="currentIcon">
        <WeatherIcon weather={weather} size="2xsm" className="fill-slate-100" />
      </g> */}
    </svg>
  );
};

export default SunsetSunriseChart;
