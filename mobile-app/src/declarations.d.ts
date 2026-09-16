/**
 * Global ambient type declarations for LegacyLens mobile app.
 *
 * This file provides:
 *  - Augmentation of expo-status-bar's StatusBarProps to include
 *    backgroundColor and translucent (used across many screens but not in
 *    the official type definition for SDK 57).
 *  - A stub for react-native-maps which is not yet installed.
 *
 * expo-audio, expo-video, expo-haptics, expo-speech are now properly installed and ship
 * their own type definitions, so they no longer need stubs here.
 * react-native-webview is also installed and has its own types.
 */

// ─── expo-status-bar augmentation ────────────────────────────────────────────
// Re-open the module to add missing props used throughout the codebase.
declare module 'expo-status-bar' {
  import { Component } from 'react';

  export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';
  export type StatusBarAnimation = 'none' | 'fade' | 'slide';

  export interface StatusBarProps {
    /** Sets the color of the status bar text. @default 'auto' */
    style?: StatusBarStyle;
    /** If the transition between status bar property changes should be animated. */
    animated?: boolean;
    /** If the status bar is hidden. */
    hidden?: boolean;
    /** Transition effect when showing/hiding. @platform ios */
    hideTransitionAnimation?: StatusBarAnimation;
    /** Background colour of the status bar (Android only). */
    backgroundColor?: string;
    /** Whether the status bar is translucent (Android only). */
    translucent?: boolean;
  }

  export class StatusBar extends Component<StatusBarProps> {}

  export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean): void;
  export function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation): void;
  export function setStatusBarBackgroundColor(color: string, animated?: boolean): void;
  export function setStatusBarTranslucent(translucent: boolean): void;
}

// ─── react-native-maps (not yet installed) ───────────────────────────────────
declare module 'react-native-maps' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface Region extends LatLng {
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface MapViewProps {
    style?: StyleProp<ViewStyle>;
    initialRegion?: Region;
    region?: Region;
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    onPress?: (event: { nativeEvent: { coordinate: LatLng } }) => void;
    showsUserLocation?: boolean;
    followsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
    [key: string]: any;
  }

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    pinColor?: string;
    onPress?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export interface CalloutProps {
    tooltip?: boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export class MapView extends React.Component<MapViewProps> {
    animateToRegion(region: Region, duration?: number): void;
    animateCamera(camera: any, opts?: { duration?: number }): void;
  }

  export class Marker extends React.Component<MarkerProps> {}
  export class Callout extends React.Component<CalloutProps> {}

  export default MapView;
}
