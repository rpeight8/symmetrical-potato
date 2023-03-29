"use client";

import { HTMLAttributes, useContext, useEffect } from "react";

import WeatherMainBlock from "@/components/WeatherMainBlock";
import WeatherInfoAdditional from "@/components/WeatherAdditionaInfoBlock";
import WeatherSunsetSunsriseBlock from "@/components/WeatherSunsetSunsriseBlock";

import { WeatherContext } from "@/context/WeatherContext";
import useWeather from "@/hooks/useWeather";
import kelvinToCelsium from "@/utils/kelvinToCelsium";

interface MainProps extends HTMLAttributes<HTMLElement> {}

const Main = ({}: MainProps) => {
  const { state, dispatch } = useContext(WeatherContext);

  const { data, isError, isLoading } = useWeather(state.location);

  if (isError) {
    return <div>Something went wrong</div>;
  }

  if (!data && !isLoading) {
    return null;
  }

  const currentDateMs = Date.now();
  const { weather, main, wind, date, sys } = data ?? {};

  return (
    <main>
      <section>
        <WeatherMainBlock
          isLoading={isLoading}
          weather={weather?.[0].main}
          weatherDescription={weather?.[0].description}
          temperature={kelvinToCelsium(main?.temp || 0)}
          temperatureUnit="C"
          location={state.location}
        />
      </section>
      <section>
        <WeatherInfoAdditional
          isLoading={isLoading}
          currentDateMs={currentDateMs}
          humidityPercent={main?.humidity}
          pressure={main?.pressure}
          windSpeed={wind?.speed}
        />
      </section>
      <section>
        <WeatherSunsetSunsriseBlock
          isLoading={isLoading}
          sunsetMs={sys?.sunset}
          sunriseMs={sys?.sunrise}
          currentDateMs={currentDateMs}
        />
      </section>
    </main>
  );
};

export default Main;
