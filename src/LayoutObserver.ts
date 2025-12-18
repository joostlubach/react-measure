import Timer from 'react-timer'
import { LayoutRect } from './types'

export class LayoutObserver {

  constructor(
    private callback: LayoutChangeCallback,
    options: LayoutObserverOptions = {},
  ) {
    this.timer = options.timer ?? new Timer()

    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const element = entry.target
        this.updateRect(element)
        this.callback(element)
      }
    })

    // Start RAF polling for position changes
    this.startPolling()
  }

  public dispose() {
    this.timer.disable()
    this.observedElements.clear()
    this.resizeObserver.disconnect()
    this.stopPolling()
  }

  private timer: Timer
  private resizeObserver: ResizeObserver
  private observedElements = new Map<Element, LayoutRect>()
  private rafHandle: number | null = null


  /**
   * Start observing an element for layout changes.
   */
  public observe(element: Element) {
    if (this.observedElements.has(element)) { return }

    // Store initial rect
    const rect = element.getBoundingClientRect()
    this.observedElements.set(element, {
      left:   rect.left,
      top:    rect.top,
      width:  rect.width,
      height: rect.height,
    })

    // Start observing with ResizeObserver
    this.resizeObserver.observe(element, {box: 'border-box'})

    // Restart polling if stopped
    if (this.rafHandle == null && this.observedElements.size > 0) {
      this.startPolling()
    }
  }

  /**
   * Stop observing an element.
   */
  public unobserve(element: Element) {
    this.observedElements.delete(element)
    this.resizeObserver.unobserve(element)

    // Stop polling if no more elements
    if (this.observedElements.size === 0) {
      this.stopPolling()
    }
  }

  private startPolling = () => {
    if (this.rafHandle != null) { return }

    const poll = () => {
      // Check for position changes
      for (const [element, lastRect] of this.observedElements) {
        const rect = element.getBoundingClientRect()
        
        // Check if position changed (size changes are handled by ResizeObserver)
        if (rect.left !== lastRect.left || rect.top !== lastRect.top) {
          this.updateRect(element)
          this.callback(element)
        }
      }

      // Continue polling if still observing elements
      if (this.observedElements.size > 0) {
        if (this.timer != null) {
          this.rafHandle = this.timer.requestAnimationFrame(poll)
        } else {
          this.rafHandle = requestAnimationFrame(poll)
        }
      } else {
        this.rafHandle = null
      }
    }

    if (this.timer != null) {
      this.rafHandle = this.timer.requestAnimationFrame(poll)
    } else {
      this.rafHandle = requestAnimationFrame(poll)
    }
  }

  private stopPolling() {
    if (this.rafHandle == null) { return }

    if (this.timer != null) {
      this.timer.cancelAnimationFrame(this.rafHandle)
    } else {
      cancelAnimationFrame(this.rafHandle)
    }
    
    this.rafHandle = null
  }

  private updateRect(element: Element) {
    const rect = element.getBoundingClientRect()
    this.observedElements.set(element, {
      left:   rect.left,
      top:    rect.top,
      width:  rect.width,
      height: rect.height,
    })
  }

}

export interface LayoutObserverOptions {
  /**
   * The timer instance to use for RAF polling.
   * If not provided, RAF will be used directly without timer control.
   */
  timer?: Timer
}

export type LayoutChangeCallback = (element: Element) => void