// The shapes of the API, by their names. They are generated from its OpenAPI document
// (packages/api-types, `bun gen:api`); nothing here is written by hand but the names.
//
// A shape that the API hands out has every field. The same shape in a request may leave out what the
// API has a default for: those are the names that end in Request, and the shapes only requests have.
import type { components as answers } from "@rooftop/api-types";
import type { components as requests } from "@rooftop/api-types/requests";

type Answers = answers["schemas"];
type Requests = requests["schemas"];

export type ErrorDetail = Answers["ErrorDetail"];
export type ErrorResponse = Answers["ErrorResponse"];
export type Health = Answers["Health"];

export type Project = Answers["Project"];
export type Roof = Answers["Roof"];
export type Obstacle = Answers["Obstacle"];
export type ArraySpec = Answers["ArraySpec"];
export type Losses = Answers["Losses"];
export type Weather = Answers["Weather"];

export type ProjectRequest = Requests["Project"];
export type RoofRequest = Requests["Roof"];
export type ObstacleRequest = Requests["Obstacle"];
export type EquipmentFile = Requests["EquipmentFile"];
export type RoofFile = Requests["RoofFile"];
export type SunRequest = Requests["SunRequest"];
export type WeatherRequest = Requests["WeatherRequest"];

export type ModuleResponse = Answers["ModuleResponse"];
export type InverterResponse = Answers["InverterResponse"];
export type ImportedRoof = Answers["ImportedRoof"];
export type LayoutResponse = Answers["LayoutResponse"];
export type LayoutReadouts = Answers["LayoutReadouts"];
export type SunResponse = Answers["SunResponse"];
export type WeatherResponse = Answers["WeatherResponse"];

export type DesignProgress = Answers["DesignProgress"];
export type DesignDone = Answers["DesignDone"];
export type DesignFailed = Answers["DesignFailed"];
export type DesignEvent = DesignProgress | DesignDone | DesignFailed;
export type DesignResult = Answers["DesignResult"];
export type DesignOption = Answers["Option"];
export type NoOptions = Answers["NoOptions"];

export type ExportKind = "pdf" | "dxf" | "kmz" | "csv" | "sld";
