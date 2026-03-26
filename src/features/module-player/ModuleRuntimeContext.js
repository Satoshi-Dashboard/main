import { createContext, useContext } from 'react';

export const ModuleRuntimeContext = createContext({
  setDynamicProviders: () => {},
});

export function useModuleRuntimeContext() {
  return useContext(ModuleRuntimeContext);
}
