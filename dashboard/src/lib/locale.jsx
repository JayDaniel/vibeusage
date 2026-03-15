import React, { useCallback, useState } from "react";
import { getLocale, setLocale as setCopyLocale } from "./copy";

const LocaleContext = React.createContext({
  locale: "en",
  setLocale: () => {},
  toggleLocale: () => {},
});

/** 语言环境 Provider，包裹应用根组件以支持运行时语言切换 */
export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => getLocale());

  /** 同步更新 React state 和 copy 模块的语言设置 */
  const setLocale = useCallback((next) => {
    setCopyLocale(next);
    setLocaleState(next);
  }, []);

  /** 在 en/zh 之间切换 */
  const toggleLocale = useCallback(() => {
    const next = locale === "en" ? "zh" : "en";
    setCopyLocale(next);
    setLocaleState(next);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

/** 获取当前语言和切换函数 */
export function useLocale() {
  return React.useContext(LocaleContext);
}
