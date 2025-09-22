/**
 * Centralized Color Palette Management - Dark Theme Only
 * Similar to Flutter's AppColors, this file contains all color definitions
 * Usage: import { AppColors } from '@/lib/appColors'
 * Example: <div style={{ backgroundColor: AppColors.primary }}>
 */

export const AppColors = {
  // Primary Colors
  primary: "#02FEFE", // Main brand color
  primaryBackground: "#02FEFE0D", // Primary with opacity
  primaryLight: "#22FEFE26", // Light variant with opacity
  teal: "#20B2AA", // Teal accent color for modal elements

  // Success Colors
  success: "#22C55E", // Success green
  successLight: "#4ADE80", // Light success green

  // Error/Danger Colors
  error: "#EF4444", // Error red
  errorLight: "#F87171", // Light error red

  // Dark Theme Background Colors
  darkPrimary: "#121214", // Main dark background (blackish)
  darkSecondary: "#1A1A1E", // Secondary dark background (greyish)
  divider: "#1F1F23", // Divider line color
  modalBackground: "#121214", // Modal background fill color

  // Common Colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Dark Theme Gray Scale
  gray: {
    50: "#F9FAFB", // Keep for text contrast
    100: "#F3F4F6", // Keep for text contrast
    200: "#E5E7EB", // Keep for borders
    300: "#D1D5DB", // Keep for muted text
    400: "#9CA3AF", // Keep for placeholder text
    500: "#6B7280", // Keep for secondary text
    600: "#4B5563", // Dark card backgrounds
    700: "#374151", // Darker card backgrounds
    800: "#1F2937", // Very dark backgrounds
    900: "#111827", // Darkest backgrounds
  },
} as const;

// Color categories for easier organization - Dark Theme Only
export const ColorCategories = {
  primary: {
    main: AppColors.primary,
    background: AppColors.primaryBackground,
    light: AppColors.primaryLight,
  },
  success: {
    main: AppColors.success,
    light: AppColors.successLight,
  },
  error: {
    main: AppColors.error,
    light: AppColors.errorLight,
  },
  dark: {
    primary: AppColors.darkPrimary,
    secondary: AppColors.darkSecondary,
  },
  neutral: {
    white: AppColors.white,
    black: AppColors.black,
    transparent: AppColors.transparent,
  },
  gray: AppColors.gray,
} as const;

// Type definitions for type safety
export type AppColorKey = keyof typeof AppColors;
export type PrimaryColors = keyof typeof ColorCategories.primary;
export type SuccessColors = keyof typeof ColorCategories.success;
export type ErrorColors = keyof typeof ColorCategories.error;
export type GrayColors = keyof typeof AppColors.gray;

/**
 * Helper function to get color with type safety
 * @param colorName - The name of the color
 * @returns The hex color value
 */
export const getColor = (colorName: AppColorKey): string => {
  const color = AppColors[colorName];
  if (typeof color === "string") {
    return color;
  }
  throw new Error(`Color ${colorName} is not a direct string value`);
};

/**
 * Helper function to get primary color variants
 * @param variant - The primary color variant
 * @returns The hex color value
 */
export const getPrimaryColor = (variant: PrimaryColors = "main"): string => {
  return ColorCategories.primary[variant];
};

/**
 * Helper function to get success color variants
 * @param variant - The success color variant
 * @returns The hex color value
 */
export const getSuccessColor = (variant: SuccessColors = "main"): string => {
  return ColorCategories.success[variant];
};

/**
 * Helper function to get error color variants
 * @param variant - The error color variant
 * @returns The hex color value
 */
export const getErrorColor = (variant: ErrorColors = "main"): string => {
  return ColorCategories.error[variant];
};

/**
 * Helper function to get gray color by shade
 * @param shade - The gray shade (50-900)
 * @returns The hex color value
 */
export const getGrayColor = (shade: GrayColors): string => {
  return AppColors.gray[shade];
};

/**
 * Helper function to convert hex to rgba with opacity
 * @param hex - Hex color value (with or without #)
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 */
export const hexToRgba = (hex: string, opacity: number): string => {
  // Remove # if present
  hex = hex.replace("#", "");

  // Convert hex to rgb
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Predefined color combinations for common UI elements
 */
export const ColorCombinations = {
  button: {
    primary: {
      background: AppColors.primary,
      text: AppColors.white,
      hover: hexToRgba(AppColors.primary, 0.8),
    },
    success: {
      background: AppColors.success,
      text: AppColors.white,
      hover: hexToRgba(AppColors.success, 0.8),
    },
    error: {
      background: AppColors.error,
      text: AppColors.white,
      hover: hexToRgba(AppColors.error, 0.8),
    },
  },
  badge: {
    success: {
      background: AppColors.successLight,
      text: AppColors.success,
    },
    error: {
      background: AppColors.errorLight,
      text: AppColors.error,
    },
    primary: {
      background: AppColors.primaryLight,
      text: AppColors.primary,
    },
  },
} as const;
