import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * JumpingNumber - 以「数字翻滚」效果展示变化的数值
 * 每个字符独立动画，产生类似老虎机 / 计数器的视觉效果
 *
 * @param {string} value - 要展示的格式化数值字符串，如 "649.8M" / "$266.55"
 * @param {number} staggerMs - 每个字符的动画延迟间隔（毫秒）
 * @param {number} durationMs - 单个字符的动画时长（毫秒）
 * @param {string} className - 额外的 CSS 类名
 */
export function JumpingNumber({
  value = "",
  staggerMs = 40,
  durationMs = 600,
  className = "",
}) {
  const prevValueRef = useRef(value);
  const [animId, setAnimId] = useState(0);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setAnimId((id) => id + 1);
    }
  }, [value]);

  const chars = useMemo(() => String(value).split(""), [value]);

  return (
    <span className={`inline-flex items-baseline ${className}`} aria-label={value}>
      {chars.map((char, i) => {
        const isDigit = /\d/.test(char);
        return (
          <span
            key={`${animId}-${i}`}
            className="inline-block"
            style={{
              animation: isDigit
                ? `digitJump ${durationMs}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * staggerMs}ms both`
                : `charFade ${durationMs * 0.6}ms ease-out ${i * staggerMs}ms both`,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
