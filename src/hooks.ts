import { isFunction } from 'lodash'
import { RefObject, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTimer } from 'react-timer'
import { useContinuousRef } from 'react-util/hooks'
import { LayoutObserver } from './LayoutObserver'
import { LayoutRect, Position, Size } from './types'
import { layoutRectEquals, sizeEquals } from './util'

export * from './types'

export function useSize<E extends LayoutElement>(ref: RefObject<E | null> | null, callback: (size: Size) => void, options?: UseLayoutOptions): Size
export function useSize<E extends LayoutElement>(ref: RefObject<E | null> | null, options?: UseLayoutOptions): Size
export function useSize<E extends LayoutElement>(ref: RefObject<E | null> | null, callback?: (size: Size) => void): Size
export function useSize(...args: any[]) {
  const ref = args.shift()
  const callback = isFunction(args[0]) ? args.shift() : undefined
  const options = args.shift() ?? {}

  const [size, setSize] = useState<Size>({width: 0, height: 0})
  const prevSizeRef = useContinuousRef(size)

  useLayout(ref, LayoutObservable.Size, options, element => {
    const size = getSize(element)
    if (prevSizeRef.current == null || !sizeEquals(prevSizeRef.current, size)) {
      setSize(size)
      callback?.(size)
      prevSizeRef.current = size
    }
  })

  return size
}

export function usePosition<E extends LayoutElement>(ref: RefObject<E | null> | null, callback: (position: Position) => void, options?: UseLayoutOptions): Position
export function usePosition<E extends LayoutElement>(ref: RefObject<E | null> | null, options?: UseLayoutOptions): Position
export function usePosition<E extends LayoutElement>(ref: RefObject<E | null> | null, callback?: (position: Position) => void): Position
export function usePosition(...args: any[]) {
  const ref = args.shift()
  const callback = isFunction(args[0]) ? args.shift() : undefined
  const options = args.shift() ?? {}

  const [position, setPosition] = useState<Position>({top: 0, left: 0})
  const prevPositionRef = useContinuousRef(position)

  useLayout(ref, LayoutObservable.Position, options, element => {
    const position = getPosition(element)
    if (prevPositionRef.current == null || !positionEquals(prevPositionRef.current, position)) {
      setPosition(position)
      callback?.(position)
      prevPositionRef.current = position
    }
  })

  return position
}

export function useBoundingRectangle<E extends LayoutElement>(ref: RefObject<E | null> | null, callback: (rect: LayoutRect) => void, options: UseLayoutOptions): LayoutRect
export function useBoundingRectangle<E extends LayoutElement>(ref: RefObject<E | null> | null, callback?: (rect: LayoutRect) => void): LayoutRect
export function useBoundingRectangle(...args: any[]) {
  const ref = args.shift()
  const callback = isFunction(args[0]) ? args.shift() : undefined
  const options = args.shift() ?? {}

  const [rect, setRect] = useState<LayoutRect>({left: 0, top: 0, width: 0, height: 0})
  const prevRectRef = useContinuousRef(rect)

  useLayout(ref, LayoutObservable.BoundingRectangle, options, element => {
    const rect = element.getBoundingClientRect()
    if (prevRectRef.current == null || !layoutRectEquals(prevRectRef.current, rect)) {
      setRect(rect)
      callback?.(rect)
      prevRectRef.current = rect
    }
  })

  return rect
}

function useLayout<E extends LayoutElement>(ref: RefObject<E | null> | null, observable: LayoutObservable, options: UseLayoutOptions, callback: (element: E) => void): void
function useLayout<E extends LayoutElement>(ref: RefObject<E | null> | null, observable: LayoutObservable, callback: (element: E) => void): void
function useLayout(...args: any[]) {
  const ref = args.shift() as RefObject<LayoutElement>
  const observable = args.shift() as LayoutObservable
  const callback = args.pop() as (element: LayoutElement) => void
  const options = (args.pop() ?? {}) as UseLayoutOptions

  const prevRect = useRef<LayoutRect>({left: 0, top: 0, width: 0, height: 0})

  const timer = useTimer()
  const updatesRef = useRef<LayoutRect[]>([])

  const layoutEquals = useCallback((prev: LayoutRect, next: LayoutRect) => {
    const compareSize = observable === LayoutObservable.Size || observable === LayoutObservable.BoundingRectangle
    const comparePosition = observable === LayoutObservable.Position || observable === LayoutObservable.BoundingRectangle

    if (compareSize && !sizeEquals(prev, next)) { return false }
    if (comparePosition && !positionEquals(prev, next)) { return false }

    return true
  }, [observable])

  const update = useCallback((element: LayoutElement) => {
    const rect = element.getBoundingClientRect()
    const nextRect = {
      left:   Math.floor(rect.left),
      top:    Math.floor(rect.top),
      width:  Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    }

    if (layoutEquals(prevRect.current, nextRect)) {
      updatesRef.current = []
      return
    }
    prevRect.current = nextRect
    updatesRef.current.push(nextRect)

    if (updatesRef.current.length > 20) {
      console.warn('useLayout() is not settling', element, updatesRef.current)
      return
    }

    callback(element)
  }, [callback, layoutEquals])

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
    if (ref?.current == null) { return }

    const observer = new LayoutObserver(() => {
      update(ref.current)
    })
    observer.observe(ref.current)

    updatesRef.current = []
    update(ref.current)

    return () => { observer.dispose() }
  }, [ref, onLayout, update, observable])
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

export function getPosition(element: LayoutElement) {
  const rect = element.getBoundingClientRect()
  return {
    left: Math.floor(rect.left),
    top:  Math.floor(rect.top),
  }
}

export function positionEquals(a: Position, b: Position) {
  return a.left === b.left && a.top === b.top
}

export interface UseLayoutOptions {
  debounce?: number
  throttle?: number
}

export type MeasureFunction = () => void
export type LayoutElement = HTMLElement | SVGElement

enum LayoutObservable {
  BoundingRectangle,
  Size,
  Position,
}