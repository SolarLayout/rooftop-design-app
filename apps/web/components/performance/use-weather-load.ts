"use client";

import { useEffect, useRef, useState } from "react";
import { useStores } from "@/components/shell/stores";
import { api, ApiError } from "@/lib/api";
import { withWeather, type DownloadedSource, type WeatherChosen } from "@/lib/flow/weather-source";

export type WeatherLoad = {
  /** The source whose hours are on their way; null while none are. */
  loading: DownloadedSource | null;
  /** Why the last choice was not loaded, in the API's words; null while there is nothing to say. */
  failure: string | null;
  /** Asks /weather for the source at the roof's place, then commits the source and its hours in one edit (decision 12). */
  download: (source: DownloadedSource) => void;
  /** Commits what the CSV dialog read: the source, the file's name and text, and its hours. */
  take: (chosen: WeatherChosen) => void;
};

/** Why the weather was not loaded: the API's words, or the app's, with no word of the machine (V2 · 5, voice §5). */
function reasonOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "The app could not finish this step. Try again.";
}

/**
 * The weather source chosen in the header (plan/phase-08-plan.md, decision 12): PVGIS or NASA is asked of /weather first
 * and the document is edited once when the hours come; a failure is said under the select and leaves the weather of
 * before. A choice made while another loads gives the first up; so does leaving the page.
 */
export function useWeatherLoad(): WeatherLoad {
  const { project } = useStores();
  const [loading, setLoading] = useState<DownloadedSource | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const call = useRef<AbortController | null>(null);

  function giveUp() {
    call.current?.abort();
    call.current = null;
  }

  useEffect(() => giveUp, []);

  function take(chosen: WeatherChosen) {
    giveUp();
    setLoading(null);
    setFailure(null);
    project.getState().commit((document) => withWeather(document, chosen));
  }

  async function download(source: DownloadedSource) {
    const document = project.getState().project;
    if (document === null) return;
    giveUp();
    const thisCall = new AbortController();
    call.current = thisCall;
    setLoading(source);
    setFailure(null);
    try {
      const answer = await api.loadWeather({ source, lat: document.roof.lat, lon: document.roof.lon, csv_name: "", csv_text: "" }, { signal: thisCall.signal });
      if (thisCall.signal.aborted) return;
      call.current = null;
      take({ source, weather: answer.weather });
    } catch (error) {
      if (thisCall.signal.aborted) return;
      call.current = null;
      setLoading(null);
      setFailure(reasonOf(error));
    }
  }

  return { loading, failure, download, take };
}
