import { LayoutRect, Size } from './types'

export function layoutRectEquals(rect1: LayoutRect, rect2: LayoutRect): boolean {
  if (rect1.left !== rect2.left) { return false }
  if (rect1.top !== rect2.top) { return false }
  if (rect1.width !== rect2.width) { return false }
  if (rect1.height !== rect2.height) { return false }

  return true
}

export function sizeEquals(size1: Size, size2: Size): boolean {
  if (size1.width !== size2.width) { return false }
  if (size1.height !== size2.height) { return false }

  return true
}

