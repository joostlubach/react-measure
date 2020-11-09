import {isEqual} from 'lodash'

export function objectEquals(left: AnyObject, right: AnyObject, equals: (a: any, b: any) => boolean = isEqual): boolean {
  if (Object.keys(left).length !== Object.keys(right).length) { return false }

  for (const key of Object.keys(left)) {
    if (!equals(left[key], right[key])) {
      return false
    }
  }

  return true
}