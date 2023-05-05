import React from 'react';
import { LayoutRect, Size } from './types';
export declare function useSize<E extends LayoutElement>(ref: React.RefObject<E> | null, options: UseLayoutOptions, callback: (size: Size) => any): MeasureFunction;
export declare function useSize<E extends LayoutElement>(ref: React.RefObject<E> | null, callback: (size: Size) => any): MeasureFunction;
export declare function useBoundingRectangle<E extends LayoutElement>(ref: React.RefObject<E> | null, options: UseLayoutOptions, callback: (rect: LayoutRect) => any): MeasureFunction;
export declare function useBoundingRectangle<E extends LayoutElement>(ref: React.RefObject<E> | null, callback: (rect: LayoutRect) => any): MeasureFunction;
export declare function useLayout<E extends LayoutElement>(ref: React.RefObject<E> | null, options: UseLayoutOptions, callback: (element: E) => any): MeasureFunction;
export declare function useLayout<E extends LayoutElement>(ref: React.RefObject<E> | null, callback: (element: E) => any): MeasureFunction;
export declare function getSize(element: LayoutElement): {
    width: number;
    height: number;
};
export interface UseLayoutOptions {
    debounce?: number;
    throttle?: number;
}
export type MeasureFunction = () => any;
export type LayoutElement = HTMLElement | SVGElement;
