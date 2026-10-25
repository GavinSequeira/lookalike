import { useEffect, useRef, useState } from 'react';

// Adds the "in" class the first time the element scrolls into view.
export function useInView(options = { threshold: 0.15 }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    if (!('IntersectionObserver' in window)) { setSeen(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); observer.disconnect(); }
    }, options);
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]); // eslint-disable-line react-hooks/exhaustive-deps

  return [ref, seen];
}

export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, seen] = useInView();
  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Counts up from 0 when scrolled into view.
export function CountUp({ to = 0, duration = 1200, suffix = '' }) {
  const [ref, seen] = useInView();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || to === 0) { setValue(to); return; }
    let raf;
    const start = performance.now();
    const tick = now => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);

  return <span ref={ref}>{value}{suffix}</span>;
}
