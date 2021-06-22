import React from 'react'
import { useTimer } from 'react-timer'
import { layoutRectEquals, sizeEquals } from './util'

export function useSize<E extends LayoutElement>(ref: React.RefObject<E> | null, options: UseLayoutOptions, callback: (size: Size) => any): void
export function useSize<E extends LayoutElement>(ref: React.RefObject<E> | null, callback: (size: Size) => any): void
export function useSize(...args: any[]) {
  const ref      = args.shift()
  const callback = args.pop()
  const options  = args.pop() ?? {}

  const prevSizeRef = React.useRef<Size | null>(null)

  return useLayout(ref, options, element => {
    const size = getSize(element)
    if (prevSizeRef.current == null || !sizeEquals(prevSizeRef.current, size)) {
      callback(size)
      prevSizeRef.current = size
    }
  })
}

export function useBoundingRectangle<E extends LayoutElement>(ref: React.RefObject<E> | null, options: UseLayoutOptions, callback: (rect: LayoutRect) => any): void
export function useBoundingRectangle<E extends LayoutElement>(ref: React.RefObject<E> | null, callback: (rect: LayoutRect) => any): void
export function useBoundingRectangle(...args: any[]) {
  const ref      = args.shift()
  const callback = args.pop()
  const options  = args.pop() ?? {}

  const prevRectRef = React.useRef<LayoutRect | null>(null)

  return useLayout(ref, options, element => {
    const rect = element.getBoundingClientRect()
    if (prevRectRef.current == null || !layoutRectEquals(prevRectRef.current, rect)) {
      callback(rect)
      prevRectRef.current = rect
    }
  })
}

export function useLayout<E extends LayoutElement>(ref: React.RefObject<E> | null, options: UseLayoutOptions, callback: (element: E) => any): void
export function useLayout<E extends LayoutElement>(ref: React.RefObject<E> | null, callback: (element: E) => any): void
export function useLayout(...args: any[]) {
  const ref      = args.shift() as React.RefObject<LayoutElement>
  const callback = args.pop() as (element: LayoutElement) => any
  const options  = (args.pop() ?? {}) as UseLayoutOptions

  const timer = useTimer()
  const onLayout = React.useCallback(() => {
    if (options.debounce == null && options.throttle == null) {
      if (ref.current == null) { return }
      callback(ref.current)
    }

    if (options.debounce != null) {
      timer.clearAll()
    }
    if (options.throttle != null && timer.isActive) {
      return
    }

    timer.setTimeout(() => {
      if (ref.current == null) { return }
      callback(ref.current)
    }, options.throttle ?? options.debounce ?? 0)
  }, [callback, options.debounce, options.throttle, ref, timer])

  React.useLayoutEffect(() => {
    if (!('ResizeObserver' in window)) {
      console.warn("useSize(): ResizeObserver not supported")
      return
    }

    if (ref?.current == null) { return }

    const ResizeObserver = (window as any).ResizeObserver

    const observer = new ResizeObserver(onLayout)
    observer.observe(ref.current)

    callback(ref.current)

    return () => { observer.disconnect() }
  }, [callback, onLayout, ref])
}

export function getSize(element: LayoutElement) {
  if (element instanceof HTMLElement) {
    return {
      width:  element.offsetWidth,
      height: element.offsetHeight
    }
  } else {
    return {
      width:  element.clientWidth,
      height: element.clientHeight
    }
  }
}

export interface UseLayoutOptions {
  debounce?: number
  throttle?: number
}

export type LayoutElement = HTMLElement | SVGElement