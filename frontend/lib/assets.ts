import { AppIcons, AppIconKey } from "./appIcons";
import { AppImages, AppImageKey } from "./appImages";
import { AppColors, AppColorKey } from "./appColors";

/**
 * Combined Assets Export
 * Combines AppIcons, AppImages, and AppColors for easier importing
 * Usage: import { AppIcons, AppImages, AppColors, Assets } from '@/lib/assets'
 */
export { AppIcons, getIcon, hasIcon, getIconWithColor } from "./appIcons";
export type { AppIconKey } from "./appIcons";
export {
  AppImages,
  getImage,
  hasImage,
  getBannerImage,
  getTypeImage,
} from "./appImages";
export type { AppImageKey } from "./appImages";
export {
  AppColors,
  ColorCategories,
  ColorCombinations,
  getColor,
  getPrimaryColor,
  getSuccessColor,
  getErrorColor,
  getGrayColor,
  hexToRgba,
} from "./appColors";
export type {
  AppColorKey,
  PrimaryColors,
  SuccessColors,
  ErrorColors,
  GrayColors,
} from "./appColors";

/**
 * Combined assets object for when you need icons, images, and colors
 */
export const Assets = {
  icons: AppIcons,
  images: AppImages,
  colors: AppColors,
} as const;

/**
 * Asset type union for type safety when working with any asset
 */
export type AssetPath = string;

/**
 * Helper function to get any asset (icon, image, or color) by full key path
 * @param assetPath - The asset path in format 'icons.iconName', 'images.imageName', or 'colors.colorName'
 * @returns The path/value of the asset or undefined if not found
 */
export const getAsset = (assetPath: string): string | undefined => {
  const [category, assetName] = assetPath.split(".");

  if (category === "icons" && assetName in AppIcons) {
    return AppIcons[assetName as AppIconKey];
  }

  if (category === "images" && assetName in AppImages) {
    return AppImages[assetName as AppImageKey];
  }

  if (category === "colors" && assetName in AppColors) {
    const colorValue = AppColors[assetName as AppColorKey];
    return typeof colorValue === "string" ? colorValue : undefined;
  }

  return undefined;
};
