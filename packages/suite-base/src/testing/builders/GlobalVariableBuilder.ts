import { GlobalVariables } from "@lichtblick/suite-base/hooks/useGlobalVariables";
import BasicBuilder from "@lichtblick/suite-base/testing/builders/BasicBuilder";

class GlobalVariableBuilder {
  public static globalVariables(): GlobalVariables {
    return {
      [BasicBuilder.string()]: undefined,
      [BasicBuilder.string()]: BasicBuilder.number(),
      [BasicBuilder.string()]: BasicBuilder.boolean(),
      [BasicBuilder.string()]: BasicBuilder.string(),
      [BasicBuilder.string()]: BasicBuilder.strings(),
      [BasicBuilder.string()]: BasicBuilder.genericDictionary(String),
    };
  }
}

export default GlobalVariableBuilder;
