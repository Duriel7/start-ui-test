import * as React from 'react';
//using local storage like in Kent C Dodds course
export function useLocalStorageState(key: string, defaultValue: string = '') {
  const [state, setState] = React.useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    const valueInLocalStorage = window.localStorage.getItem(key);
    if (valueInLocalStorage) {
      return valueInLocalStorage;
    }
    return defaultValue;
  });

  const prevKeyRef = React.useRef(key);

  React.useEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey !== key) {
      window.localStorage.removeItem(prevKey);
    }
    prevKeyRef.current = key;
    window.localStorage.setItem(key, state);
  }, [key, state]);

  return [state, setState] as const;
}
