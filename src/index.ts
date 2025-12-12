import { isFunction } from 'lodash'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTimer } from 'react-timer'
import { useContinuousRef } from 'react-util/hooks'
import { LayoutRect, Size } from './types'
import { layoutRectEquals, sizeEquals } from './util'

export * from './types'

export function useSize<E extends LayoutElement>(ref: React.RefObject<E | null> | null, callback: (size: Size) => any, options?: UseLayoutOptions): Size
export function useSize<E extends LayoutElement>(ref: React.RefObject<E | null> | null, options?: UseLayoutOptions): Size
export function useSize<E extends LayoutElement>(ref: React.RefObject<E | null> | null, callback?: (size: Size) => any): Size
export function useSize(...args: any[]) {
  const ref = args.shift()
  const callback = isFunction(args[0]) ? args.shift() : undefined
  const options = args.shift() ?? {}

  const [size, setSize] = useState<Size>({width: 0, height: 0})
  const prevSizeRef = useContinuousRef(size)

  useLayout(ref, options, element => {
    const size = getSize(element)
    if (prevSizeRef.current == null || !sizeEquals(prevSizeRef.current, size)) {
      setSize(size)
      callback?.(size)
      prevSizeRef.current = size
    }
  })

  return size
}

export function useBoundingRectangle<E extends LayoutElement>(ref: React.RefObject<E | null> | null, callback: (rect: LayoutRect) => any, options: UseLayoutOptions): LayoutRect
export function useBoundingRectangle<E extends LayoutElement>(ref: React.RefObject<E | null> | null, callback?: (rect: LayoutRect) => any): LayoutRect
export function useBoundingRectangle(...args: any[]) {
  const ref = args.shift()
  const callback = isFunction(args[0]) ? args.shift() : undefined
  const options = args.shift() ?? {}

  const [rect, setRect] = useState<LayoutRect>({left: 0, top: 0, width: 0, height: 0})
  const prevRectRef = useContinuousRef(rect)

  useLayout(ref, options, element => {
    const rect = element.getBoundingClientRect()
    if (prevRectRef.current == null || !layoutRectEquals(prevRectRef.current, rect)) {
      setRect(rect)
      callback?.(rect)
      prevRectRef.current = rect
    }
  })

  return rect
}

export function useLayout<E extends LayoutElement>(ref: React.RefObject<E | null> | null, options: UseLayoutOptions, callback: (element: E) => any): void
export function useLayout<E extends LayoutElement>(ref: React.RefObject<E | null> | null, callback: (element: E) => any): void
export function useLayout(...args: any[]) {
  const ref = args.shift() as React.RefObject<LayoutElement>
  const callback = args.pop() as (element: LayoutElement) => any
  const options = (args.pop() ?? {}) as UseLayoutOptions

  const prevRect = useRef<LayoutRect>({left: 0, top: 0, width: 0, height: 0})

  const timer = useTimer()

  const update = useCallback((element: LayoutElement) => {
    const rect = element.getBoundingClientRect()
    const nextRect = {
      left:   Math.floor(rect.left),
      top:    Math.floor(rect.top),
      width:  Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    }

    if (prevRect.current.left === nextRect.left &&
      prevRect.current.top === nextRect.top &&
      prevRect.current.width === nextRect.width &&
      prevRect.current.height === nextRect.height
    ) { return }

    prevRect.current = nextRect
    callback(element)
  }, [callback])

  const onLayout = useCallback(() => {
    if (options.debounce == null && options.throttle == null) {
      if (ref.current == null) { return }
      update(ref.current)
    }

    if (options.debounce != null) {
      timer.clearAll()
    }
    if (options.throttle != null && timer.isActive) {
      return
    }

    timer.setTimeout(() => {
      if (ref.current == null) { return }
      update(ref.current)
    }, options.throttle ?? options.debounce ?? 0)
  }, [update, options.debounce, options.throttle, ref, timer])

  useLayoutEffect(() => {
    if (!('ResizeObserver' in window)) {
      console.warn("useLayout(): ResizeObserver not supported")
      return
    }

    if (ref?.current == null) { return }

    const ResizeObserver = (window as any).ResizeObserver

    const observer = new ResizeObserver(onLayout)
    observer.observe(ref.current)

    update(ref.current)

    return () => { observer.disconnect() }
  }, [ref, onLayout, update])
}

export function getSize(element: LayoutElement) {
  if (element instanceof HTMLElement) {
    return {
      width:  element.offsetWidth,
      height: element.offsetHeight,
    }
  } else {
    return {
      width:  element.clientWidth,
      height: element.clientHeight,
    }
  }
}

export interface UseLayoutOptions {
  debounce?: number
  throttle?: number
}

export type MeasureFunction = () => any
export type LayoutElement = HTMLElement | SVGElement
