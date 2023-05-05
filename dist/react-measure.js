import o from "react";
var m = Object.defineProperty, f = (n, t, e) => t in n ? m(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e, l = (n, t, e) => (f(n, typeof t != "symbol" ? t + "" : t, e), e);
const c = 16;
class d {
  //------
  // Lifecycle
  constructor(t) {
    l(this, "disposed", !1), l(this, "timeouts", /* @__PURE__ */ new Set()), l(this, "animationFrames", /* @__PURE__ */ new Set()), t && this.hookUnmount(t);
  }
  hookUnmount(t) {
    const e = t.componentWillUnmount;
    t.componentWillUnmount = () => {
      this.dispose(), e && e.call(t);
    };
  }
  get isDisposed() {
    return this.disposed;
  }
  dispose() {
    this.clearAll(), this.cancelAllAnimationFrames(), this.disposed = !0;
  }
  get isActive() {
    return this.timeouts.size > 0 || this.animationFrames.size > 0;
  }
  //------
  // setTimeout / clearTimeout
  setTimeout(t, e) {
    if (this.disposed)
      return null;
    const i = setTimeout(() => {
      this.timeouts.delete(i), t();
    }, e);
    return this.timeouts.add(i), i;
  }
  clearTimeout(t) {
    t != null && (clearTimeout(t), this.timeouts.delete(t));
  }
  //------
  // setInterval / clearInterval
  setInterval(t, e) {
    if (this.disposed)
      return null;
    const i = setInterval(t, e);
    return this.timeouts.add(i), i;
  }
  clearInterval(t) {
    t != null && (clearInterval(t), this.timeouts.delete(t));
  }
  //------
  // Animation frame
  requestAnimationFrameAfter(t, e) {
    if (this.disposed)
      return null;
    this.setTimeout(() => {
      this.requestAnimationFrame(t);
    }, e);
  }
  requestAnimationFrame(t) {
    if (this.disposed)
      return null;
    const e = requestAnimationFrame(() => {
      this.animationFrames.delete(e), t();
    });
    return this.animationFrames.add(e), e;
  }
  cancelAnimationFrame(t) {
    cancelAnimationFrame(t), this.animationFrames.delete(t);
  }
  cancelAllAnimationFrames() {
    for (const t of this.animationFrames)
      cancelAnimationFrame(t);
    this.animationFrames.clear();
  }
  //------
  // Promises
  await(t) {
    return new Promise(async (e, i) => {
      try {
        const s = await t;
        this.isDisposed || e(s);
      } catch (s) {
        this.isDisposed || i(s);
      }
    });
  }
  then(t, e) {
    return t.then((i) => {
      if (!this.isDisposed)
        return e(i);
    });
  }
  //------
  // Throttle & debounce
  throttle(t, e) {
    if (!this.isActive)
      return this.setTimeout(t, e);
  }
  debounce(t, e) {
    return this.clearAll(), this.setTimeout(t, e);
  }
  //------
  // Transitions
  performTransition(t, e) {
    e.onPrepare && e.onPrepare(), e.onCommit && this.setTimeout(e.onCommit, c), e.onCleanUp && this.setTimeout(e.onCleanUp, c + t);
  }
  //------
  // Clear all
  clearAll() {
    for (const t of this.timeouts)
      clearTimeout(t);
    this.timeouts.clear();
  }
}
function p() {
  const n = o.useMemo(() => new d(), []);
  return o.useEffect(() => () => {
    n.dispose();
  }, [n]), n;
}
function b(n, t) {
  return !(n.left !== t.left || n.top !== t.top || n.width !== t.width || n.height !== t.height);
}
function v(n, t) {
  return !(n.width !== t.width || n.height !== t.height);
}
function F(...n) {
  const t = n.shift(), e = n.pop(), i = n.pop() ?? {}, s = o.useRef(null);
  return h(t, i, (u) => {
    const r = w(u);
    (s.current == null || !v(s.current, r)) && (e(r), s.current = r);
  });
}
function R(...n) {
  const t = n.shift(), e = n.pop(), i = n.pop() ?? {}, s = o.useRef(null);
  return h(t, i, (u) => {
    const r = u.getBoundingClientRect();
    (s.current == null || !b(s.current, r)) && (e(r), s.current = r);
  });
}
function h(...n) {
  const t = n.shift(), e = n.pop(), i = n.pop() ?? {}, s = p(), u = o.useCallback(() => {
    if (i.debounce == null && i.throttle == null) {
      if (t.current == null)
        return;
      e(t.current);
    }
    i.debounce != null && s.clearAll(), !(i.throttle != null && s.isActive) && s.setTimeout(() => {
      t.current != null && e(t.current);
    }, i.throttle ?? i.debounce ?? 0);
  }, [e, i.debounce, i.throttle, t, s]);
  return o.useLayoutEffect(() => {
    if (!("ResizeObserver" in window)) {
      console.warn("useLayout(): ResizeObserver not supported");
      return;
    }
    if ((t == null ? void 0 : t.current) == null)
      return;
    const r = window.ResizeObserver, a = new r(u);
    return a.observe(t.current), e(t.current), () => {
      a.disconnect();
    };
  }, [e, u, t]), o.useCallback(() => {
    t.current != null && e(t.current);
  }, [e, t]);
}
function w(n) {
  return n instanceof HTMLElement ? {
    width: n.offsetWidth,
    height: n.offsetHeight
  } : {
    width: n.clientWidth,
    height: n.clientHeight
  };
}
export {
  w as getSize,
  R as useBoundingRectangle,
  h as useLayout,
  F as useSize
};
