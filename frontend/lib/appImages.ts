/**
 * Centralized Image Assets Management
 * Similar to Flutter's AppImages, this file contains all image asset paths
 * Usage: import { AppImages } from '@/lib/appImages'
 * Example: <Image src={AppImages.logo} alt="Logo" />
 */

export const AppImages = {
  // Logos
  logo: "/image/logo.png",

  // Banner Images
  banner: "/image/banner.png",
  bannerPinkMobile: "/image/bannerPinkMobile.png",
  bannerMobile: "/image/banner-mobile.png",
  banner2: "/image/banner2.png",
  banner4: "/image/banner4.png",

  // General Images
  defaultAvatar: "/image/img.png",
  defaultAvatar2: "/svg/Avatar2.svg",
  img1: "/image/img1.jpg",
  img2: "/image/img2.jpg",

  // Type/Category Images
  goldenBall: "/image/type.png",
  type1: "/image/type1.png",
  bitcoin: "/image/type2.png",
  judgePill: "/image/type3.png",
  casinoChips: "/image/type4.png",
  goldenCoin: "/image/type5.png",

  // Market Images
  bitcoinGold: "/image/bitcoin-gold.png",
  judgePills: "/image/judge-pill.png",
  casinoChip: "/image/chips.png",
  goldenCoins: "/image/goldenBall.png",

  // games images
  rocket: "/image/game-action.png",
} as const;

// Type for image keys to ensure type safety
export type AppImageKey = keyof typeof AppImages;

/**
 * Helper function to get image path with type safety
 * @param imageName - The name of the image
 * @returns The path to the image
 */
export const getImage = (imageName: AppImageKey): string => {
  return AppImages[imageName];
};

/**
 * Helper function to check if an image exists
 * @param imageName - The name of the image to check
 * @returns Boolean indicating if the image exists
 */
export const hasImage = (imageName: string): imageName is AppImageKey => {
  return imageName in AppImages;
};

/**
 * Helper function to get responsive banner image based on screen size
 * @param isMobile - Boolean indicating if the current screen is mobile
 * @returns The appropriate banner image path
 */
export const getBannerImage = (isMobile: boolean = false): string => {
  return isMobile ? AppImages.bannerMobile : AppImages.banner;
};

/**
 * Helper function to get type image by number
 * @param typeNumber - The type number (1-5)
 * @returns The path to the type image, defaults to base type image if invalid number
 */
export const getTypeImage = (typeNumber: number): string => {
  switch (typeNumber) {
    case 1:
      return AppImages.goldenBall;
    case 2:
      return AppImages.bitcoin;
    case 3:
      return AppImages.judgePill;
    case 4:
      return AppImages.casinoChips;
    case 5:
      return AppImages.goldenCoin;
    default:
      return AppImages.goldenBall;
  }
};
