export interface Size {
  width:  number
  height: number
}

export interface Position {
  top: number
  left: number
}

export type LayoutRect = Position & Size