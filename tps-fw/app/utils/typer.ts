export const typer = (obj: any) => {
  if (typeof obj === "object" && !Array.isArray(obj)) {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = "any";
    }
    return JSON.stringify(result);
  }
  return "";
};
